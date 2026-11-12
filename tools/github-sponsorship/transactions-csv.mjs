import { createHash } from 'node:crypto';
import { InputError } from './io.mjs';

const HEADERS = [
  'Sponsor Handle', 'Sponsor Profile Name', 'Sponsor Public Email',
  'Sponsorship Started On', 'Is Public?', 'Is Yearly?', 'Transaction ID',
  'Payment Source', 'Tier Name', 'Tier Monthly Amount', 'Processed Amount',
  'Is Prorated?', 'Status', 'Transaction Date', 'Metadata', 'Country', 'Region', 'VAT',
];
const MESSAGES = {
  csv_invalid: 'The CSV structure is malformed.',
  csv_headers: 'The CSV headers do not match a supported observed layout.',
  csv_limit: 'The CSV exceeds a supported input limit.',
};
function fail(code) { throw new InputError(code, MESSAGES[code]); }

/** Parse structural CSV only. Source scalars remain uninterpreted. */
export function parseSponsorsCsv(text) {
  if (typeof text !== 'string') fail('csv_invalid');
  if (Buffer.byteLength(text, 'utf8') > 1048576) fail('csv_limit');
  if (text.startsWith('\uFEFF')) text = text.slice(1);
  let headers;
  let sortedIndexes;
  let indexes;
  const records = [];
  let cells = [];
  let cell = '';
  let quoted = false;
  let closed = false;

  function append(char) {
    cell += char;
    if (cell.length > 65536) fail('csv_limit');
  }
  function finishCell() {
    cells.push(cell);
    if (cells.length > HEADERS.length) fail(headers ? 'csv_invalid' : 'csv_headers');
    cell = '';
    closed = false;
  }
  function finishRecord() {
    finishCell();
    if (!headers) {
      const expected = cells.includes('Payment Source') ? HEADERS : HEADERS.filter(header => header !== 'Payment Source');
      if (cells.length !== expected.length || new Set(cells).size !== cells.length ||
          expected.some(header => !cells.includes(header))) fail('csv_headers');
      headers = cells;
      sortedIndexes = headers.map((header, index) => index).sort((a, b) => headers[a] < headers[b] ? -1 : 1);
      indexes = Object.fromEntries(headers.map((header, index) => [header, index]));
    } else {
      if (cells.length !== headers.length) fail('csv_invalid');
      if (records.length >= 5000) fail('csv_limit');
      const pairs = sortedIndexes.map(index => [headers[index], cells[index]]);
      records.push({
        row: records.length + 2,
        transactionId: cells[indexes['Transaction ID']],
        processedAmount: cells[indexes['Processed Amount']],
        status: cells[indexes.Status],
        transactionDate: cells[indexes['Transaction Date']],
        fingerprint: `sha256:${createHash('sha256').update(JSON.stringify(pairs)).digest('hex')}`,
      });
    }
    cells = [];
  }

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') { append('"'); index++; }
        else { quoted = false; closed = true; }
      } else append(char);
      continue;
    }
    if (char === ',') finishCell();
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[++index] !== '\n') fail('csv_invalid');
      finishRecord();
    } else if (char === '"') {
      if (cell.length || closed) fail('csv_invalid');
      quoted = true;
    } else {
      if (closed) fail('csv_invalid');
      append(char);
    }
  }
  if (quoted) fail('csv_invalid');
  if (cells.length || cell.length || closed) finishRecord();
  if (!headers) fail('csv_headers');
  return { layout: 'github-sponsors-csv/observed-2026', headers, records };
}
