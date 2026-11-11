import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm, mkdir, symlink, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { main } from '../cli.mjs';
import { strictJson, InputError } from '../io.mjs';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const supportAvailable = await import('../../support-profile/lib/inspect.mjs').then(() => true, () => false);
async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'itf-readiness-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const local = path.join(dir, 'funding.yml');
  await writeFile(local, '# Keep this destination\nko_fi: fictional-guide\n');
  return { dir, local, output: path.join(dir, 'review #1') };
}
function run(args, env = {}) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...env } });
}

test('real offline CLI preserves source, creates a private proposal and reports local limits', async t => {
  const f = await fixture(t);
  const mapping = path.join(f.dir, 'mapping.json');
  await writeFile(mapping, JSON.stringify({ add: { custom: ['https://example.org/guide/support'] } }));
  const before = await readFile(f.local);
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--mapping', mapping, '--output', f.output]);
  assert.ok([0, 2].includes(result.status), result.stdout + result.stderr);
  assert.deepEqual(await readFile(f.local), before);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.scope.mode, 'local');
  assert.equal(report.publication, 'not_authorised');
  assert.equal(report.recordComparison.state, 'not_supplied');
  const candidate = await readFile(path.join(f.output, 'FUNDING.candidate.yml'), 'utf8');
  assert.match(candidate, /ko_fi: fictional-guide/);
  assert.match(candidate, /https:\/\/example.org\/guide\/support/);
  assert.match(candidate, /Keep this destination/);
  assert.match(await readFile(path.join(f.output, 'FUNDING.diff'), 'utf8'), /custom/);
  assert(!result.stdout.includes('example.org'));
  if (process.platform !== 'win32') {
    assert.equal((await stat(f.output)).mode & 0o777, 0o700);
    for (const file of await readdir(f.output)) assert.equal((await stat(path.join(f.output, file))).mode & 0o777, 0o600);
  }
});

test('inspection without mapping creates no candidate or diff', async t => {
  const f = await fixture(t);
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--output', f.output]);
  assert.ok([0, 2].includes(result.status));
  assert(!(await readdir(f.output)).includes('FUNDING.candidate.yml'));
  assert(!(await readdir(f.output)).includes('FUNDING.diff'));
});

test('existing and symlink output directories are refused without changes', async t => {
  const f = await fixture(t);
  await mkdir(f.output);
  await writeFile(path.join(f.output, 'keep'), 'keep');
  const args = ['review', '--repository', 'fictional/guide', '--local', f.local, '--output'];
  assert.equal(run([...args, f.output]).status, 1);
  assert.equal(await readFile(path.join(f.output, 'keep'), 'utf8'), 'keep');
  if (process.platform !== 'win32') {
    const link = path.join(f.dir, 'link');
    await symlink(f.output, link);
    assert.equal(run([...args, link]).status, 1);
    assert.deepEqual(await readdir(f.output), ['keep']);
  }
});

test('invalid option combinations do not read remote sources or create output', async t => {
  const f = await fixture(t);
  let called = false;
  await assert.rejects(main(['review', '--repository', 'fictional/guide', '--remote', '--local', f.local, '--output', f.output], { write() {} }, { collect: async () => { called = true; } }), InputError);
  assert.equal(called, false);
  assert(!(await readdir(f.dir)).includes('review #1'));
  assert.equal(run(['review', '--repository', 'fictional/guide', '--remote', '--defaults', f.local, '--output', f.output]).status, 1);
});

test('duplicate JSON keys, unsafe numbers, oversized and deep JSON are refused', () => {
  assert.throws(() => strictJson('{"add":{},"add":{}}'), InputError);
  assert.throws(() => strictJson('{"n":9007199254740993}'), InputError);
  assert.throws(() => strictJson('['.repeat(70) + '0' + ']'.repeat(70)), InputError);
  assert.throws(() => strictJson(' '.repeat(1048577)), InputError);
  assert.throws(() => strictJson('{"x":1,}'), InputError);
  assert.deepEqual(strictJson('{"add":{"custom":["https://example.org"]}}'), { add: { custom: ['https://example.org'] } });
});

test('bad UTF-8 and non-regular inputs fail before output creation', async t => {
  const f = await fixture(t);
  await writeFile(f.local, Buffer.from([0xff, 0xfe]));
  assert.equal(run(['review', '--repository', 'fictional/guide', '--local', f.local, '--output', f.output]).status, 1);
  assert.equal(run(['review', '--repository', 'fictional/guide', '--local', f.dir, '--output', f.output]).status, 1);
  assert(!(await readdir(f.dir)).includes('review #1'));
});

test('ambiguous YAML produces a refusal or blocked report and preserves input', async t => {
  const f = await fixture(t);
  await writeFile(f.local, 'github: first\ngithub: second\n');
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--output', f.output]);
  assert.equal(result.status, 3, result.stdout + result.stderr);
  assert.equal(await readFile(f.local, 'utf8'), 'github: first\ngithub: second\n');
  assert(!(await readdir(f.output)).includes('FUNDING.candidate.yml'));
});

test('remote assembly retains the full response envelope privately before reporting', async t => {
  const f = await fixture(t);
  let output = '';
  const envelope = { wrapper: { unexpected: 'retained-private-envelope' }, status: 200, body: { key: 'value' } };
  const code = await main(['review', '--repository', 'fictional/guide', '--remote', '--output', f.output], { write(s) { output += s; } }, {
    collect: async repository => ({ snapshot: { repository, mode: 'remote', observedAt: '2026-11-11T00:00:00Z', repositoryRevision: 'a'.repeat(40), repositoryFunding: { state: 'present', text: 'custom: https://example.org/support\n', revision: 'a'.repeat(40) }, accountDefaults: { state: 'absent' }, apiFundingLinks: { state: 'observed', links: [{ platform: 'CUSTOM', url: 'https://example.org/support' }] }, observations: [] }, responses: [envelope] }),
  });
  assert.ok([0, 2].includes(code));
  assert.deepEqual(JSON.parse(await readFile(path.join(f.output, 'source-responses.json'), 'utf8')), [envelope]);
  assert(!output.includes('retained-private-envelope'));
  assert.equal(JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8')).scope.mode, 'remote');
});

test('optional financial comparison preserves inactive status and does not copy contacts', { skip: !supportAvailable }, async t => {
  const f = await fixture(t);
  const funding = path.join(f.dir, 'financial.json');
  await writeFile(funding, JSON.stringify({ version: 'fictional-1', entity: { type: 'individual', role: 'maintainer', name: 'Fictional author', email: 'author@example.org', description: 'Fictional.', webpageUrl: { url: 'https://example.org/author' } }, projects: [{ guid: 'guide', name: 'Guide', description: 'Fictional OSS guide.', webpageUrl: { url: 'https://example.org/guide' }, repositoryUrl: { url: 'https://example.org/guide' }, licenses: ['spdx:MIT'], tags: ['guide'] }], funding: { channels: [{ guid: 'support', type: 'payment-provider', address: 'https://example.org/support', description: 'Fictional.' }], plans: [{ guid: 'guide', status: 'inactive', name: 'Guide', description: 'Prospective.', amount: 0, currency: 'EUR', frequency: 'one-time', channels: ['support'] }] } }));
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--funding', funding, '--output', f.output]);
  assert.ok([0, 2].includes(result.status), result.stdout + result.stderr);
  const text = await readFile(path.join(f.output, 'review.json'), 'utf8');
  const comparison = JSON.parse(text).recordComparison;
  assert.notEqual(comparison.state, 'unavailable');
  assert.equal(comparison.plans[0].status, 'inactive');
  assert.equal(comparison.plans[0].amount, 0);
  assert.equal(comparison.plans[0].currency, 'EUR');
  assert(!text.includes('author@example.org'));
  assert.match(await readFile(funding, 'utf8'), /inactive/);
});

test('fresh output within the skill checkout or through an ancestor symlink is refused before network', async t => {
  const f = await fixture(t);
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const forbidden = path.join(root, `private-review-${randomUUID()}`);
  const invoke = async output => {
    let called = false;
    await assert.rejects(main(['review', '--repository', 'fictional/guide', '--remote', '--output', output], { write() {} }, { collect: async () => { called = true; } }), error => error.code === 'private_output_required');
    assert.equal(called, false);
  };
  await invoke(forbidden);
  await assert.rejects(stat(forbidden), error => error.code === 'ENOENT');
  if (process.platform !== 'win32') {
    const alias = path.join(f.dir, 'checkout-alias');
    await symlink(root, alias);
    await invoke(path.join(alias, path.basename(forbidden)));
    await assert.rejects(stat(forbidden), error => error.code === 'ENOENT');
  }
});

test('invalid financial fields cannot smuggle nested contacts into comparison projections', { skip: !supportAvailable }, async t => {
  const f = await fixture(t);
  const funding = path.join(f.dir, 'invalid-financial.json');
  await writeFile(funding, JSON.stringify({ version: { email: 'hidden@example.org' }, funding: { plans: [{ guid: 'guide', channels: [{ email: 'hidden@example.org' }], amount: { email: 'hidden@example.org' } }], channels: [{ guid: 'support', address: { email: 'hidden@example.org' } }] } }));
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--funding', funding, '--output', f.output]);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const text = await readFile(path.join(f.output, 'review.json'), 'utf8');
  const comparison = JSON.parse(text).recordComparison;
  assert.equal(comparison.state, 'limited');
  assert(!text.includes('hidden@example.org'));
  assert.equal(comparison.plans, undefined);
  assert.equal(comparison.sources.funding.version, undefined);
});

function supportRecord(money) {
  return { profile: 'itf.support/0.1-proposal', id: 'guide', revision: 'fictional-1', publisher: { name: 'Fictional maintainer' }, subject: { id: 'guide', name: 'Guide', kind: 'project', description: 'Fictional OSS guide.' }, limitations: 'Fictional draft only.', supportCases: [{ id: 'need', purpose: 'Maintain the guide.', status: 'proposed', resources: ['Maintainer time'], money, limitations: 'Costs are illustrative.' }] };
}

test('unknown nested money fields are omitted while known supported terms remain', { skip: !supportAvailable }, async t => {
  const f = await fixture(t);
  const support = path.join(f.dir, 'support.json');
  await writeFile(support, JSON.stringify(supportRecord({ amount: 20, currency: 'USD', frequency: 'monthly', status: 'inactive', costBasis: 'Fictional maintenance.', existingSupport: 'Unknown.', extra: { email: 'hidden@example.org' } })));
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--support', support, '--output', f.output]);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const text = await readFile(path.join(f.output, 'review.json'), 'utf8');
  const comparison = JSON.parse(text).recordComparison;
  assert.equal(comparison.cases[0].money.amount, 20);
  assert.equal(comparison.cases[0].money.status, 'inactive');
  assert(!text.includes('hidden@example.org'));
  assert.equal(comparison.cases[0].money.extra, undefined);
});

test('malformed support fields are reported without copying nested source values', { skip: !supportAvailable }, async t => {
  const f = await fixture(t);
  const support = path.join(f.dir, 'support-invalid.json');
  const record = supportRecord({ amount: { email: 'hidden@example.org' }, currency: 'USD', costBasis: 'Fictional.', existingSupport: 'Unknown.' });
  record.revision = { email: 'hidden@example.org' };
  await writeFile(support, JSON.stringify(record));
  const result = run(['review', '--repository', 'fictional/guide', '--local', f.local, '--support', support, '--output', f.output]);
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const text = await readFile(path.join(f.output, 'review.json'), 'utf8');
  const comparison = JSON.parse(text).recordComparison;
  assert.deepEqual(comparison.cases, []);
  assert.equal(comparison.sources.support.revision, undefined);
  assert(!text.includes('hidden@example.org'));
});
