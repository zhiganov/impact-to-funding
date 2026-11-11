import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createManager } from '../index.mjs';
import { prepareFromGitHub, SOURCE_URL, sourceGit } from '../lib/git.mjs';
import { targetPaths } from '../lib/targets.mjs';
import { currentReceipt, readJson, writeJson } from '../lib/storage.mjs';

function fixture(t, overrides = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-manager-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  const source = path.join(root, 'source');
  for (const directory of [home, project, source]) mkdirSync(directory);
  const git = (...args) => execFileSync('git', ['-c', 'user.name=Synthetic Fixture',
    '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgSign=false',
    '-c', `core.hooksPath=${path.join(root, 'no-hooks')}`, '-C', source, ...args], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000,
  }).trim();
  git('init', '--quiet');
  for (const name of ['LICENSE', 'PRIVACY.md', 'SOURCES.md', 'metadata.json']) writeFileSync(path.join(source, name), 'Synthetic package material.\n');
  mkdirSync(path.join(source, 'references'));
  writeFileSync(path.join(source, 'references/contributions.md'), 'Original synthetic guidance.\n');
  writeFileSync(path.join(source, '.gitignore'), 'ignored-private.txt\n');
  const commits = [];
  for (const version of ['0.1.0', '0.2.0']) {
    writeFileSync(path.join(source, 'SKILL.md'), `---\nname: impact-to-funding\ndescription: "Synthetic fixture"\nmetadata:\n  version: "${version}"\n---\n\n[Contributions](references/contributions.md).\n`);
    git('add', '.');
    git('commit', '--quiet', '-m', `Synthetic ${version}`);
    commits.push(git('rev-parse', 'HEAD'));
  }
  const records = commits.map((sourceCommit, index) => ({ contractVersion: 'itf.release/0.1',
    repository: 'zhiganov/impact-to-funding', version: `0.${index + 1}.0`, tag: `v0.${index + 1}.0`,
    sourceCommit, channel: index ? 'prerelease' : 'stable', draft: false }));
  let prepares = 0;
  const prepare = (destination, commit) => {
    prepares += 1;
    sourceGit(['clone', '--quiet', '--no-checkout', '--no-local', source, destination]);
    sourceGit(['-C', destination, 'remote', 'set-url', 'origin', SOURCE_URL]);
    sourceGit(['-C', destination, 'checkout', '--quiet', '--detach', commit]);
  };
  const options = { harness: 'codex', scope: 'project', home, project, configHome: path.join(home, '.config'), channel: 'prerelease' };
  const manager = createManager({ catalogue: async () => ({ records, complete: true }), prepare, ...overrides });
  return { root, home, project, source, git, records, commits, prepare, manager, options,
    get prepares() { return prepares; }, paths: () => targetPaths(options) };
}

test('plans and check do not install, create private state or fetch source contents', async (t) => {
  const f = fixture(t);
  const result = await f.manager.run('install', f.options);
  assert.equal(result.targetSource.sourceCommit, f.commits[1]);
  assert.equal(result.applied, false);
  assert.equal(f.prepares, 0);
  assert.equal(existsSync(f.paths().target), false);
  assert.equal(existsSync(f.paths().state), false);
});

test('complete install, pinned no-op, explicit channel update and rollback preserve files', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const paths = f.paths();
  assert.equal(readFileSync(path.join(paths.target, 'metadata.json'), 'utf8'), 'Synthetic package material.\n');
  const first = currentReceipt(paths);
  assert.equal(first.sourceCommit, f.commits[0]);
  assert.equal(first.versionSource, 'release');
  assert.deepEqual(first.policy.pin, { tag: 'v0.1.0', sourceCommit: f.commits[0] });
  const receiptBytes = readFileSync(path.join(paths.state, 'receipt.json'));
  assert.equal((await f.manager.run('check', { ...f.options, apply: true })).applied, false);
  assert.deepEqual(readFileSync(path.join(paths.state, 'receipt.json')), receiptBytes);
  assert.equal((await f.manager.run('update', { ...f.options, apply: true })).status, 'current');
  assert.equal(f.prepares, 1);
  const updated = await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  assert.equal(updated.status, 'installed');
  const second = currentReceipt(paths);
  assert.equal(second.sourceCommit, f.commits[1]);
  assert.ok(existsSync(path.join(paths.state, 'backups', second.previous, 'skill', 'SKILL.md')));
  const rolled = await f.manager.run('rollback', { ...f.options, apply: true });
  assert.equal(rolled.status, 'rolled-back');
  assert.equal(currentReceipt(paths).sourceCommit, f.commits[0]);
  assert.match(readFileSync(path.join(paths.target, 'SKILL.md'), 'utf8'), /version: "0.1.0"/);
});

test('the explicit before-change plan is emitted before any preparation or write', async (t) => {
  const f = fixture(t);
  let planned = false;
  await f.manager.run('install', { ...f.options, apply: true, onPlan(plan) {
    planned = true;
    assert.equal(plan.scope, 'project');
    assert.equal(plan.target, f.paths().target);
    assert.equal(f.prepares, 0);
    assert.equal(existsSync(f.paths().state), false);
  } });
  assert.equal(planned, true);
});

test('all native harness/project and personal paths are explicit and independently placed', async (t) => {
  for (const harness of ['claude', 'codex', 'opencode']) {
    for (const scope of ['project', 'personal']) {
      const f = fixture(t);
      const options = { ...f.options, harness, scope, apply: true };
      await f.manager.run('install', options);
      const paths = targetPaths(options);
      assert.ok(existsSync(path.join(paths.target, 'SKILL.md')));
      assert.ok(!paths.state.includes(`${path.sep}skills${path.sep}`));
      assert.equal(currentReceipt(paths).harness, harness);
      assert.equal(currentReceipt(paths).scope, scope);
    }
  }
});

test('other discoverable copies require acknowledgement and remain untouched', async (t) => {
  const f = fixture(t);
  const other = path.join(f.home, '.claude/skills/impact-to-funding');
  mkdirSync(other, { recursive: true });
  writeFileSync(path.join(other, 'SKILL.md'), '---\nname: impact-to-funding\n---\nExisting copy.\n');
  const original = readFileSync(path.join(other, 'SKILL.md'));
  const plan = await f.manager.run('install', f.options);
  assert.deepEqual(plan.duplicates, [other]);
  await assert.rejects(f.manager.run('install', { ...f.options, apply: true }), /acknowledge/);
  await f.manager.run('install', { ...f.options, ackDuplicates: true, apply: true });
  assert.deepEqual(readFileSync(path.join(other, 'SKILL.md')), original);
});

test('changed, untracked and ignored material refuses updates without deleting it', async (t) => {
  for (const filename of ['SKILL.md', 'new-private.txt', 'ignored-private.txt']) {
    const f = fixture(t);
    await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
    const file = path.join(f.paths().target, filename);
    writeFileSync(file, 'Synthetic local/private work.\n');
    await assert.rejects(f.manager.run('update', { ...f.options, followChannel: true, apply: true }), /changed|extras|provenance/);
    assert.equal(readFileSync(file, 'utf8'), 'Synthetic local/private work.\n');
    assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[0]);
  }
});

test('candidate failure leaves the old complete copy usable', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const broken = createManager({ catalogue: async () => ({ records: f.records, complete: true }), prepare(destination, commit) {
    f.prepare(destination, commit);
    rmSync(path.join(destination, 'references/contributions.md'));
  } });
  await assert.rejects(broken.run('update', { ...f.options, followChannel: true, apply: true }), /Candidate/);
  assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[0]);
  assert.ok(existsSync(path.join(f.paths().target, 'references/contributions.md')));
});

test('a failed replacement after moving the old copy automatically restores it', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  let moves = 0;
  const failing = createManager({ catalogue: async () => ({ records: f.records, complete: true }), prepare: f.prepare,
    rename(from, to) { if (++moves === 2) throw new Error('Synthetic second rename failure'); renameSync(from, to); } });
  await assert.rejects(failing.run('update', { ...f.options, followChannel: true, apply: true }), /Synthetic second rename/);
  assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[0]);
  assert.match(readFileSync(path.join(f.paths().target, 'SKILL.md'), 'utf8'), /version: "0.1.0"/);
  assert.equal(existsSync(path.join(f.paths().state, 'pending.json')), false);
});

test('clean Git and complete manual copies can be deliberately adopted; source links cannot', async (t) => {
  for (const manual of [false, true]) {
    const f = fixture(t);
    mkdirSync(path.dirname(f.paths().target), { recursive: true });
    f.prepare(f.paths().target, f.commits[0]);
    if (manual) rmSync(path.join(f.paths().target, '.git'), { recursive: true });
    const before = readFileSync(path.join(f.paths().target, 'SKILL.md'));
    await f.manager.run('adopt', { ...f.options, commit: f.commits[0], apply: true });
    assert.equal(currentReceipt(f.paths()).kind, manual ? 'manual' : 'git');
    assert.deepEqual(readFileSync(path.join(f.paths().target, 'SKILL.md')), before);
    await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
    await f.manager.run('rollback', { ...f.options, apply: true });
    assert.equal(currentReceipt(f.paths()).kind, manual ? 'manual' : 'git');
  }
  const f = fixture(t);
  mkdirSync(path.dirname(f.paths().target), { recursive: true });
  symlinkSync(f.source, f.paths().target, 'dir');
  await assert.rejects(f.manager.run('adopt', { ...f.options, commit: f.commits[0], apply: true }), /symlink/);
});

test('an explicit pin cannot be silently moved and changing tracking policy is explicit', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.2.0', apply: true });
  const changed = await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  assert.equal(changed.status, 'policy-updated');
  assert.equal(currentReceipt(f.paths()).policy.pin, null);
  const moved = fixture(t);
  await moved.manager.run('install', { ...moved.options, release: 'v0.1.0', apply: true });
  moved.records[0].sourceCommit = moved.commits[1];
  const refused = await moved.manager.run('update', { ...moved.options, apply: true });
  assert.equal(refused.status, 'pin-unresolved');
  assert.equal(refused.applied, false);
  assert.equal(currentReceipt(moved.paths()).sourceCommit, moved.commits[0]);
});

test('pending interrupted replacements are explicitly recovered from the private journal', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const paths = f.paths();
  const before = currentReceipt(paths);
  const id = '11111111-1111-1111-1111-111111111111';
  const backupId = '22222222-2222-2222-2222-222222222222';
  const old = path.join(paths.state, 'backups', backupId);
  mkdirSync(old, { recursive: true });
  mkdirSync(path.join(paths.state, 'staging', id), { recursive: true });
  writeJson(path.join(old, 'receipt.json'), before);
  writeJson(path.join(paths.state, 'pending.json'), { contractVersion: 'itf.transaction/0.1', id, backupId,
    before, after: { ...before, generation: id, previous: backupId } });
  renameSync(paths.target, path.join(old, 'skill'));
  await assert.rejects(f.manager.run('update', { ...f.options, apply: true }), /Interrupted/);
  const result = await f.manager.run('recover', { ...f.options, apply: true });
  assert.equal(result.status, 'recovered');
  assert.equal(currentReceipt(paths).sourceCommit, before.sourceCommit);
  assert.ok(existsSync(path.join(paths.target, 'SKILL.md')));
  assert.equal(readJson(path.join(paths.state, 'pending.json')), null);
});

test('backup tampering and malformed receipts do not authorise overwrite', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  const receipt = currentReceipt(f.paths());
  writeFileSync(path.join(f.paths().state, 'backups', receipt.previous, 'skill', 'extra.txt'), 'Synthetic work.\n');
  await assert.rejects(f.manager.run('rollback', { ...f.options, apply: true }), /changed|extras/);
  assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[1]);
  writeJson(path.join(f.paths().state, 'receipt.json'), { ...receipt, files: [{ path: '../outside', mode: '100644', sha256: 'a'.repeat(64) }] });
  await assert.rejects(f.manager.run('update', { ...f.options, apply: true }), /inventory/);
});

test('explicit recovery clears stopped locks without a pending journal, but not live locks', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, apply: true });
  const lock = path.join(f.paths().state, 'lock.json');
  writeJson(lock, { token: '11111111-1111-1111-1111-111111111111', pid: 2147483646 });
  assert.equal((await f.manager.run('recover', { ...f.options, apply: true })).status, 'recovered');
  assert.equal(existsSync(lock), false);
  writeJson(lock, { token: '11111111-1111-1111-1111-111111111111', pid: process.pid });
  await assert.rejects(f.manager.run('recover', { ...f.options, apply: true }), /still be running/);
  assert.ok(existsSync(lock));
});

test('linked staging/backup ancestors do not redirect preparation, recovery or cleanup', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const outside = path.join(f.root, 'outside');
  mkdirSync(outside);
  writeFileSync(path.join(outside, 'keep.txt'), 'Do not change.\n');
  const staging = path.join(f.paths().state, 'staging');
  rmSync(staging, { recursive: true });
  symlinkSync(outside, staging, 'dir');
  await assert.rejects(f.manager.run('update', { ...f.options, followChannel: true, apply: true }), /symlink/);
  assert.equal(readFileSync(path.join(outside, 'keep.txt'), 'utf8'), 'Do not change.\n');
  assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[0]);
  rmSync(staging);
  await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  const backups = path.join(f.paths().state, 'backups');
  renameSync(backups, path.join(f.root, 'saved-backups'));
  symlinkSync(outside, backups, 'dir');
  await assert.rejects(f.manager.run('rollback', { ...f.options, apply: true }), /symlink/);
  assert.ok(existsSync(path.join(f.paths().target, 'SKILL.md')));
});

test('an unavailable restore source never displaces the usable current installation', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  const paths = f.paths();
  const after = currentReceipt(paths);
  const old = path.join(paths.state, 'backups', after.previous);
  const before = readJson(path.join(old, 'receipt.json'));
  mkdirSync(path.join(paths.state, 'staging', after.generation), { recursive: true });
  writeJson(path.join(paths.state, 'pending.json'), { contractVersion: 'itf.transaction/0.1',
    id: after.generation, backupId: after.previous, before, after });
  writeFileSync(path.join(old, 'skill', 'private-extra.txt'), 'Synthetic newer material.\n');
  await assert.rejects(f.manager.run('recover', { ...f.options, apply: true }), /changed|extras/);
  assert.match(readFileSync(path.join(paths.target, 'SKILL.md'), 'utf8'), /version: "0.2.0"/);
  assert.equal(currentReceipt(paths).sourceCommit, f.commits[1]);
  assert.ok(existsSync(path.join(paths.state, 'pending.json')));
});

test('recovery can resume after preserving the candidate or restoring the previous target', async (t) => {
  for (const restored of [false, true]) {
    const f = fixture(t);
    await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
    await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
    const paths = f.paths();
    const after = currentReceipt(paths);
    const old = path.join(paths.state, 'backups', after.previous);
    const before = readJson(path.join(old, 'receipt.json'));
    const stage = path.join(paths.state, 'staging', after.generation);
    mkdirSync(stage, { recursive: true });
    writeJson(path.join(paths.state, 'pending.json'), { contractVersion: 'itf.transaction/0.1',
      id: after.generation, backupId: after.previous, before, after });
    renameSync(paths.target, path.join(stage, 'interrupted'));
    if (restored) renameSync(path.join(old, 'skill'), paths.target);
    assert.equal((await f.manager.run('recover', { ...f.options, apply: true })).status, 'recovered');
    assert.equal(currentReceipt(paths).sourceCommit, f.commits[0]);
    assert.match(readFileSync(path.join(paths.target, 'SKILL.md'), 'utf8'), /version: "0.1.0"/);
    assert.ok(existsSync(path.join(stage, 'interrupted', 'SKILL.md')));
    assert.equal(readJson(path.join(paths.state, 'pending.json')), null);
  }
});

test('receipt/policy changes after planning abort instead of overwriting newer state', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const receipt = currentReceipt(f.paths());
  await assert.rejects(f.manager.run('update', { ...f.options, followChannel: true, apply: true, onPlan() {
    writeJson(path.join(f.paths().state, 'receipt.json'), { ...receipt, policy: { channel: 'stable', pin: receipt.policy.pin } });
  } }), /state changed/);
  assert.equal(currentReceipt(f.paths()).policy.channel, 'stable');
  assert.equal(currentReceipt(f.paths()).sourceCommit, f.commits[0]);
});

test('missing pin, mismatched locked commit and invalid version do not become update permission', async (t) => {
  const f = fixture(t);
  await f.manager.run('install', { ...f.options, release: 'v0.1.0', apply: true });
  const receipt = currentReceipt(f.paths());
  for (const altered of [
    { ...receipt, policy: { channel: 'prerelease' } },
    { ...receipt, policy: { channel: 'prerelease', pin: { tag: 'v0.1.0', sourceCommit: f.commits[1] } } },
    { ...receipt, version: 'main' },
    { ...receipt, versionSource: 'unknown' },
  ]) {
    writeJson(path.join(f.paths().state, 'receipt.json'), altered);
    await assert.rejects(f.manager.run('update', { ...f.options, apply: true }));
    assert.match(readFileSync(path.join(f.paths().target, 'SKILL.md'), 'utf8'), /version: "0.1.0"/);
  }
});

test('source preparation fetches a selected full commit reachable only by its tag', (t) => {
  const f = fixture(t);
  const original = f.git('branch', '--show-current');
  f.git('checkout', '--quiet', '--orphan', 'release-only');
  f.git('add', '.');
  f.git('commit', '--quiet', '-m', 'Synthetic tag-only source');
  const commit = f.git('rev-parse', 'HEAD');
  f.git('tag', 'v0.3.0', commit);
  f.git('checkout', '--quiet', original);
  f.git('branch', '-D', 'release-only');
  const destination = path.join(f.root, 'tag-only-copy');
  let fetched = false;
  prepareFromGitHub(destination, commit, { git(args) {
    if (args[0] === 'clone') return sourceGit(args.map((arg) => arg === SOURCE_URL ? f.source : arg).toSpliced(1, 0, '--no-local'));
    if (args.includes('fetch')) fetched = true;
    return sourceGit(args);
  } });
  assert.equal(fetched, true);
  assert.equal(sourceGit(['-C', destination, 'rev-parse', 'HEAD']).trim(), commit);
});

test('quoted same-name skills in noncanonical folders still require duplicate acknowledgement', async (t) => {
  for (const name of ['"impact-to-funding"', "'impact-to-funding'"]) {
    const f = fixture(t);
    const other = path.join(f.home, '.claude/skills/custom-folder');
    mkdirSync(other, { recursive: true });
    writeFileSync(path.join(other, 'SKILL.md'), `---\nname: ${name}\n---\nSynthetic.\n`);
    assert.deepEqual((await f.manager.run('install', f.options)).duplicates, [other]);
    await assert.rejects(f.manager.run('install', { ...f.options, apply: true }), /acknowledge/);
  }
});

test('an explicit commit that is a published release records that release (#64)', async (t) => {
  const f = fixture(t);
  mkdirSync(path.dirname(f.paths().target), { recursive: true });
  f.prepare(f.paths().target, f.commits[1]);
  const plan = await f.manager.run('adopt', { ...f.options, commit: f.commits[1] });
  assert.equal(plan.targetSource.tag, 'v0.2.0');
  assert.equal(plan.targetSource.versionSource, 'release');
  await f.manager.run('adopt', { ...f.options, commit: f.commits[1], apply: true });
  const receipt = currentReceipt(f.paths());
  assert.equal(receipt.version, '0.2.0');
  assert.equal(receipt.versionSource, 'release');
  assert.equal(receipt.policy.pin, f.commits[1]);
});

test('an explicit commit stays usable without a release match or catalogue (#64)', async (t) => {
  const f = fixture(t);
  f.git('commit', '--quiet', '--allow-empty', '-m', 'Synthetic unreleased commit');
  const unreleased = f.git('rev-parse', 'HEAD');
  const planned = await f.manager.run('install', { ...f.options, commit: unreleased });
  assert.equal(planned.targetSource.tag, null);
  assert.equal(planned.targetSource.versionSource, 'unknown');
  const offline = createManager({ catalogue: async () => { throw new Error('offline'); }, prepare: f.prepare });
  const result = await offline.run('install', { ...f.options, commit: f.commits[0], apply: true });
  assert.equal(result.status, 'installed');
  assert.equal(currentReceipt(f.paths()).versionSource, 'declared');
});

test('a pin-only update to a release also records the release version (#64)', async (t) => {
  const f = fixture(t);
  const offline = createManager({ catalogue: async () => { throw new Error('offline'); }, prepare: f.prepare });
  await offline.run('install', { ...f.options, commit: f.commits[0], apply: true });
  assert.equal(currentReceipt(f.paths()).versionSource, 'declared');
  const result = await f.manager.run('update', { ...f.options, release: 'v0.1.0', apply: true });
  assert.equal(result.status, 'policy-updated');
  const receipt = currentReceipt(f.paths());
  assert.deepEqual(receipt.policy.pin, { tag: 'v0.1.0', sourceCommit: f.commits[0] });
  assert.equal(receipt.version, '0.1.0');
  assert.equal(receipt.versionSource, 'release');
});
