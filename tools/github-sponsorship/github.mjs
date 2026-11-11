import { execFile } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';

const MAX_RESPONSE = 1024 * 1024;
const MAX_FILE = 64 * 1024;
const CALL_TIMEOUT = 15_000;
const TOTAL_TIMEOUT = 120_000;
const MAX_CALLS = 12;
const SHA = /^[a-f0-9]{40}$/i;
const CONTROL = /[\x00-\x1f\x7f]/;
const ENCODED_CONTROL = /%(?:0[0-9a-f]|1[0-9a-f]|7f)/i;
export const FUNDING_QUERY = 'query FundingLinks($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { fundingLinks { platform url } } }';

function failure(code, status) {
  const error = new Error(code);
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}

function repositoryParts(repository) {
  if (typeof repository !== 'string') throw failure('invalid_repository');
  const parts = repository.split('/');
  if (parts.length !== 2 || !/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(parts[0]) ||
      parts[0].includes('--') || !/^[a-z0-9_.-]{1,100}$/i.test(parts[1]) ||
      ['.', '..'].includes(parts[1])) throw failure('invalid_repository');
  return parts;
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validSha(value) {
  return typeof value === 'string' && SHA.test(value);
}

function validBranch(branch) {
  return typeof branch === 'string' && branch.length > 0 && branch.length <= 1024 &&
    !/[\x00-\x20\x7f~^:?*\[\\%]/.test(branch) && !branch.includes('..') &&
    !branch.includes('@{') && !branch.includes('//') && !branch.startsWith('/') &&
    !branch.endsWith('/') && !branch.endsWith('.') &&
    branch.split('/').every(part => !part.startsWith('.') && !part.endsWith('.lock'));
}

function validRoute(route, options) {
  if (route === 'graphql') {
    if (options.method !== 'POST' || options.query !== FUNDING_QUERY ||
        !object(options.variables) || Object.keys(options.variables).sort().join(',') !== 'name,owner' ||
        typeof options.variables.owner !== 'string' || typeof options.variables.name !== 'string') return false;
    try { repositoryParts(`${options.variables.owner}/${options.variables.name}`); } catch { return false; }
    return true;
  }
  if (typeof route !== 'string' || (options.method && options.method !== 'GET')) return false;
  const match = /^\/repos\/([^/]+)\/([^/]+)(?:\/(commits|git\/trees|git\/blobs)\/([^/]+))?$/.exec(route);
  if (!match) return false;
  try { repositoryParts(`${match[1]}/${match[2]}`); } catch { return false; }
  if (!match[3]) return true;
  if (match[3] !== 'commits') return validSha(match[4]);
  try {
    const branch = decodeURIComponent(match[4]);
    return validBranch(branch) && encodeURIComponent(branch) === match[4];
  } catch { return false; }
}

/** Existing gh authentication only. Raw stdout belongs in private evidence, not reports. */
export async function requestGithub(route, options = {}) {
  if (!validRoute(route, options)) throw failure('invalid_route');
  const timeout = Math.floor(Math.min(CALL_TIMEOUT, options.timeoutMs ?? CALL_TIMEOUT));
  if (!Number.isFinite(timeout) || timeout <= 0) throw failure('budget_exhausted');
  const args = ['api', '--hostname', 'github.com', '--include', '--method', route === 'graphql' ? 'POST' : 'GET', route];
  if (route === 'graphql') {
    args.push('--raw-field', `query=${FUNDING_QUERY}`, '--raw-field', `owner=${options.variables.owner}`,
      '--raw-field', `name=${options.variables.name}`);
  }
  return new Promise(resolve => {
    execFile('gh', args, { timeout, killSignal: 'SIGKILL', maxBuffer: MAX_RESPONSE, encoding: 'utf8', windowsHide: true }, (error, stdout = '', stderr = '') => {
      // Retain the whole captured envelope before interpreting status or JSON. Never expose stderr.
      const response = { status: 0, body: null, stdout };
      if (error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
        response.error = { code: 'response_too_large' };
        return resolve(response);
      }
      const match = /^HTTP\/\S+ (\d{3})[^\r\n]*\r?\n/.exec(stdout);
      const boundary = /\r?\n\r?\n/.exec(stdout);
      if (match && boundary) {
        response.status = Number(match[1]);
        try { response.body = JSON.parse(stdout.slice(boundary.index + boundary[0].length)); }
        catch { response.error = { code: 'invalid_envelope' }; }
        if (error?.killed) response.error = { code: 'request_timeout' };
        else if (error && response.status === 200) response.error = { code: 'request_failed' };
      } else {
        const code = error?.killed ? 'request_timeout' : error?.code === 'ENOENT' ? 'gh_unavailable' :
          /not logged|authentication|auth login|credentials|GH_TOKEN|GITHUB_TOKEN/i.test(stderr) ? 'credential_failure' : 'invalid_envelope';
        response.error = { code };
      }
      resolve(response);
    });
  });
}

function safeError(error) {
  const codes = new Set(['budget_exhausted', 'request_timeout', 'response_too_large', 'credential_failure',
    'gh_unavailable', 'invalid_envelope', 'invalid_metadata', 'invalid_revision', 'invalid_tree', 'truncated_tree',
    'unsafe_path', 'invalid_blob', 'file_too_large', 'invalid_utf8', 'invalid_funding_links',
    'invalid_blob_hash', 'nonpublic_defaults', 'unknown_defaults_visibility']);
  if (codes.has(error?.code)) return error.code;
  if (Number.isInteger(error?.status) && error.status >= 100 && error.status <= 599) return `http_${error.status}`;
  return 'request_failed';
}

function treeEntries(body, expectedSha) {
  if (!object(body) || !validSha(body.sha) || (expectedSha && body.sha.toLowerCase() !== expectedSha.toLowerCase()) ||
      !Array.isArray(body.tree) || typeof body.truncated !== 'boolean') {
    throw failure('invalid_tree');
  }
  if (body.truncated) throw failure('truncated_tree');
  const seen = new Set();
  for (const entry of body.tree) {
    if (!object(entry) || typeof entry.path !== 'string' || !entry.path || entry.path.length > 1024 ||
        /[/\\]/.test(entry.path) || CONTROL.test(entry.path) || ENCODED_CONTROL.test(entry.path) ||
        ['.', '..'].includes(entry.path) || seen.has(entry.path) || !validSha(entry.sha) ||
        !['blob', 'tree', 'commit'].includes(entry.type) ||
        !['100644', '100755', '040000', '120000', '160000'].includes(entry.mode)) throw failure('invalid_tree');
    seen.add(entry.path);
  }
  return body.tree;
}

function fundingText(body, sha) {
  if (!object(body) || !validSha(body.sha) || body.sha.toLowerCase() !== sha.toLowerCase() || body.encoding !== 'base64' ||
      !Number.isInteger(body.size) || body.size < 0 || typeof body.content !== 'string') throw failure('invalid_blob');
  if (body.size > MAX_FILE) throw failure('file_too_large');
  const encoded = body.content.replace(/\r?\n/g, '');
  if (encoded.length > 4 * Math.ceil(MAX_FILE / 3)) throw failure('file_too_large');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw failure('invalid_blob');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.length > MAX_FILE) throw failure('file_too_large');
  if (bytes.length !== body.size || bytes.toString('base64') !== encoded) throw failure('invalid_blob');
  const actualSha = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  if (actualSha !== sha.toLowerCase()) throw failure('invalid_blob_hash');
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw failure('invalid_utf8'); }
}

function fundingLinks(body) {
  if (!object(body) || ('errors' in body && (!Array.isArray(body.errors) || body.errors.length)) ||
      !object(body.data) || !object(body.data.repository) || !Array.isArray(body.data.repository.fundingLinks)) {
    throw failure('invalid_funding_links');
  }
  return body.data.repository.fundingLinks.map(link => {
    if (!object(link) || typeof link.platform !== 'string' || !/^[A-Z][A-Z0-9_]{0,63}$/.test(link.platform) ||
        typeof link.url !== 'string' || link.url.length > 8192 || /[\s\\]/.test(link.url) ||
        CONTROL.test(link.url) || ENCODED_CONTROL.test(link.url)) throw failure('invalid_funding_links');
    let url;
    try { url = new URL(link.url); } catch { throw failure('invalid_funding_links'); }
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw failure('invalid_funding_links');
    return { platform: link.platform, url: link.url };
  });
}

/** Collect public configuration only; no sponsorship identities, transactions or account writes. */
export async function collectGithub(repository, { request = requestGithub, now = () => Date.now() } = {}) {
  const [owner, name] = repositoryParts(repository);
  const started = new Date(now()).getTime();
  if (!Number.isFinite(started)) throw failure('invalid_clock');
  const realStarted = performance.now();
  const snapshot = {
    repository, mode: 'remote', observedAt: new Date(started).toISOString(), repositoryRevision: null,
    repositoryFunding: { state: 'uninspected' }, accountDefaults: { state: 'uninspected' },
    apiFundingLinks: { state: 'uninspected' }, observations: [],
  };
  const responses = [];
  let calls = 0;
  let stopped = false;
  let selectedVisibility;
  const observe = (scope, error) => snapshot.observations.push({
    code: `${scope}_unavailable`, message: `${scope} unavailable (${safeError(error)}).`,
  });
  async function read(route, options = {}) {
    const elapsed = Math.max(new Date(now()).getTime() - started, performance.now() - realStarted);
    const remaining = TOTAL_TIMEOUT - elapsed;
    if (stopped || calls >= MAX_CALLS || !Number.isFinite(remaining) || remaining <= 0) {
      stopped = true;
      throw failure('budget_exhausted');
    }
    calls++;
    const timeoutMs = Math.floor(Math.min(CALL_TIMEOUT, remaining));
    if (timeoutMs <= 0) { stopped = true; throw failure('budget_exhausted'); }
    let timer;
    let response;
    try {
      // execFile owns the real subprocess timeout and captures its final stdout on termination.
      // Racing that callback would discard its evidence just before the child exits.
      if (request === requestGithub) response = await request(route, { ...options, timeoutMs });
      else response = await Promise.race([
        Promise.resolve().then(() => request(route, { ...options, timeoutMs })),
        new Promise((_, reject) => { timer = setTimeout(() => reject(failure('request_timeout')), timeoutMs); }),
      ]);
    } catch (error) {
      if (['credential_failure', 'budget_exhausted', 'request_timeout'].includes(error?.code) || error?.status === 401) stopped = true;
      throw error;
    } finally { clearTimeout(timer); }
    // Save complete response, including unknown wrapper fields, before any field projection.
    responses.push({ route, options: { ...options, timeoutMs }, response });
    if (object(response) && response.status === 401) stopped = true;
    if (object(response) && ['credential_failure', 'request_timeout', 'response_too_large'].includes(response.error?.code)) stopped = true;
    let size;
    try { size = Buffer.byteLength(JSON.stringify(response)); } catch { throw failure('invalid_envelope'); }
    if (size > MAX_RESPONSE) { stopped = true; throw failure('response_too_large'); }
    if (!object(response) || !Number.isInteger(response.status) || response.status < 100 || response.status > 599) {
      throw failure(safeError(response?.error));
    }
    if (response.status !== 200) throw failure('http_failure', response.status);
    if (response.error) throw failure(safeError(response.error), response.status);
    if (!object(response.body)) throw failure('invalid_envelope');
    return response.body;
  }

  async function source(repo, scope) {
    let revision;
    const path = `${repo}/.github/FUNDING.yml`;
    try {
      const metadata = await read(`/repos/${repo}`);
      if (typeof metadata.full_name !== 'string' || metadata.full_name.toLowerCase() !== repo.toLowerCase() ||
          !validBranch(metadata.default_branch)) throw failure('invalid_metadata');
      if (scope === 'repositoryFunding') selectedVisibility = metadata.private;
      if (scope === 'accountDefaults' && metadata.private !== false) {
        throw failure(metadata.private === true ? 'nonpublic_defaults' : 'unknown_defaults_visibility');
      }
      const commit = await read(`/repos/${repo}/commits/${encodeURIComponent(metadata.default_branch)}`);
      if (!validSha(commit.sha) || !object(commit.commit) || !object(commit.commit.tree) || !validSha(commit.commit.tree.sha)) {
        throw failure('invalid_revision');
      }
      revision = commit.sha;
      if (scope === 'repositoryFunding') snapshot.repositoryRevision = revision;
      const rootSha = commit.commit.tree.sha;
      const root = treeEntries(await read(`/repos/${repo}/git/trees/${rootSha}`), rootSha);
      const directory = root.find(entry => entry.path === '.github');
      if (!directory) return { state: 'absent', revision, path };
      if (directory.type !== 'tree' || directory.mode !== '040000') throw failure('unsafe_path');
      const entries = treeEntries(await read(`/repos/${repo}/git/trees/${directory.sha}`), directory.sha);
      const file = entries.find(entry => entry.path === 'FUNDING.yml');
      if (!file) return { state: 'absent', revision, path };
      if (file.type !== 'blob' || !['100644', '100755'].includes(file.mode)) throw failure('unsafe_path');
      const text = fundingText(await read(`/repos/${repo}/git/blobs/${file.sha}`), file.sha);
      return { state: 'present', text, revision, path };
    } catch (error) {
      observe(scope, error);
      return { state: 'unavailable', ...(revision ? { revision } : {}), path };
    }
  }

  snapshot.repositoryFunding = await source(repository, 'repositoryFunding');
  if (name.toLowerCase() === '.github') {
    if (selectedVisibility === false) snapshot.accountDefaults = { ...snapshot.repositoryFunding };
    else {
      snapshot.accountDefaults = { state: 'unavailable', path: `${repository}/.github/FUNDING.yml` };
      observe('accountDefaults', failure(selectedVisibility === true ? 'nonpublic_defaults' : 'unknown_defaults_visibility'));
    }
  }
  else if (!stopped) snapshot.accountDefaults = await source(`${owner}/.github`, 'accountDefaults');
  if (!stopped) {
    try {
      const body = await read('graphql', { method: 'POST', query: FUNDING_QUERY, variables: { owner, name } });
      snapshot.apiFundingLinks = { state: 'observed', links: fundingLinks(body) };
      snapshot.observations.push({ code: 'configured_links_only', message: 'API funding links describe configuration; the rendered Sponsor button is unverified.' });
    } catch (error) {
      snapshot.apiFundingLinks = { state: 'unavailable' };
      observe('apiFundingLinks', error);
    }
  }
  if (stopped) snapshot.observations.push({ code: 'remote_stopped', message: 'Further remote inspection stopped after an authentication failure or resource limit.' });
  return { snapshot, responses };
}
