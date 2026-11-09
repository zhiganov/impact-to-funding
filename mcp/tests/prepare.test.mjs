import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { prepare } from '../prepare.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const revision = '7b36169f00b8d6185d16629b7784ac17ce7ea346';

test('preparation keeps the actual commit and the already-checked public snapshot identity', () => {
  const snapshot = prepare(revision);
  assert.equal(snapshot.sourceRevision, revision);
  assert.equal(snapshot.snapshotId, 'sha256:53cf94cbc6ecf1740ba683e6f4376b4e8a9701015e9463091dc2c0d63e8442e3');
  assert.equal(snapshot.records.filter((record) => record.available).length, 9);
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
      input: `object ${revision}\ntype commit\ntag fictional-library-test\ntagger Fictional Test <test@example.invalid> 1700000000 +0000\n\nEntirely fictional test object.\n`,
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
