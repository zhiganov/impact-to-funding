# Sponsors account overview checks

**Date:** 2026-11-12. **Scope:** source implementation and local fixtures for the
optional [account overview](github-sponsors-account-overview.md), extending main
`55c7334f7521c499b22c702a5fd5cf5ff55e2e48`.

## Delivered behavior

The `account` command reviews one explicitly selected Sponsors profile and visible
tiers. Public mode is the default. Viewer mode requests the nonpublic profile and
unpublished tiers visible to existing credentials. Optional account-bound drafts
compare introduction and tier fields without applying changes.

The private packet records source time, visibility, pagination and content digests.
Offline replay preserves the original observation time and source mode. Tier prices
remain integer USD cents, with monthly and one-time cadence kept distinct.

## Measured checks

On Node.js v22.18.0 on macOS:

| Check | Result |
|---|---|
| `npm test` in `tools/github-sponsorship` | 238 passed; zero failures or skips. |
| `node --test --test-concurrency=1 tests/*.test.mjs` from the root | 11 passed; zero failures or skips. |
| Focused core review tests, included in the tool suite | 28 passed. |
| Focused account collector tests, included in the tool suite | 20 passed. |
| Collector plus existing transport regressions | 53 passed; included in the tool suite. |

The CLI integration test launches the actual command with a fake `gh` executable.
It checks the fixed host/query transport, retains two fictional response envelopes,
creates a review packet, and replays its snapshot offline without another request.

Other fixtures cover public/viewer boundaries, hidden or contradictory admin flags,
monthly/one-time terms, unavailable profiles, partial pages, repeated cursors,
duplicate tiers, changing totals, malformed fields and request/size/time limits.
Draft comparisons preserve unknown baselines, source IDs, unconverted other
currencies and the published-price retirement warning. Omitted tiers produce no
removal claim.

Privacy checks cover private POSIX permissions, checkout and symlink exclusion,
unchanged inputs, exact digests, safe stdout and omission of unsupported nested
source fields. The existing repository-funding command's tests also pass.

## Review findings resolved

- Null profile values in supplied snapshots remain unknown comparison baselines.
- Normal Unicode joining characters remain valid; unsafe control text is refused.
- Collector field and snapshot limits fit the core's validation limits.
- The viewer fixture uses admin metadata provenance rather than public-query provenance.

Remote profile nulls remain invalid because the documented provider fields are
nonnull. Supplied normalized snapshots may use null to record an unknown value.
A malformed tier page is rejected atomically. Valid profile data and earlier
pages survive, with incomplete coverage explicit; raw rejected envelopes stay
in the private packet.

## Limits

All account inputs were fictional fixtures or injected responses. No live Sponsors
account, private account data or new authentication was used. Installed copies,
host/model routing and maintainer usefulness were not checked.

This slice leaves account settings, funding files and financial plans unchanged.
It excludes sponsor identities, transaction history and payouts. Tier offers are
distinct from income, project allocation and outcomes. Broader reporting and
lifecycle work remains in [#93](https://github.com/zhiganov/impact-to-funding/issues/93).
