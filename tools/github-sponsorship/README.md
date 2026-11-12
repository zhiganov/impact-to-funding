# GitHub sponsorship review tools

An optional local tool for inspecting one repository's funding links and preparing
a private review packet. The separate `account` command reviews a Sponsors profile
and visible tiers. Both preserve sources. Ordinary ItF use needs neither tool nor
a GitHub account.

## Setup

Requires Node.js 22+. From this directory in a trusted source copy:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

The package pins `yaml` 2.9.1. Remote mode uses an already installed and signed-in
GitHub CLI (`gh`), targeting github.com. It performs only fixed read-only requests;
it does not log in, create an OAuth app or change authentication.

Optional support/financial inspection reuses `tools/support-profile`. Install that
package's locked dependencies only when using `--support` or `--funding`:

```sh
npm --prefix ../support-profile ci --ignore-scripts --no-audit --no-fund
```

These setup commands may contact the package registry. They receive no review data.

## Run a review

Keep inputs and output outside the distributable skill. From a private workspace
containing a trusted copy at `./impact-to-funding` and inputs under `./work`:

```sh
# Supplied files only; makes no network calls.
node ./impact-to-funding/tools/github-sponsorship/cli.mjs review --repository example-owner/example-repo --local ./work/FUNDING.yml --output ./work/review

# Deliberately selected remote repository, using existing gh access.
node ./impact-to-funding/tools/github-sponsorship/cli.mjs review --repository example-owner/example-repo --remote --output ./work/remote-review
```

The names above are fictional placeholders. Choose the actual repository and
authorise its inspection before using remote mode. A local snapshot is not proof
of the remote default branch or the public Sponsor button.

Options:

| Option | Meaning |
|---|---|
| `--defaults FILE` | Local mode only: deliberately supplied account-default funding file. A present repository file overrides it, including an empty file. |
| `--mapping FILE` | Strict JSON proposing selected additions, replacements and removals. Without it, inspection creates no YAML candidate. |
| `--support FILE` | Deliberately supplied standalone or embedded support profile. Uses the existing inspector and preserves limited interpretations. |
| `--funding FILE` | Separately supplied funding.json financial source. Retains amount, currency, period and inactive status. |
| `--support-source-url URL` | Optional cleared canonical source context for the support input; never fetched. |
| `--funding-source-url URL` | Optional cleared source context for financial references; never fetched. |

`--local` and `--remote` are mutually exclusive. `--output` must name a fresh
directory. Existing directories and symlinks are refused before remote reads.

### Propose an explicit change

This entirely fictional mapping adds a support page while leaving other entries
alone:

```json
{
  "add": { "custom": ["https://example.org/guide/support"] }
}
```

Supply it with `--mapping ./work/mapping.json`. The mapping may contain `add`,
`replace` objects and a `remove` list of platform keys. A key must occur in only
one operation. Adding an existing key, replacing a missing key or removing a
missing key is a conflict. Select replacement values explicitly; the tool never
chooses a recipient or combines account-wide income into project allocations.

Edits support `github`, `open_collective` and `custom`. Other flat platform
entries remain visible and unchanged. Ambiguous YAML, duplicate keys, aliases,
anchors, tags, merge keys, multiple documents and nested structures are refused.
Unused blank/null platform slots from GitHub's template are preserved as source
data with no declared destination. Use explicit `replace` to populate an existing
empty slot; mapping values still require actual selected destinations.
GitHub account-role eligibility remains unverified. Custom URLs support HTTPS
without credentials, query strings, fragments, literal IPs or local hostnames.
This supported subset is not privacy clearance for a URL or its association.

## Source basis and output

Remote inspection pins each inspected repository's default branch to a commit.
It uses complete Git trees to locate `.github/FUNDING.yml`, then checks the blob
and UTF-8 bytes. The account-default path is `.github/FUNDING.yml` inside the
account's public `.github` repository. Non-public or uninspectable defaults stay
unknown. A 404 by itself never establishes an absent funding file.

API-reported funding links are recorded separately from file interpretation.
They establish neither the rendered button nor ownership, eligibility, checkout
or payouts. Source conflicts and missing inspection remain visible. An unknown
effective source blocks a requested candidate; it is not replaced with an empty
file. A candidate based on known defaults shows that creating a repository file
would override those defaults.

The fresh output directory contains:

- `source-responses.json` in remote mode: complete provider response envelopes.
- `source-observations.json`: the inspected sources and exact local digests or
  remote revisions, including raw funding text.
- `review.json` and `review.md`: findings, limits, optional financial comparison and
  explicit proposed changes.
- `FUNDING.candidate.yml` and `FUNDING.diff` only when a proposal can be prepared.
- `failure.json` if an operation is refused after output creation. A failed review
  may leave its private evidence directory for inspection; it is not a candidate.

On POSIX systems, directories use `0700` and files `0600`. Windows uses its own
filesystem controls. Stdout prints only a short operation/status summary. Treat
the complete packet as private, including repository names and response metadata.

The remote route makes at most 12 calls, with 15-second per-call and 120-second
overall limits and no retries. Authentication failures and resource exhaustion
stop further inspection. Funding files are capped at 64 KiB and 64 flat entries;
provider responses at 1 MiB. Optional support/financial inputs use their existing
1 MiB interpretation contract.

| Exit | Meaning |
|---|---|
| `0` | Inspected within the stated source scope. This is not publication readiness. |
| `2` | Limited interpretation; read the missing facts and warnings. |
| `3` | Blocked proposal or refused input. |
| `1` | Usage, setup or I/O failure. |

## Limits

The tool writes only the requested private packet. It makes no source edits,
commits, account changes, remote sponsor/transaction reads or payments. Report and support
page URLs are not fetched. A URL match is a comparison, not recipient verification.
Financial plans remain authoritative in their supplied source; links do not
activate them. The offline transaction command below handles supplied exports;
webhooks remain separate work.

## Sponsors account overview

Use `account` for one deliberately selected account's profile and visible tiers:

```sh
node ./impact-to-funding/tools/github-sponsorship/cli.mjs account --account example-maintainer --remote --output ./work/account-review
node ./impact-to-funding/tools/github-sponsorship/cli.mjs account --account example-maintainer --local ./work/earlier-review/source-observations.json --output ./work/offline-account-review
```

The account is fictional. Select and authorise the actual target before remote
inspection. Public mode is the default. `--visibility viewer` explicitly requests
the nonpublic profile and unpublished tiers visible to existing credentials. It
does not expand their permissions. `--draft FILE` compares an account-bound JSON
proposal without applying it.

The [account overview guide](../../docs/github-sponsors-account-overview.md) explains
the proposal format, tier IDs, visibility, pagination and output. A local snapshot
is supplied evidence rather than a current account read. Prices remain integer
USD cents with monthly or one-time cadence; tier offers are not income. The
account command writes the same private evidence/report files, with no funding-file
candidate. Input files are read up to 1 MiB; each parsed snapshot or draft must
also fit the core's conservative 512 KiB, 12-level and 12,000-node limits.

The account collector has its own fixed GraphQL query allowlist. It permits at
most six requests, five tier pages and 250 tiers, with 15-second request and
90-second total limits, 1 MiB responses and a normalized snapshot below 480 KiB.
It makes no retries. Partial sources stay partial. Viewer-visible tiers are not a
complete admin inventory. It excludes sponsor identities and financial activity.

Source data cannot authorise a change or publication. Review the exact candidate,
intended recipient and destination before any separately authorised use. Permission
to process information with an agent/provider is separate from public disclosure.

## Offline export reporting

The `transactions` command reviews deliberately supplied native-shaped CSV exports
for one account and UTC month. It saves a private period review with exact source
digests, overlap checks and unknown financial facts. It makes no network calls.

```sh
node ./impact-to-funding/tools/github-sponsorship/cli.mjs transactions --account example-maintainer --month 2026-11 --input ./work/exports.json --output ./work/transaction-review
```

The account is fictional. See the [export-reporting guide](../../docs/github-sponsors-export-reporting.md)
for the source manifest, supported observed headers, private output and limits.
The first adapter supports CSV, settled-record dollar amounts and explicitly
supplied USD context. Unsupported records stay visible as gaps. Account-wide
income, payouts and project allocation are not inferred from a partial summary.

## Checks and rights

```sh
npm test
```

Tests use fictional local inputs, injected API responses and a fake `gh` executable.
They are distinct from a real GitHub observation or installed-host/model check.
See the [account-overview check record](../../docs/github-sponsors-account-checks.md)
for the implemented scope and measured results.
Original code/tests are MIT; written guidance is CC BY-SA 4.0. See the root
[licence scope](../../LICENSE). GitHub API/platform rules remain GitHub's own.
