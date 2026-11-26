import assert from 'node:assert/strict';
import test from 'node:test';
import { pinLinks, renderReleaseText } from '../release-text.mjs';

const repository = 'example/itf';
const commit = 'a'.repeat(40);
const notesPath = 'docs/releases/v9.9.9.md';
const provenance = {
  files: { 'SKILL.md': 'x', 'references/a.md': 'y' },
  runtimeProvenance: {
    nodeVersion: '22.0.0', serverVersion: '0.1.0', snapshotId: 'sha256:fictional',
    dependencies: [
      { name: '@fixture/left', version: '1.0.0', license: 'Apache-2.0' },
      { name: '@fixture/right', version: '1.0.0', license: 'Apache-2.0' },
      { name: 'fixture-zod', version: '2.0.0', license: 'MIT' },
    ],
  },
  runtimeCheck: { status: 'passed', transport: 'stdio', sourceCommit: commit, tools: ['a', 'b', 'c'] },
};
const notes = `# v9.9.9: fictional\n\nSee the [guide](../install.md), [a check](../checks/x.md#result), [licence](../../LICENSE), [web](https://example.org) and [top](#top).\n\nOriginal written content remains CC BY-SA 4.0.\n`;

test('relative links are pinned to the commit; others are left alone', () => {
  const out = pinLinks(notes, { repository, commit, notesPath });
  const base = `https://github.com/${repository}/blob/${commit}/`;
  assert.match(out, new RegExp(`\\[guide\\]\\(${base}docs/install\\.md\\)`));
  assert.match(out, new RegExp(`\\[a check\\]\\(${base}docs/checks/x\\.md#result\\)`));
  assert.match(out, new RegExp(`\\[licence\\]\\(${base}LICENSE\\)`));
  assert.match(out, /\[web\]\(https:\/\/example\.org\)/);
  assert.match(out, /\[top\]\(#top\)/);
});

test('a link that leaves the repository is refused', () => {
  assert.throws(() => pinLinks('[x](../../../outside.md)', { repository, commit, notesPath }), /leaves the repository/);
});

test('the release text drops the title and puts release files before the licence line', () => {
  const out = renderReleaseText({ notes, repository, commit, notesPath, zipName: 'itf.zip', zipSha256: 'f'.repeat(64), runUrl: 'https://example.org/run', validator: '9.9.9', provenance });
  assert.doesNotMatch(out, /^# v9\.9\.9/m);
  assert.match(out, /^Source: \[`a{40}`\]/);
  assert.ok(out.indexOf('## Release files') < out.indexOf('Original written content'));
  assert.match(out, /3 files under one `itf\/` folder/);
  assert.match(out, /`@fixture\/left` 1\.0\.0 and `@fixture\/right` 1\.0\.0 \(Apache-2\.0\) and `fixture-zod` 2\.0\.0 \(MIT\)/);
  assert.match(out, /Its check passed: three tools over stdio/);
  assert.match(out, /SHA-256 `f{64}`/);
});
