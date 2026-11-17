import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync,
  symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createSetup } from '../lib/setup.mjs';
import { run } from '../cli.mjs';
import { readOpenCodeEntry } from '../lib/setup-config.mjs';

const commit = 'a'.repeat(40);
function fixture(t, config = null, overrides = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-setup-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  mkdirSync(home);
  mkdirSync(project);
  const file = path.join(project, 'opencode.jsonc');
  if (config !== null) writeFileSync(file, config);
  const calls = [];
  const setup = createSetup({
    hostVersion() { return 'opencode v2.3.0'; },
    prepare(runtime, revision) { calls.push('prepare'); assert.equal(revision, commit); mkdirSync(runtime); },
    verifySource() { return { sourceCommit: commit, skillVersion: '0.4.0', serverVersion: '0.1.0' }; },
    snapshot(runtime, revision, output) { calls.push('snapshot'); writeFileSync(output, '{"fictional":true}\n'); },
    async probe() { calls.push('probe'); return { status: 'passed', hostConnection: 'not_checked', modelRun: false }; },
    ...overrides,
  });
  return { root, home, project, file, calls, setup,
    options: { harness: 'opencode', scope: 'project', home, project, commit } };
}

test('setup preview has no filesystem, network, runtime or host effects', async (t) => {
  const f = fixture(t);
  const plan = await f.setup.run(f.options);
  assert.equal(plan.applied, false);
  assert.equal(plan.sourceCommit, commit);
  assert.deepEqual(f.calls, []);
  assert.equal(existsSync(f.file), false);
  assert.equal(existsSync(plan.privateState), false);
  assert.deepEqual(plan.configEntry.command.slice(-2), ['--snapshot', plan.configEntry.command.at(-1)]);
  assert.equal(plan.preparation.length, 4);
});

test('apply prepares and checks before registration, then check and repeated apply are read-only', async (t) => {
  const f = fixture(t);
  let displayed = false;
  const result = await f.setup.run({ ...f.options, apply: true, onPlan(plan) {
    displayed = true;
    assert.equal(existsSync(plan.privateState), false);
    assert.deepEqual(f.calls, []);
  } });
  assert.equal(displayed, true);
  assert.equal(result.status, 'registered');
  assert.deepEqual(f.calls, ['prepare', 'snapshot', 'probe']);
  assert.equal(readOpenCodeEntry(readFileSync(f.file, 'utf8'), 'itf_library').type, 'local');
  const original = readFileSync(f.file);
  const checked = await f.setup.run({ ...f.options, commit: undefined, check: true });
  assert.equal(checked.runtimeCheck.status, 'passed');
  assert.deepEqual(f.calls, ['prepare', 'snapshot', 'probe', 'probe']);
  const again = await f.setup.run({ ...f.options, apply: true });
  assert.equal(again.applied, false);
  assert.deepEqual(readFileSync(f.file), original);
  if (process.platform !== 'win32') assert.equal(lstatSync(f.file).mode & 0o777, 0o600);
});

test('backup is private and untouched configuration is restored byte-for-byte', async (t) => {
  const input = '{\r\n  // keep this\r\n  "model": "fixture/model",\r\n}\r\n';
  const f = fixture(t, input);
  const result = await f.setup.run({ ...f.options, apply: true });
  assert.equal(readFileSync(result.backup, 'utf8'), input);
  if (process.platform !== 'win32') assert.equal(lstatSync(result.backup).mode & 0o777, 0o600);
  await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(readFileSync(f.file, 'utf8'), input);
  assert.equal(existsSync(result.configEntry.command[1]), false); // synthetic runtime has no executable
  assert.equal(existsSync(path.dirname(path.dirname(result.configEntry.command[1]))), true);
  // A later explicit setup gets a new owned runtime and can reuse the same backup.
  assert.equal((await f.setup.run({ ...f.options, apply: true })).status, 'registered');
});

test('undo deletes only a newly created untouched config and retains runtime state', async (t) => {
  const f = fixture(t);
  const applied = await f.setup.run({ ...f.options, apply: true });
  const undoPlan = await f.setup.run({ ...f.options, undo: true });
  assert.equal(undoPlan.applied, false);
  assert.equal(existsSync(f.file), true);
  const undone = await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(undone.status, 'undone');
  assert.equal(existsSync(f.file), false);
  assert.equal(existsSync(applied.privateState), true);
});

test('selective undo preserves subsequent unrelated edits and comments', async (t) => {
  const f = fixture(t, '{ "model": "fixture/old" }\n');
  await f.setup.run({ ...f.options, apply: true });
  const changed = readFileSync(f.file, 'utf8').replace('fixture/old', 'fixture/new');
  writeFileSync(f.file, `// later edit\n${changed}`);
  await f.setup.run({ ...f.options, undo: true, apply: true });
  const result = readFileSync(f.file, 'utf8');
  assert.ok(result.includes('// later edit'));
  assert.ok(result.includes('fixture/new'));
  assert.equal(readOpenCodeEntry(result, 'itf_library'), null);
});

test('conflicts, changed owned entries, unsupported hosts and ambiguous configs are refused', async (t) => {
  const f = fixture(t, '{"mcp":{"servers":{"itf_library":{"type":"remote","url":"https://example.invalid/mcp"}}}}\n');
  await assert.rejects(f.setup.run(f.options), /not owned/);
  await assert.rejects(f.setup.run({ ...f.options, harness: 'codex' }), /only/);
  await assert.rejects(f.setup.run({ ...f.options, scope: 'personal' }), /only/);
  assert.deepEqual(f.calls, []);
  const g = fixture(t);
  await g.setup.run({ ...g.options, apply: true });
  writeFileSync(g.file, readFileSync(g.file, 'utf8').replace('"local"', '"remote"'));
  await assert.rejects(g.setup.run({ ...g.options, undo: true, apply: true }), /entry changed/);
  writeFileSync(path.join(g.project, 'opencode.json'), '{}');
  await assert.rejects(g.setup.run(g.options), /Multiple/);
});

test('preparation failure leaves the project untouched and a later explicit attempt uses a fresh runtime', async (t) => {
  let attempts = 0;
  const f = fixture(t, '{}\n', { prepare(runtime) {
    mkdirSync(runtime);
    if (++attempts === 1) throw new Error('synthetic preparation failure');
  } });
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /synthetic/);
  assert.equal(readFileSync(f.file, 'utf8'), '{}\n');
  assert.equal((await f.setup.run({ ...f.options, apply: true })).status, 'registered');
});

test('configuration changes during preparation are preserved', async (t) => {
  const f = fixture(t, '{}\n', { async probe() {
    writeFileSync(f.file, '{"model":"fixture/later"}\n');
    return { status: 'passed' };
  } });
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /changed during/);
  assert.equal(readFileSync(f.file, 'utf8'), '{"model":"fixture/later"}\n');
});

test('inherited registrations and linked configs are not taken over', async (t) => {
  const f = fixture(t);
  const global = path.join(f.home, '.config/opencode');
  mkdirSync(global, { recursive: true });
  writeFileSync(path.join(global, 'opencode.json'), '{"mcp":{"servers":{"itf_library":{"type":"local","command":["fixture"]}}}}');
  await assert.rejects(f.setup.run(f.options), /inherited/);
  rmSync(path.join(global, 'opencode.json'));
  const other = path.join(f.root, 'other.json');
  writeFileSync(other, '{}');
  symlinkSync(other, f.file);
  await assert.rejects(f.setup.run(f.options), /symlink/);
});

test('tampered snapshots, backups and pending receipts fail closed', async (t) => {
  const f = fixture(t, '{}\n');
  const applied = await f.setup.run({ ...f.options, apply: true });
  const receiptFile = path.join(applied.privateState, 'receipt.json');
  const receipt = JSON.parse(readFileSync(receiptFile));
  writeFileSync(receipt.snapshot, '{}');
  await assert.rejects(f.setup.run({ ...f.options, check: true }), /snapshot changed/);
  writeFileSync(applied.backup, '{"changed":true}');
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true }), /backup changed/);
  writeFileSync(applied.backup, '{}\n');
  writeFileSync(receiptFile, JSON.stringify({ ...receipt, status: 'pending' }));
  await assert.rejects(f.setup.run(f.options), /Interrupted/);
  await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(readFileSync(f.file, 'utf8'), '{}\n');
});

test('setup CLI rejects ambiguous flags before any write', async () => {
  await assert.rejects(run(['setup', '--harness', 'opencode', '--harness', 'claude']), /repeated/);
  await assert.rejects(run(['setup', '--scope']), /Missing/);
  await assert.rejects(run(['setup', '--install-node']), /Unknown/);
  await assert.rejects(run(['setup', '--harness', 'codex', '--scope', 'project']), /only/);
});

test('BOM is preserved while registering and when undoing', async (t) => {
  const original = '\ufeff{\r\n // keep BOM and CRLF\r\n}\r\n';
  const f = fixture(t, original);
  await f.setup.run({ ...f.options, apply: true });
  assert.equal(readFileSync(f.file, 'utf8').charCodeAt(0), 0xfeff);
  await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(readFileSync(f.file, 'utf8'), original);
});

test('undo refuses an intervening edit before deleting a newly created config', async (t) => {
  const f = fixture(t);
  await f.setup.run({ ...f.options, apply: true });
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true, onPlan() {
    queueMicrotask(() => writeFileSync(f.file, '{"model":"fixture/intervening"}\n'));
  } }), /changed during undo/);
  assert.equal(readFileSync(f.file, 'utf8'), '{"model":"fixture/intervening"}\n');
});

test('undo remains possible after the registered Node executable moves', async (t) => {
  const f = fixture(t);
  const result = await f.setup.run({ ...f.options, apply: true });
  const file = path.join(result.privateState, 'receipt.json');
  const receipt = JSON.parse(readFileSync(file));
  receipt.nodeExecutable = '/fictional/previous-node';
  receipt.entry.command[0] = receipt.nodeExecutable;
  const config = JSON.parse(readFileSync(f.file));
  config.mcp.servers.itf_library = receipt.entry;
  writeFileSync(f.file, JSON.stringify(config));
  writeFileSync(file, JSON.stringify(receipt));
  await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(readOpenCodeEntry(readFileSync(f.file, 'utf8'), 'itf_library'), null);
});

test('explicit undo clears only a verified stopped lock, including a preparation-only crash', async (t) => {
  const f = fixture(t);
  const applied = await f.setup.run({ ...f.options, apply: true });
  const lock = path.join(applied.privateState, 'lock.json');
  // A short-lived owned subprocess provides a real stopped PID, not a guessed one.
  const { spawnSync } = await import('node:child_process');
  const stopped = spawnSync(process.execPath, ['-e', ''], { encoding: 'utf8' });
  assert.equal(stopped.status, 0);
  writeFileSync(lock, JSON.stringify({ token: randomUUID(), pid: stopped.pid }));
  await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(existsSync(lock), false);
  writeFileSync(lock, JSON.stringify({ token: randomUUID(), pid: stopped.pid }));
  const recovery = await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(recovery.status, 'lock-cleared');
  assert.equal(existsSync(lock), false);
  writeFileSync(lock, JSON.stringify({ token: randomUUID(), pid: process.pid }));
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true }), /still be running/);
  assert.equal(existsSync(lock), true);
});
