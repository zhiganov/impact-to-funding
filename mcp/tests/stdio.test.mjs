import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import Ajv from 'ajv';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SERVER = fileURLToPath(new URL('../server.mjs', import.meta.url));
const PREPARE = fileURLToPath(new URL('../prepare.mjs', import.meta.url));
const SOURCE_REVISION = '7b36169f00b8d6185d16629b7784ac17ce7ea346';
const CONTRACT_VERSION = 'itf.library/0.1-draft';
const TOOL_NAMES = ['get_reference', 'library_info', 'search_references'];
const BOUNDS = {
  queryCodePoints: 240, queryTokens: 8, defaultPageSize: 10, maxPageSize: 25,
  maxDocumentBytes: 131072, snapshotIdCharacters: 256, cursorCharacters: 1024,
  recordIdCharacters: 64,
};
const MODES = [
  { era: 'legacy', options: { versionNegotiation: { mode: 'legacy' } } },
  { era: 'modern', options: { versionNegotiation: {
    mode: { pin: '2026-07-28' }, probe: { timeoutMs: 3000, maxRetries: 0 },
  } } },
];
const normalise = (value) => value.normalize('NFKC').trim().toLowerCase();
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function sourceBytes(path) {
  return execFileSync('git', ['show', `${SOURCE_REVISION}:${path}`], {
    cwd: ROOT, timeout: 5000, maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function withServer(t, snapshotPath, cwd, mode, check) {
  const client = new Client({ name: 'itf-stdio-contract-test', version: '0.1.0' }, mode.options);
  const transport = new StdioClientTransport({
    command: process.execPath, args: [SERVER, '--snapshot', snapshotPath], cwd, stderr: 'pipe',
  });
  let stderr = '';
  let pid;
  transport.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
  const wire = [];
  try {
    await client.connect(transport, { timeout: 3000, signal: t.signal });
    pid = transport.pid;
    assert.ok(Number.isInteger(pid) && pid > 0, 'a separate normal server process was spawned');
    assert.equal(client.getProtocolEra(), mode.era);
    const version = client.getNegotiatedProtocolVersion();
    if (mode.era === 'modern') assert.equal(version, '2026-07-28');
    else assert.match(version, /^2025-\d{2}-\d{2}$/);
    // Observe actual incoming JSON-RPC, before the SDK consumes resultType.
    // Keep the official base transport (modern negotiation uses a disposable sibling).
    const receive = transport.onmessage;
    transport.onmessage = (message) => {
      wire.push(structuredClone(message));
      receive(message);
    };
    t.diagnostic(JSON.stringify({ era: mode.era, negotiatedWireVersion: version,
      clientOptions: mode.options, requestTimeoutMs: 3000, serverCwdOutsideRepository: true }));
    await check({ client, wire, stderr: () => stderr, options: { timeout: 3000, signal: t.signal } });
  } finally {
    pid ??= transport.pid;
    await client.close();
    // Covers a partially failed connect as well as the normal SDK close path.
    await transport.close();
    assert.equal(transport.pid, null);
    if (pid) assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' }, 'owned server child exited');
    t.diagnostic(JSON.stringify({ era: mode.era, childExited: true, stderr }));
  }
}

async function discover(client, options) {
  const { tools } = await client.listTools(undefined, options);
  assert.deepEqual(tools.map((tool) => tool.name).sort(), TOOL_NAMES);
  const ajv = new Ajv({ allErrors: true, strict: false });
  return new Map(tools.map((tool) => {
    assert.equal(tool.inputSchema.type, 'object', `${tool.name} inputSchema is an object schema`);
    assert.equal(tool.inputSchema.additionalProperties, false);
    assert.equal(tool.outputSchema.type, 'object', `${tool.name} advertises structured output`);
    assert.equal(ajv.validateSchema(tool.inputSchema), true, ajv.errorsText());
    const validate = ajv.compile(tool.outputSchema);
    return [tool.name, validate];
  }));
}

async function application(client, validators, wire, mode, options, name, args, errorCode) {
  const offset = wire.length;
  const result = await client.callTool({ name, arguments: args }, options);
  const replies = wire.slice(offset).filter((message) => Object.hasOwn(message, 'result'));
  assert.equal(replies.length, 1, `${name} has one real wire result`);
  if (mode.era === 'modern') assert.equal(replies[0].result.resultType, 'complete');
  else assert.equal(Object.hasOwn(replies[0].result, 'resultType'), false);
  assert.equal(result.isError, Boolean(errorCode));
  const payload = result.structuredContent;
  assert.equal(typeof payload, 'object');
  assert.notEqual(payload, null);
  const validate = validators.get(name);
  assert.equal(validate(payload), true, `${name}: ${JSON.stringify(validate.errors)}`);
  assert.equal(result.content.length, 1);
  assert.equal(result.content[0].type, 'text');
  assert.deepEqual(JSON.parse(result.content[0].text), payload, 'text retains the entire application JSON');
  assert.equal(payload.contractVersion, CONTRACT_VERSION);
  assert.match(payload.asOf, /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/);
  assert.ok(Number.isFinite(Date.parse(payload.asOf)));
  if (errorCode) {
    assert.equal(payload.status, 'error');
    assert.equal(payload.error.code, errorCode);
    assert.equal(Object.hasOwn(payload, 'data'), false, 'application errors are not empty successes');
  } else {
    assert.equal(payload.status, 'ok');
    assert.equal(payload.sourceRevision, SOURCE_REVISION);
    assert.ok(payload.coverage.limitations.length > 0, 'even complete coverage retains caveats');
    assert.ok(payload.coverage.limitations.every((item) => typeof item === 'string' && item.length > 0));
  }
  return payload;
}

async function protocolError(client, wire, options, request) {
  const offset = wire.length;
  await assert.rejects(client.request(request, options), (error) => {
    assert.ok(error instanceof ProtocolError, 'a true protocol error, not an application payload');
    assert.equal(error.code, ProtocolErrorCode.InvalidParams);
    return true;
  });
  const replies = wire.slice(offset).filter((message) => Object.hasOwn(message, 'error'));
  assert.equal(replies.length, 1, 'the protocol error came from the server');
  assert.equal(replies[0].error.code, ProtocolErrorCode.InvalidParams);
  assert.equal(Object.hasOwn(replies[0], 'result'), false);
}

test('prepared public snapshot works over official SDK stdio in legacy and modern eras', { timeout: 55000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'itf-stdio-'));
  try {
    const snapshotPath = join(directory, 'prepared.json');
    const preparation = JSON.parse(execFileSync(process.execPath, [PREPARE,
      '--revision', SOURCE_REVISION, '--output', snapshotPath], {
      cwd: directory, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }));
    assert.equal(preparation.sourceRevision, SOURCE_REVISION);
    assert.equal(preparation.declaredRecords, 9);
    assert.equal(preparation.availableRecords, 9);
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
    assert.equal(snapshot.snapshotId, preparation.snapshotId);
    // Independent expected committed bytes, read before tool calls; never fetch links.
    const expectedCase = sourceBytes('references/library/cases/ahmedabad-heat-action-plan.md');
    const expectedLenses = sourceBytes('references/library/lenses.md');
    t.diagnostic(JSON.stringify({ node: process.version, preparation, bounds: BOUNDS,
      limits: 'Local process/contract checks only; no host/model, browser, network, deployment or impact validation.' }));

    for (const mode of MODES) {
      await withServer(t, snapshotPath, directory, mode, async ({ client, wire, stderr, options }) => {
        const validators = await discover(client, options);
        const call = (name, args = {}, code) => application(client, validators, wire, mode, options, name, args, code);
        const info = await call('library_info');
        assert.equal(info.snapshotId, snapshot.snapshotId);
        assert.equal(info.coverage.status, 'complete');
        assert.equal(info.coverage.declaredRecords, 9);
        assert.equal(info.coverage.availableRecords, 9);
        assert.equal(info.coverage.unavailableRecords, 0);
        assert.deepEqual(info.data.availableByKind, { case: 5, pattern: 2, lens: 2 });
        assert.deepEqual(info.data.bounds, BOUNDS);
        assert.equal(info.data.searchMode, 'literal_all_tokens_id_order');
        assert.equal(info.data.history, 'not_guaranteed');

        const query = '  ＴＨＥ  ';
        const expected = snapshot.records.filter((record) => record.available
          && normalise(`${record.title}\n${record.discoveryText}\n${record.contentMarkdown}`).includes('the'))
          .map((record) => record.id).sort();
        assert.ok(expected.length > 1);
        const first = await call('search_references', { query, limit: 1 });
        assert.deepEqual(first.data.items.map((item) => item.id), expected.slice(0, 1));
        assert.equal(typeof first.data.nextCursor, 'string');
        const second = await call('search_references', {
          query: 'the', limit: 1, cursor: first.data.nextCursor, snapshotId: first.snapshotId,
        });
        assert.deepEqual(second.data.items.map((item) => item.id), expected.slice(1, 2));
        assert.equal(second.snapshotId, first.snapshotId);
        const literal = await call('search_references', { query: '.*', limit: 1 });
        const literalIds = snapshot.records.filter((record) => record.available
          && normalise(`${record.title}\n${record.discoveryText}\n${record.contentMarkdown}`).includes('.*'))
          .map((record) => record.id).sort();
        assert.deepEqual(literal.data.items.map((item) => item.id), literalIds.slice(0, 1), 'not a regex');

        const detail = await call('get_reference', { id: 'C001', revision: 1, snapshotId: first.snapshotId });
        assert.equal(detail.data.record.id, 'C001');
        assert.equal(detail.data.record.recordRevision, 1);
        assert.equal(detail.data.record.contentScope, 'record_document');
        assert.deepEqual(detail.data.record.coLocatedIds, ['C001']);
        assert.equal(detail.data.record.contentMarkdown, expectedCase.toString('utf8'));
        assert.equal(detail.data.record.contentSha256, hash(expectedCase));
        for (const id of ['L001', 'L002']) {
          const lens = await call('get_reference', { id, revision: 1, snapshotId: first.snapshotId });
          assert.equal(lens.data.record.id, id);
          assert.equal(lens.data.record.contentScope, 'shared_document');
          assert.deepEqual(lens.data.record.coLocatedIds, ['L001', 'L002']);
          assert.equal(lens.data.record.anchor, id === 'L001' ? 'l001--doughnut-economics' : 'l002--planetary-boundaries');
          assert.equal(lens.data.record.contentMarkdown, expectedLenses.toString('utf8'));
          assert.equal(lens.data.record.contentSha256, hash(expectedLenses));
        }

        await call('search_references', { query: ' \t ' }, 'invalid_arguments');
        await call('search_references', { query: 'private-query-canary', unexpected: true }, 'invalid_arguments');
        await call('library_info', { unexpected: 'private-query-canary' }, 'invalid_arguments');
        await call('library_info', { contractVersion: 'itf.library/999' }, 'unsupported_version');
        await call('get_reference', {}, 'invalid_arguments');
        await call('get_reference', { id: 'C999999' }, 'not_found');
        await call('get_reference', { id: 'C001', revision: 2 }, 'revision_unavailable');
        for (const name of TOOL_NAMES) {
          await call(name, { ...(name === 'get_reference' ? { id: 'C001' } : {}),
            snapshotId: 'unavailable-snapshot-canary' }, 'snapshot_unavailable');
        }
        await call('search_references', { query: 'the', limit: 2,
          cursor: first.data.nextCursor, snapshotId: first.snapshotId }, 'invalid_cursor');
        await call('search_references', { query: 'the', limit: 1,
          cursor: first.data.nextCursor }, 'invalid_arguments');
        await protocolError(client, wire, options, { method: 'tools/call',
          params: { name: 'not_a_library_tool', arguments: {} } });
        await protocolError(client, wire, options, { method: 'tools/call', params: { name: 42 } });
        assert.equal(stderr(), '', 'normal server does not log queries or local paths');
      });
    }

    const malformedPath = join(directory, 'private-artifact-malformed.json');
    await writeFile(malformedPath, '{malformed-private-artifact-canary', { flag: 'wx', mode: 0o600 });
    const unreadablePath = join(directory, 'private-artifact-unreadable.json');
    // The unused path reliably exercises a failed read, regardless of filesystem permission privileges.
    for (const path of [unreadablePath, malformedPath]) {
      for (const mode of MODES) {
        await withServer(t, path, directory, mode, async ({ client, wire, stderr, options }) => {
          const validators = await discover(client, options);
          for (const name of TOOL_NAMES) {
            const args = name === 'get_reference' ? { id: 'C001' }
              : name === 'search_references' ? { query: 'private-query-canary' } : {};
            const payload = await application(client, validators, wire, mode, options,
              name, args, 'snapshot_unavailable');
            assert.equal(Object.hasOwn(payload, 'snapshotId'), false, 'no snapshot was selected');
            assert.ok(!JSON.stringify(payload).includes(directory));
            assert.ok(!JSON.stringify(payload).includes('private-query-canary'));
          }
          assert.match(stderr(), /snapshot unavailable or invalid/i);
          for (const privateText of [directory, path, 'private-query-canary', 'private-artifact', 'SyntaxError', 'ENOENT']) {
            assert.ok(!stderr().includes(privateText), 'stderr does not expose paths, query or raw parser/read errors');
          }
        });
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
