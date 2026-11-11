import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { collectGithub, requestGithub, FUNDING_QUERY } from '../github.mjs';

const REV = 'a'.repeat(40);
const TREE = 'b'.repeat(40);
const DIR = 'c'.repeat(40);
const blobSha = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const BLOB = blobSha(Buffer.from('github: octo\n'));
const NOW = '2026-11-11T12:00:00.000Z';
const entry = (path, type, mode, sha) => ({ path, type, mode, sha });
const tree = entries => ({ sha: TREE, truncated: false, tree: entries });
const ok = body => ({ status: 200, body, extraEnvelope: { retained: true } });
const graphql = links => ok({ data: { repository: { fundingLinks: links } } });

function fixture({ repository = 'octo/project', text = 'github: octo\n', branch = 'main', defaultsText = 'custom: https://example.org/support\n' } = {}) {
  const owner = repository.split('/')[0];
  const routes = new Map();
  for (const [repo, content] of [[repository, text], [`${owner}/.github`, defaultsText]]) {
    const bytes = Buffer.from(content);
    const sha = blobSha(bytes);
    routes.set(`/repos/${repo}`, ok({ full_name: repo, default_branch: branch, private: false, html_url: 'https://github.com/ignored' }));
    routes.set(`/repos/${repo}/commits/${encodeURIComponent(branch)}`, ok({ sha: REV, commit: { tree: { sha: TREE } } }));
    routes.set(`/repos/${repo}/git/trees/${TREE}`, ok(tree([entry('.github', 'tree', '040000', DIR)])));
    routes.set(`/repos/${repo}/git/trees/${DIR}`, ok({ ...tree([entry('FUNDING.yml', 'blob', '100644', sha)]), sha: DIR }));
    routes.set(`/repos/${repo}/git/blobs/${sha}`, ok({ sha, size: bytes.length, encoding: 'base64', content: bytes.toString('base64') }));
  }
  routes.set('graphql', graphql([{ platform: 'GITHUB', url: `https://github.com/sponsors/${owner}` }]));
  const calls = [];
  const request = async (route, options) => {
    calls.push({ route, options });
    assert.ok(routes.has(route), `Unexpected fixture route: ${route}`);
    const value = routes.get(route);
    if (value instanceof Error) throw value;
    return value;
  };
  return { routes, calls, request, run: options => collectGithub(repository, { request, now: () => NOW, ...options }) };
}

test('pins repository and defaults, preserves full envelopes and exact text with provenance', async () => {
  const f = fixture();
  const result = await f.run();
  assert.equal(result.snapshot.repository, 'octo/project');
  assert.equal(result.snapshot.mode, 'remote');
  assert.equal(result.snapshot.observedAt, NOW);
  assert.equal(result.snapshot.repositoryRevision, REV);
  assert.deepEqual(result.snapshot.repositoryFunding, {
    state: 'present', text: 'github: octo\n', revision: REV, path: 'octo/project/.github/FUNDING.yml',
  });
  assert.equal(result.snapshot.accountDefaults.state, 'present');
  assert.equal(result.snapshot.accountDefaults.path, 'octo/.github/.github/FUNDING.yml');
  assert.equal(result.snapshot.apiFundingLinks.state, 'observed');
  assert.equal(f.calls.length, 11);
  assert.equal(result.responses.length, 11);
  assert.equal(result.responses[0].response, f.routes.get('/repos/octo/project'));
  assert.deepEqual(result.responses[0].response.extraEnvelope, { retained: true });
  assert.ok(result.snapshot.observations.some(item => item.code === 'configured_links_only'));
  for (const call of f.calls) assert.ok(call.options.timeoutMs > 0 && call.options.timeoutMs <= 15_000);
  assert.deepEqual(f.calls.at(-1).options.variables, { owner: 'octo', name: 'project' });
  assert.equal(f.calls.at(-1).options.query, FUNDING_QUERY);
});

test('default branch slash is encoded as one commit ref; all content reads use pinned SHA', async () => {
  const f = fixture({ branch: 'release/stable' });
  await f.run();
  assert.ok(f.calls.some(call => call.route === '/repos/octo/project/commits/release%2Fstable'));
  assert.ok(f.calls.filter(call => call.route.includes('/git/')).every(call => /[a-f0-9]{40}$/.test(call.route)));
  assert.ok(f.calls.some(call => call.route === `/repos/octo/project/git/trees/${TREE}`));
  assert.ok(!f.calls.some(call => call.route === `/repos/octo/project/git/trees/${REV}`));
});

test('each repository pins its own default branch and commit independently', async () => {
  const f = fixture();
  const defaultsRevision = 'e'.repeat(40);
  const defaultsTree = 'f'.repeat(40);
  f.routes.set('/repos/octo/.github', ok({ full_name: 'octo/.github', default_branch: 'defaults/current', private: false }));
  f.routes.set('/repos/octo/.github/commits/defaults%2Fcurrent', ok({ sha: defaultsRevision, commit: { tree: { sha: defaultsTree } } }));
  f.routes.set(`/repos/octo/.github/git/trees/${defaultsTree}`, ok({ ...tree([]), sha: defaultsTree }));
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryRevision, REV);
  assert.equal(snapshot.accountDefaults.revision, defaultsRevision);
  assert.equal(snapshot.accountDefaults.state, 'absent');
  assert.ok(f.calls.some(call => call.route === `/repos/octo/.github/git/trees/${defaultsTree}`));
  assert.ok(!f.calls.some(call => call.route === `/repos/octo/.github/git/trees/${defaultsRevision}`));
  assert.ok(!f.calls.some(call => call.route === `/repos/octo/.github/git/trees/${TREE}`));
});

test('saved provider contract uses exact commit.tree.sha routes instead of commit aliases', async () => {
  // Allowlisted SHA/route facts from the preserved live source-responses.json.
  // Tree entries below are synthetic: this regression makes no claim about live funding absence.
  const contracts = [
    { repository: 'zhiganov/impact-to-funding', revision: '99e34c5b29a81cc02492cf1501b83641aea4d59b',
      rootSha: 'dfb20705bbec5927640e2aa3e849e63f3c1319ad' },
    { repository: 'zhiganov/.github', revision: '863bb240ae531e2542cc19f16da0adf44ca77ccb',
      rootSha: 'b8f56521575397e4d239a08e1b13d1d23a2e45bc' },
  ];
  const f = fixture({ repository: contracts[0].repository });
  for (const contract of contracts) {
    f.routes.set(`/repos/${contract.repository}/commits/main`, ok({ sha: contract.revision, commit: { tree: { sha: contract.rootSha } } }));
    // The saved successful alias responses echoed the commit SHA in body.sha.
    f.routes.set(`/repos/${contract.repository}/git/trees/${contract.revision}`, ok({ sha: contract.revision, truncated: false, tree: [] }));
    f.routes.set(`/repos/${contract.repository}/git/trees/${contract.rootSha}`, ok({ sha: contract.rootSha, truncated: false, tree: [] }));
  }
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryRevision, contracts[0].revision);
  assert.equal(snapshot.repositoryFunding.revision, contracts[0].revision);
  assert.equal(snapshot.accountDefaults.revision, contracts[1].revision);
  assert.equal(snapshot.repositoryFunding.state, 'absent');
  assert.equal(snapshot.accountDefaults.state, 'absent');
  for (const contract of contracts) {
    assert.equal(f.calls.filter(call => call.route === `/repos/${contract.repository}/git/trees/${contract.rootSha}`).length, 1);
    assert.ok(!f.calls.some(call => call.route === `/repos/${contract.repository}/git/trees/${contract.revision}`));
  }
});

test('complete root tree can establish .github absence, retaining pinned provenance', async () => {
  const f = fixture();
  f.routes.set(`/repos/octo/project/git/trees/${TREE}`, ok(tree([])));
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryFunding.state, 'absent');
  assert.equal(snapshot.repositoryFunding.revision, REV);
  assert.equal(f.calls.filter(call => call.route.includes('/repos/octo/project/git/')).length, 1);
});

test('complete child tree establishes missing FUNDING.yml; root FUNDING.yml is not a fallback', async () => {
  const f = fixture();
  f.routes.set(`/repos/octo/project/git/trees/${DIR}`, ok({ ...tree([]), sha: DIR }));
  f.routes.set(`/repos/octo/.github/git/trees/${TREE}`, ok(tree([entry('FUNDING.yml', 'blob', '100644', BLOB)])));
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryFunding.state, 'absent');
  assert.equal(snapshot.accountDefaults.state, 'absent');
});

for (const stage of ['metadata', 'commit', 'root', 'directory', 'blob']) {
  test(`protected 404 at ${stage} is unavailable, never absent, with no retries`, async () => {
    const f = fixture();
    const route = {
      metadata: '/repos/octo/project', commit: '/repos/octo/project/commits/main',
      root: `/repos/octo/project/git/trees/${TREE}`, directory: `/repos/octo/project/git/trees/${DIR}`,
      blob: `/repos/octo/project/git/blobs/${BLOB}`,
    }[stage];
    f.routes.set(route, { status: 404, body: { message: 'Not Found' } });
    const { snapshot } = await f.run();
    assert.equal(snapshot.repositoryFunding.state, 'unavailable');
    assert.match(snapshot.observations[0].message, /http_404/);
    assert.equal(f.calls.filter(call => call.route === route).length, 1);
    assert.equal(snapshot.accountDefaults.state, 'present');
  });
}

test('default repository 404 retains inherited configuration uncertainty', async () => {
  const f = fixture();
  f.routes.set('/repos/octo/.github', { status: 404, body: {} });
  const { snapshot } = await f.run();
  assert.equal(snapshot.accountDefaults.state, 'unavailable');
  assert.equal(snapshot.repositoryFunding.state, 'present');
  assert.equal(snapshot.apiFundingLinks.state, 'observed');
});

for (const location of ['root', 'directory']) {
  test(`truncated ${location} tree cannot establish absence`, async () => {
    const f = fixture();
    const sha = location === 'root' ? TREE : DIR;
    f.routes.set(`/repos/octo/project/git/trees/${sha}`, ok({ ...tree([]), sha: location === 'root' ? TREE : DIR, truncated: true }));
    const { snapshot } = await f.run();
    assert.equal(snapshot.repositoryFunding.state, 'unavailable');
    assert.match(snapshot.observations[0].message, /truncated_tree/);
  });
}

test('malformed wrappers and missing tree completeness are retained but unavailable', async () => {
  for (const response of [{ data: { full_name: 'octo/project' } }, { status: 200, body: [] }, ok({ sha: TREE, tree: [] })]) {
    const f = fixture();
    const route = response.body?.tree ? `/repos/octo/project/git/trees/${TREE}` : '/repos/octo/project';
    f.routes.set(route, response);
    const result = await f.run();
    assert.equal(result.snapshot.repositoryFunding.state, 'unavailable');
    assert.ok(result.responses.some(item => item.response === response));
  }
});

test('unknown metadata, scope mismatch, malicious branch and invalid commit are unavailable', async () => {
  for (const metadata of [{}, { full_name: 'other/project', default_branch: 'main' },
    { full_name: 'octo/project', default_branch: 'https://evil.test/main' },
    { full_name: 'octo/project', default_branch: 'main%0a' },
    { full_name: 'octo/project', default_branch: 'main\n' }]) {
    const f = fixture();
    f.routes.set('/repos/octo/project', ok(metadata));
    const { snapshot } = await f.run();
    assert.equal(snapshot.repositoryFunding.state, 'unavailable');
    assert.equal(snapshot.repositoryRevision, null);
    assert.equal(f.calls.filter(call => call.route.startsWith('/repos/octo/project')).length, 1);
  }
  const f = fixture();
  f.routes.set('/repos/octo/project/commits/main', ok({ sha: 'main' }));
  assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
  const g = fixture();
  g.routes.set('/repos/octo/project/commits/main', ok({ sha: [REV] }));
  assert.equal((await g.run()).snapshot.repositoryFunding.state, 'unavailable');
});

test('child tree identity must match the SHA in its pinned parent tree', async () => {
  const f = fixture();
  f.routes.set(`/repos/octo/project/git/trees/${DIR}`, ok(tree([])));
  assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
});

test('commit tree identity is required and root tree must match it', async () => {
  for (const commit of [{ sha: REV }, { sha: REV, commit: { tree: { sha: [TREE] } } }]) {
    const f = fixture();
    f.routes.set('/repos/octo/project/commits/main', ok(commit));
    assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
  }
  const f = fixture();
  f.routes.set(`/repos/octo/project/git/trees/${TREE}`, ok({ ...tree([]), sha: DIR }));
  assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
});

test('symlinks, submodules and duplicate paths are not traversed', async () => {
  for (const bad of [entry('.github', 'blob', '120000', DIR), entry('.github', 'commit', '160000', DIR)]) {
    const f = fixture();
    f.routes.set(`/repos/octo/project/git/trees/${TREE}`, ok(tree([bad])));
    const { snapshot } = await f.run();
    assert.equal(snapshot.repositoryFunding.state, 'unavailable');
    assert.ok(!f.calls.some(call => call.route === `/repos/octo/project/git/trees/${DIR}`));
  }
  for (const entries of [[entry('FUNDING.yml', 'blob', '120000', BLOB)],
    [entry('FUNDING.yml', 'commit', '160000', BLOB)],
    [entry('FUNDING.yml', 'blob', '100644', BLOB), entry('FUNDING.yml', 'blob', '100644', BLOB)]]) {
    const f = fixture();
    f.routes.set(`/repos/octo/project/git/trees/${DIR}`, ok({ ...tree(entries), sha: DIR }));
    assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
    assert.ok(!f.calls.some(call => call.route === `/repos/octo/project/git/blobs/${BLOB}`));
  }
});

test('UTF-8 decoding is fatal and exact, including BOM, newline and empty-file preservation', async () => {
  for (const text of ['', '\ufeffgithub: octo\r\n', 'custom: https://example.org/é\n']) {
    assert.equal((await fixture({ text }).run()).snapshot.repositoryFunding.text, text);
  }
  const f = fixture();
  const invalidBytes = Buffer.from([0xc3, 0x28]);
  const sha = blobSha(invalidBytes);
  f.routes.set(`/repos/octo/project/git/trees/${DIR}`, ok({ ...tree([entry('FUNDING.yml', 'blob', '100644', sha)]), sha: DIR }));
  f.routes.set(`/repos/octo/project/git/blobs/${sha}`, ok({ sha, encoding: 'base64', size: 2, content: invalidBytes.toString('base64') }));
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryFunding.state, 'unavailable');
  assert.match(snapshot.observations[0].message, /invalid_utf8/);
});

test('decoded file bound is 64KiB and malformed base64, size or blob identity is rejected', async () => {
  assert.equal((await fixture({ text: 'a'.repeat(65536) }).run()).snapshot.repositoryFunding.state, 'present');
  const oversized = await fixture({ text: 'a'.repeat(65537) }).run();
  assert.match(oversized.snapshot.observations[0].message, /file_too_large/);
  for (const fields of [{ content: '####' }, { content: 'YQ==', size: 0 }, { sha: REV }, { encoding: 'utf8' }]) {
    const f = fixture();
    f.routes.set(`/repos/octo/project/git/blobs/${BLOB}`, ok({ sha: BLOB, encoding: 'base64', size: 1, content: 'YQ==', ...fields }));
    assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
  }
  const f = fixture();
  f.routes.set(`/repos/octo/project/git/blobs/${BLOB}`, ok({ sha: BLOB, encoding: 'base64', size: 1, content: 'A'.repeat(500_000) }));
  assert.match((await f.run()).snapshot.observations[0].message, /file_too_large/);
});

test('blob bytes must reproduce the pinned Git blob SHA-1', async () => {
  const f = fixture();
  const bytes = Buffer.from('github: attacker\n');
  f.routes.set(`/repos/octo/project/git/blobs/${BLOB}`, ok({ sha: BLOB, encoding: 'base64', size: bytes.length, content: bytes.toString('base64') }));
  const { snapshot } = await f.run();
  assert.equal(snapshot.repositoryFunding.state, 'unavailable');
  assert.match(snapshot.observations[0].message, /invalid_blob_hash/);
});

test('account defaults require explicit public metadata before commit or content reads', async () => {
  for (const privateValue of [true, undefined, null, 'false']) {
    const f = fixture();
    f.routes.set('/repos/octo/.github', ok({ full_name: 'octo/.github', default_branch: 'main', private: privateValue }));
    const { snapshot } = await f.run();
    assert.equal(snapshot.accountDefaults.state, 'unavailable');
    assert.equal(f.calls.filter(call => call.route.startsWith('/repos/octo/.github')).length, 1);
    assert.equal(snapshot.repositoryFunding.state, 'present');
  }
});

test('selected private/unknown .github content is not reused as effective public defaults', async () => {
  for (const privateValue of [true, undefined]) {
    const f = fixture({ repository: 'octo/.github' });
    f.routes.set('/repos/octo/.github', ok({ full_name: 'octo/.github', default_branch: 'main', private: privateValue }));
    const { snapshot } = await f.run();
    assert.equal(snapshot.repositoryFunding.state, 'present');
    assert.equal(snapshot.accountDefaults.state, 'unavailable');
    assert.equal(f.calls.filter(call => call.route === '/repos/octo/.github').length, 1);
  }
});

test('GraphQL errors, null repositories and malformed link shapes do not become empty observed lists', async () => {
  for (const response of [ok({ errors: [{ message: 'private detail' }], data: { repository: { fundingLinks: [] } } }),
    ok({ data: { repository: null } }), ok({ data: { repository: {} } }),
    graphql([{ platform: 'GITHUB' }]), graphql([{ platform: 'github', url: 'https://example.org' }])]) {
    const f = fixture();
    f.routes.set('graphql', response);
    const { snapshot, responses } = await f.run();
    assert.deepEqual(snapshot.apiFundingLinks, { state: 'unavailable' });
    assert.equal(responses.at(-1).response, response);
    assert.ok(!JSON.stringify(snapshot).includes('private detail'));
  }
  const f = fixture();
  f.routes.set('graphql', graphql([]));
  assert.deepEqual((await f.run()).snapshot.apiFundingLinks, { state: 'observed', links: [] });
});

test('untrusted links and metadata URLs never drive requests', async () => {
  for (const url of ['javascript:alert(1)', 'https://user:password@evil.test', 'https://evil.test/%0a', 'https://evil.test/\n', 'https:\\evil.test']) {
    const f = fixture();
    f.routes.set('/repos/octo/project', ok({ full_name: 'octo/project', default_branch: 'main', url: 'https://evil.test/secrets' }));
    f.routes.set('graphql', graphql([{ platform: 'CUSTOM', url }]));
    assert.equal((await f.run()).snapshot.apiFundingLinks.state, 'unavailable');
    assert.ok(f.calls.every(call => call.route === 'graphql' || call.route.startsWith('/repos/octo/')));
  }
});

test('rejects unsafe repository names before any request', async () => {
  let calls = 0;
  for (const repository of ['octo/repo/extra', 'https://github.com/octo/repo', 'octo/%0a', '-octo/repo', 'octo/..',
    'octo/repo\n', 'octo/$(whoami)', 'octo--bad/repo', 'octo/repo?x=1']) {
    await assert.rejects(collectGithub(repository, { request: async () => { calls++; } }), { code: 'invalid_repository' });
  }
  assert.equal(calls, 0);
});

test('global 401 and credential failures stop subsequent sources immediately', async () => {
  for (const response of [{ status: 401, body: { secretOpaqueKey: 'do not disclose' } },
    { status: 0, body: null, error: { code: 'credential_failure' }, stdout: 'private envelope' },
    Object.assign(new Error('private message'), { code: 'credential_failure' })]) {
    const f = fixture();
    f.routes.set('/repos/octo/project', response);
    const { snapshot } = await f.run();
    assert.equal(f.calls.length, 1);
    assert.equal(snapshot.repositoryFunding.state, 'unavailable');
    assert.equal(snapshot.accountDefaults.state, 'uninspected');
    assert.equal(snapshot.apiFundingLinks.state, 'uninspected');
    assert.ok(!JSON.stringify(snapshot).includes('private'));
    assert.ok(snapshot.observations.some(item => item.code === 'remote_stopped'));
  }
});

test('ordinary request failures have safe diagnostics and no retries', async () => {
  const f = fixture();
  f.routes.set('/repos/octo/project', new Error('https://opaque-credential/private'));
  const { snapshot } = await f.run();
  assert.match(snapshot.observations[0].message, /request_failed/);
  assert.ok(!JSON.stringify(snapshot).includes('opaque-credential'));
  assert.equal(f.calls.filter(call => call.route === '/repos/octo/project').length, 1);
});

test('response size and total time limits stop further remote work', async () => {
  const f = fixture();
  f.routes.set('/repos/octo/project', ok({ padding: 'x'.repeat(1024 * 1024) }));
  assert.equal((await f.run()).snapshot.repositoryFunding.state, 'unavailable');
  assert.equal(f.calls.length, 1);
  const g = fixture();
  let clockCalls = 0;
  const { snapshot } = await g.run({ now: () => Date.parse(NOW) + (clockCalls++ > 1 ? 120_000 : 0) });
  assert.equal(g.calls.length, 1);
  assert.match(snapshot.observations[0].message, /budget_exhausted/);
  assert.equal(snapshot.accountDefaults.state, 'uninspected');
});

test('a pending injected request times out within the remaining total budget', async () => {
  let clockCalls = 0;
  let calls = 0;
  let seenTimeout;
  const { snapshot } = await collectGithub('octo/project', {
    now: () => Date.parse(NOW) + (clockCalls++ ? 119_995 : 0),
    request: async (route, options) => { calls++; seenTimeout = options.timeoutMs; return new Promise(() => {}); },
  });
  assert.ok(seenTimeout > 0 && seenTimeout <= 5);
  assert.equal(calls, 1);
  assert.match(snapshot.observations[0].message, /request_timeout/);
  assert.equal(snapshot.accountDefaults.state, 'uninspected');
});

test('selected owner/.github repository reuses its pinned source instead of fetching twice', async () => {
  const f = fixture({ repository: 'octo/.github' });
  const { snapshot } = await f.run();
  assert.deepEqual(snapshot.accountDefaults, snapshot.repositoryFunding);
  assert.equal(f.calls.length, 6);
});

test('default gh transport uses only fixed host/read methods and retains raw stdout privately', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'itf-fake-gh-'));
  const oldPath = process.env.PATH;
  const oldMode = process.env.ITF_TEST_GH_MODE;
  const oldLog = process.env.ITF_TEST_GH_LOG;
  const log = join(dir, 'args.json');
  try {
    await writeFile(join(dir, 'gh'), `#!${process.execPath}\nimport fs from 'node:fs';\nfs.writeFileSync(process.env.ITF_TEST_GH_LOG, JSON.stringify(process.argv.slice(2)));\nconst mode = process.env.ITF_TEST_GH_MODE;\nif (mode === 'auth') { process.stderr.write('authentication credentials OPAQUE_SECRET'); process.exit(1); }\nif (mode === 'invalid') { process.stdout.write('OPAQUE_RAW_INVALID'); process.exit(0); }\nif (mode === 'large') { process.stdout.write('x'.repeat(1024 * 1024 + 100)); }\nelse { process.stdout.write('HTTP/2.0 ' + (mode === '401' ? '401 Unauthorized' : '200 OK') + '\\r\\nContent-Type: application/json\\r\\n\\r\\n' + JSON.stringify({ fixture: true })); if(mode === '401') process.exitCode = 1; if(mode === 'hang') setTimeout(() => {}, 10000); }\n`, { mode: 0o700 });
    process.env.PATH = `${dir}:${oldPath}`;
    process.env.ITF_TEST_GH_LOG = log;
    process.env.ITF_TEST_GH_MODE = 'ok';
    const response = await requestGithub('/repos/octo/project');
    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { fixture: true });
    assert.match(response.stdout, /^HTTP\/2\.0 200/);
    assert.deepEqual(JSON.parse(await readFile(log, 'utf8')), ['api', '--hostname', 'github.com', '--include', '--method', 'GET', '/repos/octo/project']);
    await requestGithub('graphql', { method: 'POST', query: FUNDING_QUERY, variables: { owner: 'octo', name: 'project' } });
    assert.deepEqual(JSON.parse(await readFile(log, 'utf8')), ['api', '--hostname', 'github.com', '--include', '--method', 'POST', 'graphql',
      '--raw-field', `query=${FUNDING_QUERY}`, '--raw-field', 'owner=octo', '--raw-field', 'name=project']);
    process.env.ITF_TEST_GH_MODE = '401';
    assert.equal((await requestGithub('/repos/octo/project')).status, 401);
    process.env.ITF_TEST_GH_MODE = 'auth';
    assert.deepEqual((await requestGithub('/repos/octo/project')).error, { code: 'credential_failure' });
    process.env.ITF_TEST_GH_MODE = 'invalid';
    const invalid = await requestGithub('/repos/octo/project');
    assert.equal(invalid.stdout, 'OPAQUE_RAW_INVALID');
    assert.equal(invalid.error.code, 'invalid_envelope');
    process.env.ITF_TEST_GH_MODE = 'large';
    assert.equal((await requestGithub('/repos/octo/project')).error.code, 'response_too_large');
    process.env.ITF_TEST_GH_MODE = 'hang';
    const timedOut = await requestGithub('/repos/octo/project', { timeoutMs: 500.5 });
    assert.equal(timedOut.error.code, 'request_timeout');
    assert.match(timedOut.stdout, /^HTTP\/2\.0 200/);
    for (const [route, options] of [['https://evil.test', {}], ['/repos/octo/project', { method: 'DELETE' }],
      ['graphql', { method: 'POST', query: 'mutation { bad }', variables: { owner: 'octo', name: 'project' } }],
      ['/repos/octo/project/commits/main%0A', {}]]) {
      await assert.rejects(requestGithub(route, options), { code: 'invalid_route' });
    }
  } finally {
    if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath;
    if (oldMode === undefined) delete process.env.ITF_TEST_GH_MODE; else process.env.ITF_TEST_GH_MODE = oldMode;
    if (oldLog === undefined) delete process.env.ITF_TEST_GH_LOG; else process.env.ITF_TEST_GH_LOG = oldLog;
    await rm(dir, { recursive: true, force: true });
  }
});
