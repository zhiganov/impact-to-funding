import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createBuild, defaultPrepare, defaultSourceRoot, productionDependencies } from '../build.mjs';

test('the default source root is the repository containing the build tool', () => {
  // tests/build.test.mjs -> the repository root three levels up.
  assert.equal(defaultSourceRoot(), fileURLToPath(new URL('../../../', import.meta.url)));
});

const skill = `---\nname: impact-to-funding\ndescription: "Fictional fixture skill"\nmetadata:\n  version: "9.9.9"\n---\n\nFictional instructions.\n`;
const server = `import { value } from '@fixture/left';\nimport { readFileSync } from 'node:fs';\nconst args = process.argv.slice(2);\nif (args.length !== 2 || args[0] !== '--snapshot' || !args[1]) {\n  process.exitCode = 1;\n} else {\n  JSON.parse(readFileSync(args[1], 'utf8'));\n  console.log(\`fixture-server-ok:\${value}\`);\n}\n`;
const prepare = `import { readFileSync, writeFileSync } from 'node:fs';\nconst args = process.argv.slice(2);\nif (args.length !== 4 || args[0] !== '--revision' || args[2] !== '--output') process.exitCode = 1;\nelse writeFileSync(args[3], JSON.stringify({ snapshotId: 'fixture-snapshot-1', sourceRevision: args[1] }) + '\\n', { flag: 'wx', mode: 0o600 });\n`;
const lock = {
  name: 'itf-reference-library-mcp', version: '0.1.0', lockfileVersion: 3,
  packages: {
    '': { name: 'itf-reference-library-mcp', version: '0.1.0',
      dependencies: { '@fixture/left': '1.0.0' },
      devDependencies: { '@fixture/dev-only': '1.0.0' } },
    'node_modules/@fixture/left': { version: '1.0.0',
      resolved: 'https://registry.npmjs.org/@fixture/left/-/left-1.0.0.tgz',
      integrity: 'sha512-Zml4dGlvZXBpcnlzZXIwb2ysdGVzdGluYWxpemVkLWNoZWNrLXN1bW1hcnk=', license: 'MIT',
      dependencies: { '@fixture/nested': '1.0.0' } },
    'node_modules/@fixture/nested': { version: '1.0.0',
      resolved: 'https://registry.npmjs.org/@fixture/nested/-/nested-1.0.0.tgz',
      integrity: 'sha512-bmV4dGlvZXBpcnlzZXIwb2ysdGVzdGluYWxpemVkLWNoZWNrLXN1bW1hcnk=', license: 'Apache-2.0' },
    'node_modules/@fixture/dev-only': { version: '1.0.0', dev: true,
      resolved: 'https://registry.npmjs.org/@fixture/dev-only/-/dev-only-1.0.0.tgz',
      integrity: 'sha512-Y2hl4dGlvZXBpcnlzZXIwb2ysdGVzdGluYWxpemVkLWNoZWNrLXN1bW1hcnk=', license: 'MIT' },
  },
};

function writePackage(root, name, { license, notice = null }) {
  const directory = path.join(root, 'node_modules', ...name.split('/'));
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'package.json'), `${JSON.stringify({ name, version: '1.0.0', license,
    main: 'index.js' }, null, 2)}\n`);
  writeFileSync(path.join(directory, 'index.js'), 'export const value = \'left\';\n');
  writeFileSync(path.join(directory, 'LICENSE'), `${license} fixture licence text for ${name}.\n`);
  if (notice) writeFileSync(path.join(directory, 'NOTICE'), `${notice}\n`);
}

// A fictional local source repository: the clone, source-verification and
// lockfile checks run for real against it; only npm is simulated.
function sourceRepository(t, { install } = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-runtime-source-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const command = (...args) => execFileSync('git', [
    '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgSign=false', '-c', `core.hooksPath=${path.join(root, '.git', 'fixture-hooks')}`,
    '-C', root, ...args,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
  writeFileSync(path.join(root, 'SKILL.md'), skill);
  mkdirSync(path.join(root, 'mcp'), { recursive: true });
  writeFileSync(path.join(root, 'mcp/package.json'), `${JSON.stringify({ name: 'itf-reference-library-mcp',
    version: '7.8.9', private: true, type: 'module', license: 'MIT' }, null, 2)}\n`);
  writeFileSync(path.join(root, 'mcp/package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  for (const file of ['server.mjs', 'library.mjs', 'schemas.mjs']) writeFileSync(path.join(root, 'mcp', file), server);
  writeFileSync(path.join(root, 'mcp/prepare.mjs'), prepare);
  command('init', '--quiet');
  command('add', '--', 'SKILL.md', 'mcp');
  command('commit', '--quiet', '-m', 'Fictional runtime source');
  command('remote', 'add', 'origin', 'https://github.com/zhiganov/impact-to-funding.git');
  const commit = command('rev-parse', 'HEAD').trim();
  // The simulated npm install: production and dev packages on disk, like a full
  // `npm ci`, so the build's production-only copy has something to exclude.
  const installDependencies = (target) => {
    for (const [name, options] of [['@fixture/left', { license: 'MIT' }],
      ['@fixture/nested', { license: 'Apache-2.0', notice: 'Apache NOTICE fixture' }],
      ['@fixture/dev-only', { license: 'MIT' }]]) {
      writePackage(path.join(target, 'mcp'), name, options);
    }
  };
  return { root, commit, install: install ?? installDependencies };
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
  const source = sourceRepository(t, { install: overrides.install });
  const output = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-runtime-output-')));
  t.after(() => rmSync(output, { recursive: true, force: true }));
  const calls = { prepare: 0 };
  const build = createBuild({
    treeState: () => '',
    releaseCommit: () => ({ tag: 'v9.9.9', onMain: true }),
    install: source.install,
    prepare(clone, commit, options) {
      calls.prepare += 1;
      assert.equal(commit, source.commit);
      return defaultPrepare(clone, commit, options);
    },
    probe: async ({ expectedCommit }) => ({ status: 'passed', sourceCommit: expectedCommit,
      snapshotId: 'fixture-snapshot-1',
      tools: ['get_reference', 'library_info', 'search_references'],
      operations: ['library_info', 'search_references', 'get_reference'] }),
    ...overrides,
  });
  return { source, output, build, calls };
}

async function run(build, f, extra = {}) {
  return build({ commit: f.source.commit, output: f.output, source: f.source.root, ...extra });
}

test('the production closure excludes dev-only packages and records lockfile integrity', () => {
  const production = productionDependencies(lock);
  assert.deepEqual(production.map((entry) => entry.name), ['@fixture/left', '@fixture/nested']);
  assert.equal(production.find((entry) => entry.name === '@fixture/left').integrity,
    lock.packages['node_modules/@fixture/left'].integrity);
  assert.ok(!production.some((entry) => entry.name === '@fixture/dev-only'));
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
  assert.equal(short.calls.prepare, 0);
  const occupied = fixture(t);
  writeFileSync(path.join(occupied.output, 'existing.txt'), 'sentinel\n');
  await assert.rejects(run(occupied.build, occupied), /not empty/);
  assert.equal(occupied.calls.prepare, 0);
  assert.equal(readdirSync(occupied.output).join(','), 'existing.txt');
});

test('a full build copies only production packages and records provenance', async (t) => {
  const f = fixture(t);
  const result = await run(f.build, f);
  assert.equal(result.status, 'built');
  assert.equal(f.calls.prepare, 1);
  assert.equal(result.sourceCommit, f.source.commit);
  assert.equal(result.tag, 'v9.9.9');
  assert.equal(result.skillVersion, '9.9.9');
  assert.equal(result.serverVersion, '7.8.9');
  assert.equal(result.snapshotId, 'fixture-snapshot-1');
  assert.deepEqual(result.dependencies.map((entry) => entry.name), ['@fixture/left', '@fixture/nested']);
  const provenance = JSON.parse(readFileSync(path.join(f.output, 'provenance.json'), 'utf8'));
  assert.equal(provenance.contractVersion, 'itf.library-runtime/0.1');
  assert.equal(provenance.repository, 'zhiganov/impact-to-funding');
  assert.equal(provenance.sourceCommit, f.source.commit);
  assert.equal(provenance.skillVersion, '9.9.9');
  assert.equal(provenance.dependencies.length, 2);
  assert.ok(!existsSync(path.join(f.output, 'node_modules/@fixture/dev-only')));
  assert.ok(existsSync(path.join(f.output, 'server/server.mjs')));
  assert.ok(existsSync(path.join(f.output, 'node_modules/@fixture/left/index.js')));
  assert.ok(existsSync(path.join(f.output, 'node_modules/@fixture/nested/NOTICE')));
  // provenance.files covers every file except itself, with correct hashes.
  const onDisk = readdirRecursively(f.output).sort();
  assert.deepEqual(Object.keys(provenance.files).sort(), onDisk.filter((file) => file !== 'provenance.json'));
  for (const file of Object.keys(provenance.files)) {
    assert.equal(provenance.files[file],
      createHash('sha256').update(readFileSync(path.join(f.output, file))).digest('hex'));
  }
  const licenses = readFileSync(path.join(f.output, 'THIRD_PARTY_LICENSES.md'), 'utf8');
  assert.match(licenses, /## @fixture\/left 1\.0\.0/);
  assert.match(licenses, /## @fixture\/nested 1\.0\.0/);
  assert.match(licenses, /Apache NOTICE fixture/);
  assert.ok(!licenses.includes('@fixture/dev-only'));
  assert.equal(result.deterministic, 'not-checked');
});

test('the built runtime runs with no node_modules above it', async (t) => {
  const f = fixture(t, {
    async probe({ server, snapshot, cwd }) {
      assert.equal(noNodeModulesAbove(cwd), null, 'an ancestor node_modules would mask the folder\u2019s own packages');
      const outcome = execFileSync(process.execPath, [server, '--snapshot', snapshot],
        { cwd, encoding: 'utf8', timeout: 10000 });
      assert.equal(outcome.trim(), 'fixture-server-ok:left');
      return { status: 'passed', sourceCommit: f.source.commit, snapshotId: 'fixture-snapshot-1',
        tools: ['get_reference', 'library_info', 'search_references'],
        operations: ['library_info', 'search_references', 'get_reference'] };
    },
  });
  const result = await run(f.build, f);
  assert.equal(result.runtimeCheck.status, 'passed');
  assert.equal(noNodeModulesAbove(f.output), null);
});

test('a failed runtime check keeps the requested output untouched', async (t) => {
  const f = fixture(t, {
    async probe() { throw new Error('synthetic probe failure'); },
  });
  await assert.rejects(run(f.build, f), /synthetic probe failure/);
  assert.deepEqual(readdirSync(f.output), []);
  assert.equal(f.calls.prepare, 1);
});

test('deterministic verification matches two builds and reports injected drift', async (t) => {
  const f = fixture(t);
  const result = await run(f.build, f, { verifyDeterministic: true });
  assert.equal(result.deterministic, 'matched');
  assert.equal(f.calls.prepare, 2);
  const firstInstall = f.source.install;
  let builds = 0;
  const drifting = fixture(t, {
    install(target) {
      firstInstall(target);
      builds += 1;
      if (builds > 1) writeFileSync(path.join(target, 'mcp/node_modules/@fixture/left/extra.txt'), `drift ${builds}\n`);
    },
  });
  await assert.rejects(run(drifting.build, drifting, { verifyDeterministic: true }),
    /Two builds from the same commit differ: provenance\.json, node_modules\/@fixture\/left\/extra\.txt/);
});
