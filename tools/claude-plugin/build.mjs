import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRuntimeSource } from '../skill-package/lib/runtime-source.mjs';
import { sourceGit } from '../skill-package/lib/git.mjs';
import { createBuild as createRuntimeBuild } from '../library-runtime/build.mjs';

const REPOSITORY = 'zhiganov/impact-to-funding';
const SKILL_DIRECTORIES = ['playbooks', 'references', 'assets'];
// LICENSE is a scope note; LICENSE-CODE carries the MIT text it points to, which
// the shipped server code needs.
const ROOT_DOCUMENTS = ['SKILL.md', 'LICENSE', 'LICENSE-CODE', 'PRIVACY.md', 'SOURCES.md'];

export function defaultSourceRoot() {
  // tools/claude-plugin/build.mjs -> the repository root two levels up.
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

// A no-op install: the plugin build copies committed files, so the clone it
// reads never needs node_modules. The library runtime builds its own clone.
function installNothing() {}

export function defaultPrepare(clone, commit, { source }) {
  return prepareRuntimeSource(clone, commit, { localSource: source, includeDev: false, install: installNothing });
}

function defaultRuntimeBuild({ commit, output, source }) {
  return createRuntimeBuild()({ commit, output, source });
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target);
    else if (entry.isFile()) copyFileSync(source, target);
    else throw new Error(`Unsupported file type in the plugin source: ${entry.name}`);
  }
}

function listFiles(root, prefix = '') {
  const files = [];
  for (const entry of readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...listFiles(root, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported file type in the plugin output: ${relative}`);
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

function skillDescription(text) {
  const description = text.match(/^description: ("(?:[^"\\]|\\.)+")$/m)?.[1];
  if (!description) throw new Error('The source SKILL.md has no readable description');
  return JSON.parse(description);
}

// Every relative Markdown link in the plugin's runtime files (SKILL.md,
// playbooks/, references/, assets/) must resolve inside the package. Returns
// the set of linked files that live outside the copied skill directories.
export function linkClosure(root, files) {
  const linked = new Map();
  for (const file of files) {
    const text = readFileSync(path.join(root, file), 'utf8');
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#') || /^[a-z]+:/.test(target)) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), target.split('#')[0]));
      if (!resolved || resolved.startsWith('..')) {
        throw new Error(`A runtime link escapes the package: ${file}: ${target}`);
      }
      if (linked.has(resolved) || files.includes(resolved) || existsSync(path.join(root, resolved))) continue;
      linked.set(resolved, null);
    }
  }
  return [...linked.keys()].sort();
}

// Files copied in for reference (examples, tool guides, root notes) can link to
// repository files the plugin leaves out, mostly under docs/. Point those links
// at the same file on GitHub, pinned to the source commit, so they still work
// from an installed plugin. Links that resolve inside the package are kept.
export function pinOutwardLinks(root, files, commit) {
  for (const file of files) {
    if (!file.endsWith('.md')) continue;
    const full = path.join(root, file);
    const text = readFileSync(full, 'utf8');
    const rewritten = text.replace(/\]\(([^)\s]+)\)/g, (match, target) => {
      if (/^https?:\/\//.test(target) || target.startsWith('#') || /^[a-z]+:/.test(target)) return match;
      const [pathPart, anchor] = target.split('#');
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), pathPart)).replace(/\/$/, '');
      if (!resolved || resolved.startsWith('..') || existsSync(path.join(root, resolved))) return match;
      return `](https://github.com/${REPOSITORY}/blob/${commit}/${resolved}${anchor ? `#${anchor}` : ''})`;
    });
    if (rewritten !== text) writeFileSync(full, rewritten);
  }
}

async function buildFolder({ commit, tag, target, prepare, runtimeBuild, source }) {
  mkdirSync(target, { recursive: true, mode: 0o700 });
  const clone = mkdtempSync(path.join(tmpdir(), 'itf-claude-plugin-'));
  try {
    const observed = await prepare(clone, commit, { source });
    for (const directory of SKILL_DIRECTORIES) copyTree(path.join(clone, directory), path.join(target, directory));
    for (const document of ROOT_DOCUMENTS) copyFileSync(path.join(clone, document), path.join(target, document));
    const skill = readFileSync(path.join(clone, 'SKILL.md'), 'utf8');

    // Link closure: every relative link in the runtime files resolves inside
    // the package. docs/ never ships, so a source that still links into it is
    // refused rather than silently widened.
    const runtimeFiles = ['SKILL.md', ...listFiles(target, 'playbooks'),
      ...listFiles(target, 'references'), ...listFiles(target, 'assets')];
    const linkedFiles = linkClosure(target, runtimeFiles);
    for (const linked of linkedFiles) {
      if (linked === 'docs' || linked.startsWith('docs/')) {
        throw new Error(`The source commit's skill still links into docs/: ${linked}. Build from a commit after the docs/ decoupling.`);
      }
      const from = path.join(clone, linked);
      if (!existsSync(from) || !statSync(from).isFile()) throw new Error(`A runtime link names a missing file: ${linked}`);
      mkdirSync(path.dirname(path.join(target, linked)), { recursive: true });
      copyFileSync(from, path.join(target, linked));
    }

    pinOutwardLinks(target, [...linkedFiles, ...ROOT_DOCUMENTS.filter((document) => document !== 'SKILL.md')], commit);

    const runtime = await runtimeBuild({ commit, output: path.join(target, 'library-runtime'), source });
    const runtimeProvenance = JSON.parse(readFileSync(path.join(target, 'library-runtime', 'provenance.json'), 'utf8'));
    mkdirSync(path.join(target, '.claude-plugin'), { mode: 0o700 });
    const manifest = {
      name: 'itf',
      version: observed.skillVersion,
      description: skillDescription(skill),
      author: { name: 'Artem Zhiganov' },
      skills: '.',
      mcpServers: {
        itf_library: {
          command: 'node',
          args: ['${CLAUDE_PLUGIN_ROOT}/library-runtime/server/server.mjs',
            '--snapshot', '${CLAUDE_PLUGIN_ROOT}/library-runtime/library-snapshot.json'],
        },
      },
    };
    writeFileSync(path.join(target, '.claude-plugin', 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

    const files = hashFiles(target, listFiles(target));
    const provenance = {
      contractVersion: 'itf.claude-plugin/0.1',
      repository: REPOSITORY,
      sourceCommit: commit,
      tag,
      skillVersion: observed.skillVersion,
      runtimeProvenance,
      runtimeCheck: runtime.runtimeCheck,
      // Every file in this folder except provenance.json itself.
      files,
    };
    writeFileSync(path.join(target, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    return { provenance, runtimeCheck: runtime.runtimeCheck };
  } finally {
    rmSync(clone, { recursive: true, force: true });
  }
}

export function createPluginBuild({
  sourceRoot = defaultSourceRoot(),
  prepare = defaultPrepare,
  runtimeBuild = defaultRuntimeBuild,
  nodeVersion = () => process.versions.node,
  treeState = defaultTreeState,
  releaseCommit = defaultReleaseCommit,
} = {}) {
  return async function build({ commit, output, source = null, verifyDeterministic = false } = {}) {
    if (!/^[0-9a-f]{40}$/.test(commit ?? '')) {
      throw new TypeError('A full lowercase 40-character source commit is required');
    }
    const major = Number(/^v?(\d+)/.exec(nodeVersion())?.[1]);
    if (!(major >= 22)) throw new Error('Node 22 or later is required to build the Claude Code plugin');
    if (treeState(sourceRoot).trim() !== '') {
      throw new Error('The source checkout is dirty; commit or clean it before building a plugin release');
    }
    const release = releaseCommit(sourceRoot, commit);
    if (!release.onMain && !release.tag) {
      throw new Error('The selected commit is not reachable from main and has no release tag');
    }
    const resolved = path.resolve(output ?? path.join(sourceRoot, 'outputs', 'claude-plugin'));
    if (existsSync(resolved)) {
      if (!statSync(resolved).isDirectory() || readdirSync(resolved).length > 0) {
        throw new Error('The output directory is not empty');
      }
    } else mkdirSync(path.dirname(resolved), { recursive: true, mode: 0o700 });
    const staging = mkdtempSync(path.join(path.dirname(resolved), 'claude-plugin-build-'));
    let complete = false;
    try {
      const first = await buildFolder({ commit, tag: release.tag, target: staging, prepare, runtimeBuild, source });
      if (verifyDeterministic) {
        const second = mkdtempSync(path.join(path.dirname(resolved), 'claude-plugin-build-'));
        try {
          await buildFolder({ commit, tag: release.tag, target: second, prepare, runtimeBuild, source });
          const left = hashFiles(staging, listFiles(staging));
          const right = hashFiles(second, listFiles(second));
          const differences = [];
          for (const file of new Set([...Object.keys(left), ...Object.keys(right)])) {
            if (left[file] !== right[file]) differences.push(file);
          }
          if (differences.length > 0) {
            throw new Error(`Two plugin builds from the same commit differ: ${differences.join(', ')}`);
          }
        } finally {
          rmSync(second, { recursive: true, force: true });
        }
      }
      if (existsSync(resolved)) rmSync(resolved, { recursive: true });
      renameSync(staging, resolved);
      complete = true;
      return { status: 'built', sourceCommit: commit, tag: release.tag,
        skillVersion: first.provenance.skillVersion,
        runtimeCheck: first.runtimeCheck,
        fileCount: Object.keys(first.provenance.files).length + 1,
        deterministic: verifyDeterministic ? 'matched' : 'not-checked', output: resolved };
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
    throw new TypeError('Usage: node tools/claude-plugin/build.mjs --commit FULL_SHA [--output EMPTY_DIR] [--source LOCAL_CHECKOUT] [--verify-deterministic]');
  }
  const build = createPluginBuild();
  const result = await build(options);
  console.log(JSON.stringify({ ...result, runtimeCheck: { status: result.runtimeCheck.status,
    sourceCommit: result.runtimeCheck.sourceCommit, snapshotId: result.runtimeCheck.snapshotId } }, null, 2));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error?.message || 'Claude Code plugin build failed. No output was kept.');
    process.exitCode = 1;
  });
}
