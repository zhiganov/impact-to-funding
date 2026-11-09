import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, existsSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const example = readFileSync(new URL('../../../examples/funding-interchange.md', import.meta.url), 'utf8');
const fixtures = () => [...example.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
const carrier = 'org.impact-to-funding.support';

function workspace(t) {
  const root = mkdtempSync(path.join(process.env.ITF_TEST_TMPDIR ?? tmpdir(), 'itf-support-cli-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const tripwire = path.join(root, 'deny-network.mjs');
  writeFileSync(tripwire, `import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
const deny = () => { throw new Error('Unexpected network operation'); };
globalThis.fetch = deny;
http.request = http.get = https.request = https.get = net.connect = net.createConnection = deny;
`);
  return {
    root,
    put(name, value) {
      const target = path.join(root, name);
      writeFileSync(target, typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
      return target;
    },
    run(...args) {
      return spawnSync(process.execPath, ['--import', tripwire, cli, ...args], {
        cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 2 * 1024 * 1024,
      });
    },
  };
}

test('inspect is a real offline invocation with declaration-only checks', (t) => {
  const work = workspace(t);
  const [general] = fixtures();
  const input = work.put('general.json', general);
  const before = readFileSync(input);
  const result = work.run('inspect', input);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, 'valid');
  assert.equal(report.checks.network, 'disabled');
  assert.equal(report.checks.privacy, 'not_assessed');
  assert.deepEqual(readFileSync(input), before);
});

test('financial-view writes a new private local bundle and preserves other values', (t) => {
  const work = workspace(t);
  const [, funding] = fixtures();
  funding.extensions['org.example.other'] = { status: 'opaque', amount: 97 };
  const input = work.put('enriched.json', funding);
  const before = readFileSync(input);
  const output = path.join(work.root, 'financial-output');
  const result = work.run('financial-view', input, '--output', output);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const projected = JSON.parse(readFileSync(path.join(output, 'funding.json'), 'utf8'));
  const expected = structuredClone(funding);
  delete expected.extensions[carrier];
  assert.deepEqual(projected, expected);
  const notes = JSON.parse(readFileSync(path.join(output, 'projection-notes.json'), 'utf8'));
  assert.ok(notes.losses.length >= 2);
  assert.equal(notes.checks.consumerCompatibility, 'not_tested');
  assert.equal(notes.checks.privacy, 'not_assessed');
  assert.equal(JSON.parse(result.stdout).publication, 'not_performed');
  assert.equal(statSync(output).mode & 0o777, 0o700);
  assert.equal(statSync(path.join(output, 'funding.json')).mode & 0o777, 0o600);
  assert.equal(statSync(path.join(output, 'projection-notes.json')).mode & 0o777, 0o600);
  assert.deepEqual(readFileSync(input), before);
});

test('bind uses explicit supplied plans and writes versioned derivation notes', (t) => {
  const work = workspace(t);
  const [, enriched] = fixtures();
  const source = structuredClone(enriched.extensions[carrier]);
  source.canonicalUrl = 'https://example.org/queue-lantern/support-source.json';
  source.revision = 'source-r1';
  const entry = source.supportCases[0];
  delete entry.fundingPlanRef;
  entry.money = {
    amount: 150, currency: 'EUR', frequency: 'one-time', status: 'inactive',
    costBasis: 'Five hours at EUR 30/hour; a proposed gross cost.',
    existingSupport: 'Unconfirmed, not an established net gap.',
  };
  const financial = structuredClone(enriched);
  delete financial.extensions;
  const input = work.put('source.json', source);
  const base = work.put('base.json', financial);
  const mapping = work.put('map.json', { 'investigate-recovery': 'maintenance-study' });
  const output = path.join(work.root, 'bound-output');
  const result = work.run('bind', input, '--funding', base, '--map', mapping,
    '--destination-url', 'https://example.org/queue-lantern/funding.json',
    '--revision', 'projection-r1', '--mapping-revision', 'mapping-r1', '--output', output);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const document = JSON.parse(readFileSync(path.join(output, 'funding.json'), 'utf8'));
  assert.deepEqual(document.funding, financial.funding);
  const payload = document.extensions[carrier];
  assert.equal(payload.revision, 'projection-r1');
  assert.deepEqual(payload.derivedFrom, { url: source.canonicalUrl, revision: 'source-r1', mappingRevision: 'mapping-r1' });
  assert.equal(Object.hasOwn(payload.supportCases[0], 'money'), false);
  assert.equal(payload.supportCases[0].fundingPlanRef.guid, 'maintenance-study');
  assert.ok(payload.supportCases[0].limitations.includes(entry.money.existingSupport));
  assert.ok(payload.supportCases[0].limitations.includes(entry.money.costBasis));
});

test('limited and invalid input never create an output directory', (t) => {
  const work = workspace(t);
  const [, funding] = fixtures();
  funding.extensions[carrier].surprise = 'An uninterpreted hypothetical field';
  const input = work.put('limited.json', funding);
  const output = path.join(work.root, 'not-created');
  const result = work.run('financial-view', input, '--output', output);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.equal(JSON.parse(result.stdout).status, 'blocked');
  assert.equal(existsSync(output), false);
});

test('existing output directories are not overwritten or cleaned up', (t) => {
  const work = workspace(t);
  const [, funding] = fixtures();
  const input = work.put('valid.json', funding);
  const output = path.join(work.root, 'already-owned');
  mkdirSync(output);
  const existing = path.join(output, 'funding.json');
  writeFileSync(existing, 'Unrelated existing work\n');
  const result = work.run('financial-view', input, '--output', output);
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).code, 'output_not_created');
  assert.equal(readFileSync(existing, 'utf8'), 'Unrelated existing work\n');
  assert.equal(existsSync(path.join(output, 'projection-notes.json')), false);
});

test('syntax, unknown flags and I/O errors do not echo source values or paths', (t) => {
  const work = workspace(t);
  const secret = 'FICTIONAL_BEARER_VALUE_DO_NOT_ECHO';
  const input = work.put(secret + '.json', '{"token":"' + secret + '",');
  for (const result of [
    work.run('inspect', input),
    work.run('inspect', input, '--' + secret, secret),
    work.run('inspect', path.join(work.root, secret + '-missing.json')),
  ]) {
    assert.notEqual(result.status, 0);
    assert.ok(!result.stdout.includes(secret));
    assert.ok(!result.stderr.includes(secret));
    assert.ok(!result.stdout.includes(work.root));
    assert.ok(!result.stderr.includes(work.root));
  }
});

test('CLI input-byte refusal is visibly limited, not an empty successful document', (t) => {
  const work = workspace(t);
  const input = work.put('too-large.json', ' '.repeat(1048577));
  const result = work.run('inspect', input);
  assert.equal(result.status, 2);
  assert.equal(JSON.parse(result.stdout).status, 'limited');
});

test('CLI rejects an owned FIFO without waiting for a writer or revealing its path', {
  skip: process.platform === 'win32' ? 'POSIX FIFO regression' : false,
}, (t) => {
  const work = workspace(t);
  const input = path.join(work.root, 'FICTIONAL_PRIVATE_FIFO');
  const created = spawnSync('mkfifo', [input], { encoding: 'utf8', timeout: 1000 });
  assert.equal(created.status, 0, 'Unable to create the owned FIFO fixture');
  assert.equal(statSync(input).isFIFO(), true);
  const result = work.run('inspect', input);
  assert.equal(result.error, undefined, 'CLI must exit before the subprocess timeout');
  assert.equal(result.status, 2);
  assert.deepEqual(JSON.parse(result.stdout), { status: 'limited', code: 'input_file_limit' });
  assert.equal(result.stderr, '');
  assert.ok(!result.stdout.includes(work.root));
  assert.ok(!result.stdout.includes('FICTIONAL_PRIVATE_FIFO'));
});
