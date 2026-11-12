import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectSponsorsAccount, requestSponsors, ACCOUNT_METADATA_QUERY, PUBLIC_LISTING_QUERY, VIEWER_LISTING_QUERY } from '../account-github.mjs';

const NOW = '2026-11-12T12:00:00.000Z';
const listing = () => ({ id: 'listing-id', slug: 'fictional-maintainer', url: 'https://github.com/sponsors/fictional-maintainer', isPublic: true });
const metadata = () => ({ data: { repositoryOwner: { __typename: 'User', login: 'fictional-maintainer', hasSponsorsListing: true, sponsorsListing: listing() } } });
const sourceTier = (id = 'tier-1', fields = {}) => ({ id, name: 'Example tier', description: 'Example terms', monthlyPriceInCents: 501,
  isOneTime: false, isCustomAmount: false, updatedAt: NOW, ...fields });
const page = (nodes = [sourceTier()], fields = {}) => ({ data: { node: { ...listing(), name: 'Example maintainer',
  shortDescription: 'Example work', fullDescription: 'Example introduction',
  tiers: { nodes, totalCount: nodes.length, pageInfo: { hasNextPage: false, endCursor: null }, ...fields } } } });
const ok = body => ({ status: 200, body, extraEnvelope: { retained: true } });
function fixture(bodies = [metadata(), page()]) {
  const responses = bodies.map(body => body instanceof Error ? body : ok(body));
  const calls = [];
  const request = async (query, options) => {
    calls.push({ query, options });
    assert.ok(calls.length <= responses.length, 'Unexpected request');
    const response = responses[calls.length - 1];
    if (response instanceof Error) throw response;
    return response;
  };
  return { responses, calls, run: options => collectSponsorsAccount('fictional-maintainer', { now: () => NOW, request, ...options }) };
}
const codes = result => result.snapshot.observations.map(item => item.code);

test('collects exact public scalars, USD cents and full private response envelopes', async () => {
  const body = page();
  body.data.node.unexpected = { secret: 'PRIVATE_NESTED' };
  body.data.node.tiers.nodes[0].unexpected = { secret: 'PRIVATE_NESTED' };
  const f = fixture([metadata(), body]);
  const before = JSON.stringify(f.responses);
  const result = await f.run();
  assert.deepEqual(result.snapshot, {
    version: 'itf.github-sponsors-account/0.1', account: 'fictional-maintainer', mode: 'remote', observedAt: NOW,
    visibility: 'public', accountType: 'User',
    profile: { state: 'present', ...listing(), name: 'Example maintainer', shortDescription: 'Example work', fullDescription: 'Example introduction' },
    tiers: { state: 'complete', visibility: 'published_only', items: [{ id: 'tier-1', name: 'Example tier', description: 'Example terms',
      amountInCents: 501, currency: 'USD', cadence: 'monthly', isCustomAmount: false, updatedAt: NOW, status: 'published', statusBasis: 'published_query' }], totalCount: 1, pages: 1 },
    observations: [],
  });
  assert.equal(result.responses[0].response, f.responses[0]);
  assert.equal(result.responses[1].response, f.responses[1]);
  assert.equal(JSON.stringify(f.responses), before);
  assert.ok(!JSON.stringify(result.snapshot).includes('PRIVATE_NESTED'));
  assert.equal(f.calls[0].query, ACCOUNT_METADATA_QUERY);
  assert.deepEqual(f.calls[0].options.variables, { account: 'fictional-maintainer' });
  assert.equal(f.calls[1].query, PUBLIC_LISTING_QUERY);
  assert.deepEqual(f.calls[1].options.variables, { id: 'listing-id', after: null });
  assert.ok(f.calls.every(call => call.options.timeoutMs > 0 && call.options.timeoutMs <= 15_000));
});

test('fixed queries expose only the assigned content; public query omits adminInfo', () => {
  assert.ok(!PUBLIC_LISTING_QUERY.includes('adminInfo'));
  assert.match(PUBLIC_LISTING_QUERY, /includeUnpublished: false/);
  assert.match(VIEWER_LISTING_QUERY, /includeUnpublished: true/);
  assert.match(VIEWER_LISTING_QUERY, /adminInfo \{ isDraft isPublished isRetired \}/);
  for (const query of [ACCOUNT_METADATA_QUERY, PUBLIC_LISTING_QUERY, VIEWER_LISTING_QUERY]) {
    assert.ok(!/mutation|sponsorships|activities|payout|contact|billing|fiscal|income|goals/i.test(query));
  }
});

test('viewer scope preserves nonpublic profile and admin-only statuses without claiming admin coverage', async () => {
  const body = page([
    sourceTier('published', { adminInfo: { isDraft: false, isPublished: true, isRetired: false } }),
    sourceTier('draft', { isOneTime: true, monthlyPriceInCents: 0, isCustomAmount: true, adminInfo: { isDraft: true, isPublished: false, isRetired: false } }),
    sourceTier('retired', { adminInfo: { isDraft: false, isPublished: false, isRetired: true } }),
    sourceTier('hidden', { adminInfo: null }),
    sourceTier('conflict', { adminInfo: { isDraft: true, isPublished: true, isRetired: false } }),
    sourceTier('all-false', { adminInfo: { isDraft: false, isPublished: false, isRetired: false } }),
  ]);
  const meta = metadata();
  meta.data.repositoryOwner.__typename = 'Organization';
  meta.data.repositoryOwner.sponsorsListing.isPublic = false;
  body.data.node.isPublic = false;
  const f = fixture([meta, body]);
  const { snapshot } = await f.run({ visibility: 'viewer' });
  assert.equal(snapshot.accountType, 'Organization');
  assert.equal(snapshot.tiers.visibility, 'viewer_visible');
  assert.equal(snapshot.profile.isPublic, false);
  assert.equal(f.calls[1].query, VIEWER_LISTING_QUERY);
  assert.deepEqual(snapshot.tiers.items.map(item => item.status), ['published', 'draft', 'retired', 'unknown', 'unknown', 'unknown']);
  assert.deepEqual(snapshot.tiers.items.map(item => item.statusBasis), ['admin_info', 'admin_info', 'admin_info', 'unknown', 'unknown', 'unknown']);
  assert.equal(snapshot.tiers.items[1].cadence, 'one_time');
  assert.equal(snapshot.tiers.items[1].amountInCents, 0);
  assert.equal(snapshot.tiers.items[1].isCustomAmount, true);
});

test('account and listing identities match case-insensitively', async () => {
  const meta = metadata();
  meta.data.repositoryOwner.login = 'FICTIONAL-MAINTAINER';
  meta.data.repositoryOwner.sponsorsListing.slug = 'FICTIONAL-MAINTAINER';
  const result = await fixture([meta, page()]).run();
  assert.equal(result.snapshot.profile.state, 'present');
});

test('valid listing absence is distinct from a null or unreadable lookup', async () => {
  const meta = metadata();
  meta.data.repositoryOwner.hasSponsorsListing = false;
  meta.data.repositoryOwner.sponsorsListing = null;
  const f = fixture([meta]);
  const result = await f.run();
  assert.deepEqual(result.snapshot.profile, { state: 'absent' });
  assert.equal(f.calls.length, 1);
  for (const body of [{ data: { repositoryOwner: null } }, { data: {} }, { data: { repositoryOwner: {} } }]) {
    const result = await fixture([body]).run();
    assert.equal(result.snapshot.profile.state, 'unavailable');
    assert.equal(result.snapshot.tiers.state, 'unavailable');
  }
});

test('public mode gates content on metadata visibility and listing identity', async () => {
  for (const fields of [{ isPublic: false }, { isPublic: null }, { slug: 'other' }, { id: null },
    { url: 'https://evil.test/fictional-maintainer' }, { url: 'https://github.com/sponsors/fictional-maintainer?token=secret' }]) {
    const meta = metadata();
    Object.assign(meta.data.repositoryOwner.sponsorsListing, fields);
    const f = fixture([meta]);
    const result = await f.run();
    assert.equal(result.snapshot.profile.state, 'unavailable');
    assert.equal(f.calls.length, 1);
  }
  const meta = metadata();
  meta.data.repositoryOwner.login = 'other';
  assert.ok(codes(await fixture([meta]).run()).includes('invalid_metadata'));
});

test('identity and visibility are checked again on each content page', async () => {
  for (const fields of [{ id: 'other-listing' }, { slug: 'other' }, { isPublic: false }, { url: 'https://evil.test/' }]) {
    const first = page([sourceTier()], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'cursor-1' } });
    const last = page([sourceTier('tier-2')], { totalCount: 2 });
    Object.assign(last.data.node, fields);
    const f = fixture([metadata(), first, last]);
    const result = await f.run();
    assert.equal(result.snapshot.tiers.state, 'partial');
    assert.equal(result.snapshot.tiers.items.length, 1);
    assert.equal(result.snapshot.profile.isPublic, true);
    assert.equal(f.calls.length, 3);
  }
});

test('paginates by opaque cursor with stable totals and complete visible coverage', async () => {
  const f = fixture([metadata(), page([sourceTier()], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'opaque+/==' } }),
    page([sourceTier('tier-2')], { totalCount: 2, pageInfo: { hasNextPage: false, endCursor: 'last-cursor' } })]);
  const result = await f.run();
  assert.equal(result.snapshot.tiers.state, 'complete');
  assert.equal(result.snapshot.tiers.pages, 2);
  assert.equal(result.snapshot.tiers.totalCount, 2);
  assert.equal(result.snapshot.tiers.items.length, 2);
  assert.equal(f.calls[2].options.variables.after, 'opaque+/==');
  const empty = await fixture([metadata(), page([])]).run();
  assert.equal(empty.snapshot.tiers.state, 'complete');
  assert.deepEqual(empty.snapshot.tiers.items, []);
});

test('malformed pagination never becomes a complete empty list; valid profile remains useful', async () => {
  for (const fields of [{ pageInfo: null }, { pageInfo: {} }, { pageInfo: { hasNextPage: false } },
    { pageInfo: { hasNextPage: 'false', endCursor: null } }, { pageInfo: { hasNextPage: true, endCursor: null } },
    { pageInfo: { hasNextPage: true, endCursor: 'bad\n' } }, { nodes: null }, { totalCount: undefined },
    { totalCount: -1 }, { totalCount: 0.5 }, { totalCount: 1 }]) {
    const f = fixture([metadata(), page([], fields)]);
    const result = await f.run();
    assert.equal(result.snapshot.tiers.state, 'unavailable');
    assert.equal(result.snapshot.profile.state, 'present');
    assert.equal(f.calls.length, 2);
  }
});

test('repeated cursors, duplicate IDs and contradictory totals preserve prior validated pages', async () => {
  for (const last of [
    page([sourceTier('tier-2')], { totalCount: 3, pageInfo: { hasNextPage: true, endCursor: 'cursor-1' } }),
    page([sourceTier()], { totalCount: 2 }),
    page([sourceTier('tier-2')], { totalCount: 3 }),
    page([sourceTier('tier-2')], { totalCount: 1 }),
    page([sourceTier('tier-2')], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'cursor-2' } }),
  ]) {
    const f = fixture([metadata(), page([sourceTier()], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'cursor-1' } }), last]);
    const result = await f.run();
    assert.equal(result.snapshot.tiers.state, 'partial');
    assert.equal(result.snapshot.tiers.pages, 1);
    assert.deepEqual(result.snapshot.tiers.items.map(item => item.id), ['tier-1']);
    assert.equal(result.responses.length, 3);
  }
  const duplicate = await fixture([metadata(), page([sourceTier(), sourceTier()])]).run();
  assert.ok(codes(duplicate).includes('duplicate_tier'));
});

test('six-call and 250-tier limits stop without retries and keep collected tiers', async () => {
  const bodies = [metadata()];
  for (let i = 0; i < 5; i++) bodies.push(page(Array.from({ length: 50 }, (_, j) => sourceTier(`tier-${i * 50 + j}`)),
    { totalCount: 251, pageInfo: { hasNextPage: true, endCursor: `cursor-${i}` } }));
  const f = fixture(bodies);
  const result = await f.run();
  assert.equal(f.calls.length, 6);
  assert.equal(result.snapshot.tiers.items.length, 250);
  assert.equal(result.snapshot.tiers.pages, 5);
  assert.equal(result.snapshot.tiers.state, 'partial');
  assert.ok(codes(result).includes('tier_limit'));
  const tooMany = await fixture([metadata(), page(Array.from({ length: 51 }, (_, j) => sourceTier(`tier-${j}`)))]).run();
  assert.equal(tooMany.snapshot.tiers.state, 'unavailable');
});

test('malformed supported tier/profile fields are refused without disclosing nested data', async () => {
  for (const fields of [{ id: {} }, { name: {} }, { description: null }, { monthlyPriceInCents: -1 },
    { monthlyPriceInCents: 0.1 }, { monthlyPriceInCents: Number.MAX_SAFE_INTEGER + 1 }, { isOneTime: 'false' },
    { isCustomAmount: null }, { updatedAt: 'yesterday' }, { updatedAt: '2026-02-30T12:00:00Z' },
    { updatedAt: '2026-11-12T24:00:00Z' }]) {
    const result = await fixture([metadata(), page([sourceTier('tier-1', fields)])]).run();
    assert.equal(result.snapshot.tiers.state, 'unavailable');
    assert.ok(codes(result).includes('invalid_tier'));
  }
  const body = page();
  body.data.node.fullDescription = { PRIVATE_NESTED: true };
  const result = await fixture([metadata(), body]).run();
  assert.equal(result.snapshot.profile.state, 'unavailable');
  assert.ok(!JSON.stringify(result.snapshot).includes('PRIVATE_NESTED'));
  const badAdmin = await fixture([metadata(), page([sourceTier('tier-1', { adminInfo: { isDraft: true } })])]).run({ visibility: 'viewer' });
  assert.ok(codes(badAdmin).includes('invalid_tier'));
});

test('profile and tier string boundaries match the core review contract', async () => {
  for (const [field, max] of [['name', 4096], ['shortDescription', 4096], ['fullDescription', 65536]]) {
    const accepted = page();
    accepted.data.node[field] = 'x'.repeat(max);
    assert.equal((await fixture([metadata(), accepted]).run()).snapshot.profile[field].length, max);
    accepted.data.node[field] += 'x';
    const rejected = await fixture([metadata(), accepted]).run();
    assert.equal(rejected.snapshot.profile.state, 'unavailable');
    assert.ok(codes(rejected).includes('invalid_profile'));
  }
  for (const [field, max] of [['name', 4096], ['description', 65536]]) {
    const accepted = await fixture([metadata(), page([sourceTier('tier-1', { [field]: 'x'.repeat(max) })])]).run();
    assert.equal(accepted.snapshot.tiers.items[0][field].length, max);
    const rejected = await fixture([metadata(), page([sourceTier('tier-1', { [field]: 'x'.repeat(max + 1) })])]).run();
    assert.ok(codes(rejected).includes('invalid_tier'));
    assert.equal(rejected.snapshot.profile.state, 'present');
  }
});

test('listing/tier IDs are bounded separately from 1024-character cursors', async () => {
  const meta = metadata();
  const first = page([sourceTier('t'.repeat(256))], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'c'.repeat(1024) } });
  const last = page([sourceTier('tier-2')], { totalCount: 2 });
  for (const value of [meta.data.repositoryOwner.sponsorsListing, first.data.node, last.data.node]) value.id = 'i'.repeat(256);
  const f = fixture([meta, first, last]);
  const accepted = await f.run();
  assert.equal(accepted.snapshot.profile.id.length, 256);
  assert.equal(accepted.snapshot.tiers.state, 'complete');
  assert.equal(f.calls[2].options.variables.after.length, 1024);
  const badMeta = metadata();
  badMeta.data.repositoryOwner.sponsorsListing.id = 'i'.repeat(257);
  const rejectedMeta = fixture([badMeta]);
  assert.ok(codes(await rejectedMeta.run()).includes('invalid_listing'));
  assert.equal(rejectedMeta.calls.length, 1);
  assert.ok(codes(await fixture([metadata(), page([sourceTier('t'.repeat(257))])]).run()).includes('invalid_tier'));
  const badCursor = page([sourceTier()], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'c'.repeat(1025) } });
  assert.ok(codes(await fixture([metadata(), badCursor]).run()).includes('invalid_pagination'));
});

test('source text keeps normal Unicode joins while refusing other format, C0 and C1 controls', async () => {
  const joined = 'مثال\u200cمتن 👩\u200d💻\tline\r\nnext';
  const body = page([sourceTier('tier-1', { name: joined, description: joined })]);
  for (const field of ['name', 'shortDescription', 'fullDescription']) body.data.node[field] = joined;
  const accepted = await fixture([metadata(), body]).run();
  assert.equal(accepted.snapshot.profile.fullDescription, joined);
  assert.equal(accepted.snapshot.tiers.items[0].description, joined);
  for (const control of ['\u0000', '\u0008', '\u000b', '\u000c', '\u001f', '\u007f', '\u0085', '\u009f', '\u200b', '\u202e', '\u2066', '\ufeff']) {
    for (const field of ['name', 'shortDescription', 'fullDescription']) {
      const invalid = page();
      invalid.data.node[field] = `before${control}after`;
      assert.ok(codes(await fixture([metadata(), invalid]).run()).includes('invalid_profile'));
    }
    for (const field of ['id', 'name', 'description']) {
      assert.ok(codes(await fixture([metadata(), page([sourceTier('tier-1', { [field]: `before${control}after` })])]).run()).includes('invalid_tier'));
    }
    const meta = metadata();
    meta.data.repositoryOwner.sponsorsListing.id = `before${control}after`;
    assert.ok(codes(await fixture([meta]).run()).includes('invalid_listing'));
  }
});

test('request failures, 401, GraphQL errors and malformed envelopes are safe and retained', async () => {
  for (const response of [null, { data: { private: 'PRIVATE_PROVIDER_DETAIL' } }, { status: 401, body: { private: 'PRIVATE_PROVIDER_DETAIL' } },
    { status: 404, body: {} }, { status: 0, body: null, error: { code: 'credential_failure', message: 'PRIVATE_PROVIDER_DETAIL' } },
    { status: 200, body: { errors: [{ message: 'PRIVATE_PROVIDER_DETAIL' }], data: metadata().data } },
    { status: 200, body: { errors: {}, data: metadata().data } }, { status: 200, body: [] },
    { status: 200, body: metadata(), error: { code: 'PRIVATE_PROVIDER_DETAIL' } }]) {
    let calls = 0;
    const result = await collectSponsorsAccount('fictional-maintainer', { now: () => NOW, request: async () => { calls++; return response; } });
    assert.equal(calls, 1);
    assert.equal(result.responses[0].response, response);
    assert.equal(result.snapshot.profile.state, 'unavailable');
    assert.ok(!JSON.stringify(result.snapshot).includes('PRIVATE_PROVIDER_DETAIL'));
  }
  const f = fixture([metadata(), page([sourceTier()], { totalCount: 2, pageInfo: { hasNextPage: true, endCursor: 'next' } }), new Error('PRIVATE_PROVIDER_DETAIL')]);
  const result = await f.run();
  assert.equal(result.snapshot.tiers.state, 'partial');
  assert.ok(codes(result).includes('request_failed'));
  assert.equal(f.calls.length, 3);
});

test('response and normalized snapshot bounds stop with known data preserved', async () => {
  const f = fixture();
  f.responses[0].padding = 'x'.repeat(1024 * 1024);
  const oversized = await f.run();
  assert.ok(codes(oversized).includes('response_too_large'));
  assert.equal(f.calls.length, 1);
  assert.equal(oversized.responses[0].response, f.responses[0]);
  const big = page(Array.from({ length: 8 }, (_, i) => sourceTier(`tier-big-${i}`, { description: 'x'.repeat(64 * 1024) })), { totalCount: 9 });
  const limited = await fixture([metadata(), page([sourceTier()], { totalCount: 9, pageInfo: { hasNextPage: true, endCursor: 'next' } }), big]).run();
  assert.equal(limited.snapshot.tiers.state, 'partial');
  assert.equal(limited.snapshot.tiers.items.length, 1);
  assert.ok(codes(limited).includes('snapshot_too_large'));
  assert.ok(Buffer.byteLength(JSON.stringify(limited.snapshot)) < 512 * 1024);
});

test('total budget exhaustion and pending injected timeout stop without retries', async () => {
  let clockCalls = 0;
  const f = fixture();
  const result = await f.run({ now: () => Date.parse(NOW) + (clockCalls++ > 1 ? 90_000 : 0) });
  assert.equal(f.calls.length, 1);
  assert.ok(codes(result).includes('budget_exhausted'));
  let calls = 0;
  let seenTimeout;
  clockCalls = 0;
  const pending = await collectSponsorsAccount('fictional-maintainer', {
    now: () => Date.parse(NOW) + (clockCalls++ ? 89_995 : 0),
    request: async (query, options) => { calls++; seenTimeout = options.timeoutMs; return new Promise(() => {}); },
  });
  assert.equal(calls, 1);
  assert.ok(seenTimeout > 0 && seenTimeout <= 5);
  assert.ok(codes(pending).includes('request_timeout'));
});

test('invalid account, scope and clock fail before requests', async () => {
  let calls = 0;
  const request = async () => { calls++; };
  for (const account of ['', 'a'.repeat(40), '-bad', 'bad--name', 'bad/name', 'bad\n', 'https://github.com/example', {}, null]) {
    await assert.rejects(collectSponsorsAccount(account, { request }), { code: 'invalid_account' });
  }
  await assert.rejects(collectSponsorsAccount('example', { request, visibility: 'admin' }), { code: 'invalid_visibility' });
  await assert.rejects(collectSponsorsAccount('example', { request, now: () => 'invalid' }), { code: 'invalid_clock' });
  assert.equal(calls, 0);
});

test('default transport uses JSON stdin with exact fixed host/query and safe failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'itf-account-fake-gh-'));
  const keys = ['PATH', 'ITF_ACCOUNT_TEST_MODE', 'ITF_ACCOUNT_TEST_LOG'];
  const saved = new Map(keys.map(key => [key, process.env[key]]));
  const log = join(dir, 'request.json');
  try {
    await writeFile(join(dir, 'gh'), `#!${process.execPath}
const fs = require('node:fs');
const body = fs.readFileSync(0, 'utf8');
fs.writeFileSync(process.env.ITF_ACCOUNT_TEST_LOG, JSON.stringify({args: process.argv.slice(2), input: JSON.parse(body)}));
const mode = process.env.ITF_ACCOUNT_TEST_MODE;
if (mode === 'auth') { process.stderr.write('authentication PRIVATE_SECRET'); process.exit(1); }
if (mode === 'invalid') { process.stdout.write('PRIVATE_INVALID_ENVELOPE'); process.exit(0); }
if (mode === 'large') { process.stdout.write('x'.repeat(1024 * 1024 + 100)); }
else {
  process.stdout.write('HTTP/2.0 ' + (mode === '401' ? '401 Unauthorized' : '200 OK') + '\\r\\nContent-Type: application/json\\r\\n\\r\\n' + JSON.stringify({fixture: true}));
  if (mode === '401') process.exitCode = 1;
  if (mode === 'hang') setTimeout(() => {}, 10000);
}
`, { mode: 0o700 });
    process.env.PATH = `${dir}:${saved.get('PATH') ?? ''}`;
    process.env.ITF_ACCOUNT_TEST_LOG = log;
    process.env.ITF_ACCOUNT_TEST_MODE = 'ok';
    for (const [query, variables] of [[ACCOUNT_METADATA_QUERY, { account: 'fictional-maintainer' }],
      [PUBLIC_LISTING_QUERY, { id: 'listing-id', after: null }], [VIEWER_LISTING_QUERY, { id: 'listing-id', after: 'opaque+/==' }]]) {
      const result = await requestSponsors(query, { variables });
      assert.equal(result.status, 200);
      assert.deepEqual(result.body, { fixture: true });
      assert.match(result.stdout, /^HTTP\/2\.0 200/);
      assert.deepEqual(JSON.parse(await readFile(log, 'utf8')), {
        args: ['api', '--hostname', 'github.com', '--include', '--method', 'POST', 'graphql', '--input', '-'], input: { query, variables },
      });
    }
    const variables = Object.assign(Object.create({ toJSON: () => ({ account: 'unselected-account' }) }), { account: 'fictional-maintainer' });
    await requestSponsors(ACCOUNT_METADATA_QUERY, { variables });
    assert.deepEqual(JSON.parse(await readFile(log, 'utf8')).input.variables, { account: 'fictional-maintainer' });
    await requestSponsors(PUBLIC_LISTING_QUERY, { variables: { id: 'i'.repeat(256), after: 'c'.repeat(1024) } });
    assert.equal(JSON.parse(await readFile(log, 'utf8')).input.variables.after.length, 1024);
    for (const [mode, code] of [['auth', 'credential_failure'], ['invalid', 'invalid_envelope'], ['large', 'response_too_large'], ['hang', 'request_timeout']]) {
      process.env.ITF_ACCOUNT_TEST_MODE = mode;
      const result = await requestSponsors(ACCOUNT_METADATA_QUERY, { variables: { account: 'fictional-maintainer' }, timeoutMs: mode === 'hang' ? 300 : 15_000 });
      assert.equal(result.error.code, code);
      assert.ok(!JSON.stringify(result.error).includes('PRIVATE'));
      if (mode === 'hang') assert.match(result.stdout, /^HTTP\/2\.0 200/);
      if (mode === 'invalid') assert.equal(result.stdout, 'PRIVATE_INVALID_ENVELOPE');
    }
    process.env.ITF_ACCOUNT_TEST_MODE = '401';
    assert.equal((await requestSponsors(ACCOUNT_METADATA_QUERY, { variables: { account: 'fictional-maintainer' } })).status, 401);
    const before = await readFile(log, 'utf8');
    for (const [query, variables] of [['mutation { bad }', { account: 'fictional-maintainer' }],
      ['https://evil.test', {}], [ACCOUNT_METADATA_QUERY, { account: 'bad/name' }],
      [ACCOUNT_METADATA_QUERY, { account: 'example', extra: true }], [PUBLIC_LISTING_QUERY, { id: 'listing-id', after: undefined }],
      [PUBLIC_LISTING_QUERY, { id: 'listing-id', after: 'bad\n' }], [PUBLIC_LISTING_QUERY, { id: {}, after: null }],
      [PUBLIC_LISTING_QUERY, { id: 'i'.repeat(257), after: null }], [PUBLIC_LISTING_QUERY, { id: 'listing-id', after: 'c'.repeat(1025) }]]) {
      await assert.rejects(requestSponsors(query, { variables }), { code: 'invalid_request' });
    }
    await assert.rejects(requestSponsors(ACCOUNT_METADATA_QUERY, { variables: { account: 'example' }, timeoutMs: 0 }), { code: 'budget_exhausted' });
    assert.equal(await readFile(log, 'utf8'), before);
  } finally {
    for (const [key, value] of saved) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await rm(dir, { recursive: true, force: true });
  }
});
