// Fictional values in the observed native CSV header layout. No real export rows.
export const headers = ['Sponsor Handle', 'Sponsor Profile Name', 'Sponsor Public Email', 'Sponsorship Started On',
  'Is Public?', 'Is Yearly?', 'Transaction ID', 'Payment Source', 'Tier Name', 'Tier Monthly Amount',
  'Processed Amount', 'Is Prorated?', 'Status', 'Transaction Date', 'Metadata', 'Country', 'Region', 'VAT'];

export const fields = extra => ({
  'Sponsor Handle': 'fictional-private-sponsor', 'Sponsor Profile Name': 'Fictional private sponsor',
  'Sponsor Public Email': 'private@example.test', 'Sponsorship Started On': '2026-10-10 12:00:00 +0000',
  'Is Public?': 'false', 'Is Yearly?': 'false', 'Transaction ID': 'fictional-transaction-1',
  'Payment Source': 'Fictional source', 'Tier Name': 'Fictional tier', 'Tier Monthly Amount': '$5.00',
  'Processed Amount': '$5.00', 'Is Prorated?': 'false', Status: 'settled',
  'Transaction Date': '2026-11-10 12:00:00 +0000', Metadata: '=UNTRUSTED("private")',
  Country: 'Fictional', Region: 'Private', VAT: '', ...extra,
});

export function csv(rows = [{}], selectedHeaders = headers) {
  const quote = value => /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
  return [selectedHeaders.join(','), ...rows.map(extra => selectedHeaders.map(header => quote(fields(extra)[header])).join(','))].join('\r\n') + '\r\n';
}
