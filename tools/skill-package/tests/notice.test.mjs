import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { checkNotice, configureNotice, createManager, formatNotice } from '../index.mjs';
import { SOURCE_URL, sourceGit } from '../lib/git.mjs';
import { targetPaths } from '../lib/targets.mjs';
import { currentReceipt, readJson, writeJson } from '../lib/storage.mjs';

const day = 24 * 60 * 60 * 1000;
const start = 1_800_000_000_000;
const packageRoot = fileURLToPath(new URL('../', import.meta.url));

async function fixture(t, { channel = 'prerelease', includeHelper = true } = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-notice-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  const source = path.join(root, 'source');
  for (const dir of [home, project, source]) mkdirSync(dir);
  const git = (...args) => execFileSync('git', [
    '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgSign=false', '-c', `core.hooksPath=${path.join(root, 'no-hooks')}`,
    '-C', source, ...args,
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 }).trim();
  git('init', '--quiet');
  for (const name of ['LICENSE', 'PRIVACY.md', 'SOURCES.md']) writeFileSync(path.join(source, name), 'Synthetic package.\n');
  mkdirSync(path.join(source, 'references'));
  writeFileSync(path.join(source, 'references/contributions.md'), 'Synthetic guidance.\n');
  if (includeHelper) {
    mkdirSync(path.join(source, 'tools/skill-package'), { recursive: true });
    cpSync(path.join(packageRoot, 'lib'), path.join(source, 'tools/skill-package/lib'), { recursive: true });
    cpSync(path.join(packageRoot, 'notice-entry.mjs'), path.join(source, 'tools/skill-package/notice-entry.mjs'));
  }
  writeFileSync(path.join(source, 'package.json'), '{"type":"module"}\n');
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
  const prepare = (destination, commit) => {
    sourceGit(['clone', '--quiet', '--no-checkout', '--no-local', source, destination]);
    sourceGit(['-C', destination, 'remote', 'set-url', 'origin', SOURCE_URL]);
    sourceGit(['-C', destination, 'checkout', '--quiet', '--detach', commit]);
  };
  const options = { harness: 'codex', scope: 'project', home, project, configHome: path.join(home, '.config'), channel };
  const manager = createManager({ catalogue: async () => ({ records, complete: true }), prepare });
  await manager.run('install', { ...options, release: 'v0.1.0', apply: true });
  const paths = targetPaths(options);
  const setting = (enabled, apply = true) => configureNotice({ ...options, enabled, apply });
  let requests = 0;
  const catalogue = async () => { requests += 1; return { records, complete: true }; };
  const check = (more = {}) => checkNotice(paths.target, { home, project, now: start, catalogue, networkAllowed: true, ...more });
  return { root, home, project, source, commits, records, paths, options, manager, prepare, setting, check,
    get requests() { return requests; } };
}

test('consent is per managed copy, read-only until apply and disabled by default', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.check()).status, 'offer');
  assert.equal(f.requests, 0);
  const preview = f.setting(true, false);
  assert.equal(preview.currentlyEnabled, false);
  assert.match(preview.disclosure, /GitHub sees normal network metadata/);
  assert.equal((await f.check()).status, 'offer');
  assert.equal(f.setting(true).applied, true);
  assert.equal(f.setting(null, false).currentlyEnabled, true);
  assert.equal(f.setting(false).applied, true);
  assert.equal((await f.check()).status, 'disabled');
  assert.equal(f.requests, 0);
});

test('the managed CLI previews, enables, reports and disables consent without installing anything', async (t) => {
  const f = await fixture(t);
  const cli = path.join(packageRoot, 'itf.mjs');
  const args = ['notice', 'enable', '--harness', 'codex', '--scope', 'project', '--project', f.project];
  const env = { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config') };
  const run = (arguments_) => spawnSync(process.execPath, [cli, ...arguments_], { cwd: f.project, env, encoding: 'utf8', timeout: 10000 });
  const preview = run(args);
  assert.equal(preview.status, 0, preview.stderr);
  assert.equal(JSON.parse(preview.stdout).applied, false);
  assert.equal((await f.check()).status, 'offer');
  const enabled = run([...args, '--apply']);
  assert.equal(enabled.status, 0, enabled.stderr);
  assert.equal(JSON.parse(enabled.stdout).applied, true);
  assert.match(enabled.stderr, /beforeChange/);
  const status = run(['notice', 'status', '--harness', 'codex', '--scope', 'project', '--project', f.project]);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).currentlyEnabled, true);
  const disabled = run(['notice', 'disable', '--harness', 'codex', '--scope', 'project', '--project', f.project, '--apply']);
  assert.equal(disabled.status, 0, disabled.stderr);
  assert.equal((await f.check()).status, 'disabled');
  const byRoot = run(['notice', 'enable', '--root', f.paths.target, '--apply']);
  assert.equal(byRoot.status, 0, byRoot.stderr);
  assert.equal(JSON.parse(byRoot.stdout).target, f.paths.target);
  const conflicting = run(['notice', 'enable', '--root', f.paths.target, '--harness', 'codex', '--scope', 'project', '--apply']);
  assert.notEqual(conflicting.status, 0);
  assert.equal(f.setting(false).applied, true);
  assert.equal(f.requests, 0);
});

test('an older managed copy cannot enable an integration absent from its source receipt', async (t) => {
  const f = await fixture(t, { includeHelper: false });
  assert.equal(f.setting(true, false).helperBundled, false);
  assert.throws(() => f.setting(true), /predates in-skill notices/);
  assert.equal((await f.check()).status, 'unknown');
  assert.equal(f.requests, 0);
});

test('notice compares the loaded managed copy, preserves its pin and emits no private path', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const before = currentReceipt(f.paths);
  const result = await f.check();
  assert.equal(result.status, 'available');
  assert.equal(result.installed, '0.1.0');
  assert.equal(result.available, '0.2.0');
  assert.equal(result.channel, 'prerelease');
  assert.equal(result.releaseUrl, 'https://github.com/zhiganov/impact-to-funding/releases/tag/v0.2.0');
  assert.deepEqual(currentReceipt(f.paths), before);
  const text = formatNotice(result);
  assert.match(text, /^UPDATE_AVAILABLE: ItF 0\.1\.0 → 0\.2\.0/);
  assert.ok(!text.includes(f.root));
  assert.match(text, /has not changed/);
});

test('stable channel excludes prereleases and equal or older releases are not updates', async (t) => {
  const f = await fixture(t, { channel: 'stable' });
  f.setting(true);
  assert.equal((await f.check()).status, 'no-newer-release');
  assert.equal(formatNotice(await f.check()), '');
});

test('catalogue checks and unconfirmed notice attempts are rate-limited per version for 24 hours', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  assert.equal((await f.check()).status, 'available');
  assert.equal((await f.check({ now: start + 23 * 60 * 60 * 1000 })).status, 'suppressed');
  assert.equal(f.requests, 1);
  assert.equal((await f.check({ now: start + day })).status, 'available');
  assert.equal(f.requests, 2);
  assert.equal((await f.check({ now: start + 7 * day })).status, 'available');
  assert.equal(f.requests, 3);
});

test('consent follows a managed update, but a new installation at the same path does not inherit it', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const first = currentReceipt(f.paths);
  await f.manager.run('update', { ...f.options, followChannel: true, apply: true });
  const updated = currentReceipt(f.paths);
  assert.equal(updated.installationId, first.installationId);
  assert.equal(f.setting(null, false).currentlyEnabled, true);
  writeJson(path.join(f.paths.state, 'receipt.json'), { ...updated,
    installationId: '22222222-2222-2222-2222-222222222222' });
  assert.equal(f.setting(null, false).currentlyEnabled, false);
  assert.equal((await f.check()).status, 'offer');
  assert.equal(f.requests, 0);
});

test('preference changes cannot finish concurrently with a running check', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  let continueRequest;
  let signalStarted;
  const started = new Promise((resolve) => { signalStarted = resolve; });
  const request = new Promise((resolve) => { continueRequest = resolve; });
  const check = f.check({ catalogue: async () => { signalStarted(); return request; } });
  await started;
  assert.throws(() => f.setting(false), /check is in progress/);
  continueRequest({ records: f.records, complete: true });
  assert.equal((await check).status, 'available');
  assert.equal(f.setting(false).applied, true);
  assert.equal((await f.check()).status, 'disabled');
});

test('an applied preference no-op also waits for an existing notice lock', async (t) => {
  const f = await fixture(t);
  f.setting(false);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  writeJson(path.join(dir, 'check.lock'), { token: 'other-active', pid: process.pid });
  assert.throws(() => f.setting(false), /check is in progress/);
  assert.equal(f.setting(null, false).currentlyEnabled, false);
});

test('opting out by the selected root works even when local skill files have changed', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  writeFileSync(path.join(f.paths.target, 'private-untracked.txt'), 'private\n');
  assert.equal((await f.check()).status, 'unknown');
  const disabled = configureNotice({ selected: f.paths.target, home: f.home, enabled: false, apply: true });
  assert.equal(disabled.applied, true);
  assert.equal(readFileSync(path.join(f.paths.target, 'private-untracked.txt'), 'utf8'), 'private\n');
  assert.equal(f.requests, 0);
});

test('network error and incomplete catalogue remain unknown and are not retried within a day', async (t) => {
  for (const failure of [async () => { throw new Error('offline'); }, async () => ({ records: [], complete: false })]) {
    const f = await fixture(t);
    f.setting(true);
    let calls = 0;
    const catalogue = async () => { calls += 1; return failure(); };
    assert.equal((await f.check({ catalogue })).status, 'unknown');
    assert.equal((await f.check({ catalogue, now: start + 1 })).status, 'unknown');
    assert.equal(calls, 1);
  }
});

test('without host network permission even an enabled copy makes no request or cache write', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  assert.equal((await f.check({ networkAllowed: false })).status, 'unknown');
  assert.equal(f.requests, 0);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  assert.equal(readJson(path.join(dir, 'cache.json')), null);
});

test('without network permission a fresh local cache can suppress a repeat without a request', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  assert.equal((await f.check()).status, 'available');
  assert.equal((await f.check({ networkAllowed: false, now: start + 1 })).status, 'suppressed');
  assert.equal(f.requests, 1);
});

test('offline use does not write or emit an unrecorded reminder from a fresh cache', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  assert.equal((await f.check()).status, 'available');
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  const file = path.join(dir, 'cache.json');
  const cache = readJson(file);
  cache.reminders = {};
  writeJson(file, cache);
  const before = readFileSync(file);
  assert.equal((await f.check({ networkAllowed: false, now: start + 1 })).status, 'unknown');
  assert.deepEqual(readFileSync(file), before);
  assert.equal(f.requests, 1);
});

test('an unknown attempt is durably recorded before any network request', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  assert.equal((await f.check({ catalogue: async () => {
    const pending = readJson(path.join(dir, 'cache.json'));
    assert.equal(pending.state, 'unknown');
    assert.equal(pending.attemptedAt, start);
    throw new Error('Interrupted network');
  } })).status, 'unknown');
  assert.equal((await f.check({ now: start + 1, catalogue: async () => { throw new Error('must not retry'); } })).status, 'unknown');
});

test('an exact commit pin can be matched to a published release without inferring from its declared version', async (t) => {
  const f = await fixture(t);
  const original = currentReceipt(f.paths);
  writeJson(path.join(f.paths.state, 'receipt.json'), { ...original, version: '0.1.0-dev.1',
    versionSource: 'declared', policy: { channel: 'prerelease', pin: f.commits[0] } });
  f.setting(true);
  const result = await f.check();
  assert.equal(result.status, 'available');
  assert.equal(result.installed, '0.1.0');
  assert.equal(result.available, '0.2.0');
});

test('an unlisted development commit can surface a release only with freshness unknown', async (t) => {
  const f = await fixture(t);
  const original = currentReceipt(f.paths);
  writeJson(path.join(f.paths.state, 'receipt.json'), { ...original, version: '0.3.0-dev.0',
    versionSource: 'declared', policy: { channel: 'prerelease', pin: f.commits[0] } });
  f.setting(true);
  const result = await f.check({ catalogue: async () => ({ records: [f.records[1]], complete: true }) });
  assert.equal(result.status, 'release-available');
  assert.equal(result.installed, null);
  const text = formatNotice(result);
  assert.match(text, /^RELEASE_AVAILABLE: ItF release 0\.2\.0/);
  assert.match(text, /freshness is unknown/);
  assert.ok(!text.includes(f.root));
  assert.ok(!text.includes('newer'));
});

test('missing or inconsistent manager results stay unknown, never reported as current', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const result = await f.check({ managerFactory: () => ({ run: async () => ({ target: f.paths.target,
    current: { sourceCommit: f.commits[0] }, targetSource: null }) }) });
  assert.equal(result.status, 'unknown');
});

test('changed/unknown copies and moved locked tags do not produce notices', async (t) => {
  const changed = await fixture(t);
  changed.setting(true);
  writeFileSync(path.join(changed.paths.target, 'private-untracked.txt'), 'private\n');
  assert.equal((await changed.check()).status, 'unknown');
  const moved = await fixture(t);
  moved.setting(true);
  moved.records[0].sourceCommit = moved.commits[1];
  assert.equal((await moved.check()).status, 'unknown');
  assert.equal((await checkNotice(moved.source, { home: moved.home, project: moved.project, catalogue: async () => { throw new Error('must not fetch'); } })).status, 'unknown');
});

test('disabled, missing or unsafe private state never falls back to network or a guessed copy', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  assert.equal((await f.check({ disabled: true })).status, 'disabled');
  assert.equal(f.requests, 0);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const directory = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  symlinkSync('/dev/null', path.join(directory, 'cache.json'));
  assert.equal((await f.check()).status, 'unknown');
  assert.equal(f.requests, 0);
});

test('an active notice lock suppresses concurrent work, and a stopped lock is safely recovered', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  const file = path.join(dir, 'check.lock');
  writeJson(file, { token: 'fixture', pid: process.pid });
  assert.equal((await f.check()).status, 'busy');
  assert.equal(f.requests, 0);
  writeJson(file, { token: 'fixture-stopped', pid: 2147483646 });
  writeJson(`${file}.recovery.other`, { token: 'other-recoverer', pid: process.pid });
  assert.equal((await f.check()).status, 'busy');
  assert.equal(readJson(file).token, 'fixture-stopped');
  rmSync(`${file}.recovery.other`);
  writeJson(`${file}.recovery.stopped`, { token: 'stopped-recoverer', pid: 2147483646 });
  assert.equal((await f.check()).status, 'available');
  assert.equal(existsSync(file), false);
});

test('a linked notice-state ancestor is rejected before network access', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const moved = path.join(f.root, 'saved-notice-state');
  (await import('node:fs')).renameSync(noticeRoot, moved);
  symlinkSync(moved, noticeRoot, 'dir');
  assert.equal((await f.check()).status, 'unknown');
  assert.equal(f.requests, 0);
});

test('separate managed copies cannot share consent or reminder state', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const personal = { ...f.options, scope: 'personal', ackDuplicates: true };
  await f.manager.run('install', { ...personal, release: 'v0.1.0', apply: true });
  const personalPath = targetPaths(personal).target;
  assert.equal((await checkNotice(personalPath, { home: f.home, project: f.project, now: start,
    catalogue: async () => { throw new Error('unconfigured copy must not fetch'); } })).status, 'offer');
  assert.equal((await f.check()).status, 'available');
});

test('the actual installed helper offers opt-in without contacting a service', async (t) => {
  const f = await fixture(t);
  const entry = path.join(f.paths.target, 'tools/skill-package/notice-entry.mjs');
  const result = spawnSync(process.execPath, [entry], { cwd: f.project,
    env: { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config') },
    encoding: 'utf8', timeout: 8000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^NOTICE_OFFER: Optional ItF update notices are off until enabled/);
  assert.equal(existsSync(path.join(f.home, '.local/state/impact-to-funding-notices')), false);
  const disabled = spawnSync(process.execPath, [entry], { cwd: f.project,
    env: { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), ITF_UPDATE_NOTICES: 'off' },
    encoding: 'utf8', timeout: 8000 });
  assert.equal(disabled.status, 0, disabled.stderr);
  assert.equal(disabled.stdout, '');
  assert.equal(existsSync(path.join(f.home, '.local/state/impact-to-funding-notices')), false);
});

test('the actual enabled helper cannot contact GitHub without the host network flag', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const marker = path.join(f.root, 'unexpected-network');
  const mock = path.join(f.root, 'forbid-fetch.mjs');
  writeFileSync(mock, `import { writeFileSync } from 'node:fs';\nglobalThis.fetch = async () => { writeFileSync(${JSON.stringify(marker)}, 'attempt'); throw new Error('Unexpected network'); };\n`);
  const entry = path.join(f.paths.target, 'tools/skill-package/notice-entry.mjs');
  const env = { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), NODE_OPTIONS: `--import=${mock}` };
  const result = spawnSync(process.execPath, [entry], { cwd: f.project, env, encoding: 'utf8', timeout: 8000 });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(existsSync(marker), false);
});

test('real helper process uses the selected installed copy and emits an advisory only once', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const mock = path.join(f.root, 'mock-fetch.mjs');
  const releases = f.records.map((r) => ({ tag_name: r.tag, prerelease: r.channel === 'prerelease', draft: false,
    html_url: `https://github.com/zhiganov/impact-to-funding/releases/tag/${r.tag}` }));
  writeFileSync(mock, `const releases = ${JSON.stringify(releases)};\nconst commits = ${JSON.stringify(f.commits)};\nglobalThis.fetch = async (url) => {\n  const parsed = new URL(url);\n  if (parsed.origin !== 'https://api.github.com') throw new Error('Unexpected host');\n  let body;\n  if (parsed.pathname.endsWith('/releases')) body = releases;\n  else if (parsed.pathname.endsWith('/git/ref/tags/v0.1.0')) body = {ref:'refs/tags/v0.1.0',object:{type:'commit',sha:commits[0]}};\n  else if (parsed.pathname.endsWith('/git/ref/tags/v0.2.0')) body = {ref:'refs/tags/v0.2.0',object:{type:'commit',sha:commits[1]}};\n  else throw new Error('Unexpected URL');\n  return {ok:true,json:async()=>body};\n};\n`);
  const entry = path.join(f.paths.target, 'tools/skill-package/notice-entry.mjs');
  const env = { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), NODE_OPTIONS: `--import=${mock}` };
  const run = () => spawnSync(process.execPath, [entry, '--allow-network'], { cwd: f.project, env, encoding: 'utf8', timeout: 8000 });
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /^UPDATE_AVAILABLE: ItF 0\.1\.0 → 0\.2\.0/);
  assert.ok(!first.stdout.includes(f.root));
  const second = run();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, '');
  assert.equal(currentReceipt(f.paths).sourceCommit, f.commits[0]);
});

test('the actual helper bounds a stalled operation and leaves an unknown attempt', async (t) => {
  const f = await fixture(t);
  f.setting(true);
  const mock = path.join(f.root, 'stall-fetch.mjs');
  writeFileSync(mock, 'globalThis.fetch = async () => new Promise(() => { setInterval(() => {}, 1000); });\n');
  const entry = path.join(f.paths.target, 'tools/skill-package/notice-entry.mjs');
  const env = { ...process.env, HOME: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), NODE_OPTIONS: `--import=${mock}` };
  const before = Date.now();
  const result = spawnSync(process.execPath, [entry, '--allow-network'], { cwd: f.project, env, encoding: 'utf8', timeout: 8000 });
  const elapsed = Date.now() - before;
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  assert.ok(elapsed >= 3000 && elapsed < 6500, `Timed helper took ${elapsed}ms`);
  const noticeRoot = path.join(f.home, '.local/state/impact-to-funding-notices');
  const dir = path.join(noticeRoot, (await import('node:fs')).readdirSync(noticeRoot)[0]);
  assert.equal(readJson(path.join(dir, 'cache.json')).state, 'unknown');
});
