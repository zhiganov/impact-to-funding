import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewTransactions } from '../transactions.mjs';
import { csv, headers } from './transaction-fixtures.mjs';

const options = { account: 'fictional-maintainer', month: '2026-11' };
const source = (text = csv(), extra = {}) => ({ text, month: '2026-11', currency: 'USD', ...extra });
const review = (...sources) => reviewTransactions(sources.length ? sources : [source()], options);

test('reviews native-shaped fictional CSV with exact amounts and private projection', () => {
  const report = review();
  assert.equal(report.status, 'ready');
  assert.equal(report.records[0].processedAmountCents, '500');
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
  assert.equal(report.scope.coverage, 'supplied_records_only');
  assert.equal(report.scope.accountBasis, 'supplied_context');
  assert.equal(report.totals.completeAccountTotal, false);
  assert.equal(report.records[0].utcDate, '2026-11-10T12:00:00.000Z');
  for (const value of ['fictional-private-sponsor', 'private@example.test', 'UNTRUSTED', 'fictional-transaction-1', 'Fictional tier']) {
    assert(!JSON.stringify(report).includes(value));
  }
});

test('repeated files and identical identified transactions do not multiply amounts', () => {
  const text = csv();
  const report = review(source(text), source(text), source(text.replaceAll('\r\n', '\n')));
  assert.equal(report.counts.repeatedFiles, 1);
  assert.equal(report.counts.duplicateTransactions, 1);
  assert.equal(report.counts.includedTransactions, 1);
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
  assert.deepEqual(report, review(source(text), source(text), source(text.replaceAll('\r\n', '\n'))));
});

test('reordered header layouts keep record fingerprints stable', () => {
  const report = review(source(csv()), source(csv([{}], [...headers].reverse())));
  assert.equal(report.counts.duplicateTransactions, 1);
  assert.equal(report.records.length, 1);
});

test('conflicting transaction IDs exclude every conflicting occurrence', () => {
  const report = review(source(csv()), source(csv([{ 'Processed Amount': '$8.00' }])));
  assert.equal(report.status, 'limited');
  assert.equal(report.records.length, 0);
  assert.equal(report.totals, null);
  assert.equal(report.issues.filter(x => x.code === 'transaction_conflict').length, 2);
});

test('conflicting private fields also prevent guessed deduplication', () => {
  const report = review(source(csv()), source(csv([{ Metadata: 'different fictional tag' }])));
  assert.equal(report.counts.rejectedRecords, 2);
  assert.equal(report.totals, null);
  assert(!JSON.stringify(report).includes('different fictional tag'));
});

test('identical bytes with conflicting context cannot contribute totals', () => {
  const report = review(source(), source(csv(), { currency: 'EUR' }));
  assert.equal(report.sources[0].state, 'context_conflict');
  assert.equal(report.records.length, 0);
  assert.equal(report.totals, null);
});

test('missing or unsupported currency stays unknown rather than assuming USD', () => {
  for (const currency of [undefined, 'EUR']) {
    const report = review(source(csv(), { currency }));
    assert.equal(report.status, 'limited');
    assert.equal(report.totals, null);
    assert(report.issues.some(x => x.code.startsWith('currency_')));
  }
});

test('unknown statuses and missing amounts visibly limit usable-record totals', () => {
  const report = review(source(csv([
    {}, { 'Transaction ID': 'fictional-2', Status: 'pending' },
    { 'Transaction ID': 'fictional-3', 'Processed Amount': '' },
  ])));
  assert.equal(report.status, 'limited');
  assert.equal(report.counts.rejectedRecords, 2);
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
  assert(report.unknowns.includes('payouts'));
});

test('signed processed amounts remain separate and large values use exact arithmetic', () => {
  const report = review(source(csv([
    { 'Processed Amount': '$99,999,999,999,999.99' },
    { 'Transaction ID': 'negative', 'Processed Amount': '-$2.01' },
    { 'Transaction ID': 'zero', 'Processed Amount': '$0.00' },
  ])));
  assert.equal(report.totals.positiveProcessedAmountCents, '9999999999999999');
  assert.equal(report.totals.negativeProcessedAmountCents, '-201');
  assert(!Object.hasOwn(report.totals, 'netIncome'));
});

test('report months use UTC while preserving the recorded timezone and local export month', () => {
  const input = source(csv([{ 'Transaction Date': '2026-11-01 00:30:00 +0200' }]));
  const november = review(input);
  assert.equal(november.counts.outsidePeriod, 1);
  assert.equal(november.totals, null);
  const october = reviewTransactions([input], { ...options, month: '2026-10' });
  assert.equal(october.records.length, 1);
  assert.equal(october.records[0].recordedDate, '2026-11-01 00:30:00 +0200');
});

test('impossible dates are rejected without guessed fixes', () => {
  for (const date of ['2026-11-31 12:00:00 +0000',
    '2026-11-10 25:00:00 +0000', '2026-11-10 12:00:00 +1430', '2026-11-10']) {
    const report = review(source(csv([{ 'Transaction Date': date }])));
    assert.equal(report.counts.rejectedRecords, 1, date);
    assert.equal(report.totals, null);
  }
});

test('export-month uncertainty limits coverage without discarding a valid UTC-period transaction', () => {
  const input = source(csv([{ 'Transaction Date': '2026-12-01 00:30:00 +0200' }]));
  const report = review(input);
  assert.equal(report.status, 'limited');
  assert.equal(report.counts.includedTransactions, 1);
  assert.equal(report.counts.rejectedRecords, 0);
  assert.equal(report.totals.positiveProcessedAmountCents, '500');
  assert(report.issues.some(x => x.code === 'source_month_mismatch'));
});

test('export-month descriptions are coverage context, not conflicting transaction identity', () => {
  const text = csv([{ 'Transaction Date': '2026-12-01 00:30:00 +0200' }]);
  const report = review(source(text), source(text, { month: '2026-12' }), source(text.replaceAll('\r\n', '\n'), { month: '2026-12' }));
  assert.equal(report.counts.repeatedFiles, 1);
  assert.equal(report.counts.duplicateTransactions, 1);
  assert.equal(report.counts.includedTransactions, 1);
  assert(!report.issues.some(x => x.code === 'transaction_conflict'));
});

test('blocked source identities still taint matching transactions in other files', () => {
  const text = csv();
  for (const other of [text.replaceAll('\r\n', '\n'), csv([{ 'Processed Amount': '$9.00' }])]) {
    const report = review(source(text), source(text, { currency: 'EUR' }), source(other));
    assert.equal(report.records.length, 0);
    assert.equal(report.totals, null);
    assert(report.issues.some(x => x.source === 3 && x.code === 'transaction_conflict'));
  }
});

test('identity is required; equal sponsor names or prices do not deduplicate rows', () => {
  const report = review(source(csv([{ 'Transaction ID': '' }, { 'Transaction ID': 'separate' }])));
  assert.equal(report.counts.rejectedRecords, 1);
  assert.equal(report.counts.includedTransactions, 1);
});

test('malformed and unsupported sources remain explicitly uninterpreted', () => {
  for (const text of ['not,a,native,header\n', '[]', csv().replace('"=UNTRUSTED', '"broken"=UNTRUSTED')]) {
    const report = review(source(text));
    assert.equal(report.status, 'limited');
    assert.equal(report.sources[0].state, 'uninterpreted');
    assert.equal(report.totals, null);
  }
});

test('header-only sources establish no account-wide zero', () => {
  const report = review(source(csv([])));
  assert.equal(report.counts.inspectedRecords, 0);
  assert.equal(report.totals, null);
  assert.equal(report.scope.coverage, 'supplied_records_only');
});

test('validates context and leaves source inputs unchanged', () => {
  const inputs = [source()], before = structuredClone(inputs);
  reviewTransactions(inputs, options);
  assert.deepEqual(inputs, before);
  for (const changed of [{ account: '../other' }, { account: 'fictional\n' }, { month: '2026-13' }, { month: 'Nov' }, { month: '2026-11\n' }]) {
    assert.throws(() => reviewTransactions(inputs, { ...options, ...changed }), { code: 'transactions_input' });
  }
  assert.throws(() => reviewTransactions([], options), { code: 'transactions_input' });
  assert.throws(() => reviewTransactions(Array(9).fill(source()), options), { code: 'transactions_input' });
  assert.throws(() => review(source(csv(), { currency: 'USD\n' })), { code: 'transactions_input' });
});

test('the combined record limit applies across different source files before review output', () => {
  const blank = Object.fromEntries(headers.map(header => [header, '']));
  const text = csv(Array.from({ length: 5000 }, (_, i) => ({ ...blank,
    'Transaction ID': `fictional-${i}`, 'Processed Amount': '$1.00', Status: 'settled',
    'Transaction Date': '2026-11-10 12:00:00 +0000',
  })));
  assert(Buffer.byteLength(text) < 1048576);
  assert.throws(() => review(source(text), source(text.replaceAll('\r\n', '\n')), source(csv())), { code: 'transactions_limit' });
});
