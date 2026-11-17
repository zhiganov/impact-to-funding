import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { assertPlainPath } from './targets.mjs';
import { clearStoppedLock, owned, readJson, uuidPattern, writeJson } from './storage.mjs';
import { addOpenCodeEntry, entriesEqual, readOpenCodeEntry, removeOpenCodeEntry } from './setup-config.mjs';
import {
  checkRuntimeSource, prepareRuntime, prepareRuntimeSnapshot, probeRuntime,
} from './setup-runtime.mjs';

const CONTRACT = 'itf.library-setup/0.1';
const digest = (value) => createHash('sha256').update(value).digest('hex');
const fileNames = ['opencode.json', 'opencode.jsonc', '.opencode/opencode.json', '.opencode/opencode.jsonc'];

function bytes(file) {
  assertPlainPath(file);
  if (!existsSync(file)) return null;
  const stat = owned(file);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024 || stat.nlink !== 1) {
    throw new Error('Setup requires a bounded, owned regular config file without hard links');
  }
  return readFileSync(file);
}
const hash = (value) => value === null ? null : digest(value);
const text = (value) => value === null ? '{}\n' : new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(value);

function pathsFor(options) {
  if (options.harness !== 'opencode' || options.scope !== 'project') {
    throw new TypeError('Library setup currently supports only --harness opencode --scope project');
  }
  if (process.platform === 'win32') throw new Error('Library setup currently supports POSIX hosts only');
  const project = realpathSync(path.resolve(options.project ?? process.cwd()));
  const home = realpathSync(options.home ?? homedir());
  assertPlainPath(project);
  if (!owned(project).isDirectory()) throw new Error('Project is not an owned directory');
  const name = options.name ?? 'itf_library';
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name)) throw new TypeError('Use a short lowercase server name');
  const candidates = fileNames.map((file) => path.join(project, file)).filter(existsSync);
  if (candidates.length > 1) throw new Error('Multiple project configs: select one configuration layout before setup');
  const config = candidates[0] ?? path.join(project, 'opencode.jsonc');
  const state = path.join(home, '.local/state/impact-to-funding/library-setup', digest(`${project}\n${name}`));
  assertPlainPath(state);
  const source = options.source ? realpathSync(path.resolve(options.source)) : null;
  if (source) assertPlainPath(source);
  return { project, home, name, config, state, source };
}

function privateDirectory(directory) {
  assertPlainPath(directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (!owned(directory).isDirectory()) throw new Error('Setup state is not an owned directory');
}

function receiptAt(paths) {
  const receipt = readJson(path.join(paths.state, 'receipt.json'));
  if (!receipt) return null;
  if (receipt.contractVersion !== CONTRACT || receipt.project !== paths.project
    || receipt.name !== paths.name || receipt.config !== paths.config
    || !/^[a-f0-9]{40}$/.test(receipt.sourceCommit)
    || !['pending', 'registered', 'undone'].includes(receipt.status)
    || !uuidPattern.test(receipt.generation)
    || receipt.runtime !== path.join(paths.state, 'runtimes', `${receipt.sourceCommit}-${receipt.generation}`)
    || receipt.snapshot !== path.join(receipt.runtime, 'outputs/library-snapshot.json')
    || !/^[a-f0-9]{64}$/.test(receipt.snapshotHash)
    || !/^[a-f0-9]{64}$/.test(receipt.afterHash)
    || !(receipt.beforeHash === null || /^[a-f0-9]{64}$/.test(receipt.beforeHash))
    || typeof receipt.nodeExecutable !== 'string' || !path.isAbsolute(receipt.nodeExecutable)
    || /[\x00-\x1f]/.test(receipt.nodeExecutable)
    || !entriesEqual(receipt.entry, entryFor(receipt.runtime, receipt.snapshot, receipt.nodeExecutable))) {
    throw new Error('Unrecognised setup receipt; preserve it for inspection');
  }
  return receipt;
}

function entryFor(runtime, snapshot, nodeExecutable = process.execPath) {
  return { type: 'local', command: [nodeExecutable, path.join(runtime, 'mcp/server.mjs'), '--snapshot', snapshot] };
}

function inheritedConflict(paths, configHome) {
  // Inspect only the selected server key; never print other settings or values.
  const others = new Set();
  for (let directory = path.dirname(paths.project); ; directory = path.dirname(directory)) {
    for (const file of fileNames) others.add(path.join(directory, file));
    if (directory === path.dirname(directory)) break;
  }
  const global = path.join(configHome ?? process.env.XDG_CONFIG_HOME ?? path.join(paths.home, '.config'), 'opencode');
  for (const file of ['opencode.json', 'opencode.jsonc']) others.add(path.join(global, file));
  for (const file of others) {
    const original = bytes(file);
    if (original !== null && readOpenCodeEntry(text(original), paths.name) !== null) {
      throw new Error('The server name already exists in inherited configuration; leave it with its current owner');
    }
  }
}

function replaceConfig(paths, expectedHash, content) {
  if (hash(bytes(paths.config)) !== expectedHash) throw new Error('Config changed since the plan; nothing was overwritten');
  const temporary = path.join(path.dirname(paths.config), `.itf-setup-${randomUUID()}.tmp`);
  assertPlainPath(temporary);
  const mode = existsSync(paths.config) ? lstatSync(paths.config).mode & 0o777 : 0o600;
  writeFileSync(temporary, content, { flag: 'wx', mode });
  try {
    if (hash(bytes(paths.config)) !== expectedHash) throw new Error('Config changed during setup; nothing was overwritten');
    renameSync(temporary, paths.config);
  } finally { if (existsSync(temporary)) unlinkSync(temporary); }
}

function installedHostVersion() {
  let version;
  try {
    version = execFileSync('opencode', ['--version'], {
      encoding: 'utf8', timeout: 5000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch { throw new Error('OpenCode CLI is unavailable; setup does not install it'); }
  if (!/^opencode v2\.(?:[3-9]|\d{2,})\.\d+(?:[-+][\w.-]+)?$/.test(version)) {
    throw new Error('This setup adapter requires OpenCode V2.3 or later within V2');
  }
  return version;
}

export function createSetup({
  prepare = prepareRuntime, snapshot = prepareRuntimeSnapshot, probe = probeRuntime,
  verifySource = checkRuntimeSource, hostVersion = installedHostVersion,
} = {}) {
  async function plan(options) {
    const paths = pathsFor(options);
    const original = bytes(paths.config);
    const current = readOpenCodeEntry(text(original), paths.name);
    const receipt = receiptAt(paths);
    if (options.undo) {
      if (!receipt || receipt.status === 'undone') {
        if (!existsSync(path.join(paths.state, 'lock.json'))) throw new Error('No active setup receipt to undo');
        return { paths, original, receipt: null, command: 'setup', operation: 'undo', applied: false,
          harness: 'opencode', scope: 'project', config: paths.config, serverName: paths.name,
          status: 'lock-recovery', privateState: paths.state, changes: [path.join(paths.state, 'lock.json')],
          retained: ['unregistered runtime artifacts', 'project configuration'] };
      }
      if (current !== null && !entriesEqual(current, receipt.entry)) {
        throw new Error('Setup-owned entry changed; preserve it instead of undoing');
      }
      return { paths, original, receipt, command: 'setup', operation: 'undo', applied: false,
        harness: 'opencode', scope: 'project', config: paths.config, serverName: paths.name,
        status: 'undo-available', privateState: paths.state,
        changes: current === null ? [] : [paths.config],
        retained: ['runtime', 'private backups and receipt'] };
    }
    if (receipt?.status === 'pending') throw new Error('Interrupted setup: inspect the private state and use setup --undo');
    const commit = options.commit ?? (receipt?.status === 'registered' ? receipt.sourceCommit : null);
    if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new TypeError('Choose an explicit full --commit for the library runtime');
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Library setup needs Node.js 22+; use the plain skill without it');
    if (process.env.OPENCODE_CONFIG || process.env.OPENCODE_CONFIG_CONTENT) {
      throw new Error('External OpenCode config overrides are active; setup cannot establish the project config boundary');
    }
    const host = hostVersion();
    inheritedConflict(paths, options.configHome);
    const active = receipt?.status === 'registered';
    const runtime = active ? receipt.runtime : path.join(paths.state, 'runtimes', `${commit}-${options.generation}`);
    const snapshotPath = path.join(runtime, 'outputs/library-snapshot.json');
    const entry = active ? receipt.entry : entryFor(runtime, snapshotPath);
    if (current !== null && (!receipt || receipt.status !== 'registered' || !entriesEqual(current, receipt.entry))) {
      throw new Error('Existing MCP registration is not owned by this setup; leave it untouched');
    }
    if (receipt?.status === 'registered') {
      if (commit !== receipt.sourceCommit || !entriesEqual(current, receipt.entry)) {
        throw new Error('Setup source or registration changed; undo the owned registration before replacing it');
      }
      verifySource(runtime, commit);
      if (hash(bytes(snapshotPath)) !== receipt.snapshotHash) throw new Error('Prepared snapshot changed');
    } else if (existsSync(runtime) || existsSync(snapshotPath)) {
      throw new Error('Existing runtime artifacts have no active receipt; preserve them before another setup');
    }
    return { paths, original, receipt, entry, runtime, snapshotPath, commit,
      command: 'setup', operation: options.check ? 'check' : 'register',
      applied: false, harness: 'opencode', hostVersion: host, scope: 'project', config: paths.config, serverName: paths.name,
      status: receipt?.status === 'registered' ? 'registered' : 'setup-available',
      sourceCommit: commit, source: paths.source ? 'selected local Git repository' : 'public ItF Git repository',
      privateState: paths.state,
      backup: original === null ? null : path.join(paths.state, 'backups', digest(original)),
      changes: receipt?.status === 'registered' ? [] : [paths.config, paths.state],
      configEntry: entry,
      preparation: receipt?.status === 'registered' ? [] : [
        'Clone the selected source into private setup state',
        'npm ci in its mcp directory: locked registry dependencies, scripts/audit/funding disabled',
        'Prepare the public library snapshot from the selected Git commit',
        'Check library_info, search_references and get_reference over local stdio',
      ],
      limits: ['No skill installation or update', 'No global configuration or runtime installation',
        'No funding-service registration, model run or hosting', 'Host connection is checked separately'],
    };
  }

  function publicPlan(value) {
    const { paths, original, receipt, entry, runtime, snapshotPath, commit, ...visible } = value;
    return visible;
  }

  async function run(options = {}) {
    options = { ...options, generation: randomUUID() };
    if (options.undo && options.check) throw new TypeError('Choose undo or check');
    const before = await plan(options);
    if (!options.apply && !options.check) return publicPlan(before);
    if (options.check) {
      if (options.apply) throw new TypeError('Check is read-only; omit --apply');
      if (before.status !== 'registered') throw new Error('Apply a reviewed setup before checking the runtime');
      return { ...publicPlan(before),
        runtimeCheck: await probe(before.runtime, before.snapshotPath, before.commit, before.receipt.nodeExecutable) };
    }
    options.onPlan?.(publicPlan(before));
    if (before.status === 'registered' && !options.undo) return publicPlan(before);
    const { paths } = before;
    privateDirectory(paths.state);
    if (options.undo) {
      clearStoppedLock(paths);
      if (before.status === 'lock-recovery') return { ...publicPlan(before), applied: true, status: 'lock-cleared' };
    }
    const lock = path.join(paths.state, 'lock.json');
    const token = randomUUID();
    writeFileSync(lock, JSON.stringify({ token, pid: process.pid }), { flag: 'wx', mode: 0o600 });
    try {
      const fresh = await plan(options);
      if (hash(fresh.original) !== hash(before.original)) throw new Error('Config changed since the plan');
      if (options.undo) {
        const receipt = fresh.receipt;
        const original = receipt.beforeHash === null ? null : bytes(path.join(paths.state, 'backups', receipt.beforeHash));
        if (hash(original) !== receipt.beforeHash) throw new Error('Private config backup changed');
        const currentHash = hash(fresh.original);
        if (currentHash === receipt.afterHash) {
          if (original === null) {
            if (hash(bytes(paths.config)) !== currentHash) throw new Error('Config changed during undo; nothing was removed');
            unlinkSync(paths.config);
          }
          else replaceConfig(paths, currentHash, original);
        } else if (readOpenCodeEntry(text(fresh.original), paths.name) !== null) {
          replaceConfig(paths, currentHash, removeOpenCodeEntry(text(fresh.original), paths.name, receipt.entry));
        }
        writeJson(path.join(paths.state, 'receipt.json'), { ...receipt, status: 'undone' });
        return { ...publicPlan(fresh), applied: true, status: 'undone' };
      }
      privateDirectory(path.dirname(fresh.runtime));
      // The receipt is written only after a usable runtime and checked snapshot exist.
      await prepare(fresh.runtime, fresh.commit, paths.source);
      const identity = verifySource(fresh.runtime, fresh.commit);
      privateDirectory(path.dirname(fresh.snapshotPath));
      await snapshot(fresh.runtime, fresh.commit, fresh.snapshotPath);
      const runtimeCheck = await probe(fresh.runtime, fresh.snapshotPath, fresh.commit);
      const after = addOpenCodeEntry(text(fresh.original), paths.name, fresh.entry);
      if (hash(bytes(paths.config)) !== hash(fresh.original)) throw new Error('Config changed during runtime preparation');
      if (fresh.original !== null) {
        privateDirectory(path.join(paths.state, 'backups'));
        const backup = path.join(paths.state, 'backups', digest(fresh.original));
        const saved = bytes(backup);
        if (saved !== null && hash(saved) !== hash(fresh.original)) throw new Error('Private backup differs from its expected identity');
        if (saved === null) writeFileSync(backup, fresh.original, { flag: 'wx', mode: 0o600 });
      }
      const receipt = { contractVersion: CONTRACT, project: paths.project, name: paths.name, config: paths.config,
        sourceCommit: fresh.commit, generation: options.generation, runtime: fresh.runtime, snapshot: fresh.snapshotPath,
        nodeExecutable: process.execPath,
        snapshotHash: hash(bytes(fresh.snapshotPath)), entry: fresh.entry, status: 'pending',
        beforeHash: hash(fresh.original), afterHash: digest(after), identity, runtimeCheck };
      writeJson(path.join(paths.state, 'receipt.json'), receipt);
      replaceConfig(paths, receipt.beforeHash, after);
      writeJson(path.join(paths.state, 'receipt.json'), { ...receipt, status: 'registered' });
      return { ...publicPlan(fresh), applied: true, status: 'registered',
        installedIdentity: identity, runtimeCheck, registration: 'written', skill: 'unchanged' };
    } finally {
      if (readJson(lock)?.token !== token) throw new Error('Setup lock owner changed; preserve state');
      unlinkSync(lock);
    }
  }
  return { run };
}
