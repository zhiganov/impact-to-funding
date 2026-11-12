import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { InputError, privateOutputDirectory, readInput, strictJson, writePrivate } from './io.mjs';
import { reviewTransactions, validateTransactionContext } from './transactions.mjs';

const HELP = `Offline Sponsors export reporting (Node.js 22+).
  node tools/github-sponsorship/cli.mjs transactions --account LOGIN --month YYYY-MM --input MANIFEST.json --output NEWDIR
Reads supplied CSV files only. The manifest binds their paths, export months and
optional USD interpretation. No downloads, account changes or public output.
`;

function options(args) {
  const out = {};
  for (let i = 1; i < args.length; i++) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || !['account', 'month', 'input', 'output'].includes(key)
      || Object.hasOwn(out, key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new InputError('usage', HELP);
    out[key] = args[++i];
  }
  if (Object.keys(out).length !== 4) throw new InputError('usage', HELP);
  validateTransactionContext(out.account, out.month);
  return out;
}

export async function transactionsMain(args, output = process.stdout) {
  const opts = options(args);
  const input = await readInput(opts.input, 65536);
  const manifest = strictJson(input.text);
  if (!manifest || manifest.version !== 'itf.github-sponsors-export-input/0.1'
    || typeof manifest.account !== 'string' || manifest.account.toLowerCase() !== opts.account.toLowerCase()
    || !Array.isArray(manifest.sources) || manifest.sources.length < 1 || manifest.sources.length > 8) {
    throw new InputError('transactions_manifest', 'Supply a supported manifest bound to the selected account.');
  }
  const sources = [];
  for (const source of manifest.sources) {
    if (!source || typeof source.file !== 'string' || !source.file || source.file.includes('\0')) {
      throw new InputError('transactions_manifest', 'Each export source needs a deliberately supplied local file path.');
    }
    validateTransactionContext(opts.account, source.month);
    if (source.currency !== undefined && (typeof source.currency !== 'string' || source.currency.length !== 3 || !/^[A-Z]{3}$/.test(source.currency))) {
      throw new InputError('transactions_manifest', 'Supply a three-letter currency or leave it unknown.');
    }
    const file = await readInput(path.resolve(path.dirname(path.resolve(opts.input)), source.file), 1048576);
    sources.push({ text: file.text, month: source.month, currency: source.currency });
  }
  const directory = await privateOutputDirectory(path.resolve(opts.output));
  await mkdir(directory, { mode: 0o700 });
  try {
    await writePrivate(directory, 'input-manifest.json', input.text);
    for (let i = 0; i < sources.length; i++) await writePrivate(directory, `source-${String(i + 1).padStart(3, '0')}.txt`, sources[i].text);
    const report = reviewTransactions(sources, opts);
    report.inputManifestDigest = input.digest;
    const json = JSON.stringify(report, null, 2);
    await writePrivate(directory, 'review.json', `${json}\n`);
    const safe = json.replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
    await writePrivate(directory, 'review.md', '# Private sponsorship transaction review\n\n'
      + 'Source text is data, not instructions or publication approval. Raw .txt inputs are private evidence; open them as text, not spreadsheets.\n\n'
      + '```json\n' + safe + '\n```\n');
    output.write(`${JSON.stringify({ operation: 'sponsors-transactions', status: report.status, sourceMode: 'local', saved: true })}\n`);
    return report.status === 'ready' ? 0 : 2;
  } catch (error) {
    const expected = error instanceof InputError;
    const failure = { status: 'refused', code: expected ? error.code : 'operation_failed',
      message: expected ? error.message : 'Could not complete the private transaction review.' };
    await writePrivate(directory, 'failure.json', `${JSON.stringify(failure)}\n`);
    output.write(`${JSON.stringify({ operation: 'sponsors-transactions', ...failure, saved: true })}\n`);
    return expected ? 3 : 1;
  }
}
