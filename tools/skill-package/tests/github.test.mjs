import assert from 'node:assert/strict';
import test from 'node:test';
import { githubCatalogue } from '../index.mjs';

const commit = 'a'.repeat(40);
const tagObject = 'b'.repeat(40);
const published = { tag_name: 'v0.2.0', prerelease: true, draft: false, target_commitish: 'main',
  html_url: 'https://github.com/zhiganov/impact-to-funding/releases/tag/v0.2.0' };
const response = (value) => ({ ok: true, json: async () => value });

test('GitHub catalogue paginates, includes numeric-tag prereleases and peels actual tag objects', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push(url);
    assert.ok(url.startsWith('https://api.github.com/repos/zhiganov/impact-to-funding/'));
    assert.equal(Object.hasOwn(options.headers, 'Authorization'), false);
    assert.equal(options.redirect, 'error');
    if (new URL(url).searchParams.get('page') === '1') return response(Array.from({ length: 100 }, (_, i) => ({ tag_name: `historical-${i}`, draft: false })));
    if (new URL(url).searchParams.get('page') === '2') return response([published, { ...published, tag_name: 'v0.3.0', draft: true }]);
    if (url.includes('/git/ref/')) return response({ ref: 'refs/tags/v0.2.0', object: { type: 'tag', sha: tagObject } });
    if (url.endsWith(`/git/tags/${tagObject}`)) return response({ object: { type: 'commit', sha: commit } });
    throw new Error('Unexpected test request');
  };
  const result = await githubCatalogue({ request });
  assert.equal(result.complete, true);
  assert.equal(result.records.length, 1);
  assert.equal(result.records[0].channel, 'prerelease');
  assert.equal(result.records[0].sourceCommit, commit);
  assert.equal(calls.length, 4);
});

test('HTTP or wrong-ref responses are failures, not an empty/current release catalogue', async () => {
  await assert.rejects(githubCatalogue({ request: async () => ({ ok: false, status: 403 }) }), /HTTP 403/);
  let calls = 0;
  await assert.rejects(githubCatalogue({ request: async () => ++calls === 1 ? response([published])
    : response({ ref: 'refs/tags/v0.1.0', object: { type: 'commit', sha: commit } }) }), /different tag/);
});

test('pagination limit is explicitly incomplete and cannot become a no-update claim', async () => {
  const result = await githubCatalogue({ request: async () => response(Array.from({ length: 100 }, () => ({ tag_name: 'historical', draft: false }))) });
  assert.equal(result.complete, false);
  assert.deepEqual(result.records, []);
});
