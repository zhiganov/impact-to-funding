import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  HELPER_VERSION, REPOSITORY, compareVersions, inspectInstallation, parseVersion,
  releaseFromGitHub, selectRelease, validateRelease,
} from '../index.mjs';

const sha = (digit) => digit.repeat(40);
const release = (version, { channel = 'stable', commit = sha('a'), draft = false } = {}) => ({
  contractVersion: 'itf.release/0.1', repository: REPOSITORY,
  version, tag: `v${version}`, sourceCommit: commit, channel, draft,
});
const choose = (records, options = {}) => selectRelease(records, { channel: 'prerelease', complete: true, ...options });
const skill = (version = '0.3.0-dev.0') => `---\nname: impact-to-funding\ndescription: "Synthetic fixture"\n${version === null ? '' : `metadata:\n  version: "${version}"\n`}---\n\nSynthetic instructions.\n`;

function fixture(t, { git = true, version = '0.3.0-dev.0' } = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'itf-provenance-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const command = (...args) => execFileSync('git', [
    '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgSign=false', '-c', `core.hooksPath=${path.join(root, '.git', 'fixture-hooks')}`,
    '-C', root, ...args,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 });
  writeFileSync(path.join(root, 'SKILL.md'), skill(version));
  mkdirSync(path.join(root, 'references'));
  writeFileSync(path.join(root, 'references', 'contributions.md'), 'Synthetic contribution guidance.\n');
  if (git) {
    command('init', '--quiet');
    command('add', '--', 'SKILL.md', 'references');
    command('commit', '--quiet', '-m', 'Synthetic baseline');
    command('remote', 'add', 'origin', `https://github.com/${REPOSITORY}.git`);
  }
  return { root, command, write: (name, text) => writeFileSync(path.join(root, name), text) };
}

test('SemVer ordering covers numeric components, prereleases and build metadata', () => {
  const ordered = ['0.2.9', '0.2.10', '0.3.0-alpha', '0.3.0-alpha.1', '0.3.0-alpha.2',
    '0.3.0-alpha.10', '0.3.0-beta', '0.3.0-rc.1', '0.3.0', '1.0.0'];
  for (let i = 1; i < ordered.length; i += 1) {
    assert.equal(compareVersions(ordered[i - 1], ordered[i]), -1);
    assert.equal(compareVersions(ordered[i], ordered[i - 1]), 1);
  }
  assert.equal(compareVersions('0.3.0+build.1', '0.3.0+other'), 0);
  assert.equal(compareVersions('1.0.0-1', '1.0.0-a'), -1);
  assert.equal(compareVersions('99999999999999999999.0.0', '99999999999999999998.0.0'), 1);
});

test('invalid versions are rejected instead of compared lexically', () => {
  for (const version of ['v0.2.0', '0.2', '01.2.0', '1.0.0-01', '1.0.0-', '', null, 2]) {
    assert.throws(() => parseVersion(version), TypeError);
  }
});

test('release records require a fixed source, repository, channel and matching version tag', () => {
  assert.deepEqual(validateRelease(release('0.2.0')), release('0.2.0'));
  for (const change of [
    { sourceCommit: 'main' }, { sourceCommit: 'abcdef0' }, { repository: 'other/project' },
    { tag: 'v0.1.0' }, { draft: undefined }, { channel: 'latest' },
  ]) assert.throws(() => validateRelease({ ...release('0.2.0'), ...change }), TypeError);
  assert.throws(() => validateRelease(release('0.3.0-dev.0')), TypeError);
});

test('GitHub conversion requires the actual resolved tag, never target_commitish', () => {
  const github = {
    tag_name: 'v0.2.0', html_url: `https://github.com/${REPOSITORY}/releases/tag/v0.2.0`,
    prerelease: true, draft: false, target_commitish: 'main',
  };
  const converted = releaseFromGitHub(github, { tag: 'v0.2.0', commit: sha('b') });
  assert.equal(converted.sourceCommit, sha('b'));
  assert.equal(converted.channel, 'prerelease');
  assert.throws(() => releaseFromGitHub(github), TypeError);
  assert.throws(() => releaseFromGitHub(github, { tag: 'v0.1.0', commit: sha('b') }), TypeError);
  assert.throws(() => releaseFromGitHub({ ...github, html_url: 'https://example.invalid/release' }, { tag: 'v0.2.0', commit: sha('b') }), TypeError);
});

test('experimental releases without SemVer suffixes are included only in the chosen channel', () => {
  const records = [release('0.1.0'), release('0.2.0', { channel: 'prerelease' }),
    release('0.3.0', { channel: 'prerelease', draft: true })];
  assert.equal(choose(records).selected.version, '0.2.0');
  assert.equal(choose(records, { channel: 'stable' }).selected.version, '0.1.0');
  assert.equal(choose([records[1]], { channel: 'stable' }).status, 'no-release');
  assert.throws(() => selectRelease(records, { complete: true }), TypeError);
  assert.throws(() => selectRelease(records, { channel: 'stable' }), TypeError);
});

test('incomplete catalogues cannot assert no release or select a misleading latest version', () => {
  assert.equal(choose([], { complete: false }).status, 'catalogue-incomplete');
  assert.equal(choose([release('0.1.0')], { complete: false }).selected, null);
});

test('pins are retained, including unknown commits, missing tags and channel conflicts', () => {
  const records = [release('0.1.0'), release('0.2.0', { channel: 'prerelease', commit: sha('b') })];
  assert.equal(choose(records, { pin: 'v0.1.0' }).selected.version, '0.1.0');
  assert.equal(choose(records, { pin: sha('a') }).status, 'pinned');
  for (const options of [{ pin: sha('c') }, { pin: 'v0.9.0' }, { pin: 'v0.2.0', channel: 'stable' }]) {
    const result = choose(records, options);
    assert.equal(result.status, 'pin-unresolved');
    assert.equal(result.selected, null);
    assert.equal(result.pin, options.pin);
  }
  assert.throws(() => choose(records, { pin: 'main' }), TypeError);
});

test('conflicting tag records fail closed and release-only fields do not inherit host verification', () => {
  assert.throws(() => choose([release('0.2.0'), release('0.2.0', { commit: sha('b') })]), TypeError);
  const record = validateRelease({ ...release('0.2.0'), hostVerified: true, localPath: 'private' });
  assert.equal(Object.hasOwn(record, 'hostVerified'), false);
  assert.equal(Object.hasOwn(record, 'localPath'), false);
  assert.equal(choose([record, record]).selected.tag, 'v0.2.0');
});

test('a stored tag/commit pin refuses a moved tag rather than accepting the new source', () => {
  const pin = { tag: 'v0.2.0', sourceCommit: sha('a') };
  assert.equal(choose([release('0.2.0')], { pin }).status, 'pinned');
  const result = choose([release('0.2.0', { commit: sha('b') })], { pin });
  assert.equal(result.status, 'pin-unresolved');
  assert.equal(result.selected, null);
  assert.deepEqual(result.pin, pin);
  assert.throws(() => choose([], { pin: { tag: 'v0.2.0' } }), TypeError);
});

test('inspection identifies the explicitly selected complete Git copy without authenticating its origin', (t) => {
  const f = fixture(t);
  const result = inspectInstallation(f.root);
  assert.equal(result.skill.declaredVersion, '0.3.0-dev.0');
  assert.equal(result.source.commit, f.command('rev-parse', 'HEAD').trim());
  assert.equal(result.source.repository, REPOSITORY);
  assert.equal(result.source.authenticated, false);
  assert.equal(result.files.tracked, 'clean');
  assert.equal(result.files.checkedFiles, 2);
  assert.equal(result.files.untrackedEntries, 0);
  assert.equal(result.files.ignoredEntries, 0);
  assert.equal(result.local.realPath, path.resolve(result.local.realPath));
  assert.equal(result.helperVersion, HELPER_VERSION);
  assert.notEqual(result.helperVersion, result.skill.declaredVersion);
});

test('tracked, staged, untracked and ignored changes are observed without disclosing filenames', (t) => {
  const f = fixture(t);
  f.write('references/contributions.md', 'Changed guidance.\n');
  f.command('add', 'references/contributions.md');
  f.write('.gitignore', 'ignored-private.txt\n');
  f.write('ignored-private.txt', 'Synthetic private fixture, not output.\n');
  f.write('untracked-private.txt', 'Synthetic private fixture, not output.\n');
  const result = inspectInstallation(f.root);
  assert.equal(result.files.tracked, 'modified');
  assert.equal(result.files.statusChangedEntries, 1);
  assert.equal(result.files.untrackedEntries, 2);
  assert.equal(result.files.ignoredEntries, 1);
  assert.ok(!JSON.stringify(result).includes('private.txt'));
});

test('actual byte comparison detects modifications hidden by assume-unchanged', (t) => {
  const f = fixture(t);
  f.command('update-index', '--assume-unchanged', 'references/contributions.md');
  f.write('references/contributions.md', 'Hidden edit.\n');
  const result = inspectInstallation(f.root);
  assert.equal(result.files.statusChangedEntries, 0);
  assert.equal(result.files.tracked, 'modified');
});

test('deleted references are not a clean complete package', (t) => {
  const f = fixture(t);
  rmSync(path.join(f.root, 'references', 'contributions.md'));
  assert.equal(inspectInstallation(f.root).files.tracked, 'modified');
});

test('legacy and invalid metadata remain unknown, not inferred from helper or neighbouring files', (t) => {
  const f = fixture(t, { version: null });
  assert.equal(inspectInstallation(f.root).skill.metadataState, 'legacy-no-version');
  assert.equal(inspectInstallation(f.root).skill.declaredVersion, null);
  f.write('SKILL.md', skill('not-a-version'));
  assert.equal(inspectInstallation(f.root).skill.metadataState, 'invalid-version');
});

test('manual copies do not borrow their containing project repository as provenance', (t) => {
  const parent = fixture(t);
  const copy = path.join(parent.root, 'manual-copy');
  mkdirSync(copy);
  writeFileSync(path.join(copy, 'SKILL.md'), skill());
  const result = inspectInstallation(copy);
  assert.equal(result.skill.declaredVersion, '0.3.0-dev.0');
  assert.equal(result.source.kind, 'unknown');
  assert.equal(result.source.commit, null);
  assert.equal(result.files.tracked, 'unknown');
});

test('standalone manual copies and missing origins are handled without an authentication claim', (t) => {
  const manual = fixture(t, { git: false });
  assert.equal(inspectInstallation(manual.root).source.commit, null);
  const cloned = fixture(t);
  cloned.command('remote', 'remove', 'origin');
  const result = inspectInstallation(cloned.root);
  assert.equal(result.source.repository, null);
  assert.match(result.source.commit, /^[a-f0-9]{40}$/);
  assert.equal(result.files.tracked, 'clean');
});

test('unknown or credential-bearing remotes are never echoed in reports', (t) => {
  const f = fixture(t);
  f.command('remote', 'set-url', 'origin', 'https://synthetic-credential@example.invalid/project.git');
  const result = inspectInstallation(f.root);
  assert.equal(result.source.repository, null);
  assert.ok(!JSON.stringify(result).includes('synthetic-credential'));
  assert.ok(!JSON.stringify(result).includes('example.invalid'));
});

test('inherited Git directory/worktree/index overrides cannot lend another repository provenance', (t) => {
  const selected = fixture(t);
  const other = fixture(t, { version: '0.4.0-dev.0' });
  const keys = ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE'];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    process.env.GIT_DIR = path.join(other.root, '.git');
    process.env.GIT_WORK_TREE = selected.root;
    process.env.GIT_INDEX_FILE = path.join(other.root, '.git', 'index');
    const result = inspectInstallation(selected.root);
    assert.equal(result.skill.declaredVersion, '0.3.0-dev.0');
    // Read the selected fixture's SHA with the overrides removed as well.
    assert.equal(result.source.commit, execFileSync('git', ['-C', selected.root, 'rev-parse', 'HEAD'], {
      encoding: 'utf8', env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
    }).trim());
    assert.equal(result.files.tracked, 'clean');
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});

test('replacement refs cannot make replacement content clean for the original reported SHA', (t) => {
  const f = fixture(t);
  const original = f.command('rev-parse', 'HEAD').trim();
  f.write('references/contributions.md', 'Replacement content.\n');
  f.command('add', 'references/contributions.md');
  f.command('commit', '--quiet', '-m', 'Synthetic replacement');
  const replacement = f.command('rev-parse', 'HEAD').trim();
  f.command('replace', original, replacement);
  f.command('update-ref', 'HEAD', original);
  assert.equal(f.command('status', '--porcelain'), '');
  const result = inspectInstallation(f.root);
  assert.equal(result.source.commit, original);
  assert.equal(result.files.tracked, 'modified');
});

test('linked installation roots resolve to the chosen copy; a symlink entry point is refused', (t) => {
  const f = fixture(t);
  const links = mkdtempSync(path.join(tmpdir(), 'itf-provenance-links-'));
  t.after(() => rmSync(links, { recursive: true, force: true }));
  const linked = path.join(links, 'selected');
  symlinkSync(f.root, linked, 'dir');
  assert.equal(inspectInstallation(linked).local.selectedPath, linked);
  assert.equal(inspectInstallation(linked).source.commit, f.command('rev-parse', 'HEAD').trim());
  const target = path.join(f.root, 'SKILL.md');
  const original = readFileSync(target);
  rmSync(target);
  writeFileSync(path.join(links, 'entry.md'), original);
  symlinkSync(path.join(links, 'entry.md'), target);
  assert.throws(() => inspectInstallation(f.root), TypeError);
});

test('inspection is local and read-only; helper and declared versions remain independent', (t) => {
  const f = fixture(t);
  const before = f.command('status', '--porcelain');
  const entry = readFileSync(path.join(f.root, 'SKILL.md'));
  inspectInstallation(f.root);
  assert.equal(f.command('status', '--porcelain'), before);
  assert.deepEqual(readFileSync(path.join(f.root, 'SKILL.md')), entry);
  const helperPackage = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(HELPER_VERSION, helperPackage.version);
});
