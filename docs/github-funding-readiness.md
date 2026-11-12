# Review repository funding before proposing changes

Use the optional [funding-readiness tool](../tools/github-sponsorship/README.md)
when a maintainer wants to inspect a selected repository's funding destinations
and prepare a private proposal. It connects the existing
[sponsorship playbook](../playbooks/github-sponsorship.md) with source-qualified
configuration checks. A profile or financial manifest is optional.

## What the maintainer can do

1. Select the repository and permitted source material. Use supplied files offline
   or deliberately inspect remote configuration through existing GitHub access.
2. Read the actual source basis: local digest or remote default-branch commit,
   repository file, permitted account defaults and API-reported links. Missing
   inspection stays unknown.
3. Compare supplied support/financial records if useful. Keep their amounts,
   periods, plan states and source versions separate from funding links.
4. Supply explicit destination changes and inspect the proposed YAML and diff.
   Existing links are preserved unless their change is explicitly requested.
5. Decide whether to publish the exact candidate through a separately authorised
   repository/account operation. The tool leaves originals unchanged.

A useful review can end with a conflict, an unknown default or a decision to keep
the existing links. A syntactically valid candidate is not a payment arrangement.

## Place in the wider sponsorship journey

The playbook still drafts introductions, tiers and updates independently. GitHub
owns account eligibility, tier configuration and payouts. This tool handles the
read-only repository-funding review. The optional
[account overview](github-sponsors-account-overview.md) handles profile and tier
context separately. Transaction imports and recurring webhooks remain later scopes.

The [integration design](github-sponsorship-design.md) preserves the boundaries
between `itf-manifest.json`, `funding.json`, `FUNDING.yml`, a public support page
and GitHub account settings. The wider direction remains tracked in
[ItF #93](https://github.com/zhiganov/impact-to-funding/issues/93).

The [check record](github-funding-readiness-checks.md) separates local tests, the
bounded GitHub observation and the final retained-source replay.

## Limits

Use the packet privately. It contains source metadata and may reveal sensitive
associations. ItF does not inspect sponsor identities or transactions through this
tool. API-reported links are distinct from verified public display, recipient
authority, checkout and payout. Installed-copy behaviour and maintainer usefulness
need their own evidence; source tests establish neither.
