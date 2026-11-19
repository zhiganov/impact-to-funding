import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createPluginBuild, defaultPrepare, defaultSourceRoot, linkClosure } from '../build.mjs';

const skill = `---\nname: impact-to-funding\ndescription: "Fictional fixture skill"\nmetadata:\n  version: "9.9.9"\n---\n\nFictional instructions with [an example](examples/bar.md) and [a tool guide](tools/widget/README.md).\n`;
const lock = {
  name: 'itf-reference-library-mcp', version: '0.1.0', lockfileVersion: 3,
  packages: {
    '': { name: 'itf-reference-library-mcp', version: '0.1.0' },
    'node_modules/@fixture/left': { version: '1.0.0',
      resolved: 'https://registry.npmjs.org/@fixture/left/-/left-1.0.0.tgz',
      integrity: 'sha512-Zml4dGlvZXBpcnlzZXIwb2ysdGVzdGluYWxpemVkLWNoZWNrLXN1bW1hcnk=', license: 'MIT' },
  },
};

// A fictional local source repository: the clone and source-verification run
// for real against it; the runtime build is simulated, and no npm runs at all.
function sourceRepository(t, { docsLink = false } = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-plugin-source-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const command = (...args) => execFileSync('git', [
    '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgSign=false', '-c', `core.hooksPath=${path.join(root, '.git', 'fixture-hooks')}`,
    '-C', root, ...args,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
  const write = (name, text) => {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), text);
  };
  write('SKILL.md', skill);
  write('LICENSE', 'Fixture licence.\n');
  write('PRIVACY.md', 'Fixture privacy note.\n');
  write('SOURCES.md', 'Fixture sources note.\n');
  write('playbooks/guide.md', docsLink
    ? 'A guide that [still links docs](../docs/design-note.md).\n'
    : 'A guide with [an example](../examples/bar.md) and [a tool guide](../tools/widget/README.md).\n');
  write('references/claims.md', 'Read [the MCP guide](../mcp/README.md) and [the playbook](../playbooks/guide.md).\n');
  write('assets/report.md', 'Fixture worksheet.\n');
  write('examples/bar.md', 'Fictional example.\n');
  write('tools/widget/README.md', 'Widget guide for humans.\n');
  write('mcp/README.md', 'Library MCP guide.\n');
  write('mcp/package.json', `${JSON.stringify({ name: 'itf-reference-library-mcp', version: '7.8.9', private: true }, null, 2)}\n`);
  write('mcp/package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
  command('init', '--quiet');
  command('add', '--', 'SKILL.md', 'LICENSE', 'PRIVACY.md', 'SOURCES.md', 'playbooks', 'references', 'assets',
    'examples', 'tools', 'mcp');
  command('commit', '--quiet', '-m', 'Fictional plugin source');
  command('remote', 'add', 'origin', 'https://github.com/zhiganov/impact-to-funding.git');
  return { root, commit: command('rev-parse', 'HEAD').trim() };
}

// Simulated library-runtime build: writes the folder the real runtime build
// produces, without any clone, npm or probe.
function simulatedRuntimeBuild({ commit }) {
  const provenance = { contractVersion: 'itf.library-runtime/0.1', repository: 'zhiganov/impact-to-funding',
    sourceCommit: commit, skillVersion: '9.9.9' };
  const runtimeCheck = { status: 'passed', sourceCommit: commit, snapshotId: 'fixture-snapshot-1' };
  return async ({ output }) => {
    mkdirSync(path.join(output, 'server'), { recursive: true });
    writeFileSync(path.join(output, 'server', 'server.mjs'), 'fixture server\n');
    writeFileSync(path.join(output, 'library-snapshot.json'), `${JSON.stringify({ snapshotId: 'fixture-snapshot-1', sourceRevision: commit })}\n`);
    writeFileSync(path.join(output, 'provenance.json'), `${JSON.stringify(provenance)}\n`);
    return { status: 'built', sourceCommit: commit, skillVersion: '9.9.9', runtimeCheck };
  };
}

function noNodeModulesAbove(directory) {
  for (let current = path.dirname(directory); ; current = path.dirname(current)) {
    if (existsSync(path.join(current, 'node_modules'))) return current;
    if (current === path.dirname(current)) return null;
  }
}

function readdirRecursively(root, prefix = '') {
  const files = [];
  for (const entry of readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...readdirRecursively(root, relative));
    else files.push(relative);
  }
  return files;
}

function fixture(t, overrides = {}) {
  const source = sourceRepository(t, { docsLink: overrides.docsLink });
  const output = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-plugin-output-')));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  const calls = { prepare: 0, runtimeBuild: 0 };
  const build = createPluginBuild({
    treeState: () => '',
    releaseCommit: () => ({ tag: 'v9.9.9', onMain: true }),
    prepare(clone, commit, options) {
      calls.prepare += 1;
      assert.equal(commit, source.commit);
      return defaultPrepare(clone, commit, options);
    },
    runtimeBuild(options) {
      calls.runtimeBuild += 1;
      return simulatedRuntimeBuild({ commit: source.commit })(options);
    },
    ...overrides,
  });
  return { source, output, build, calls };
}

async function run(build, f, extra = {}) {
  return build({ commit: f.source.commit, output: f.output, source: f.source.root, ...extra });
}

test('the default source root is the repository containing the build tool', () => {
  // tools/claude-plugin/tests/build.test.mjs -> four levels up.
  assert.equal(defaultSourceRoot(), fileURLToPath(new URL('../../../', import.meta.url)));
});

test('the link closure keeps every relative runtime link inside the package', async (t) => {
  const f = fixture(t);
  const result = await run(f.build, f);
  assert.equal(result.status, 'built');
  assert.ok(existsSync(path.join(f.output, 'examples/bar.md')));
  assert.ok(existsSync(path.join(f.output, 'tools/widget/README.md')));
  assert.ok(existsSync(path.join(f.output, 'mcp/README.md')));
  assert.ok(existsSync(path.join(f.output, 'library-runtime/server/server.mjs')));
  assert.ok(existsSync(path.join(f.output, '.claude-plugin/plugin.json')));
  const runtimeFiles = ['SKILL.md', ...readdirRecursively(f.output, 'playbooks'),
    ...readdirRecursively(f.output, 'references'), ...readdirRecursively(f.output, 'assets')];
  assert.deepEqual(linkClosure(f.output, runtimeFiles), []);
  // The runtime build ran inside the package, and no ancestor node_modules
  // was involved.
  assert.equal(f.calls.runtimeBuild, 1);
  assert.equal(noNodeModulesAbove(f.output), null);
  assert.ok(!existsSync(path.join(f.output, 'tools/skill-package')));
  assert.ok(!existsSync(path.join(f.output, 'docs')));
  assert.equal(result.deterministic, 'not-checked');
});

test('a source that still links into docs/ is refused, not silently widened', async (t) => {
  const f = fixture(t, { docsLink: true });
  await assert.rejects(run(f.build, f), /still links into docs/);
  assert.deepEqual(readdirSync(f.output), []);
});

test('the manifest carries the plugin identity, skill version and inline server', async (t) => {
  const f = fixture(t);
  await run(f.build, f);
  const manifest = JSON.parse(readFileSync(path.join(f.output, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(manifest.name, 'itf');
  assert.equal(manifest.version, '9.9.9');
  assert.equal(manifest.skills, '.');
  assert.equal(manifest.description, 'Fictional fixture skill');
  assert.deepEqual(manifest.author, { name: 'Artem Zhiganov' });
  assert.deepEqual(manifest.mcpServers.itf_library.args, [
    '${CLAUDE_PLUGIN_ROOT}/library-runtime/server/server.mjs',
    '--snapshot', '${CLAUDE_PLUGIN_ROOT}/library-runtime/library-snapshot.json',
  ]);
  assert.equal(manifest.mcpServers.itf_library.command, 'node');
  // No component path may escape the plugin root.
  assert.ok(!JSON.stringify(manifest).includes('..'));
});

test('provenance records the source, the runtime provenance and every file hash', async (t) => {
  const f = fixture(t);
  await run(f.build, f);
  const provenance = JSON.parse(readFileSync(path.join(f.output, 'provenance.json'), 'utf8'));
  assert.equal(provenance.contractVersion, 'itf.claude-plugin/0.1');
  assert.equal(provenance.sourceCommit, f.source.commit);
  assert.equal(provenance.skillVersion, '9.9.9');
  assert.equal(provenance.runtimeProvenance.sourceCommit, f.source.commit);
  assert.equal(provenance.runtimeCheck.status, 'passed');
  const onDisk = readdirRecursively(f.output).sort();
  assert.deepEqual(Object.keys(provenance.files).sort(), onDisk.filter((file) => file !== 'provenance.json'));
  for (const file of Object.keys(provenance.files)) {
    assert.equal(provenance.files[file],
      createHash('sha256').update(readFileSync(path.join(f.output, file))).digest('hex'));
  }
});

test('refusals precede any preparation and keep the output untouched', async (t) => {
  for (const override of [{ nodeVersion: () => '20.19.0' },
    { treeState: () => ' M SKILL.md' },
    { releaseCommit: () => ({ tag: null, onMain: false }) }]) {
    const f = fixture(t, override);
    mkdirSync(path.join(f.output, 'sentinel'));
    await assert.rejects(run(f.build, f), /Node 22|dirty|reachable/);
    assert.equal(f.calls.prepare, 0);
    assert.ok(existsSync(path.join(f.output, 'sentinel')));
  }
  const short = fixture(t);
  await assert.rejects(run(short.build, short, { commit: 'main' }), /full lowercase 40-character source commit/);
  const occupied = fixture(t);
  writeFileSync(path.join(occupied.output, 'existing.txt'), 'sentinel\n');
  await assert.rejects(run(occupied.build, occupied), /not empty/);
  assert.equal(occupied.calls.prepare, 0);
});

test('a failed runtime build keeps the requested output untouched', async (t) => {
  let attempts = 0;
  const failing = fixture(t, {
    runtimeBuild(options) {
      attempts += 1;
      if (attempts === 1) throw new Error('synthetic runtime failure');
      return simulatedRuntimeBuild({ commit: options.commit })(options);
    },
  });
  await assert.rejects(run(failing.build, failing), /synthetic runtime failure/);
  assert.deepEqual(readdirSync(failing.output), []);
  const result = await run(failing.build, failing);
  assert.equal(result.status, 'built');
});

test('deterministic verification matches two builds and reports injected drift', async (t) => {
  const f = fixture(t);
  const result = await run(f.build, f, { verifyDeterministic: true });
  assert.equal(result.deterministic, 'matched');
  assert.equal(f.calls.runtimeBuild, 2);
  let builds = 0;
  const drifting = fixture(t, {
    runtimeBuild(options) {
      builds += 1;
      const runtime = simulatedRuntimeBuild({ commit: options.commit });
      return runtime(options).then((summary) => {
        if (builds > 1) writeFileSync(path.join(options.output, 'drift.txt'), `drift ${builds}\n`);
        return summary;
      });
    },
  });
  await assert.rejects(run(drifting.build, drifting, { verifyDeterministic: true }),
    /Two plugin builds from the same commit differ: provenance\.json, library-runtime\/drift\.txt/);
});
