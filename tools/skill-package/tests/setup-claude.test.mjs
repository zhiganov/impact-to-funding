import assert from 'node:assert/strict';
import {
  existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createClaudeSetup } from '../lib/setup-claude.mjs';
import { run } from '../cli.mjs';

const commit = 'b'.repeat(40);
const secret = { emailAddress: 'fixture@example.invalid', accountUuid: 'fixture-account' };

// A stand-in for the Claude Code CLI. It edits the fixture config the way the
// real CLI does: one entry under projects[<project>].mcpServers.
function fakeClaude(calls, { wrongEntry = false } = {}) {
  return (args, paths) => {
    calls.push(args.slice(0, 2).join(' '));
    const config = existsSync(paths.config) ? JSON.parse(readFileSync(paths.config, 'utf8')) : {};
    config.projects ??= {};
    config.projects[paths.project] ??= {};
    const servers = (config.projects[paths.project].mcpServers ??= {});
    const name = args[4];
    if (args[1] === 'add-json') {
      if (Object.hasOwn(servers, name)) throw new Error('already exists');
      servers[name] = wrongEntry ? { type: 'stdio', command: '/bin/true' } : JSON.parse(args[5]);
    } else if (args[1] === 'remove') {
      if (!Object.hasOwn(servers, name)) throw new Error('not found');
      delete servers[name];
    } else throw new Error('unexpected command');
    writeFileSync(paths.config, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  };
}

function fixture(t, config = null, overrides = {}) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-setup-claude-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  const configDir = path.join(root, 'claude-config');
  mkdirSync(home);
  mkdirSync(project);
  mkdirSync(configDir);
  const file = path.join(configDir, '.claude.json');
  if (config !== null) writeFileSync(file, `${JSON.stringify(config(project), null, 2)}\n`, { mode: 0o600 });
  const calls = [];
  const setup = createClaudeSetup({
    hostVersion() { return '2.1.325 (Claude Code)'; },
    prepare(runtime, revision) { calls.push('prepare'); assert.equal(revision, commit); mkdirSync(runtime); },
    verifySource() { return { sourceCommit: commit, skillVersion: '0.5.0', serverVersion: '0.1.0' }; },
    snapshot(runtime, revision, output) { calls.push('snapshot'); writeFileSync(output, '{"fictional":true}\n'); },
    async probe() { calls.push('probe'); return { status: 'passed', hostConnection: 'not_checked', modelRun: false }; },
    claude: fakeClaude(calls),
    ...overrides,
  });
  const read = () => JSON.parse(readFileSync(file, 'utf8'));
  return { root, home, project, file, calls, setup, read,
    options: { harness: 'claude', scope: 'local', home, project, commit, claudeConfigDir: configDir } };
}

const withOthers = (project) => ({
  oauthAccount: secret,
  mcpServers: { user_server: { type: 'stdio', command: '/usr/bin/user' } },
  projects: {
    [project]: { allowedTools: [], mcpServers: { other: { type: 'stdio', command: '/usr/bin/other', env: { TOKEN: 'fixture' } } } },
    '/elsewhere': { mcpServers: { itf_library: { type: 'stdio', command: '/usr/bin/elsewhere' } } },
  },
});

test('claude preview has no filesystem, runtime or host-CLI effects', async (t) => {
  const f = fixture(t);
  const plan = await f.setup.run(f.options);
  assert.equal(plan.applied, false);
  assert.equal(plan.harness, 'claude');
  assert.equal(plan.scope, 'local');
  assert.equal(plan.backup, null);
  assert.equal(plan.configEntry.type, 'stdio');
  assert.deepEqual(plan.configEntry.args.slice(-2), ['--snapshot', plan.configEntry.args.at(-1)]);
  assert.deepEqual(f.calls, []);
  assert.equal(existsSync(f.file), false);
  assert.equal(existsSync(plan.privateState), false);
});

test('claude apply prepares and checks first, writes one entry, and leaves everything else alone', async (t) => {
  const f = fixture(t, withOthers);
  const before = f.read();
  const result = await f.setup.run({ ...f.options, apply: true });
  assert.equal(result.status, 'registered');
  assert.deepEqual(f.calls, ['prepare', 'snapshot', 'probe', 'mcp add-json']);
  const after = f.read();
  assert.deepEqual(after.projects[f.project].mcpServers.itf_library, result.configEntry);
  assert.deepEqual(after.oauthAccount, before.oauthAccount);
  assert.deepEqual(after.mcpServers, before.mcpServers);
  assert.deepEqual(after.projects[f.project].mcpServers.other, before.projects[f.project].mcpServers.other);
  assert.deepEqual(after.projects['/elsewhere'], before.projects['/elsewhere']);
  const state = readFileSync(path.join(result.privateState, 'receipt.json'), 'utf8');
  assert.equal(state.includes('fixture-account'), false);
  assert.equal(state.includes('TOKEN'), false);
  if (process.platform !== 'win32') assert.equal(lstatSync(path.join(result.privateState, 'receipt.json')).mode & 0o777, 0o600);
  const again = await f.setup.run({ ...f.options, apply: true });
  assert.equal(again.applied, false);
  assert.deepEqual(f.calls, ['prepare', 'snapshot', 'probe', 'mcp add-json']);
  const checked = await f.setup.run({ ...f.options, commit: undefined, check: true });
  assert.equal(checked.runtimeCheck.status, 'passed');
});

test('claude undo removes only the owned entry and keeps the runtime', async (t) => {
  const f = fixture(t, withOthers);
  const result = await f.setup.run({ ...f.options, apply: true });
  const plan = await f.setup.run({ ...f.options, undo: true });
  assert.equal(plan.status, 'undo-available');
  const undone = await f.setup.run({ ...f.options, undo: true, apply: true });
  assert.equal(undone.status, 'undone');
  const after = f.read();
  assert.equal(Object.hasOwn(after.projects[f.project].mcpServers, 'itf_library'), false);
  assert.ok(after.projects[f.project].mcpServers.other);
  assert.ok(after.projects['/elsewhere'].mcpServers.itf_library);
  assert.equal(existsSync(path.dirname(path.dirname(result.configEntry.args[0]))), true);
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true }), /No active setup receipt/);
});

test('claude setup refuses names owned elsewhere, in any scope, without calling the CLI', async (t) => {
  const local = fixture(t, (project) => ({ projects: { [project]: { mcpServers: { itf_library: { command: 'x' } } } } }));
  await assert.rejects(local.setup.run(local.options), /not owned by this setup/);
  const user = fixture(t, () => ({ mcpServers: { itf_library: { command: 'x' } } }));
  await assert.rejects(user.setup.run(user.options), /user scope/);
  const shared = fixture(t);
  writeFileSync(path.join(shared.project, '.mcp.json'), '{"mcpServers":{"itf_library":{"command":"x"}}}');
  await assert.rejects(shared.setup.run(shared.options), /shared project \.mcp\.json/);
  const named = fixture(t, () => ({ mcpServers: { itf_library: { command: 'x' } } }));
  const plan = await named.setup.run({ ...named.options, name: 'itf_library_2' });
  assert.equal(plan.serverName, 'itf_library_2');
  for (const f of [local, user, shared]) assert.deepEqual(f.calls, []);
});

test('claude setup stops if a conflicting entry appears during preparation', async (t) => {
  let configFile;
  let projectPath;
  const f = fixture(t, null, {
    async probe() {
      writeFileSync(configFile, JSON.stringify({ projects: { [projectPath]: { mcpServers: { itf_library: { command: 'x' } } } } }));
      return { status: 'passed' };
    },
  });
  configFile = f.file;
  projectPath = f.project;
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /appeared during runtime preparation/);
  assert.deepEqual(f.read().projects[f.project].mcpServers.itf_library, { command: 'x' });
  assert.equal(f.calls.includes('mcp add-json'), false);
});

test('claude setup refuses an unexpected write and preserves a changed entry on undo', async (t) => {
  const calls = [];
  const f = fixture(t, null, { claude: fakeClaude(calls, { wrongEntry: true }) });
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /did not record the expected entry/);
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /Interrupted setup/);
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true }), /entry changed; preserve it/);
  assert.deepEqual(f.read().projects[f.project].mcpServers.itf_library, { type: 'stdio', command: '/bin/true' });
});

test('claude setup refuses an edited owned entry and malformed configuration', async (t) => {
  const f = fixture(t);
  await f.setup.run({ ...f.options, apply: true });
  const edited = f.read();
  edited.projects[f.project].mcpServers.itf_library.args.push('--extra');
  writeFileSync(f.file, JSON.stringify(edited));
  await assert.rejects(f.setup.run({ ...f.options, apply: true }), /not owned by this setup/);
  await assert.rejects(f.setup.run({ ...f.options, undo: true, apply: true }), /entry changed; preserve it/);
  const broken = fixture(t);
  writeFileSync(broken.file, '{ not json');
  await assert.rejects(broken.setup.run(broken.options), /not valid JSON/);
});

test('setup CLI rejects unsupported claude scopes before any write', async () => {
  await assert.rejects(run(['setup', '--harness', 'claude', '--scope', 'project', '--commit', commit]), /--harness claude --scope local/);
  await assert.rejects(run(['setup', '--harness', 'claude', '--scope', 'user', '--commit', commit]), /--harness claude --scope local/);
});
