# Review a Sponsors profile and tiers

The optional account overview reads a selected GitHub Sponsors profile and its
visible tiers. It can compare the source with supplied draft text and terms. It
saves a private review packet and leaves the account unchanged.

This extends the [funding-readiness review](github-funding-readiness.md). Repository
funding links describe destinations; the account overview describes the offer at
one selected account. Ordinary ItF use needs neither tool.

## What a maintainer can do

1. Select the account and the permitted visibility scope.
2. Inspect its profile introduction and source-visible tiers, or supply a saved
   account snapshot offline.
3. Read the source basis, observation time, pagination state and visibility limits.
4. Optionally compare a proposed introduction or tier terms with the source.
5. Decide which facts or changes need review before editing GitHub manually.

The account is selected explicitly. A repository name, support-profile subject or
matching URL does not select its payment recipient.

## Run an overview

Use the existing optional package's [setup instructions](../tools/github-sponsorship/README.md#setup).
Keep private inputs and output outside the skill checkout. In a private workspace
with a trusted source copy at `./impact-to-funding`:

```sh
# Read a deliberately selected account through existing gh access.
node ./impact-to-funding/tools/github-sponsorship/cli.mjs account --account example-maintainer --remote --output ./work/account-review

# Re-examine a deliberately supplied saved snapshot without network calls.
node ./impact-to-funding/tools/github-sponsorship/cli.mjs account --account example-maintainer --local ./work/earlier-review/source-observations.json --output ./work/offline-review
```

The account above is fictional. Choose the real target and authorise its inspection
before using remote mode. A saved snapshot retains its original observation time;
it does not establish current account state.

### Choose visibility

The default `--visibility public` reads a public profile and published tiers.
It checks the listing's public visibility before requesting its introduction.

`--visibility viewer` explicitly requests a nonpublic profile and unpublished tiers
that the existing credentials may see. It leaves credentials unchanged. GitHub
restricts drafts to listing admins. Retired tiers may also be visible to existing
sponsors on those tiers. This mode therefore means viewer-visible information,
rather than a complete admin inventory.

Publication status comes from the published-only query or the source's admin
metadata. Unavailable metadata leaves status unknown. Source text and a supplied
snapshot cannot opt themselves into a wider visibility scope.

### Compare a draft

Use `--draft ./work/draft.json` with an explicitly account-bound proposal:

```json
{
  "account": "example-maintainer",
  "profile": {
    "fullDescription": "A proposed introduction about the work and support need."
  },
  "tiers": [
    {
      "id": "the-selected-source-tier-id",
      "amountInCents": 600,
      "currency": "USD",
      "cadence": "monthly"
    }
  ]
}
```

These are fictional values. Existing tiers are matched by their source ID, not by
name. A proposal without an ID is a new tier proposal. An unknown ID stays
unobserved. Omitted fields make no proposed change; omitted tiers are not removals.

GitHub tier prices are USD. The overview keeps integer cents and distinguishes
monthly from one-time terms using `isOneTime`, even though the API's price field is
named `monthlyPriceInCents`. A proposed other currency stays unconverted. Changing
a published price requires retiring that tier and creating another; existing
sponsors can remain on a retired tier.

## Source and output

Remote mode uses fixed read-only GraphQL queries through the existing GitHub CLI.
It requests profile and tier fields only. It retains complete response envelopes
privately before projecting the supported fields into the report.

The fresh output directory contains:

- `source-responses.json` for remote response evidence;
- `source-observations.json` for the account snapshot;
- `review.json` and `review.md` for the overview and optional comparison;
- `failure.json` if an operation is refused after directory creation.

Local snapshot and draft inputs receive exact content digests. The saved snapshot
has its own digest. On POSIX systems, the directory uses `0700` and files use
`0600`. Stdout contains only a short status summary. The tool refuses output inside
its skill checkout, including symlink aliases and existing output directories.

The snapshot is a tool-local interchange format, not a new ItF support-profile
standard. `itf.github-sponsors-account/0.1` identifies its supported shape. A remote
packet's snapshot can later be supplied to local mode. Missing access, partial
pages, unavailable fields and conflicting source information remain visible.

Remote collection permits at most six requests, five tier pages and 250 tiers,
with 15-second request and 90-second overall bounds and no retries. Response
envelopes are bounded at 1 MiB; normalized snapshots stay below 480 KiB. A malformed
tier page is rejected as a whole. Valid profile data and earlier tier pages remain
available, with incomplete coverage explicit. Reaching the last visible page
establishes completeness only within that visibility scope.

## Limits

Account observations are dated reads across requests, not an atomic content
revision. They leave recipient authority, eligibility, checkout, payouts and
project allocation unverified. Tier prices are offers, not income received.

This slice excludes sponsor identities, transactions and payout/contact/billing
fields. It leaves account settings, funding destinations and financial plans
unchanged. Publication and processing through an agent/provider have separate
disclosure boundaries. Review the exact proposed content before publishing it.

Source tests establish the tool's tested behavior. Installed-host routing and
maintainer usefulness require their own evidence. No live account target or
private account inspection was part of this implementation's validation. See the
[check record](github-sponsors-account-checks.md).

## Sources

GitHub documentation consulted 2026-11-12:

- [Sponsors GraphQL reference](https://docs.github.com/en/graphql/reference/sponsors): listing fields, tier prices, visibility, admin metadata and pagination.
- [Managing sponsorship tiers](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers): USD/monthly/one-time terms, published-price changes and existing sponsors.
- [Sponsors API entry point](https://docs.github.com/en/sponsors/integrating-with-github-sponsors/getting-started-with-the-sponsors-graphql-api).

The wider journey and remaining reporting/lifecycle work stay in
[ItF #93](https://github.com/zhiganov/impact-to-funding/issues/93).
