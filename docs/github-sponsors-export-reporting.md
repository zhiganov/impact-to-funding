# Review supplied sponsorship exports

The optional `transactions` command creates a private period review from supplied
GitHub Sponsors CSV exports. It helps a maintainer inspect recorded support before
drafting an update. It keeps financial support separate from work and outcomes.

This extends the [sponsorship tools](../tools/github-sponsorship/README.md).
Ordinary ItF conversation needs no export or funding account.

## Run a private review

Use a trusted source copy with the package's existing dependencies installed.
Keep input files and output outside the skill checkout. In a private workspace,
create a manifest next to the deliberately supplied export files:

```json
{
  "version": "itf.github-sponsors-export-input/0.1",
  "account": "example-maintainer",
  "sources": [
    { "file": "november.csv", "month": "2026-11", "currency": "USD" }
  ]
}
```

The account and values are fictional. File paths resolve relative to the manifest.
Select the real account deliberately. The observed CSV layout has no account or
currency field: these values remain supplied context, rather than verified facts
from the file. Leave currency out when it is unknown; the tool then leaves amounts
uninterpreted. It currently supports USD interpretation only.

```sh
node ./impact-to-funding/tools/github-sponsorship/cli.mjs transactions --account example-maintainer --month 2026-11 --input ./work/exports.json --output ./work/transaction-review
```

`--month` selects a UTC calendar month using each transaction's recorded offset.
The report retains the original timezone-bearing date. The source's supplied
export month is recorded separately. GitHub's public guide does not define its
export-month timezone, so supplying that month does not establish complete UTC
coverage.

The fresh output directory contains:

- `input-manifest.json`: the exact supplied manifest;
- `source-001.txt`, and so on: exact source text, including unsupported records;
- `review.json` and `review.md`: the private review, source digests and limits;
- `failure.json` if processing is refused after output creation.

Raw sources use `.txt` to discourage opening formula-like cells in a spreadsheet.
Open them as text. On POSIX systems, directories use `0700` and files use `0600`.
The tool excludes output inside its skill checkout, including symlink aliases.
Stdout contains only a short safe status summary.

## Read the result

The report includes the selected account and month, exact file digests, supplied
context, source states, included record references and unresolved rows. Logical
row numbers count CSV records, including the header; quoted multiline cells do
not add record numbers.

Amounts use exact decimal arithmetic and are stored as integer-cent strings.
Positive and negative processed amounts are shown separately for usable unique
`settled` records. The totals describe that supported subset. A report with no
included records leaves totals absent rather than claiming zero account income.
Fees, refunds, net income, payouts and expected recurring support stay unknown.
The monthly tier offer is not substituted for the processed transaction amount.

Identical files are counted once. The tool uses transaction IDs to compare records
across files, bound to the selected account. It never deduplicates by sponsor name
or amount. A conflicting ID excludes every conflicting occurrence from totals.
Changes in omitted private fields also keep records in conflict rather than
guessing that they are duplicates. Unresolved records remain in the raw sources.

Normal summaries omit sponsor names, handles, contact details, transaction IDs,
location and arbitrary metadata. Hashed record references support private review.
Source visibility flags do not authorise naming a sponsor in an update. Use the
[sponsorship playbook](../playbooks/github-sponsorship.md) to prepare a separate,
curated update from permitted financial facts and evidence about the work.

## Supported input and source basis

The first adapter supports two observed native CSV header sets: the 18-field
layout documented by a [public hledger rule](https://github.com/hledgerorg/hledger/blob/c4a04b17f616ab0accc2ec5ec8e1c9cce1c8ec24/examples/csv/other/github-sponsorships.rules),
and the same set without `Payment Source`, represented in a
[public consumer's layout description](https://github.com/ActivityWatch/stats/blob/01f5f97209b026dfd26ec4edc6eb32efa76f8c1b/analyze_sponsors.py).
Only structural facts were used; the parser and test rows are original.

The relevant columns are `Transaction ID`, `Processed Amount`, `Status` and
`Transaction Date`. All columns participate in record fingerprints. Header order
can vary. Unknown, missing or duplicate headers leave a file uninterpreted.
The supported monetary form is a dollar-prefixed amount with two decimal places,
optionally grouped with commas or preceded by a minus sign. Dates use
`YYYY-MM-DD HH:MM:SS ±HHMM`. Statuses other than `settled` remain uninterpreted.

GitHub's [export guide](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/viewing-your-sponsors-and-sponsorships)
confirms monthly CSV/JSON transaction exports and a metadata column. It does not
publish a complete row schema. The adapter therefore describes its observed CSV
layout explicitly. JSON and other layouts are outside this first adapter.

Limits are eight files, 1 MiB per source, 5,000 rows per file, 10,000 rows overall,
65,536 characters per cell and a 64 KiB manifest. Quoted CSV commas, newlines and
doubled quotes are supported, along with UTF-8 BOM and LF/CRLF line endings.
Malformed structure leaves the whole file uninterpreted. Invalid financial rows
stay visibly excluded from derived totals.

## Limits

The review covers supplied records, not a complete account ledger. It leaves
account settings, funding destinations and financial plans unchanged. There are
no downloads, account queries, webhooks, payouts, allocation rules or tax advice.

The packet is private. Processing it through an agent/model and publishing a
curated update have separate disclosure boundaries. Campaign metadata alone does
not establish that a campaign caused support.

Validation uses fictional rows in the observed layout. A current native-export
check, installed-host routing and usefulness to maintainers remain unverified.
See the [check record](github-sponsors-export-checks.md).
