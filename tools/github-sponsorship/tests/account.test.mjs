import assert from 'node:assert/strict';
import test from 'node:test';
import { AccountError, reviewAccount } from '../account.mjs';

const options = { account: 'example-maintainer', visibility: 'public', mode: 'local' };
const tier = (extra = {}) => ({
  id: 'tier-1', name: 'Support', description: 'Example terms', amountInCents: 505,
  currency: 'USD', cadence: 'monthly', isCustomAmount: false,
  updatedAt: '2026-11-11T00:00:00Z', status: 'published', statusBasis: 'published_query', ...extra,
});
const snapshot = (extra = {}) => ({
  version: 'itf.github-sponsors-account/0.1', account: 'example-maintainer', mode: 'remote',
  observedAt: '2026-11-12T00:00:00Z', visibility: 'public', accountType: 'User',
  profile: { state: 'present', id: 'listing-1', slug: 'example-maintainer',
    url: 'https://github.com/sponsors/example-maintainer', isPublic: true,
    name: 'Example maintainer', shortDescription: 'Example work', fullDescription: 'Introduction\nNext paragraph' },
  tiers: { state: 'complete', visibility: 'published_only', items: [tier()], totalCount: 1, pages: 1 },
  observations: [], ...extra,
});
const draft = (extra = {}) => ({ account: 'EXAMPLE-maintainer', ...extra });
const review = (input = snapshot(), proposal, opts = options) => reviewAccount(input, proposal, opts);
function rejects(fn, code) {
  assert.throws(fn, error => error instanceof AccountError && (!code || error.code === code));
}

test('complete public snapshot is source-scoped ready, with exact USD cents and no mutation proposal', () => {
  const report = review();
  assert.equal(report.status, 'ready');
  assert.equal(report.publication, 'not_authorised');
  assert.equal(report.tiers.items[0].amountInCents, 505);
  assert.equal(report.tiers.items[0].currency, 'USD');
  assert.equal(report.comparison.state, 'not_supplied');
  assert.deepEqual(report.comparison.tierChanges, []);
  for (const field of ['candidate', 'mutations', 'income', 'totals', 'sponsors', 'payouts']) assert.equal(Object.hasOwn(report, field), false);
});

test('invocation mode wins over original source mode while observation time and scope stay intact', () => {
  const input = snapshot();
  const report = review(input, undefined, { ...options, sourceDigest: 'a'.repeat(64) });
  assert.equal(report.scope.mode, 'local');
  assert.equal(report.scope.sourceMode, 'remote');
  assert.equal(report.scope.observedAt, input.observedAt);
  assert.equal(report.scope.sourceDigest, 'a'.repeat(64));
  assert.match(report.limitations.join(' '), /no fresh remote read/);
  assert.equal(review(snapshot({ mode: 'local' }), undefined, { ...options, mode: 'remote' }).scope.mode, 'remote');
});

test('identity comparisons ignore case for account, listing slug, URL and draft', () => {
  const input = snapshot({ account: 'EXAMPLE-MAINTAINER', accountType: 'Organization' });
  input.profile.slug = 'Example-Maintainer';
  input.profile.url = 'https://github.com/sponsors/EXAMPLE-maintainer';
  assert.equal(review(input, draft()).status, 'ready');
  for (const mutate of [s => { s.account = 'another'; }, s => { s.profile.slug = 'another'; },
    s => { s.profile.url = 'https://github.com/sponsors/another'; }]) {
    const source = snapshot(); mutate(source);
    rejects(() => review(source), 'identity_mismatch');
  }
  rejects(() => review(snapshot(), { account: 'another' }), 'identity_mismatch');
});

test('public requests reject private content and viewer snapshots before projection', () => {
  const input = snapshot(); input.profile.isPublic = false;
  rejects(() => review(input), 'visibility_mismatch');
  rejects(() => review(snapshot({ visibility: 'viewer' })), 'visibility_mismatch');
});

test('viewer scope retains explicit statuses and hidden status stays unknown', () => {
  const input = snapshot({ visibility: 'viewer' });
  input.profile.isPublic = false;
  input.tiers = { state: 'complete', visibility: 'viewer_visible', pages: 1, totalCount: 4,
    items: ['published', 'draft', 'retired', 'unknown'].map((status, index) => tier({ id: `tier-${index}`, status,
      statusBasis: status === 'unknown' ? 'unknown' : 'admin_info', cadence: index === 3 ? 'one_time' : 'monthly' })) };
  const report = review(input, undefined, { ...options, visibility: 'viewer' });
  assert.equal(report.status, 'ready');
  assert.deepEqual(report.tiers.items.map(item => item.status), ['published', 'draft', 'retired', 'unknown']);
  assert.equal(report.tiers.items[3].cadence, 'one_time');
});

test('requesting viewer scope never upgrades a public-only source', () => {
  const report = review(snapshot(), draft(), { ...options, visibility: 'viewer' });
  assert.equal(report.status, 'limited');
  assert.equal(report.scope.visibility, 'public');
  assert.equal(report.scope.requestedVisibility, 'viewer');
  assert.equal(report.tiers.visibility, 'published_only');
  assert.equal(report.comparison.state, 'limited');
  const invalid = snapshot(); invalid.profile.isPublic = false;
  rejects(() => review(invalid, undefined, { ...options, visibility: 'viewer' }), 'visibility_mismatch');
});

for (const state of ['partial', 'unavailable', 'uninspected']) {
  test(`${state} tiers remain useful but visibly limited`, () => {
    const input = snapshot();
    input.tiers = { state, visibility: 'published_only', items: state === 'partial' ? [tier()] : [] };
    const report = review(input, draft({ tiers: [{ id: 'unknown-id', name: 'Proposal' }] }));
    assert.equal(report.status, 'limited');
    assert.equal(report.comparison.state, 'limited');
    assert.equal(report.comparison.tierChanges[0].state, 'not_observed');
    assert.equal(report.comparison.tierChanges[0].sourceState, state);
    assert.equal(Object.hasOwn(report.comparison.tierChanges[0].changes[0], 'before'), false);
  });
}

for (const state of ['absent', 'unavailable', 'uninspected']) {
  test(`${state} profile has no manufactured baseline`, () => {
    const input = snapshot({ profile: { state }, tiers: { state: 'unavailable', visibility: 'published_only', items: [] } });
    const report = review(input, draft({ profile: { shortDescription: 'Proposal' } }));
    assert.deepEqual(report.profile, { state });
    assert.equal(report.status, 'limited');
    assert.deepEqual(report.comparison.profileChanges, [{ field: 'shortDescription', after: 'Proposal', state: 'not_observed' }]);
  });
}

test('only declared fields compare and omitted tiers never become removals', () => {
  const report = review(snapshot(), draft({ profile: { shortDescription: 'New introduction' }, tiers: [] }));
  assert.deepEqual(report.comparison.profileChanges, [{ field: 'shortDescription', before: 'Example work', after: 'New introduction', state: 'changed' }]);
  assert.deepEqual(report.comparison.tierChanges, []);
  assert.equal(review(snapshot(), draft()).comparison.state, 'compared');
});

test('null profile fields remain unknown baselines and limit both inspection and comparison', () => {
  for (const field of ['name', 'shortDescription', 'fullDescription']) {
    const input = snapshot(); input.profile[field] = null;
    const inspected = review(input);
    assert.equal(inspected.profile[field], null);
    assert.equal(inspected.status, 'limited');
    assert.equal(inspected.comparison.state, 'not_supplied');
    assert.match(inspected.limitations.join(' '), /Null profile fields have unknown values/);
    const proposedField = field === 'name' ? 'shortDescription' : field;
    const report = review(input, draft({ profile: { [proposedField]: '' } }));
    assert.equal(report.status, 'limited');
    assert.equal(report.comparison.state, 'limited');
    if (field !== 'name') assert.deepEqual(report.comparison.profileChanges, [{
      field, before: null, after: '', state: 'not_observed',
    }]);
  }
  const input = snapshot(); input.profile.shortDescription = '';
  assert.equal(review(input, draft({ profile: { shortDescription: 'Proposal' } })).comparison.profileChanges[0].state, 'changed');
});

test('profile and tier text supports emoji joiners and Persian non-joiners while refusing bidi and controls', () => {
  const joined = '👩\u200d💻 می\u200cنویسم';
  const input = snapshot();
  for (const field of ['name', 'shortDescription', 'fullDescription']) input.profile[field] = joined;
  input.tiers.items[0].name = joined; input.tiers.items[0].description = joined;
  const report = review(input, draft({ profile: { shortDescription: joined }, tiers: [{ id: 'tier-1', description: joined }] }));
  assert.equal(report.status, 'ready');
  assert.equal(report.profile.shortDescription, joined);
  assert.equal(report.tiers.items[0].description, joined);
  assert.equal(report.comparison.profileChanges[0].state, 'unchanged');
  assert.equal(report.comparison.tierChanges[0].changes[0].state, 'unchanged');
  for (const control of ['\u0000', '\u0007', '\u007f', '\u061c', '\u200e', '\u202e', '\u2066', '\ufeff']) {
    const invalid = snapshot(); invalid.profile.fullDescription = `${joined}${control}`;
    rejects(() => review(invalid));
    rejects(() => review(snapshot(), draft({ profile: { fullDescription: `${joined}${control}` } })), 'invalid_draft');
  }
});

test('tier IDs bind comparisons; names never imply a match or a removal', () => {
  const report = review(snapshot(), draft({ tiers: [{ name: 'Support', amountInCents: 500 }, { id: 'missing', name: 'Support' }] }));
  assert.equal(report.comparison.tierChanges[0].state, 'new_proposal');
  assert.equal(report.comparison.tierChanges[1].state, 'not_observed');
  assert.equal(report.comparison.tierChanges[1].sourceVisibility, 'published_only');
  assert.ok(report.comparison.tierChanges.every(item => item.changes.every(change => !Object.hasOwn(change, 'before'))));
});

test('published changed prices warn about retirement; unchanged prices and nonpublished tiers do not', () => {
  const change = amountInCents => review(snapshot(), draft({ tiers: [{ id: 'tier-1', amountInCents }] })).comparison.tierChanges[0];
  assert.equal(change(600).warnings[0].code, 'published_price_immutable');
  assert.equal(change(505).warnings.length, 0);
  for (const status of ['draft', 'retired', 'unknown']) {
    const input = snapshot({ visibility: 'viewer' });
    input.tiers.visibility = 'viewer_visible';
    input.tiers.items = [tier({ status, statusBasis: status === 'unknown' ? 'unknown' : 'admin_info' })];
    const report = review(input, draft({ tiers: [{ id: 'tier-1', amountInCents: 600 }] }), { ...options, visibility: 'viewer' });
    assert.deepEqual(report.comparison.tierChanges[0].warnings, []);
  }
});

test('non-USD proposals stay unconverted and cadence changes preserve supplied scalars', () => {
  const report = review(snapshot(), draft({ tiers: [{ id: 'tier-1', amountInCents: 600, currency: 'EUR', cadence: 'one_time' }] }));
  const comparison = report.comparison.tierChanges[0];
  assert.equal(report.comparison.state, 'limited');
  assert.equal(comparison.priceComparison, 'not_directly_comparable');
  assert.ok(comparison.warnings.some(item => item.code === 'currency_not_comparable'));
  assert.deepEqual(comparison.changes.find(item => item.field === 'amountInCents'), { field: 'amountInCents', before: 505, after: 600, state: 'changed' });
  assert.deepEqual(comparison.changes.find(item => item.field === 'cadence'), { field: 'cadence', before: 'monthly', after: 'one_time', state: 'changed' });
});

test('safe projection excludes unknown fields and provider diagnostic text', () => {
  const input = snapshot({ unexpected: { secret: 'DO-NOT-PROJECT' }, observations: [{ code: 'invented', message: 'DO-NOT-PROJECT', raw: { secret: 'DO-NOT-PROJECT' } }] });
  input.profile.extra = { secret: 'DO-NOT-PROJECT' };
  input.tiers.items[0].adminInfo = { isDraft: true, private: 'DO-NOT-PROJECT' };
  input.tiers.items[0].sponsors = ['DO-NOT-PROJECT'];
  const report = review(input, draft({ profile: { extra: 'DO-NOT-PROJECT' }, tiers: [{ id: 'tier-1', extra: { secret: 'DO-NOT-PROJECT' } }] }));
  assert.equal(JSON.stringify(report).includes('DO-NOT-PROJECT'), false);
  assert.deepEqual(report.observations, [{ code: 'source_observation', message: 'The source supplied an additional observation. Inspect the private source record.' }]);
  assert.equal(report.status, 'limited');
});

test('known diagnostic codes also use fixed messages and non-present profiles contain only safe state/code', () => {
  const input = snapshot({ profile: { state: 'unavailable', code: 'profile_unavailable' }, observations: [{ code: 'timeout', message: 'private-provider-message' }] });
  input.tiers = { state: 'unavailable', visibility: 'published_only', items: [] };
  const report = review(input);
  assert.equal(report.profile.code, 'profile_unavailable');
  assert.equal(report.observations[0].message, 'The account source request exceeded its time limit.');
  input.profile.raw = 'forbidden';
  rejects(() => review(input));
});

test('malformed snapshots, identities, timestamps and source shapes fail with fixed safe errors', () => {
  for (const mutate of [
    s => { s.version = 'wrong'; }, s => { s.account = 'bad--name'; }, s => { s.mode = 'invented'; },
    s => { s.accountType = 'Bot'; }, s => { s.observedAt = '2026-02-30T00:00:00Z'; },
    s => { s.observedAt = '2026-11-12'; }, s => { s.profile = null; }, s => { s.profile.name = 42; },
    s => { s.profile.url += '?token=private'; }, s => { s.profile.state = 'invented'; },
    s => { s.tiers.items = null; }, s => { s.observations = {}; }, s => { s.observations = [{ code: 'x', message: {} }]; },
    s => { s.tiers.state = 'invented'; }, s => { s.tiers.pages = -1; }, s => { s.tiers.pages = 6; },
    s => { s.tiers.totalCount = 0; }, s => { s.tiers.totalCount = 2; }, s => { s.tiers.pages = 0; },
    s => { s.tiers.items[0].amountInCents = Number.MAX_SAFE_INTEGER + 1; },
    s => { s.tiers.items[0].amountInCents = -1; }, s => { s.tiers.items[0].amountInCents = 1.5; },
    s => { s.tiers.items[0].currency = 'EUR'; }, s => { s.tiers.items[0].cadence = 'weekly'; },
    s => { s.tiers.items[0].isCustomAmount = 'false'; }, s => { s.tiers.items[0].status = 'draft'; },
    s => { s.tiers.items[0].statusBasis = 'unknown'; }, s => { s.tiers.visibility = 'viewer_visible'; },
    s => { s.tiers.state = 'unavailable'; }, s => { s.tiers.items.push(tier()); },
  ]) {
    const input = snapshot(); mutate(input);
    rejects(() => review(input));
  }
  rejects(() => review(snapshot(), undefined, { ...options, sourceDigest: 'secret' }), 'invalid_options');
  rejects(() => review(snapshot(), undefined, { ...options, visibility: 'other' }), 'invalid_options');
  const error = new AccountError('untrusted-provider-text');
  assert.equal(error.code, 'invalid_input');
  assert.equal(error.message, 'Supply bounded ordinary JSON data.');
});

test('empty complete inventories need explicit inspected evidence', () => {
  const input = snapshot();
  input.tiers = { state: 'complete', visibility: 'published_only', items: [] };
  rejects(() => review(input));
  input.tiers.totalCount = 0;
  assert.equal(review(input).tiers.state, 'complete');
  delete input.tiers.totalCount;
  input.tiers.pages = 1;
  assert.equal(review(input).tiers.state, 'complete');
});

test('malformed and duplicate draft values are refused', () => {
  for (const proposal of [null, {}, draft({ profile: null }), draft({ profile: { shortDescription: 5 } }),
    draft({ tiers: {} }), draft({ tiers: [null] }), draft({ tiers: [{ id: 5 }] }),
    draft({ tiers: [{ name: false }] }), draft({ tiers: [{ amountInCents: -1 }] }),
    draft({ tiers: [{ currency: 'usd' }] }), draft({ tiers: [{ currency: 'US' }] }),
    draft({ tiers: [{ cadence: 'weekly' }] }), draft({ tiers: [{ id: 'same' }, { id: 'same' }] }),
  ]) rejects(() => review(snapshot(), proposal));
});

test('status provenance must agree with visible scope and tier status', () => {
  for (const [status, statusBasis] of [['unknown', 'admin_info'], ['draft', 'unknown'],
    ['retired', 'published_query'], ['published', 'published_query']]) {
    const input = snapshot({ visibility: 'viewer' });
    input.tiers.visibility = 'viewer_visible';
    input.tiers.items = [tier({ status, statusBasis })];
    rejects(() => review(input, undefined, { ...options, visibility: 'viewer' }));
  }
});

test('nullable profile text, custom amount tiers, prefixed digests and maximum inventory retain fidelity', () => {
  const input = snapshot({ accountType: null });
  input.profile.name = null; input.profile.shortDescription = null; input.profile.fullDescription = null;
  input.tiers.items = Array.from({ length: 250 }, (_, i) => tier({ id: `tier-${i}`, isCustomAmount: true, amountInCents: i }));
  input.tiers.pages = 5; input.tiers.totalCount = 250;
  const report = review(input, draft({ profile: { shortDescription: '' } }), { ...options, sourceDigest: `sha256:${'b'.repeat(64)}` });
  assert.equal(report.tiers.items.length, 250);
  assert.equal(report.tiers.items[0].isCustomAmount, true);
  assert.equal(report.tiers.items[0].amountInCents, 0);
  assert.equal(report.scope.accountType, null);
  assert.equal(report.comparison.profileChanges[0].before, null);
  assert.equal(report.comparison.profileChanges[0].after, '');
  assert.equal(report.comparison.profileChanges[0].state, 'not_observed');
  assert.equal(report.status, 'limited');
});

test('ordinary JSON boundary rejects accessors, symbols, prototypes, sparse/custom arrays and cycles without executing hooks', () => {
  let executions = 0;
  const accessor = { get account() { executions++; throw new Error('unsafe getter'); } };
  const array = [tier()]; array[Symbol.iterator] = () => { executions++; throw new Error('unsafe iterator'); };
  const arrayGetter = [];
  Object.defineProperty(arrayGetter, '0', { enumerable: true, get() { executions++; throw new Error('unsafe getter'); } });
  const cyclic = snapshot(); cyclic.extra = cyclic;
  for (const input of [accessor, Object.create(snapshot()), { ...snapshot(), extra: new Date() },
    { ...snapshot(), extra: { toJSON() { executions++; } } }, { ...snapshot(), [Symbol('x')]: true },
    { ...snapshot(), extra: JSON.parse('{"__proto__":{"polluted":true}}') },
    { ...snapshot(), tiers: { ...snapshot().tiers, items: array } },
    { ...snapshot(), tiers: { ...snapshot().tiers, items: arrayGetter } },
    { ...snapshot(), observations: new Array(1) }, cyclic,
    { ...snapshot(), extra: Number.MAX_SAFE_INTEGER + 1 },
  ]) rejects(() => review(input), 'invalid_input');
  assert.equal(executions, 0);
  assert.equal({}.polluted, undefined);
});

test('snapshot size, depth, tier and observation counts are bounded', () => {
  rejects(() => review(snapshot({ extra: 'x'.repeat(512 * 1024) })), 'size_limit');
  let nested = {}; for (let i = 0; i < 15; i++) nested = { nested };
  rejects(() => review(snapshot({ extra: nested })), 'size_limit');
  const input = snapshot(); input.tiers.items = Array.from({ length: 251 }, (_, i) => tier({ id: `tier-${i}` }));
  input.tiers.totalCount = 251;
  rejects(() => review(input));
  rejects(() => review(snapshot({ observations: Array.from({ length: 65 }, () => ({ code: 'timeout', message: 'Timeout' })) })));
});

test('input and draft remain deeply unchanged and report does not retain mutable source references', () => {
  const input = snapshot();
  const proposal = draft({ profile: { fullDescription: 'New description' }, tiers: [{ id: 'tier-1', description: 'New terms' }] });
  const before = structuredClone({ input, proposal, options });
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } };
  freeze(input); freeze(proposal);
  const report = review(input, proposal);
  assert.deepEqual({ input, proposal, options }, before);
  report.profile.name = 'Different'; report.tiers.items[0].name = 'Different';
  assert.equal(input.profile.name, 'Example maintainer');
  assert.equal(input.tiers.items[0].name, 'Support');
});
