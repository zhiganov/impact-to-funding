import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { InputError } from '../io.mjs';
import { parseSponsorsCsv } from '../transactions-csv.mjs';

// All identities, contact details and transactions in this file are fictional.
const headers = [
  'Sponsor Handle', 'Sponsor Profile Name', 'Sponsor Public Email',
  'Sponsorship Started On', 'Is Public?', 'Is Yearly?', 'Transaction ID',
  'Payment Source', 'Tier Name', 'Tier Monthly Amount', 'Processed Amount',
  'Is Prorated?', 'Status', 'Transaction Date', 'Metadata', 'Country', 'Region', 'VAT',
];
const source = {
  'Sponsor Handle': 'fictional-sponsor', 'Sponsor Profile Name': 'Fictional Person',
  'Sponsor Public Email': 'fictional@example.org', 'Sponsorship Started On': '2026-10-01',
  'Is Public?': 'false', 'Is Yearly?': 'false', 'Transaction ID': 'fictional-txn-1',
  'Payment Source': 'Fictional source', 'Tier Name': 'Fictional tier', 'Tier Monthly Amount': '$5.00',
  'Processed Amount': '$5.00', 'Is Prorated?': 'false', 'Status': 'settled',
  'Transaction Date': '2026-11-01 12:00:00 +0000', 'Metadata': 'fictional metadata',
  'Country': 'Example country', 'Region': 'Example region', 'VAT': '',
};
const quote = value => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
const row = (values, order = headers) => order.map(header => quote(values[header] ?? '')).join(',');
const csv = (values = [source], order = headers, newline = '\n') =>
  [order.map(quote).join(','), ...values.map(value => row(value, order))].join(newline);
const rejects = (text, code) => assert.throws(() => parseSponsorsCsv(text), error => {
  assert.ok(error instanceof InputError);
  assert.equal(error.code, code);
  assert.equal(error.message, {
    csv_invalid: 'The CSV structure is malformed.',
    csv_headers: 'The CSV headers do not match a supported observed layout.',
    csv_limit: 'The CSV exceeds a supported input limit.',
  }[code]);
  return true;
});

test('observed layouts, reordered headers and optional final terminators', () => {
  for (const order of [headers, headers.filter(header => header !== 'Payment Source'), [...headers].reverse()]) {
    for (const newline of ['\n', '\r\n']) {
      for (const ending of ['', newline]) {
        const parsed = parseSponsorsCsv(`\uFEFF${csv([source], order, newline)}${ending}`);
        assert.equal(parsed.layout, 'github-sponsors-csv/observed-2026');
        assert.deepEqual(parsed.headers, order);
        assert.equal(parsed.records.length, 1);
        assert.equal(parsed.records[0].transactionId, source['Transaction ID']);
        assert.equal(parsed.records[0].row, 2);
      }
    }
  }
});

test('quoted commas, doubled quotes, newlines and CR bytes decode exactly', () => {
  const values = { ...source, 'Transaction ID': 'fictional,"quoted"\nID\r\nnext\r', 'Processed Amount': ' $5,000.00 ' };
  const parsed = parseSponsorsCsv(csv([values, source]));
  assert.equal(parsed.records[0].transactionId, values['Transaction ID']);
  assert.equal(parsed.records[0].processedAmount, values['Processed Amount']);
  assert.equal(parsed.records[1].row, 3);
});

test('fingerprints bind every decoded pair, are order-stable and spelling-sensitive', () => {
  const record = parseSponsorsCsv(csv()).records[0];
  const pairs = [...headers].sort().map(header => [header, source[header]]);
  assert.equal(record.fingerprint, `sha256:${createHash('sha256').update(JSON.stringify(pairs)).digest('hex')}`);
  assert.equal(parseSponsorsCsv(csv([source], [...headers].reverse())).records[0].fingerprint, record.fingerprint);
  const allQuoted = [headers, headers.map(header => source[header])]
    .map(values => values.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
  assert.equal(parseSponsorsCsv(allQuoted).records[0].fingerprint, record.fingerprint);
  for (const header of headers) {
    const changed = parseSponsorsCsv(csv([{ ...source, [header]: `${source[header]} ` }])).records[0];
    assert.notEqual(changed.fingerprint, record.fingerprint, header);
  }
  assert.notEqual(parseSponsorsCsv(csv([source], headers.filter(header => header !== 'Payment Source'))).records[0].fingerprint, record.fingerprint);
});

test('record projection omits sponsor identity, metadata and location', () => {
  const record = parseSponsorsCsv(csv()).records[0];
  assert.deepEqual(Object.keys(record).sort(), ['fingerprint', 'processedAmount', 'row', 'status', 'transactionDate', 'transactionId']);
  for (const header of ['Sponsor Handle', 'Sponsor Profile Name', 'Sponsor Public Email', 'Metadata', 'Country', 'Region']) {
    assert.ok(!JSON.stringify(record).includes(source[header]));
  }
});

test('header-only sources have zero records; malformed and empty scalars are retained', () => {
  for (const ending of ['', '\n', '\r\n']) assert.deepEqual(parseSponsorsCsv(`${headers.join(',')}${ending}`).records, []);
  const records = parseSponsorsCsv(csv([{}, { 'Transaction ID': ' ', 'Processed Amount': 'unknown', 'Status': '???', 'Transaction Date': 'not a date' }])).records;
  assert.deepEqual(records.map(({ transactionId, processedAmount, status, transactionDate }) =>
    [transactionId, processedAmount, status, transactionDate]), [['', '', '', ''], [' ', 'unknown', '???', 'not a date']]);
});

test('rejects malformed quoting, bare CR and inconsistent row widths', () => {
  const header = headers.join(',');
  for (const malformed of ['"unterminated', 'before"quote', '"closed"extra', '"closed" "again"', '"closed"\r', '"""']) {
    rejects(`${header}\n${malformed}`, 'csv_invalid');
  }
  for (const text of [`${header}\r${row(source)}`, `${csv()}\r`, `${header}\n`, `${header}\n\n`, `${csv()}\n\n`, `${header}\n,`, `${csv()},`, `${header}\n${headers.map(() => '').join(',')},`]) {
    if (text === `${header}\n`) assert.deepEqual(parseSponsorsCsv(text).records, []);
    else rejects(text, 'csv_invalid');
  }
});

test('requires exactly one complete known header set', () => {
  for (const invalid of [[], headers.slice(1), [...headers, 'Extra'], headers.map(header => header === 'VAT' ? 'Unknown' : header),
    headers.map(header => header === 'VAT' ? 'Status' : header), headers.map(header => `${header} `), headers.map(header => header.toLowerCase())]) {
    rejects(invalid.join(','), 'csv_headers');
  }
  rejects(`\uFEFF\uFEFF${csv()}`, 'csv_headers');
  rejects(null, 'csv_invalid');
});

test('cell bounds cover plain, quoted and decoded doubled-quote values', () => {
  for (const value of ['x'.repeat(65536), '"'.repeat(65536)]) {
    assert.equal(parseSponsorsCsv(csv([{ ...source, 'Transaction ID': value }])).records[0].transactionId, value);
    rejects(csv([{ ...source, 'Transaction ID': `${value}x` }]), 'csv_limit');
  }
});

test('permits 5000 data records and refuses 5001', () => {
  const text = csv(Array.from({ length: 5000 }, () => ({})));
  const parsed = parseSponsorsCsv(`${text}\n`);
  assert.equal(parsed.records.length, 5000);
  assert.equal(parsed.records.at(-1).row, 5001);
  rejects(`${text}\n${row({})}`, 'csv_limit');
});

test('UTF-8 byte limit accepts exactly 1 MiB including BOM', () => {
  for (const bom of ['', '\uFEFF']) {
    const prefix = `${bom}${headers.join(',')}\n`;
    let remaining = 1048576 - Buffer.byteLength(prefix) - (headers.length - 1);
    const values = headers.map(() => {
      const length = Math.min(remaining, 65536);
      remaining -= length;
      return 'x'.repeat(length);
    });
    assert.equal(remaining, 0);
    const text = prefix + values.join(',');
    assert.equal(Buffer.byteLength(text), 1048576);
    assert.equal(parseSponsorsCsv(text).records.length, 1);
    rejects(`${text}\n`, 'csv_limit');
  }
  rejects(csv(Array.from({ length: 9 }, () => ({ Metadata: 'é'.repeat(65536) }))), 'csv_limit');
});
