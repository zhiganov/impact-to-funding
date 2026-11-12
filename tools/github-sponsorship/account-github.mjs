import { execFile } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const MAX_RESPONSE = 1024 * 1024;
// Leave headroom for the core's conservative JSON accounting (including array keys).
const MAX_SNAPSHOT = 480 * 1024;
const CALL_TIMEOUT = 15_000;
const TOTAL_TIMEOUT = 90_000;
const LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const TOKEN = /^[\x21-\x7e]{1,1024}$/;

export const ACCOUNT_METADATA_QUERY = 'query SponsorsAccount($account: String!) { repositoryOwner(login: $account) { __typename login ... on Sponsorable { hasSponsorsListing sponsorsListing { id slug url isPublic } } } }';
const listingQuery = viewer => `query SponsorsListing($id: ID!, $after: String) { node(id: $id) { ... on SponsorsListing { id slug url isPublic name shortDescription fullDescription tiers(first: 50, after: $after, includeUnpublished: ${viewer ? 'true' : 'false'}) { totalCount nodes { id name description monthlyPriceInCents isOneTime isCustomAmount updatedAt${viewer ? ' adminInfo { isDraft isPublished isRetired }' : ''} } pageInfo { hasNextPage endCursor } } } } }`;
export const PUBLIC_LISTING_QUERY = listingQuery(false);
export const VIEWER_LISTING_QUERY = listingQuery(true);

const SAFE_CODES = new Set(['invalid_envelope', 'invalid_metadata', 'invalid_listing', 'nonpublic_listing',
  'invalid_profile', 'invalid_tier', 'invalid_pagination', 'duplicate_tier', 'contradictory_total',
  'graphql_errors', 'request_failed', 'request_timeout', 'credential_failure', 'gh_unavailable',
  'response_too_large', 'snapshot_too_large', 'budget_exhausted', 'tier_limit']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const login = value => typeof value === 'string' && LOGIN.test(value) && !value.includes('--');
const token = value => typeof value === 'string' && TOKEN.test(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const text = (value, max) => typeof value === 'string' && value.length <= max &&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\p{Cf}]/u.test(value.replace(/[\u200c\u200d]/g, ''));
const id = value => text(value, 256) && value.length > 0 && !/\s/u.test(value);
const same = (a, b) => typeof a === 'string' && a.toLowerCase() === b.toLowerCase();
function failure(code) { return Object.assign(new Error(code), { code }); }
function safeCode(error) { return SAFE_CODES.has(error?.code) ? error.code : 'request_failed'; }
function bytes(value) {
  try { return Buffer.byteLength(JSON.stringify(value)); }
  catch { throw failure('invalid_envelope'); }
}
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value)) return false;
  const time = Date.parse(value);
  const canonical = value.replace(/(?:\.(\d{1,3}))?Z$/, (_, fraction = '') => `.${fraction.padEnd(3, '0')}Z`);
  return Number.isFinite(time) && new Date(time).toISOString() === canonical;
}

function variablesValid(query, variables) {
  if (!object(variables)) return false;
  if (query === ACCOUNT_METADATA_QUERY) return Object.keys(variables).join(',') === 'account' && login(variables.account);
  return [PUBLIC_LISTING_QUERY, VIEWER_LISTING_QUERY].includes(query) &&
    Object.keys(variables).sort().join(',') === 'after,id' && id(variables.id) &&
    (variables.after === null || token(variables.after));
}

/** Uses existing gh authentication. Full stdout is private source evidence. */
export async function requestSponsors(query, { variables, timeoutMs = CALL_TIMEOUT } = {}) {
  if (!variablesValid(query, variables)) throw failure('invalid_request');
  const selectedVariables = query === ACCOUNT_METADATA_QUERY ? { account: variables.account } : { id: variables.id, after: variables.after };
  const timeout = Math.floor(Math.min(CALL_TIMEOUT, timeoutMs));
  if (!Number.isFinite(timeout) || timeout <= 0) throw failure('budget_exhausted');
  return new Promise(resolve => {
    const child = execFile('gh', ['api', '--hostname', 'github.com', '--include', '--method', 'POST', 'graphql', '--input', '-'],
      { timeout, killSignal: 'SIGKILL', maxBuffer: MAX_RESPONSE, encoding: 'utf8', windowsHide: true },
      (error, stdout = '', stderr = '') => {
        const response = { status: 0, body: null, stdout };
        if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') response.error = { code: 'response_too_large' };
        else {
          const status = /^HTTP\/\S+ (\d{3})[^\r\n]*\r?\n/.exec(stdout);
          const boundary = /\r?\n\r?\n/.exec(stdout);
          if (status && boundary) {
            response.status = Number(status[1]);
            try { response.body = JSON.parse(stdout.slice(boundary.index + boundary[0].length)); }
            catch { response.error = { code: 'invalid_envelope' }; }
          } else response.error = { code: 'invalid_envelope' };
          if (error?.killed) response.error = { code: 'request_timeout' };
          else if (error?.code === 'ENOENT') response.error = { code: 'gh_unavailable' };
          else if (error && /not logged|authentication|auth login|credentials|GH_TOKEN|GITHUB_TOKEN/i.test(stderr)) response.error = { code: 'credential_failure' };
          else if (error && response.status === 200) response.error = { code: 'request_failed' };
        }
        resolve(response);
      });
    // An early executable failure can close stdin before the write completes.
    child.stdin.on('error', () => {});
    child.stdin.end(JSON.stringify({ query, variables: selectedVariables }));
  });
}

function listingIdentity(value, account, visibility, expectedId) {
  if (!object(value) || !id(value.id) || (expectedId && value.id !== expectedId) ||
      !login(value.slug) || !same(value.slug, account) || typeof value.isPublic !== 'boolean' ||
      typeof value.url !== 'string' || !/^https:\/\/github\.com\/sponsors\/[a-z0-9-]+$/i.test(value.url) ||
      !same(value.url.slice(value.url.lastIndexOf('/') + 1), account)) throw failure('invalid_listing');
  if (visibility === 'public' && !value.isPublic) throw failure('nonpublic_listing');
}

function profile(value) {
  for (const [key, max] of [['name', 4096], ['shortDescription', 4096], ['fullDescription', 65536]]) {
    if (!text(value[key], max)) throw failure('invalid_profile');
  }
  return { state: 'present', id: value.id, slug: value.slug, url: value.url, isPublic: value.isPublic,
    name: value.name, shortDescription: value.shortDescription, fullDescription: value.fullDescription };
}

function tier(value, visibility) {
  if (!object(value) || !id(value.id) || !text(value.name, 4096) || !text(value.description, 65536) ||
      !integer(value.monthlyPriceInCents) || typeof value.isOneTime !== 'boolean' ||
      typeof value.isCustomAmount !== 'boolean' || !timestamp(value.updatedAt)) throw failure('invalid_tier');
  let status = visibility === 'public' ? 'published' : 'unknown';
  let statusBasis = visibility === 'public' ? 'published_query' : 'unknown';
  if (visibility === 'viewer' && value.adminInfo != null) {
    if (!object(value.adminInfo) || !['isDraft', 'isPublished', 'isRetired'].every(key => typeof value.adminInfo[key] === 'boolean')) throw failure('invalid_tier');
    const flags = [['isDraft', 'draft'], ['isPublished', 'published'], ['isRetired', 'retired']].filter(([key]) => value.adminInfo[key]);
    if (flags.length === 1) { status = flags[0][1]; statusBasis = 'admin_info'; }
  }
  return { id: value.id, name: value.name, description: value.description, amountInCents: value.monthlyPriceInCents,
    currency: 'USD', cadence: value.isOneTime ? 'one_time' : 'monthly', isCustomAmount: value.isCustomAmount,
    updatedAt: value.updatedAt, status, statusBasis };
}

/** Collect listing content and visible tiers only. No financial or sponsor records. */
export async function collectSponsorsAccount(account, { visibility = 'public', request = requestSponsors, now = () => Date.now() } = {}) {
  if (!login(account)) throw failure('invalid_account');
  if (!['public', 'viewer'].includes(visibility)) throw failure('invalid_visibility');
  if (typeof request !== 'function' || typeof now !== 'function') throw failure('invalid_options');
  const started = new Date(now()).getTime();
  if (!Number.isFinite(started)) throw failure('invalid_clock');
  const realStarted = performance.now();
  const snapshot = { version: 'itf.github-sponsors-account/0.1', account, mode: 'remote',
    observedAt: new Date(started).toISOString(), visibility, accountType: null,
    profile: { state: 'uninspected' }, tiers: { state: 'uninspected', visibility: visibility === 'public' ? 'published_only' : 'viewer_visible', items: [] },
    observations: [] };
  const responses = [];
  let calls = 0;
  const observe = code => snapshot.observations.push({ code, message: `Account inspection limited (${code}).` });
  async function read(query, variables) {
    const elapsed = Math.max(new Date(now()).getTime() - started, performance.now() - realStarted);
    const timeoutMs = Math.floor(Math.min(CALL_TIMEOUT, TOTAL_TIMEOUT - elapsed));
    if (++calls > 6 || !Number.isFinite(timeoutMs) || timeoutMs <= 0) throw failure('budget_exhausted');
    let timer;
    let response;
    try {
      // The subprocess callback owns timeout capture, so retain stdout even on termination.
      response = request === requestSponsors ? await request(query, { variables, timeoutMs }) : await Promise.race([
        Promise.resolve().then(() => request(query, { variables, timeoutMs })),
        new Promise((_, reject) => { timer = setTimeout(() => reject(failure('request_timeout')), timeoutMs); }),
      ]);
    } finally { clearTimeout(timer); }
    responses.push({ query, options: { variables: { ...variables }, timeoutMs }, response });
    if (bytes(response) > MAX_RESPONSE) throw failure('response_too_large');
    if (!object(response)) throw failure('invalid_envelope');
    if (response.status === 401) throw failure('credential_failure');
    if (response.error) throw failure(safeCode(response.error));
    if (!integer(response.status) || response.status < 100 || response.status > 599) throw failure('invalid_envelope');
    if (response.status !== 200) throw failure('request_failed');
    const body = response.body;
    if (!object(body)) throw failure('invalid_envelope');
    if ('errors' in body && (!Array.isArray(body.errors) || body.errors.length)) throw failure('graphql_errors');
    if (!object(body.data)) throw failure('invalid_envelope');
    return body.data;
  }

  try {
    const data = await read(ACCOUNT_METADATA_QUERY, { account });
    const owner = data.repositoryOwner;
    if (!object(owner) || !['User', 'Organization'].includes(owner.__typename) || !same(owner.login, account) ||
        typeof owner.hasSponsorsListing !== 'boolean') throw failure('invalid_metadata');
    snapshot.accountType = owner.__typename;
    if (!owner.hasSponsorsListing) {
      if (owner.sponsorsListing != null) throw failure('invalid_metadata');
      snapshot.profile = { state: 'absent' };
      snapshot.tiers.state = 'unavailable';
      return { snapshot, responses };
    }
    listingIdentity(owner.sponsorsListing, account, visibility);
    const id = owner.sponsorsListing.id;
    const cursors = new Set();
    const ids = new Set();
    let after = null;
    let total;
    for (let page = 1; page <= 5; page++) {
      const data = await read(visibility === 'public' ? PUBLIC_LISTING_QUERY : VIEWER_LISTING_QUERY, { id, after });
      const value = data.node;
      listingIdentity(value, account, visibility, id);
      const selectedProfile = profile(value);
      if (bytes({ ...snapshot, profile: selectedProfile }) >= MAX_SNAPSHOT - 1024) throw failure('snapshot_too_large');
      snapshot.profile = selectedProfile;
      const connection = value.tiers;
      if (!object(connection) || !Array.isArray(connection.nodes) || connection.nodes.length > 50 ||
          !integer(connection.totalCount) || !object(connection.pageInfo) ||
          typeof connection.pageInfo.hasNextPage !== 'boolean' ||
          !(connection.pageInfo.endCursor === null || token(connection.pageInfo.endCursor))) throw failure('invalid_pagination');
      const { hasNextPage, endCursor } = connection.pageInfo;
      if ((hasNextPage && (!token(endCursor) || cursors.has(endCursor) || !connection.nodes.length)) ||
          (endCursor !== null && cursors.has(endCursor))) throw failure('invalid_pagination');
      const selectedTiers = connection.nodes.map(value => tier(value, visibility));
      const pageIds = new Set();
      for (const value of selectedTiers) {
        if (ids.has(value.id) || pageIds.has(value.id)) throw failure('duplicate_tier');
        pageIds.add(value.id);
      }
      const count = ids.size + selectedTiers.length;
      if ((total !== undefined && total !== connection.totalCount) || count > connection.totalCount ||
          (!hasNextPage && count !== connection.totalCount) || (hasNextPage && count >= connection.totalCount)) throw failure('contradictory_total');
      if (count > 250) throw failure('tier_limit');
      const nextTiers = { ...snapshot.tiers, state: hasNextPage ? 'partial' : 'complete',
        items: [...snapshot.tiers.items, ...selectedTiers], totalCount: connection.totalCount, pages: page };
      if (bytes({ ...snapshot, profile: selectedProfile, tiers: nextTiers }) >= MAX_SNAPSHOT - 1024) throw failure('snapshot_too_large');
      snapshot.profile = selectedProfile;
      snapshot.tiers = nextTiers;
      for (const value of selectedTiers) ids.add(value.id);
      total = connection.totalCount;
      if (!hasNextPage) break;
      if (endCursor !== null) cursors.add(endCursor);
      after = endCursor;
      if (page === 5) throw failure('tier_limit');
    }
  } catch (error) {
    const code = safeCode(error);
    if (snapshot.profile.state !== 'present') snapshot.profile = { state: 'unavailable', code };
    snapshot.tiers.state = snapshot.tiers.pages ? 'partial' : 'unavailable';
    observe(code);
  }
  return { snapshot, responses };
}
