const VERSION = 'itf.github-sponsors-account/0.1';
const MAX_BYTES = 512 * 1024;
const LOGIN = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);
const MESSAGES = {
  invalid_input: 'Supply bounded ordinary JSON data.',
  size_limit: 'Account input exceeds the supported size or nesting limit.',
  invalid_options: 'Supply a valid account, invocation mode and visibility.',
  invalid_snapshot: 'The account snapshot has an invalid or inconsistent shape.',
  unsupported_version: 'The account snapshot version is unsupported.',
  identity_mismatch: 'The selected account and supplied identities must match.',
  visibility_mismatch: 'Public inspection requires a public-scoped source and public profile.',
  invalid_draft: 'The account draft has an invalid or inconsistent shape.',
  duplicate_tier: 'Tier IDs must be unique within each supplied list.',
};
const DIAGNOSTICS = {
  source_observation: 'The source supplied an additional observation. Inspect the private source record.',
  source_unavailable: 'The account source is unavailable.',
  profile_unavailable: 'The Sponsors profile could not be inspected.',
  tiers_unavailable: 'The Sponsors tiers could not be inspected.',
  pagination_incomplete: 'Only part of the visible tier inventory was inspected.',
  listing_absent: 'The source reports that the account has no Sponsors listing.',
  authentication_required: 'The account source requires existing GitHub authorization.',
  rate_limited: 'The account source was rate limited.',
  request_failed: 'The account source request failed.',
  timeout: 'The account source request exceeded its time limit.',
  response_limit: 'The account source exceeded a response limit.',
  visibility_limited: 'The account source is limited to the selected visible scope.',
};

export class AccountError extends Error {
  constructor(code = 'invalid_input') {
    const safeCode = typeof code === 'string' && Object.hasOwn(MESSAGES, code) ? code : 'invalid_input';
    super(MESSAGES[safeCode]);
    this.name = 'AccountError';
    this.code = safeCode;
  }
}

function fail(code) { throw new AccountError(code); }
function check(condition, code = 'invalid_snapshot') { if (!condition) fail(code); }
function own(value, key) { return Object.hasOwn(value, key); }
function oneOf(value, choices, code) { check(choices.includes(value), code); return value; }

// Inspect descriptors before reading values. Unknown JSON fields are validated but
// never projected; getters, custom prototypes and serialization hooks cannot run.
function jsonData(value) {
  let bytes = 0;
  let nodes = 0;
  const ancestors = new Set();
  function visit(item, depth) {
    if (++nodes > 12000 || depth > 12) fail('size_limit');
    if (item === null || typeof item === 'boolean') bytes += 5;
    else if (typeof item === 'number') {
      check(Number.isFinite(item) && (!Number.isInteger(item) || Number.isSafeInteger(item)), 'invalid_input');
      bytes += 24;
    } else if (typeof item === 'string') bytes += Buffer.byteLength(JSON.stringify(item), 'utf8');
    else {
      check(item && typeof item === 'object', 'invalid_input');
      const array = Array.isArray(item);
      const prototype = Object.getPrototypeOf(item);
      check(array ? prototype === Array.prototype : prototype === Object.prototype || prototype === null, 'invalid_input');
      check(!ancestors.has(item), 'invalid_input');
      ancestors.add(item);
      const keys = Reflect.ownKeys(item);
      if (array) check(item.length <= 1000 && keys.length === item.length + 1, 'invalid_input');
      for (const key of keys) {
        if (array && key === 'length') continue;
        check(typeof key === 'string' && !UNSAFE.has(key), 'invalid_input');
        const descriptor = Object.getOwnPropertyDescriptor(item, key);
        check(descriptor.enumerable && own(descriptor, 'value'), 'invalid_input');
        if (array) check(/^(0|[1-9][0-9]*)$/.test(key) && Number(key) < item.length, 'invalid_input');
        bytes += Buffer.byteLength(JSON.stringify(key), 'utf8') + 2;
        visit(descriptor.value, depth + 1);
      }
      if (array) for (let i = 0; i < item.length; i++) check(own(item, i), 'invalid_input');
      ancestors.delete(item);
      bytes += 2;
    }
    if (bytes > MAX_BYTES) fail('size_limit');
  }
  visit(value, 0);
}

function object(value, code = 'invalid_snapshot') {
  check(value !== null && typeof value === 'object' && !Array.isArray(value), code);
  return value;
}
function text(value, max = 16384, code = 'invalid_snapshot', empty = true) {
  check(typeof value === 'string' && value.length <= max && (empty || value.trim().length > 0)
    // ZWNJ and ZWJ are ordinary shaping characters in language and emoji text.
    // Other format controls, including bidi overrides/isolates, remain refused.
    && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\p{Cf}]/u.test(value.replace(/[\u200c\u200d]/g, '')), code);
  return value;
}
function id(value, code) {
  text(value, 256, code, false);
  check(!/\s/u.test(value), code);
  return value;
}
function account(value, code) {
  check(typeof value === 'string' && LOGIN.test(value), code);
  return value;
}
function sameAccount(value, selected) {
  account(value, 'identity_mismatch');
  check(value.toLowerCase() === selected.toLowerCase(), 'identity_mismatch');
}
function integer(value, max = Number.MAX_SAFE_INTEGER, code = 'invalid_snapshot') {
  check(Number.isSafeInteger(value) && value >= 0 && value <= max, code);
  return value;
}
function timestamp(value) {
  check(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value));
  const time = Date.parse(value);
  check(Number.isFinite(time) && new Date(time).toISOString().slice(0, 19) === value.slice(0, 19));
  return value;
}
function diagnostic(value) {
  text(value, 128);
  const code = own(DIAGNOSTICS, value) ? value : 'source_observation';
  return { code, message: DIAGNOSTICS[code] };
}

function profileData(input, selected, visibility) {
  object(input);
  const state = oneOf(input.state, ['present', 'absent', 'unavailable', 'uninspected']);
  if (state !== 'present') {
    check(Object.keys(input).every(key => ['state', 'code'].includes(key)));
    return { state, ...(own(input, 'code') ? { code: diagnostic(input.code).code } : {}) };
  }
  sameAccount(input.slug, selected);
  check(typeof input.isPublic === 'boolean');
  if (visibility === 'public') check(input.isPublic, 'visibility_mismatch');
  check(typeof input.url === 'string' && /^https:\/\/github\.com\/sponsors\/[a-z0-9-]+$/i.test(input.url));
  sameAccount(input.url.slice(input.url.lastIndexOf('/') + 1), selected);
  const output = { state, id: id(input.id), slug: input.slug, url: input.url, isPublic: input.isPublic };
  for (const field of ['name', 'shortDescription', 'fullDescription']) {
    output[field] = input[field] === null ? null : text(input[field], field === 'fullDescription' ? 65536 : 4096);
  }
  return output;
}

function tierData(input, visibility) {
  object(input);
  const output = {
    id: id(input.id), name: text(input.name, 4096), description: text(input.description, 65536),
    amountInCents: integer(input.amountInCents), currency: oneOf(input.currency, ['USD']),
    cadence: oneOf(input.cadence, ['monthly', 'one_time']),
    isCustomAmount: input.isCustomAmount, updatedAt: timestamp(input.updatedAt),
    status: oneOf(input.status, ['published', 'draft', 'retired', 'unknown']),
    statusBasis: oneOf(input.statusBasis, ['published_query', 'admin_info', 'unknown']),
  };
  check(typeof output.isCustomAmount === 'boolean');
  if (output.statusBasis === 'published_query') check(output.status === 'published' && visibility === 'published_only');
  else if (output.statusBasis === 'admin_info') check(output.status !== 'unknown' && visibility === 'viewer_visible');
  else check(output.status === 'unknown');
  if (visibility === 'published_only') check(output.status === 'published' && output.statusBasis === 'published_query');
  return output;
}

function tiersData(input, visibility, profile) {
  object(input);
  const state = oneOf(input.state, ['complete', 'partial', 'unavailable', 'uninspected']);
  const expected = visibility === 'public' ? 'published_only' : 'viewer_visible';
  check(input.visibility === expected);
  check(Array.isArray(input.items) && input.items.length <= 250);
  const items = input.items.map(item => tierData(item, expected));
  check(new Set(items.map(item => item.id)).size === items.length, 'duplicate_tier');
  if (['unavailable', 'uninspected'].includes(state)) check(items.length === 0);
  if (profile.state === 'absent') check(items.length === 0);
  const output = { state, visibility: expected, items };
  if (own(input, 'totalCount')) {
    output.totalCount = integer(input.totalCount);
    check(output.totalCount >= items.length);
    if (state === 'complete') check(output.totalCount === items.length);
  }
  if (own(input, 'pages')) output.pages = integer(input.pages, 5);
  if (items.length) check(output.pages !== 0);
  // An explicit zero total (or an inspected page) distinguishes an empty
  // inventory from missing pagination metadata in a supplied snapshot.
  if (state === 'complete' && !items.length && profile.state !== 'absent') {
    check(output.totalCount === 0 || output.pages > 0);
  }
  if (own(input, 'code')) output.code = diagnostic(input.code).code;
  return output;
}

const PROFILE_FIELDS = ['shortDescription', 'fullDescription'];
const TIER_FIELDS = ['name', 'description', 'amountInCents', 'currency', 'cadence'];

function draftData(input, selected) {
  object(input, 'invalid_draft');
  sameAccount(input.account, selected);
  const output = { account: input.account };
  if (own(input, 'profile')) {
    object(input.profile, 'invalid_draft');
    output.profile = {};
    for (const field of PROFILE_FIELDS) if (own(input.profile, field)) {
      output.profile[field] = text(input.profile[field], field === 'fullDescription' ? 65536 : 4096, 'invalid_draft');
    }
  }
  if (own(input, 'tiers')) {
    check(Array.isArray(input.tiers) && input.tiers.length <= 250, 'invalid_draft');
    output.tiers = input.tiers.map(item => {
      object(item, 'invalid_draft');
      const tier = {};
      if (own(item, 'id')) tier.id = id(item.id, 'invalid_draft');
      for (const field of ['name', 'description']) if (own(item, field)) {
        tier[field] = text(item[field], field === 'description' ? 65536 : 4096, 'invalid_draft');
      }
      if (own(item, 'amountInCents')) tier.amountInCents = integer(item.amountInCents, Number.MAX_SAFE_INTEGER, 'invalid_draft');
      if (own(item, 'currency')) {
        check(typeof item.currency === 'string' && /^[A-Z]{3}$/.test(item.currency), 'invalid_draft');
        tier.currency = item.currency;
      }
      if (own(item, 'cadence')) tier.cadence = oneOf(item.cadence, ['monthly', 'one_time'], 'invalid_draft');
      return tier;
    });
    const ids = output.tiers.filter(item => own(item, 'id')).map(item => item.id);
    check(new Set(ids).size === ids.length, 'duplicate_tier');
  }
  return output;
}

function declaredChanges(proposal, source, fields) {
  return fields.filter(field => own(proposal, field)).map(field => ({
    field, ...(source ? { before: source[field] } : {}), after: proposal[field],
    // A null source scalar records an unknown baseline, not an empty value.
    state: source && source[field] !== null ? source[field] === proposal[field] ? 'unchanged' : 'changed' : 'not_observed',
  }));
}

function compare(draft, profile, tiers) {
  if (draft === undefined) return { state: 'not_supplied', profileChanges: [], tierChanges: [] };
  const profileChanges = declaredChanges(draft.profile ?? {}, profile.state === 'present' ? profile : null, PROFILE_FIELDS);
  let limited = profileChanges.some(item => item.state === 'not_observed');
  const tierChanges = (draft.tiers ?? []).map(proposal => {
    const source = own(proposal, 'id') ? tiers.items.find(item => item.id === proposal.id) : undefined;
    const changes = declaredChanges(proposal, source, TIER_FIELDS);
    const warnings = [];
    const nonUSD = own(proposal, 'currency') && proposal.currency !== 'USD';
    if (nonUSD) {
      limited = true;
      warnings.push({ code: 'currency_not_comparable', message: 'The supplied currency is not USD. Amounts remain unconverted and are not directly comparable.' });
    }
    if (source?.status === 'published' && changes.some(item => ['amountInCents', 'currency'].includes(item.field) && item.state === 'changed')) {
      warnings.push({ code: 'published_price_immutable', message: 'A published tier price is immutable. A price change requires retiring the tier and creating a new tier; existing sponsors can remain on the retired tier.' });
    }
    const state = source ? 'observed' : own(proposal, 'id') ? 'not_observed' : 'new_proposal';
    if (state === 'not_observed') limited = true;
    return {
      ...(own(proposal, 'id') ? { id: proposal.id } : {}), state, changes,
      ...(source ? { sourceStatus: source.status } : {}),
      sourceState: tiers.state, sourceVisibility: tiers.visibility,
      priceComparison: nonUSD ? 'not_directly_comparable' : source ? 'USD_unconverted' : 'not_observed', warnings,
    };
  });
  return { state: limited ? 'limited' : 'compared', profileChanges, tierChanges };
}

export function reviewAccount(snapshot, draft = undefined, options = undefined) {
  jsonData(snapshot);
  if (draft !== undefined) jsonData(draft);
  jsonData(options);
  object(options, 'invalid_options');
  const selected = account(options.account, 'invalid_options');
  const visibility = oneOf(options.visibility, ['public', 'viewer'], 'invalid_options');
  const mode = oneOf(options.mode, ['local', 'remote'], 'invalid_options');
  if (own(options, 'sourceDigest')) {
    check(typeof options.sourceDigest === 'string' && /^(?:sha256:)?[a-f0-9]{64}$/i.test(options.sourceDigest), 'invalid_options');
  }
  object(snapshot);
  check(snapshot.version === VERSION, 'unsupported_version');
  sameAccount(snapshot.account, selected);
  oneOf(snapshot.mode, ['local', 'remote']);
  const sourceVisibility = oneOf(snapshot.visibility, ['public', 'viewer']);
  if (visibility === 'public') check(sourceVisibility === 'public', 'visibility_mismatch');
  const observedAt = timestamp(snapshot.observedAt);
  oneOf(snapshot.accountType, ['User', 'Organization', null]);
  const profile = profileData(snapshot.profile, selected, sourceVisibility);
  const tiers = tiersData(snapshot.tiers, sourceVisibility, profile);
  check(Array.isArray(snapshot.observations) && snapshot.observations.length <= 64);
  const observations = snapshot.observations.map(item => {
    object(item);
    text(item.message, 4096);
    return diagnostic(item.code);
  });
  const supplied = draft === undefined ? undefined : draftData(draft, selected);
  const comparison = compare(supplied, profile, tiers);
  const profileUnknown = profile.state === 'present'
    && ['name', ...PROFILE_FIELDS].some(field => profile[field] === null);
  const scopeLimited = sourceVisibility !== visibility || profile.state !== 'present' || profileUnknown || tiers.state !== 'complete';
  if (comparison.state === 'compared' && scopeLimited) comparison.state = 'limited';
  const limitations = [
    'Ready means inspection within the recorded visible scope, not Sponsors eligibility or publication approval.',
    'Tier coverage is source-scoped. Missing tiers do not establish removal or a complete private inventory.',
    'Profile and tiers are observations over time, not an atomically pinned account revision.',
    'Tier amounts are individual USD prices. They do not establish income, payouts or financial-plan changes.',
  ];
  if (mode === 'local') limitations.push('The supplied local snapshot retains its original observation time and scope. This invocation made no fresh remote read.');
  if (sourceVisibility !== visibility) limitations.push('The supplied public source cannot establish viewer-visible coverage.');
  if (profile.state !== 'present') limitations.push('The Sponsors profile was not observed as present; profile proposals have no observed baseline.');
  if (profileUnknown) limitations.push('Null profile fields have unknown values; proposals for those fields have no observed baseline.');
  if (tiers.state !== 'complete') limitations.push('The visible tier inventory is incomplete or uninspected.');
  return {
    status: scopeLimited || observations.length > 0 || comparison.state === 'limited' ? 'limited' : 'ready',
    scope: { account: selected, mode, sourceMode: snapshot.mode, observedAt,
      visibility: sourceVisibility, requestedVisibility: visibility, accountType: snapshot.accountType,
      ...(own(options, 'sourceDigest') ? { sourceDigest: options.sourceDigest } : {}) },
    profile, tiers, observations, comparison, limitations, publication: 'not_authorised',
  };
}
