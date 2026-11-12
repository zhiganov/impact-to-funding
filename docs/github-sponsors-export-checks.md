# Sponsorship export-reporting checks

**Date:** 2026-11-12. **Scope:** the optional offline
[export review](github-sponsors-export-reporting.md), extending main
`0d4dbfb289c55bc3066676a61d51ee7b13ccdb71`.

## Implemented behavior

The `transactions` command reads a manifest and deliberately supplied CSV files.
It reviews one selected account and UTC month, saves exact private sources and
digests, and summarizes usable unique settled records. Account, export month and
currency remain supplied context. The source layout has no account/currency field.

The first adapter supports the observed 17- and 18-header CSV layouts linked in the
guide. Only USD dollar-amount interpretation is supported. Unknown currencies,
statuses, malformed fields and unsupported layouts remain explicit gaps.
Positive and negative amounts stay separate. An empty usable result has no total.

## Checks

Environment: Node.js v22.18.0 on macOS. All inputs were fictional.

| Check | Result |
|---|---|
| Sponsorship package: `npm test` in `tools/github-sponsorship` | 274 passed; zero failures or skips. |
| Structural CSV parser tests, included above | 10 passed. |
| Transaction interpretation tests, included above | 19 passed. |
| Actual transaction CLI tests, included above | 7 passed. |

The existing repository-funding and account-overview tests are included in the
package run. The new parser checks both header layouts, reordered headers, BOM,
quoted commas/newlines, doubled quotes, invalid structure, privacy projection,
cell/row/byte limits and full-field record fingerprints.

Interpretation checks cover exact large and signed amounts, repeat files,
identified duplicates, conflicting IDs, conflicting supplied currency, unknown
currency/status, empty results, month boundaries, impossible timestamps, unchanged
inputs and the combined record limit. Monetary calculations use integer arithmetic.

The actual CLI tests check deterministic replay, exact input digests and retained
bytes, safe stdout, omission of sponsor details, private POSIX permissions, output
and symlink exclusion, context mismatch, unsupported options, malformed files and
input limits. A fake `gh` sentinel confirms that the offline command never invokes
the GitHub CLI.

## Review and corrections

Independent structural-parser and cross-module review found three related defects
in the initial integration. Focused regressions and a targeted review recheck
confirmed their repair:

- A valid UTC-period transaction now survives uncertain export-month coverage.
- Export month is provenance, rather than part of financial transaction equality.
- Blocked sources still contribute known IDs/fingerprints to conflict detection,
  so another file cannot bypass a known contradiction.

The final local pass also refuses trailing-newline account/month/currency values.
Raw formula-like cells remain source text and are saved with a `.txt` extension.
The tool creates no spreadsheet output.

## Evidence limits

The public GitHub guide confirms exports, but does not publish a full row schema.
Public consumers establish observed headers and representations. Fictional rows
test that supported layout; they are not a current native export or an end-user
trial. Current native-export compatibility, installed-host routing and maintainer
usefulness remain unverified.

No private export, live account read, new authentication or paid model run was
used. The tool leaves account settings, funding files, financial plans and installed
copies unchanged. Transaction amounts do not verify payouts or impact.
