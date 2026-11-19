import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { assertPlainPath } from './targets.mjs';
import { clearStoppedLock, owned, readJson, uuidPattern, writeJson } from './storage.mjs';
import { entriesEqual } from './setup-config.mjs';
import {
  checkRuntimeSource, prepareRuntime, prepareRuntimeSnapshot, probeRuntime,
} from './setup-runtime.mjs';

// Claude Code local scope: one private entry per project, inside the host's own
// config file. That file also holds account data, so setup never copies,
// rewrites or restores it. All writes go through the host CLI, one entry at a
// time, and every write is read back and compared.
const CONTRACT = 'itf.library-setup.claude-local/0.1';
const MAX_CONFIG_BYTES = 32 * 1024 * 1024;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// Claude Code reads ~/.claude.json unless CLAUDE_CONFIG_DIR selects another folder.
function configDirectory(configDir) {
  const directory = configDir ?? process.env.CLAUDE_CONFIG_DIR;
  return directory ? realpathSync(path.resolve(directory)) : null;
}

function readConfig(file) {
  assertPlainPath(file);
  if (!existsSync(file)) return null;
  const stat = owned(file);
  if (!stat.isFile() || stat.size > MAX_CONFIG_BYTES) {
    throw new Error('Setup requires a bounded, owned regular Claude Code config file');
  }
  let value;
  try { value = JSON.parse(readFileSync(file, 'utf8')); }
  catch { throw new Error('Claude Code config is not valid JSON; setup leaves it untouched'); }
  if (!object(value)) throw new Error('Claude Code config root must be an object');
  return value;
}

function serversIn(container, label) {
  if (container === undefined || container === null) return null;
  if (!object(container)) throw new Error(`Claude Code ${label} must be an object`);
  return container;
}

// Returns only the selected server's entry; other servers and values are never
// returned, printed or stored, because they can contain credentials.
function localEntry(config, project, name) {
  const projects = serversIn(config?.projects, 'projects');
  const settings = projects ? serversIn(projects[project], 'project settings') : null;
  const servers = settings ? serversIn(settings.mcpServers, 'mcpServers') : null;
  if (!servers || !Object.hasOwn(servers, name)) return null;
  if (!object(servers[name])) throw new Error('Claude Code MCP entry must be an object');
  return servers[name];
}

function otherScopeConflict(config, project, name) {
  const user = serversIn(config?.mcpServers, 'user mcpServers');
  if (user && Object.hasOwn(user, name)) {
    throw new Error('The server name already exists in user scope; leave it with its current owner');
  }
  const shared = path.join(project, '.mcp.json');
  if (existsSync(shared)) {
    const stat = owned(shared);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new Error('Project .mcp.json is not a bounded regular file');
    let value;
    try { value = JSON.parse(readFileSync(shared, 'utf8')); }
    catch { throw new Error('Project .mcp.json is not valid JSON; setup cannot check for a name conflict'); }
    const servers = object(value) ? serversIn(value.mcpServers, '.mcp.json mcpServers') : null;
    if (servers && Object.hasOwn(servers, name)) {
      throw new Error('The server name already exists in the shared project .mcp.json; leave it with its current owner');
    }
  }
}

function pathsFor(options) {
  if (options.harness !== 'claude' || options.scope !== 'local') {
    throw new TypeError('This adapter supports only --harness claude --scope local');
  }
  if (process.platform === 'win32') throw new Error('Library setup currently supports POSIX hosts only');
  const project = realpathSync(path.resolve(options.project ?? process.cwd()));
  const home = realpathSync(options.home ?? homedir());
  assertPlainPath(project);
  if (!owned(project).isDirectory()) throw new Error('Project is not an owned directory');
  const name = options.name ?? 'itf_library';
  if (!/^[a-z][a-z0-9_-]{0,63}$/.test(name)) throw new TypeError('Use a short lowercase server name');
  const configDir = configDirectory(options.claudeConfigDir);
  const config = configDir ? path.join(configDir, '.claude.json') : path.join(home, '.claude.json');
  const state = path.join(home, '.local/state/impact-to-funding/library-setup',
    digest(`claude-local\n${project}\n${name}`));
  assertPlainPath(state);
  const source = options.source ? realpathSync(path.resolve(options.source)) : null;
  if (source) assertPlainPath(source);
  return { project, home, name, config, state, source, configDir };
}

function entryFor(runtime, snapshot, nodeExecutable = process.execPath) {
  return { type: 'stdio', command: nodeExecutable, args: [path.join(runtime, 'mcp/server.mjs'), '--snapshot', snapshot] };
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
    || typeof receipt.nodeExecutable !== 'string' || !path.isAbsolute(receipt.nodeExecutable)
    || /[\x00-\x1f]/.test(receipt.nodeExecutable)
    || !entriesEqual(receipt.entry, entryFor(receipt.runtime, receipt.snapshot, receipt.nodeExecutable))) {
    throw new Error('Unrecognised setup receipt; preserve it for inspection');
  }
  return receipt;
}

// Pass CLAUDE_CONFIG_DIR only when it was selected. Setting it to the home folder
// would move Claude Code's other files, such as settings and credentials.
function claudeEnvironment(paths) {
  const env = { ...process.env };
  if (paths.configDir) env.CLAUDE_CONFIG_DIR = paths.configDir;
  else delete env.CLAUDE_CONFIG_DIR;
  return env;
}

function runClaude(args, paths) {
  execFileSync('claude', args, {
    cwd: paths.project, env: claudeEnvironment(paths), encoding: 'utf8', timeout: 60000,
    maxBuffer: 64 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function installedHostVersion() {
  let version;
  try {
    version = execFileSync('claude', ['--version'], {
      encoding: 'utf8', timeout: 10000, maxBuffer: 4096, stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch { throw new Error('Claude Code CLI is unavailable; setup does not install it'); }
  const match = version.match(/^(\d+)\.(\d+)\.(\d+) \(Claude Code\)$/);
  if (!match || Number(match[1]) < 2) throw new Error('This setup adapter requires Claude Code 2 or later');
  return version;
}

export function createClaudeSetup({
  prepare = prepareRuntime, snapshot = prepareRuntimeSnapshot, probe = probeRuntime,
  verifySource = checkRuntimeSource, hostVersion = installedHostVersion, claude = runClaude,
} = {}) {
  async function plan(options) {
    const paths = pathsFor(options);
    const config = readConfig(paths.config);
    const current = localEntry(config, paths.project, paths.name);
    const receipt = receiptAt(paths);
    const base = { command: 'setup', applied: false, harness: 'claude', scope: 'local',
      config: paths.config, serverName: paths.name, privateState: paths.state };
    if (options.undo) {
      if (!receipt || receipt.status === 'undone') {
        if (!existsSync(path.join(paths.state, 'lock.json'))) throw new Error('No active setup receipt to undo');
        return { paths, receipt: null, current, ...base, operation: 'undo', status: 'lock-recovery',
          changes: [path.join(paths.state, 'lock.json')], retained: ['unregistered runtime artifacts', 'Claude Code configuration'] };
      }
      if (current !== null && !entriesEqual(current, receipt.entry)) {
        throw new Error('Setup-owned entry changed; preserve it instead of undoing');
      }
      return { paths, receipt, current, ...base, operation: 'undo', status: 'undo-available',
        changes: current === null ? [] : [`${paths.config} (one local MCP entry, through the Claude Code CLI)`],
        retained: ['runtime', 'private receipt'] };
    }
    if (receipt?.status === 'pending') throw new Error('Interrupted setup: inspect the private state and use setup --undo');
    const commit = options.commit ?? (receipt?.status === 'registered' ? receipt.sourceCommit : null);
    if (!/^[a-f0-9]{40}$/.test(commit ?? '')) throw new TypeError('Choose an explicit full --commit for the library runtime');
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Library setup needs Node.js 22+; use the plain skill without it');
    const host = hostVersion();
    otherScopeConflict(config, paths.project, paths.name);
    const active = receipt?.status === 'registered';
    const runtime = active ? receipt.runtime : path.join(paths.state, 'runtimes', `${commit}-${options.generation}`);
    const snapshotPath = path.join(runtime, 'outputs/library-snapshot.json');
    const entry = active ? receipt.entry : entryFor(runtime, snapshotPath);
    if (current !== null && (!active || !entriesEqual(current, receipt.entry))) {
      throw new Error('Existing MCP registration is not owned by this setup; leave it untouched');
    }
    if (active) {
      if (commit !== receipt.sourceCommit || current === null) {
        throw new Error('Setup source or registration changed; undo the owned registration before replacing it');
      }
      verifySource(runtime, commit);
      const saved = existsSync(snapshotPath) ? digest(readFileSync(snapshotPath)) : null;
      if (saved !== receipt.snapshotHash) throw new Error('Prepared snapshot changed');
    } else if (existsSync(runtime) || existsSync(snapshotPath)) {
      throw new Error('Existing runtime artifacts have no active receipt; preserve them before another setup');
    }
    return { paths, receipt, current, entry, runtime, snapshotPath, commit, ...base,
      operation: options.check ? 'check' : 'register', hostVersion: host,
      status: active ? 'registered' : 'setup-available',
      sourceCommit: commit, source: paths.source ? 'selected local Git repository' : 'public ItF Git repository',
      backup: null,
      configWrite: 'claude mcp add-json --scope local (one entry; setup never copies or rewrites this file)',
      changes: active ? [] : [`${paths.config} (one local MCP entry, through the Claude Code CLI)`, paths.state],
      configEntry: entry,
      preparation: active ? [] : [
        'Clone the selected source into private setup state',
        'npm ci in its mcp directory: locked registry dependencies, scripts/audit/funding disabled',
        'Prepare the public library snapshot from the selected Git commit',
        'Check library_info, search_references and get_reference over local stdio',
      ],
      limits: ['No skill installation or update', 'No user-scope or shared .mcp.json registration',
        'No funding-service registration, model run or hosting', 'Host connection is checked separately'],
    };
  }

  function publicPlan(value) {
    const { paths, receipt, current, entry, runtime, snapshotPath, commit, ...visible } = value;
    return visible;
  }

  function readBack(paths) {
    return localEntry(readConfig(paths.config), paths.project, paths.name);
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
      if (options.undo) {
        const { receipt } = fresh;
        if (fresh.current !== null) {
          claude(['mcp', 'remove', '--scope', 'local', paths.name], paths);
          if (readBack(paths) !== null) throw new Error('Claude Code still lists the entry after removal');
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
      const latest = readConfig(paths.config);
      if (localEntry(latest, paths.project, paths.name) !== null) {
        throw new Error('An entry with this name appeared during runtime preparation; nothing was registered');
      }
      otherScopeConflict(latest, paths.project, paths.name);
      const receipt = { contractVersion: CONTRACT, project: paths.project, name: paths.name, config: paths.config,
        sourceCommit: fresh.commit, generation: options.generation, runtime: fresh.runtime, snapshot: fresh.snapshotPath,
        nodeExecutable: process.execPath, snapshotHash: digest(readFileSync(fresh.snapshotPath)),
        entry: fresh.entry, status: 'pending', identity, runtimeCheck };
      writeJson(path.join(paths.state, 'receipt.json'), receipt);
      claude(['mcp', 'add-json', '--scope', 'local', paths.name, JSON.stringify(fresh.entry)], paths);
      const written = readBack(paths);
      if (written === null || !entriesEqual(written, fresh.entry)) {
        throw new Error('Claude Code did not record the expected entry; use setup --undo after inspecting it');
      }
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
