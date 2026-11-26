import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { prepare } from '../prepare.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const revision = execFileSync('git', ['write-tree'], { cwd: root, encoding: 'utf8', timeout: 5000 }).trim();
const commitRevision = execFileSync('git', ['commit-tree', revision, '-p', 'HEAD', '-m', 'Disposable library test tree'], {
  cwd: root, encoding: 'utf8', timeout: 5000,
  env: { ...process.env, GIT_AUTHOR_NAME: 'ItF Test', GIT_AUTHOR_EMAIL: 'test@example.invalid',
    GIT_COMMITTER_NAME: 'ItF Test', GIT_COMMITTER_EMAIL: 'test@example.invalid' },
}).trim();

test('preparation keeps the actual commit and all mapped library records available', () => {
  const snapshot = prepare(commitRevision);
  assert.equal(snapshot.sourceRevision, commitRevision);
  assert.match(snapshot.snapshotId, /^sha256:[0-9a-f]{64}$/);
  assert.equal(snapshot.records.length, 11);
  assert.equal(snapshot.records.filter((record) => record.available).length, 11);
  // The mapping only accepts the current library index, so an old commit can't be
  // pinned here. Check instead that the same commit always prepares the same snapshot.
  assert.equal(prepare(commitRevision).snapshotId, snapshot.snapshotId);
});

test('annotated tag object hashes are rejected, not peeled and mislabelled as commits', () => {
  const directory = mkdtempSync(join(tmpdir(), 'itf-prepare-type-'));
  try {
    const objects = join(directory, 'objects');
    mkdirSync(objects);
    const alternate = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-path', 'objects'], {
      cwd: root, encoding: 'utf8', stdio: 'pipe', timeout: 5000,
    }).trim();
    // All test writes live in this disposable object store; no refs or repo objects change.
    const env = { ...process.env, GIT_OBJECT_DIRECTORY: objects, GIT_ALTERNATE_OBJECT_DIRECTORIES: alternate };
    const tag = execFileSync('git', ['mktag'], {
      cwd: root, env, encoding: 'utf8', stdio: 'pipe', timeout: 5000,
      input: `object ${commitRevision}\ntype commit\ntag fictional-library-test\ntagger Fictional Test <test@example.invalid> 1700000000 +0000\n\nEntirely fictional test object.\n`,
    }).trim();
    const output = join(directory, 'must-not-exist.json');
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../prepare.mjs', import.meta.url)),
      '--revision', tag, '--output', output], { cwd: directory, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /^Snapshot preparation failed\./);
    assert.equal(existsSync(output), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
