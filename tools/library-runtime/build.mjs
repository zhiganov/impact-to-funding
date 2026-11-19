import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRuntimeSource, prepareRuntimeSnapshot } from '../skill-package/lib/runtime-source.mjs';
import { sourceGit } from '../skill-package/lib/git.mjs';
import { probeRuntimeFolder } from './probe.mjs';

const REPOSITORY = 'zhiganov/impact-to-funding';
const SERVER_FILES = ['server.mjs', 'library.mjs', 'schemas.mjs'];

export function defaultSourceRoot() {
  // tools/library-runtime/build.mjs -> the repository root two levels up.
  return fileURLToPath(new URL('../..', import.meta.url));
}

function defaultTreeState(root) {
  return sourceGit(['-C', root, 'status', '--porcelain']);
}

function defaultReleaseCommit(root, commit) {
  let onMain = true;
  try {
    sourceGit(['-C', root, 'merge-base', '--is-ancestor', commit, 'refs/remotes/origin/main']);
  } catch {
    onMain = false;
  }
  const tags = sourceGit(['-C', root, 'tag', '--points-at', commit]).trim();
  return { tag: tags ? tags.split('\n')[0].trim() : null, onMain };
}

export function defaultPrepare(clone, commit, { source, install }) {
  return prepareRuntimeSource(clone, commit, { localSource: source, includeDev: false, install });
}

// The production dependency closure of mcp/package-lock.json: every package
// reachable from the root "dependencies", never dev-only entries.
export function productionDependencies(lock) {
  const packages = lock.packages ?? {};
  const seen = new Map();
  function visit(name) {
    if (seen.has(name)) return;
    const entry = packages[`node_modules/${name}`];
    if (!entry) throw new Error(`Runtime lock is missing production dependency ${name}`);
    seen.set(name, entry);
    for (const dependency of Object.keys(entry.dependencies ?? {})) visit(dependency);
    for (const dependency of Object.keys(entry.optionalDependencies ?? {})) {
      if (packages[`node_modules/${dependency}`]) visit(dependency);
    }
  }
  for (const dependency of Object.keys(packages['']?.dependencies ?? {})) visit(dependency);
  return [...seen.keys()].sort().map((name) => {
    const entry = seen.get(name);
    return { name, version: entry.version, integrity: entry.integrity, license: entry.license ?? null };
  });
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target);
    else if (entry.isFile()) copyFileSync(source, target);
    else throw new Error(`Unsupported file type in the runtime source: ${entry.name}`);
  }
}

function listFiles(root, prefix = '') {
  const files = [];
  for (const entry of readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(root, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported file type in the runtime output: ${relative}`);
  }
  return files.sort();
}

function hashFiles(root, files) {
  const hashes = {};
  for (const file of files) {
    hashes[file] = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex');
  }
  return hashes;
}

function licenceFileName(directory) {
  const match = readdirSync(directory).filter((name) => /^LICEN[CS]E/i.test(name)).sort()[0];
  if (!match) throw new Error(`A production package has no licence file: ${directory}`);
  return match;
}

function thirdPartyLicenses(clone, production) {
  const sections = [];
  for (const dependency of production) {
    const directory = path.join(clone, 'mcp', 'node_modules', ...dependency.name.split('/'));
    const metadata = JSON.parse(readFileSync(path.join(directory, 'package.json'), 'utf8'));
    const licence = readFileSync(path.join(directory, licenceFileName(directory)), 'utf8');
    let section = `## ${dependency.name} ${dependency.version}\n\n${metadata.license ?? 'unknown'}\n\n${licence.trimEnd()}\n`;
    if (existsSync(path.join(directory, 'NOTICE'))) {
      section += `\n${readFileSync(path.join(directory, 'NOTICE'), 'utf8').trimEnd()}\n`;
    }
    sections.push(section);
  }
  return `# Third-party licences in this runtime\n\nThis folder bundles the production dependencies of the ItF reference-library server. Each section keeps the package's own licence text.\n\n${sections.join('\n')}`;
}

async function buildFolder({ commit, tag, target, prepare, snapshot, probe, install, source }) {
  mkdirSync(target, { recursive: true, mode: 0o700 });
  const clone = mkdtempSync(path.join(tmpdir(), 'itf-library-runtime-'));
  try {
    const observed = await prepare(clone, commit, { source, install });
    const lock = JSON.parse(readFileSync(path.join(clone, 'mcp/package-lock.json'), 'utf8'));
    const production = productionDependencies(lock);
    mkdirSync(path.join(target, 'server'), { mode: 0o700 });
    for (const file of SERVER_FILES) {
      copyFileSync(path.join(clone, 'mcp', file), path.join(target, 'server', file));
    }
    for (const dependency of production) {
      const from = path.join(clone, 'mcp', 'node_modules', ...dependency.name.split('/'));
      copyTree(from, path.join(target, 'node_modules', ...dependency.name.split('/')));
    }
    snapshot(clone, commit, path.join(target, 'library-snapshot.json'));
    const snapshotId = JSON.parse(readFileSync(path.join(target, 'library-snapshot.json'), 'utf8')).snapshotId;
    writeFileSync(path.join(target, 'THIRD_PARTY_LICENSES.md'), `${thirdPartyLicenses(clone, production)}\n`, { flag: 'wx', mode: 0o600 });
    const files = hashFiles(target, listFiles(target));
    const provenance = {
      contractVersion: 'itf.library-runtime/0.1',
      repository: REPOSITORY,
      sourceCommit: commit,
      tag,
      skillVersion: observed.skillVersion,
      serverVersion: observed.serverVersion,
      snapshotId,
      nodeVersion: process.versions.node,
      dependencies: production,
      // Every file in this folder except provenance.json itself.
      files,
    };
    writeFileSync(path.join(target, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    const check = await probe({ server: path.join(target, 'server', 'server.mjs'),
      snapshot: path.join(target, 'library-snapshot.json'), expectedCommit: commit, cwd: target });
    if (check.status !== 'passed' || check.sourceCommit !== commit || check.snapshotId !== snapshotId) {
      throw new Error('The built runtime did not pass its own source-bound check');
    }
    return { provenance, check };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

export function createBuild({
  sourceRoot = defaultSourceRoot(),
  prepare = defaultPrepare,
  snapshot = prepareRuntimeSnapshot,
  probe = probeRuntimeFolder,
  install,
  nodeVersion = () => process.versions.node,
  treeState = defaultTreeState,
  releaseCommit = defaultReleaseCommit,
} = {}) {
  return async function build({ commit, output, source = null, verifyDeterministic = false } = {}) {
    if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
      throw new TypeError('A full lowercase 40-character source commit is required');
    }
    const major = Number(/^v?(\d+)/.exec(nodeVersion())?.[1]);
    if (!(major >= 22)) throw new Error('Node 22 or later is required to build the library runtime');
    if (treeState(sourceRoot).trim() !== '') {
      throw new Error('The source checkout is dirty; commit or clean it before building a release runtime');
    }
    const release = releaseCommit(sourceRoot, commit);
    if (!release.onMain && !release.tag) {
      throw new Error('The selected commit is not reachable from main and has no release tag');
    }
    const resolved = path.resolve(output ?? path.join(sourceRoot, 'outputs', 'library-runtime'));
    if (existsSync(resolved)) {
      if (!statSync(resolved).isDirectory() || readdirSync(resolved).length > 0) {
        throw new Error('The output directory is not empty');
      }
    } else mkdirSync(path.dirname(resolved), { recursive: true, mode: 0o700 });
    const staging = mkdtempSync(path.join(path.dirname(resolved), 'library-runtime-build-'));
    let complete = false;
    try {
      const first = await buildFolder({ commit, tag: release.tag, target: staging,
        prepare, snapshot, probe, install, source });
      if (verifyDeterministic) {
        const second = mkdtempSync(path.join(path.dirname(resolved), 'library-runtime-build-'));
        try {
          await buildFolder({ commit, tag: release.tag, target: second,
            prepare, snapshot, probe, install, source });
          const left = hashFiles(staging, listFiles(staging));
          const right = hashFiles(second, listFiles(second));
          const differences = [];
          for (const file of new Set([...Object.keys(left), ...Object.keys(right)])) {
            if (left[file] !== right[file]) differences.push(file);
          }
          if (differences.length > 0) {
            throw new Error(`Two builds from the same commit differ: ${differences.join(', ')}`);
          }
        } finally {
          rmSync(second, { recursive: true, force: true });
        }
      }
      if (existsSync(resolved)) rmSync(resolved, { recursive: true });
      renameSync(staging, resolved);
      complete = true;
      return { status: 'built', sourceCommit: commit, tag: release.tag,
        skillVersion: first.provenance.skillVersion, serverVersion: first.provenance.serverVersion,
        snapshotId: first.provenance.snapshotId, nodeVersion: first.provenance.nodeVersion,
        dependencies: first.provenance.dependencies, fileCount: Object.keys(first.provenance.files).length + 1,
        runtimeCheck: first.check, deterministic: verifyDeterministic ? 'matched' : 'not-checked', output: resolved };
    } finally {
      if (!complete) rmSync(staging, { recursive: true, force: true });
    }
  };
}

async function main() {
  const arguments_ = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < arguments_.length; i += 1) {
    const argument = arguments_[i];
    if (argument === '--verify-deterministic') {
      if ('verifyDeterministic' in options) throw new TypeError('Repeated option: --verify-deterministic');
      options.verifyDeterministic = true;
      continue;
    }
    const value = arguments_[i + 1];
    if (!value) throw new TypeError(`Missing value for ${argument}`);
    if (!['--commit', '--output', '--source'].includes(argument)) throw new TypeError(`Unknown option: ${argument}`);
    const key = argument.slice(2);
    if (key in options) throw new TypeError(`Repeated option: ${argument}`);
    options[key] = value;
    i += 1;
  }
  if (!options.commit) {
    throw new TypeError('Usage: node tools/library-runtime/build.mjs --commit FULL_SHA [--output EMPTY_DIR] [--source LOCAL_CHECKOUT] [--verify-deterministic]');
  }
  const build = createBuild();
  const result = await build(options);
  console.log(JSON.stringify({ ...result, runtimeCheck: { status: result.runtimeCheck.status,
    tools: result.runtimeCheck.tools, sourceCommit: result.runtimeCheck.sourceCommit } }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error?.message || 'Library runtime build failed. No output was kept.');
    process.exitCode = 1;
  });
}
