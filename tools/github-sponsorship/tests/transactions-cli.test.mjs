import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, stat, rm, mkdir, symlink, chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { csv } from './transaction-fixtures.mjs';

const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const account = 'fictional-maintainer';
const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;

async function fixture(t, text = csv(), sources) {
  const dir = await mkdtemp(path.join(tmpdir(), 'itf-transactions-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const local = path.join(dir, 'transactions.csv'), input = path.join(dir, 'input.json');
  await writeFile(local, text);
  await writeFile(input, JSON.stringify({ version: 'itf.github-sponsors-export-input/0.1', account,
    sources: sources ?? [{ file: 'transactions.csv', month: '2026-11', currency: 'USD' }] }));
  return { dir, local, input, output: path.join(dir, 'private review') };
}
const args = f => ['transactions', '--account', account, '--month', '2026-11', '--input', f.input, '--output', f.output];
const run = (args, env = {}) => spawnSync(process.execPath, [cli, ...args], {
  encoding: 'utf8', timeout: 15000, env: { ...process.env, ...env },
});

test('real offline CLI saves a bounded private packet with exact sources and no gh call', async t => {
  const f = await fixture(t, '\ufeff' + csv());
  const before = await Promise.all([readFile(f.local), readFile(f.input)]);
  if (process.platform !== 'win32') {
    const gh = path.join(f.dir, 'gh');
    await writeFile(gh, `#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(path.join(f.dir, 'network-attempt'))},'called');process.exit(78);\n`);
    await chmod(gh, 0o700);
  }
  const result = run(args(f), { PATH: `${f.dir}${path.delimiter}${process.env.PATH}` });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const reportBytes = await readFile(path.join(f.output, 'review.json'));
  const report = JSON.parse(reportBytes);
  assert.equal(report.inputManifestDigest, digest(before[1]));
  assert.equal(report.sources[0].digest, digest(before[0]));
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
  assert.equal(report.scope.sourceMode, 'local');
  assert.equal(report.scope.publication, 'not_authorised');
  assert.deepEqual(await readFile(path.join(f.output, 'source-001.txt')), before[0]);
  assert.deepEqual(await readFile(path.join(f.output, 'input-manifest.json')), before[1]);
  assert.deepEqual(await Promise.all([readFile(f.local), readFile(f.input)]), before);
  for (const text of [result.stdout, reportBytes.toString(), await readFile(path.join(f.output, 'review.md'), 'utf8')]) {
    assert(!text.includes('fictional-private-sponsor'));
    assert(!text.includes('private@example.test'));
    assert(!text.includes('UNTRUSTED'));
  }
  assert(!result.stdout.includes(account));
  assert(!(await readdir(f.dir)).includes('network-attempt'));
  assert.deepEqual((await readdir(f.output)).sort(), ['input-manifest.json', 'review.json', 'review.md', 'source-001.txt']);
  if (process.platform !== 'win32') {
    assert.equal((await stat(f.output)).mode & 0o777, 0o700);
    for (const file of await readdir(f.output)) assert.equal((await stat(path.join(f.output, file))).mode & 0o777, 0o600);
  }
});

test('replays unchanged input deterministically and repeated files do not multiply totals', async t => {
  const f = await fixture(t, csv(), [
    { file: 'transactions.csv', month: '2026-11', currency: 'USD' },
    { file: 'transactions.csv', month: '2026-11', currency: 'USD' },
  ]);
  assert.equal(run(args(f)).status, 0);
  const output2 = path.join(f.dir, 'second');
  assert.equal(run([...args(f).slice(0, -1), output2]).status, 0);
  assert.deepEqual(await readFile(path.join(f.output, 'review.json')), await readFile(path.join(output2, 'review.json')));
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.counts.repeatedFiles, 1);
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
});

test('unsupported native shape retains exact private input and cannot become a zero total', async t => {
  const text = 'unknown,header\nPRIVATE-UNSUPPORTED,CONTENT\n';
  const f = await fixture(t, text);
  const result = run(args(f));
  assert.equal(result.status, 2, result.stdout + result.stderr);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.totals, null);
  assert.equal(report.sources[0].state, 'uninterpreted');
  assert.equal(await readFile(path.join(f.output, 'source-001.txt'), 'utf8'), text);
  assert(!result.stdout.includes('PRIVATE-UNSUPPORTED'));
});

test('source currency can stay unknown without being silently supplied by the CLI', async t => {
  const f = await fixture(t, csv(), [{ file: 'transactions.csv', month: '2026-11' }]);
  assert.equal(run(args(f)).status, 2);
  const report = JSON.parse(await readFile(path.join(f.output, 'review.json'), 'utf8'));
  assert.equal(report.sources[0].currencyBasis, 'unknown');
  assert.equal(report.totals, null);
});

test('account mismatch and unsupported options fail before output creation', async t => {
  const f = await fixture(t);
  for (const tail of [['--remote'], ['--month', '2026-11'], ['--mapping', f.local]]) {
    assert.equal(run([...args(f), ...tail]).status, 1);
  }
  const bad = args(f); bad[2] = 'different-account';
  assert.equal(run(bad).status, 1);
  assert(!(await readdir(f.dir)).includes('private review'));
});

test('existing output, symlink targets and checkout aliases remain excluded', async t => {
  const f = await fixture(t);
  await mkdir(f.output); await writeFile(path.join(f.output, 'keep'), 'keep');
  assert.equal(run(args(f)).status, 1);
  assert.equal(await readFile(path.join(f.output, 'keep'), 'utf8'), 'keep');
  const inside = path.join(root, `transaction-private-${randomUUID()}`);
  assert.equal(run([...args(f).slice(0, -1), inside]).status, 1);
  if (process.platform !== 'win32') {
    const alias = path.join(f.dir, 'checkout-alias'); await symlink(root, alias);
    assert.equal(run([...args(f).slice(0, -1), path.join(alias, 'private')]).status, 1);
  }
});

test('oversized or invalid UTF-8 files are refused before private output creation', async t => {
  const f = await fixture(t);
  for (const bytes of [Buffer.from([0xff, 0xfe]), Buffer.alloc(1048577, 65)]) {
    await writeFile(f.local, bytes);
    assert.equal(run(args(f)).status, 1);
    assert(!(await readdir(f.dir)).includes('private review'));
  }
});
