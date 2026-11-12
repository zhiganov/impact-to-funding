import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, stat, rm, mkdir, symlink, readdir, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { main } from '../cli.mjs';
import { InputError } from '../io.mjs';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const account = 'fictional-maintainer';
function source() {
  return {
    version: 'itf.github-sponsors-account/0.1', account, mode: 'remote',
    observedAt: '2026-11-12T00:00:00Z', visibility: 'public', accountType: 'User',
    profile: { state: 'present', id: 'listing-id', slug: account, url: `https://github.com/sponsors/${account}`, isPublic: true,
      name: 'Fictional maintainer', shortDescription: 'Fictional work', fullDescription: 'PRIVATE-SOURCE-TEXT' },
    tiers: { state: 'complete', visibility: 'published_only', totalCount: 1, pages: 1, items: [
      { id: 'tier-id', name: 'Fictional tier', description: 'Fictional terms', amountInCents: 500, currency: 'USD',
        cadence: 'monthly', isCustomAmount: false, updatedAt: '2026-11-11T00:00:00Z', status: 'published', statusBasis: 'published_query' },
    ] }, observations: [],
  };
}
async function fixture(t, snapshot = source()) {
  const dir = await mkdtemp(path.join(tmpdir(), 'itf-account-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const local = path.join(dir, 'snapshot.json');
  await writeFile(local, `${JSON.stringify(snapshot, null, 2)}\n`);
  return { dir, local, output: path.join(dir, 'account review') };
}
function run(args, env = {}) {
  return spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, ...env } });
}
const args = f => ['account', '--account', account, '--local', f.local, '--output', f.output];

test('real account CLI saves a private local overview without a network read or account proposal', async t => {
  const f = await fixture(t), before = await readFile(f.local);
  const result = run(args(f));
  assert.ok([0, 2].includes(result.status), result.stdout + result.stderr);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.scope.mode, 'local');
  assert.equal(report.scope.observedAt, '2026-11-12T00:00:00Z');
  assert.equal(report.publication, 'not_authorised');
  assert.equal(report.sources.snapshot.kind, 'supplied_snapshot');
  assert.match(report.sources.snapshot.digest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(report.comparison.state, 'not_supplied');
  assert.deepEqual(await readFile(f.local), before);
  assert(!result.stdout.includes('PRIVATE-SOURCE-TEXT'));
  assert(!result.stdout.includes(account));
  assert.deepEqual((await readdir(f.output)).sort(), ['review.json', 'review.md', 'source-observations.json']);
  if (process.platform !== 'win32') {
    assert.equal((await stat(f.output)).mode & 0o777, 0o700);
    for (const file of await readdir(f.output)) assert.equal((await stat(path.join(f.output, file))).mode & 0o777, 0o600);
  }
});

test('draft comparison retains the proposal digest, source bytes and read-only boundary', async t => {
  const f = await fixture(t), draft = path.join(f.dir, 'draft.json');
  await writeFile(draft, JSON.stringify({ account, profile: { fullDescription: 'A proposed introduction' }, tiers: [{ id: 'tier-id', amountInCents: 600 }] }));
  const originals = await Promise.all([readFile(f.local), readFile(draft)]);
  const result = run([...args(f), '--draft', draft]);
  assert.ok([0, 2].includes(result.status), result.stdout + result.stderr);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.sources.draft.kind, 'supplied_proposal');
  assert.match(report.sources.draft.digest, /^sha256:/);
  assert.match(JSON.stringify(report.comparison), /A proposed introduction/);
  assert.match(JSON.stringify(report.comparison), /600/);
  assert.deepEqual(await Promise.all([readFile(f.local), readFile(draft)]), originals);
  assert(!(await readdir(f.output)).some(name => /candidate|diff|FUNDING/.test(name)));
});

test('remote account dispatch explicitly supplies public/viewer scope and retains complete envelopes privately', async t => {
  const f = await fixture(t), seen = [];
  let stdout = '';
  const code = await main(['account', '--account', account, '--remote', '--output', f.output], { write(text) { stdout += text; } }, {
    collectAccount: async (login, options) => {
      seen.push({ login, ...options });
      return { snapshot: source(), responses: [{ response: { status: 200, body: { privateEvidence: 'PRIVATE-ENVELOPE' }, extraEnvelope: { retained: true } } }] };
    },
  });
  assert.ok([0, 2].includes(code));
  assert.deepEqual(seen, [{ login: account, visibility: 'public' }]);
  const raw = JSON.parse(await readFile(path.join(f.output, 'source-responses.json'), 'utf8'));
  assert.equal(raw[0].response.extraEnvelope.retained, true);
  assert.equal(raw[0].response.body.privateEvidence, 'PRIVATE-ENVELOPE');
  assert(!stdout.includes('PRIVATE-ENVELOPE'));
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.scope.mode, 'remote');
  assert(!JSON.stringify(report).includes('PRIVATE-ENVELOPE'));
});

test('viewer is an explicit option rather than inferred from a supplied file', async t => {
  const snapshot = source(); snapshot.visibility = 'viewer'; snapshot.tiers.visibility = 'viewer_visible';
  snapshot.tiers.items[0].statusBasis = 'admin_info';
  const f = await fixture(t, snapshot);
  const publicResult = run(args(f));
  assert.ok([2, 3].includes(publicResult.status), publicResult.stdout + publicResult.stderr);
  const viewerOutput = path.join(f.dir, 'viewer');
  const result = run([...args(f).slice(0, -1), viewerOutput, '--visibility', 'viewer']);
  assert.ok([0, 2].includes(result.status), result.stdout + result.stderr);
});

test('account mismatches and invalid source structures fail safely, preserving sources', async t => {
  const f = await fixture(t), before = await readFile(f.local);
  const result = run(['account', '--account', 'other-account', '--local', f.local, '--output', f.output]);
  assert.equal(result.status, 3, result.stdout + result.stderr);
  assert.equal(JSON.parse(await readFile(path.join(f.output, 'failure.json'), 'utf8')).status, 'refused');
  assert.deepEqual(await readFile(f.local), before);
  assert(!result.stdout.includes('PRIVATE-SOURCE-TEXT'));
});

test('unsafe usage is refused before collector calls or output creation', async t => {
  const f = await fixture(t); let called = false;
  for (const tail of [[], ['--remote'], ['--visibility', 'unknown'], ['--visibility', 'public', '--visibility', 'viewer'], ['--mapping', f.local]]) {
    await assert.rejects(main([...args(f), ...tail, ...(tail.length ? [] : ['--account', account])], { write() {} }, {
      collectAccount: async () => { called = true; },
    }), InputError);
  }
  assert.equal(called, false);
  assert(!(await readdir(f.dir)).includes('account review'));
  for (const login of ['../other', 'bad--login', '-other', 'other/thing']) {
    assert.equal(run(['account', '--account', login, '--remote', '--output', f.output]).status, 1);
  }
});

test('existing and symlink output are refused before remote reads', async t => {
  const f = await fixture(t); let called = false;
  await mkdir(f.output); await writeFile(path.join(f.output, 'keep'), 'keep');
  const collectAccount = async () => { called = true; };
  await assert.rejects(main(['account', '--account', account, '--remote', '--output', f.output], { write() {} }, { collectAccount }));
  assert.equal(called, false);
  if (process.platform !== 'win32') {
    const alias = path.join(f.dir, 'alias'); await symlink(f.output, alias);
    await assert.rejects(main(['account', '--account', account, '--remote', '--output', alias], { write() {} }, { collectAccount }));
  }
  assert.equal(called, false);
  assert.equal(await readFile(path.join(f.output, 'keep'), 'utf8'), 'keep');
});

test('the checkout and its symlink aliases are excluded from private output', async t => {
  const f = await fixture(t); let called = false;
  const collectAccount = async () => { called = true; };
  await assert.rejects(main(['account', '--account', account, '--remote', '--output', path.join(root, `account-private-${randomUUID()}`)], { write() {} }, { collectAccount }), InputError);
  if (process.platform !== 'win32') {
    const alias = path.join(f.dir, 'skill-alias'); await symlink(root, alias);
    await assert.rejects(main(['account', '--account', account, '--remote', '--output', path.join(alias, 'private')], { write() {} }, { collectAccount }), InputError);
  }
  assert.equal(called, false);
});

test('duplicate-key and malformed snapshot JSON fail before output creation', async t => {
  const f = await fixture(t);
  for (const text of ['{"account":"one","account":"two"}', '{', '{"n":9007199254740993}']) {
    await writeFile(f.local, text);
    assert.equal(run(args(f)).status, 1);
    assert(!(await readdir(f.dir)).includes('account review'));
  }
});

test('real remote CLI composes fake gh, collector and review, then replays offline without more requests', async t => {
  if (process.platform === 'win32') return t.skip('This fake executable fixture uses POSIX PATH lookup.');
  const f = await fixture(t), gh = path.join(f.dir, 'gh'), log = path.join(f.dir, 'calls.jsonl');
  const snapshot = source();
  const providerTier = snapshot.tiers.items[0];
  const providerProfile = { ...snapshot.profile };
  delete providerProfile.state;
  const metadata = { data: { repositoryOwner: { __typename: 'User', login: account, hasSponsorsListing: true,
    sponsorsListing: { id: 'listing-id', slug: account, url: providerProfile.url, isPublic: true } } } };
  const listing = { data: { node: { ...providerProfile, tiers: { totalCount: 1, nodes: [{ id: providerTier.id,
    name: providerTier.name, description: providerTier.description, monthlyPriceInCents: providerTier.amountInCents,
    isOneTime: false, isCustomAmount: false, updatedAt: providerTier.updatedAt }], pageInfo: { hasNextPage: false, endCursor: null } } } } };
  await writeFile(gh, `#!${process.execPath}\nconst fs=require('node:fs');let input='';process.stdin.on('data',x=>input+=x);process.stdin.on('end',()=>{const p=JSON.parse(input);const args=process.argv.slice(2);if(JSON.stringify(args)!==JSON.stringify(['api','--hostname','github.com','--include','--method','POST','graphql','--input','-']))process.exit(9);const metadata=p.query.startsWith('query SponsorsAccount(');if(metadata?p.variables.account!==${JSON.stringify(account)}:p.variables.id!=='listing-id'||p.variables.after!==null||p.query.includes('adminInfo'))process.exit(8);fs.appendFileSync(process.env.ITF_ACCOUNT_TEST_LOG,JSON.stringify({metadata})+'\\n');console.log('HTTP/2.0 200 OK\\nContent-Type: application/json\\n\\n'+JSON.stringify(metadata?${JSON.stringify(metadata)}:${JSON.stringify(listing)}));});\n`);
  await chmod(gh, 0o700);
  const env = { PATH: `${f.dir}${path.delimiter}${process.env.PATH}`, ITF_ACCOUNT_TEST_LOG: log };
  const remote = run(['account', '--account', account, '--remote', '--output', f.output], env);
  assert.equal(remote.status, 0, remote.stdout + remote.stderr);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.profile.fullDescription, snapshot.profile.fullDescription);
  assert.equal(report.tiers.state, 'complete');
  assert.equal(report.tiers.items[0].amountInCents, 500);
  const calls = await readFile(log, 'utf8');
  assert.equal(calls.trim().split('\n').length, 2);
  const evidence = JSON.parse(await readFile(path.join(f.output, 'source-responses.json'), 'utf8'));
  assert.equal(evidence.length, 2);
  assert.match(evidence[1].response.stdout, /HTTP\/2\.0 200/);
  const replayOutput = path.join(f.dir, 'offline-replay');
  const replay = run(['account', '--account', account, '--local', path.join(f.output, 'source-observations.json'), '--output', replayOutput], env);
  assert.equal(replay.status, 0, replay.stdout + replay.stderr);
  const replayReport = JSON.parse(await readFile(path.join(replayOutput, 'review.json'), 'utf8'));
  assert.equal(replayReport.scope.mode, 'local');
  assert.equal(replayReport.scope.sourceMode, 'remote');
  assert.equal(replayReport.scope.observedAt, report.scope.observedAt);
  assert.equal(await readFile(log, 'utf8'), calls);
  assert(!remote.stdout.includes('PRIVATE-SOURCE-TEXT'));
  assert(!replay.stdout.includes('PRIVATE-SOURCE-TEXT'));
});
