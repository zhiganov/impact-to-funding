# Funding-readiness implementation checks

Checked 2026-11-11 on Node.js 22.18.0, with YAML 2.9.1 and GitHub CLI 2.102.0.
This records source/tool behaviour, not installed-host routing or usefulness.

## Delivered source

- A separate optional package under `tools/github-sponsorship`.
- Offline funding-file inspection and explicit add/replace/remove proposals.
- Read-only inspection of one selected GitHub repository, its public account
  defaults and API-reported funding links, with pinned source revisions.
- Private findings, source evidence, optional support/financial comparison and
  candidate/diff files. Original funding files and financial plans are unchanged.
- Playbook/usage links. The broader sponsorship scope remains in
  [#93](https://github.com/zhiganov/impact-to-funding/issues/93).

## Local verification

| Check | Result |
|---|---|
| Optional funding-readiness package, final source | 180 passed, zero failures or skips. |
| Existing root suite | 125 passed, zero failures or skips. |
| Existing support-profile package | 44 passed, zero failures or skips. |
| Final root source/package checks | Seven passed; includes document/link and licence integrity. |

Tests cover source precedence and unavailable defaults, malformed/ambiguous YAML,
template empty slots, link limits, explicit mapping conflicts, exact custom URL
identity and platform/count differences. They cover unchanged sources, output
permissions, checkout/symlink exclusion, invalid nested records and preserved
inactive financial terms. Collector tests use injected responses and a disposable
fake `gh` to exercise its fixed host/query, timeouts, response bounds, complete
trees, commit/tree/blob identity, public-default policy and safe error reporting.

Independent review found four material issues: output-directory exclusion,
invalid nested record projection, custom trailing-slash comparison and lost
platform/count identity. All were repaired with regressions. The reviewers scored
their listed fixes resolved. Later template-slot support has its own regressions
in the final 180-test suite.

## Real GitHub observation and retained replay

The selected public repository was `zhiganov/impact-to-funding`, pinned at
`99e34c5b29a81cc02492cf1501b83641aea4d59b`. Its public account-default repository
was independently pinned at `863bb240ae531e2542cc19f16da0adf44ca77ccb`.
Complete raw responses were retained privately before projection.

The first pass exposed an API assumption: requesting a tree by a commit alias
returned that alias in `sha`. The collector now requests the exact tree SHA from
the pinned commit, rather than weakening the identity check. One targeted live
correction read only the newly needed exact-tree/blob routes; five successful
metadata/commit/funding-link responses were reused. All source reads returned 200.

That correction retrieved both funding files, but the parser refused unused blank
slots in GitHub's standard funding template. The live route then ended. Source
slot support was repaired and checked offline using the retained source snapshot,
with **no further API calls**. The final CLI replay found both files present,
selected the repository override and retained the supplied financial plan as
inactive. Recipient-role eligibility remains limited. No candidate was requested
or created.

The final parser therefore has local regressions and a retained real-source replay.
It was not followed by another fresh live pass. No source, account, sponsorship,
payment or payout configuration was changed.

## Limits

API-reported funding links are distinct from a verified rendered button, recipient
authority, eligibility, checkout, payout or project allocation. The private packet
is not publication approval. Supplied source claims keep their own disclosure and
processing limits.

No installed skill copy, additional host/model, private sponsor ledger, transaction
importer, webhook listener or payout arrangement was tested or changed. No new
hosting, authentication setup or paid model run was used. Local tests do not show
that ItF causes sponsorship or helps maintainers sustain their work.
