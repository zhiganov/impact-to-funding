import { createHash } from 'node:crypto';
import { parseSponsorsCsv } from './transactions-csv.mjs';
import { InputError } from './io.mjs';

const LOGIN = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const MONTH = /^(?:19[7-9]\d|[2-9]\d{3})-(?:0[1-9]|1[0-2])$/;
const sha = value => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const diagnostic = code => ({ code, message: {
  csv_invalid: 'The CSV structure is malformed.',
  csv_headers: 'The CSV headers do not match a supported observed layout.',
  csv_limit: 'The CSV exceeds a supported input limit.',
  source_context_conflict: 'Identical source bytes have conflicting supplied context.',
  invalid_transaction_id: 'The record has no supported transaction identity.',
  invalid_transaction_date: 'The record has no supported timezone-bearing transaction date.',
  source_month_mismatch: 'Supplied export-month coverage differs from recorded local dates or another supplied description. The export-month timezone is unverified.',
  currency_unknown: 'The source has no currency field and no currency was supplied.',
  currency_unsupported: 'The supplied currency is outside the supported dollar-amount interpretation.',
  invalid_processed_amount: 'The processed amount has an unsupported representation.',
  status_unsupported: 'The transaction status is outside the supported settled-record interpretation.',
  transaction_conflict: 'Records with the same transaction identity contain different source facts.',
}[code] ?? 'This source could not be interpreted.' });

function requireValue(condition) {
  if (!condition) throw new InputError('transactions_input', 'Supply a valid account, month and bounded export source list.');
}

export function validateTransactionContext(account, month) {
  requireValue(typeof account === 'string' && account === account.trim() && LOGIN.test(account));
  requireValue(typeof month === 'string' && month.length === 7 && MONTH.test(month));
}

function transactionDate(value) {
  const match = /^(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d) ([+-])(\d\d)(\d\d)$/.exec(value);
  if (!match) return null;
  const local = `${match[1]}T${match[2]}Z`;
  const time = Date.parse(local);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== local.replace('Z', '.000Z')) return null;
  const hours = Number(match[4]), minutes = Number(match[5]);
  if (hours > 14 || minutes > 59 || (hours === 14 && minutes !== 0)) return null;
  const offset = (hours * 60 + minutes) * 60000 * (match[3] === '+' ? 1 : -1);
  const utc = new Date(time - offset).toISOString();
  if (!MONTH.test(utc.slice(0, 7))) return null;
  return { recorded: value, utc, localMonth: match[1].slice(0, 7) };
}

function cents(value) {
  const match = /^(-?)\$((?:0|[1-9]\d{0,14}|[1-9]\d{0,2}(?:,\d{3}){1,4}))\.(\d{2})$/.exec(value);
  if (!match) return null;
  return BigInt(`${match[1]}${match[2].replaceAll(',', '')}${match[3]}`).toString();
}

/** Sources contain exact decoded CSV text and deliberately supplied context. */
export function reviewTransactions(sources, { account, month } = {}) {
  validateTransactionContext(account, month);
  requireValue(Array.isArray(sources) && sources.length > 0 && sources.length <= 8);
  for (const source of sources) {
    requireValue(source && typeof source === 'object' && typeof source.text === 'string');
    requireValue(typeof source.month === 'string' && source.month.length === 7 && MONTH.test(source.month));
    requireValue(source.currency === undefined || (typeof source.currency === 'string' && source.currency.length === 3 && /^[A-Z]{3}$/.test(source.currency)));
  }
  const sourceReports = [];
  const uniqueFiles = new Map();
  const entries = [];
  const issues = [];
  let totalRecords = 0;
  let repeatedFiles = 0;
  for (let index = 0; index < sources.length; index++) {
    const source = sources[index], digest = sha(source.text), sourceIndex = index + 1;
    const context = JSON.stringify(source.currency ?? null);
    const report = { source: sourceIndex, digest, suppliedMonth: source.month,
      currency: source.currency ?? null, currencyBasis: source.currency ? 'supplied_context' : 'unknown',
      accountBasis: 'supplied_context', state: 'inspected', records: null };
    sourceReports.push(report);
    const previous = uniqueFiles.get(digest);
    if (previous) {
      if (previous.context !== context) {
        previous.report.state = report.state = 'context_conflict';
        previous.blocked = true;
        issues.push({ source: sourceIndex, ...diagnostic('source_context_conflict') });
      } else {
        repeatedFiles++;
        report.state = 'repeated_file';
        report.repeatedSource = previous.report.source;
        if (source.month !== previous.report.suppliedMonth) issues.push({ source: sourceIndex, ...diagnostic('source_month_mismatch') });
      }
      continue;
    }
    const file = { context, report, blocked: false };
    uniqueFiles.set(digest, file);
    let parsed;
    try { parsed = parseSponsorsCsv(source.text); }
    catch (error) {
      if (!(error instanceof InputError)) throw error;
      report.state = 'uninterpreted';
      issues.push({ source: sourceIndex, ...diagnostic(error.code) });
      continue;
    }
    report.layout = parsed.layout;
    report.records = parsed.records.length;
    totalRecords += parsed.records.length;
    if (totalRecords > 10000) throw new InputError('transactions_limit', 'The supplied sources exceed 10000 data records.');
    for (const row of parsed.records) {
      const entry = { source: sourceIndex, row: row.row, file, fingerprint: row.fingerprint, codes: [] };
      if (!/^[\x21-\x7e]{1,256}$/.test(row.transactionId)) entry.codes.push('invalid_transaction_id');
      else entry.transactionRef = sha(`${account.toLowerCase()}\n${row.transactionId}`);
      const date = transactionDate(row.transactionDate);
      if (!date) entry.codes.push('invalid_transaction_date');
      else {
        entry.date = date;
        if (date.localMonth !== source.month) issues.push({ source: sourceIndex, row: row.row, ...diagnostic('source_month_mismatch') });
      }
      if (!source.currency) entry.codes.push('currency_unknown');
      else if (source.currency !== 'USD') entry.codes.push('currency_unsupported');
      const amount = cents(row.processedAmount);
      if (amount === null) entry.codes.push('invalid_processed_amount');
      if (row.status !== 'settled') entry.codes.push('status_unsupported');
      entry.amount = amount;
      entries.push(entry);
    }
  }
  const identities = new Map();
  for (const entry of entries) {
    if (!entry.transactionRef) continue;
    const group = identities.get(entry.transactionRef);
    if (group) {
      if (group.first.fingerprint !== entry.fingerprint || group.first.file.context !== entry.file.context || entry.file.blocked) group.conflict = true;
    } else identities.set(entry.transactionRef, { first: entry, conflict: entry.file.blocked });
  }
  const records = [];
  let duplicateTransactions = 0, rejectedRecords = 0, outsidePeriod = 0;
  let positive = 0n, negative = 0n;
  for (const entry of entries) {
    let codes = [...entry.codes];
    if (entry.file.blocked) codes.push('source_context_conflict');
    const group = identities.get(entry.transactionRef);
    if (group?.conflict) codes.push('transaction_conflict');
    if (codes.length) {
      rejectedRecords++;
      for (const code of new Set(codes)) issues.push({ source: entry.source, row: entry.row, ...diagnostic(code) });
      continue;
    }
    if (group.first !== entry) { duplicateTransactions++; continue; }
    if (entry.date.utc.slice(0, 7) !== month) { outsidePeriod++; continue; }
    const amount = BigInt(entry.amount);
    if (amount >= 0n) positive += amount;
    else negative += amount;
    records.push({ source: entry.source, row: entry.row, transactionRef: entry.transactionRef,
      fingerprint: entry.fingerprint, recordedDate: entry.date.recorded, utcDate: entry.date.utc,
      status: 'settled', processedAmountCents: entry.amount, currency: 'USD', currencyBasis: 'supplied_context' });
  }
  return {
    version: 'itf.github-sponsors-transactions-review/0.1', status: issues.length ? 'limited' : 'ready',
    scope: { account, accountBasis: 'supplied_context', month, periodBasis: 'UTC calendar month',
      coverage: 'supplied_records_only', sourceMode: 'local', publication: 'not_authorised' },
    sources: sourceReports, records, issues,
    counts: { suppliedFiles: sources.length, uniqueFiles: uniqueFiles.size, repeatedFiles,
      inspectedRecords: totalRecords, includedTransactions: records.length, duplicateTransactions, rejectedRecords, outsidePeriod },
    totals: records.length ? { basis: 'usable_unique_settled_records_in_requested_UTC_month', currency: 'USD',
      currencyBasis: 'supplied_context', positiveProcessedAmountCents: positive.toString(),
      negativeProcessedAmountCents: negative.toString(), completeAccountTotal: false } : null,
    unknowns: ['fees', 'refund_semantics', 'net_income', 'payouts', 'expected_recurring_support', 'project_allocation'],
    limitations: [
      'The account, export month and currency are supplied context; this layout does not verify them.',
      'The review covers supplied records, not a complete account ledger. An empty result is not proof of no support.',
      'Positive and negative processed amounts retain their signs. Neither category establishes fees, refunds or bank receipt.',
      'Source sponsor visibility does not grant permission to identify a sponsor in a public update.',
      'Financial support and campaign tags do not establish work completed, outcomes or causal impact.',
    ],
  };
}
