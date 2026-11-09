# Optional local support-profile tools

Local inspection and narrow OSS financial projections for the adopted
[`itf.support/0.1-proposal` contract](../../docs/support-profile-contract.md).
This is a separate optional Node package, **not required for ordinary skill use**.
Start with the [authoring and usage guide](../../docs/support-profile-tools.md)
and optional [worksheet](../../assets/support-profile.md). General standalone
profiles include non-software, non-financial and prospective work; OSS projection
requirements must not become a gate for that work.

## Setup

Requires **Node.js 22 or later**. From **this directory only**
(`tools/support-profile` in a trusted copy):

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

Dependencies are pinned to **Ajv 8.17.1** and **jsonc-parser 3.3.1**. No root
dependency installation, SDK, server, host configuration or account is required.
Do not install these just to converse with the skill or draft a prose profile.
Dependency setup can contact the registry; runtime commands do not use the network.

## CLI

Syntax below is relative to the source root; it is an interface reference, **not
an instruction to store inputs or outputs in the checkout**:

```text
node tools/support-profile/cli.mjs inspect INPUT [--source-url URL]
node tools/support-profile/cli.mjs bind INPUT --funding BASE --map MAP --destination-url URL --revision REV --mapping-revision REV --output NEWDIR [--source-url URL]
node tools/support-profile/cli.mjs financial-view INPUT --output NEWDIR [--source-url URL]
```

For runnable examples, use the [guide's private-workspace layout](../../docs/support-profile-tools.md#prepare-the-optional-tool-only-if-needed):
a trusted source copy at `./impact-to-funding`, with inputs/mapping/output under
its sibling `./work`, outside the distributable copy. For example, from that
private workspace:

```sh
node ./impact-to-funding/tools/support-profile/cli.mjs inspect ./work/input.json
```

| Operation | Input and result |
|---|---|
| `inspect` | Standalone or exact enriched OSS carrier; JSON interpretation report on stdout. No rewrite or URL fetch. |
| `bind` | Curated standalone OSS candidate, separately supplied real financial base with known content version, explicit strict-JSON case-ID → plan-GUID object. Maps all and only `money` cases, checks known terms against supplied plans, writes a derived embedded candidate. |
| `financial-view` | Enriched OSS input with exact carrier and known financial source basis; removes only the ItF carrier, preserving other extensions and base values. Writes a financial candidate and loss notes. |

For `bind`, a standalone canonical URL or explicit `--source-url` is required for
the versioned derivation. The new support revision, destination canonical URL and
`derivedFrom` source URL/revision/mapping revision identify the transformation.
Cost basis and existing-support meaning carry into case limitations when money
is replaced by a reference; financial terms are not duplicated. No inferred
budget, defaulted money, currency conversion, activated ask or replacement of an
existing ItF carrier is supported.

Both transforms require valid supported declarations and a valid supported
financial base. Limited/unknown data and unresolved/conflicting references block
transformation with a specific gap. Unsupported financial projections do not
invalidate the broader standalone/manual route or justify fabricating OSS facts.

Writing commands create `funding.json` and `projection-notes.json` in **NEWDIR,
which must not exist**; validation precedes writes and there are no overwrites.
Directory/file permissions are `0700`/`0600`. Stdout contains a brief operation
report, not candidate data. The financial view preserves financial content
version/base values, discloses retained unrelated extensions and records lost ItF
support/report context. It is not a lossless round trip or a new independent
financial authority. Multiple references to one plan are not multiple asks.

## Inspection results and limits

- Exit `0`: valid supported interpretation within the local checks; `2`: limited;
  `3`: invalid; `4`: unsupported; `1`: usage/I/O failure.
- Strict JSON, maximum **1 MiB**, maximum nesting **64**. Comments, trailing
  commas, duplicate keys and unsafe numeric rounding are not accepted; the parser
  dependency does not make JSONC an input format.
- Unknown profiles are unsupported. Unknown data properties limit interpretation;
  unknown enum values in known fields are invalid. No silent nearest-version
  interpretation, repairs or success-shaped empty results.
- Known URL query strings limit interpretation without guesses about their privacy.
  Diagnostics do not echo unknown keys, raw source values or URLs. Native financial
  URL fields/origins and query-free URLs are not privacy-cleared by this reader.
- `money.amount: 0` means **any amount**, not unknown or zero cost. Both amount and
  currency may be absent for an unpriced standalone need. Do not supply defaults
  to make it a ready financial plan.
- Report URLs and external plans are **not fetched**. Report references are
  publisher declarations, not proof of inspection, version-matched evidence,
  independent review or outcomes.
- `fundingSchema` reports upstream structural validation, separately from local
  `fundingMeaning`/`financialIssues`. Unsupported explicit schema declarations
  limit interpretation rather than authorise schema loading. Negative asks are
  refused; permitted optional empty native metadata and historical credits are
  preserved, not silently repaired or rejected as if they were funding requests.

Validation checks structure and declared relationships. It is **not** permission
to process or publish material, verification of identity/authority/impact, or
actual funder eligibility. Approval for processing with an agent/provider and its
retention terms is separate from approval of exact public content and its actual
destination. Private permissions on output files do not settle either question.
Keep private evidence/crosswalks and per-funder packets outside these candidates.

The tool has **no network, publisher, application, payment or source collector**.
It does not fetch reports, replace existing carriers, publish a schema endpoint,
set up authentication or submit to a directory. Real upstream consumer/version
compatibility remains untested until an actual selected test establishes it.

This README specifies usage, not observed test results. Updating source does not
update the installed skill at `fbb8993`; native installation of this updated
source and reliable model routing have not been established by this change.

## Schema and rights

The [contract](../../docs/support-profile-contract.md) remains the field-meaning
source; an executable schema or schema pass does not replace those meanings or
prove consumer acceptance. The [unmodified vendored funding.json v1.1.0 schema](vendor/funding-v1.1.0.schema.json)
is **CC-BY-SA 4.0**, not MIT; retain its [upstream notice](vendor/NOTICE.md).
Original ItF code and its own support schema are **MIT**; see the repository
[licence](../../LICENSE) and [sources](../../SOURCES.md). No upstream, FLOSS/fund
or Zerodha endorsement or extension agreement is implied. These licences do not
grant rights over private inputs or make a local candidate publishable.

## Local checks

After optional dependency setup, run `npm test` from this directory. The tests use
the authored fictional examples and temporary local candidates; they do not run a
directory, funder, hosted service or model. Repository package integrity remains
the separate root command `node --test tests/package.test.mjs`.
See the [observed check record](../../docs/support-profile-checks.md) for the
tested environment, findings, repairs and precise unverified limits.
