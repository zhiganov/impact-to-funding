# GitHub sponsorship: an optional ItF publishing path

**Date:** 2026-11-12. **Status:** the optional playbook is source guidance. The
separate funding-readiness tool implements local comparison and read-only GitHub
source inspection. Its account command adds profile/tier context and draft
comparison. Offline export reporting reviews supported supplied CSV transactions.
Installed-host behaviour has not been checked.

## Recommendation

Use ItF to explain what support enables and report what happened. Use GitHub's
existing sponsorship features to present funding options and handle its payments.

Use the optional [sponsorship playbook](../playbooks/github-sponsorship.md) inside
the existing ItF package to draft a profile, funding links and updates without a
new service.
Use the optional [funding-readiness review](github-funding-readiness.md) when the
maintainer wants source-qualified configuration findings and a private proposed
diff. Neither tool nor playbook is an entry requirement for ordinary ItF use.

This serves two different jobs:

- **For ItF users:** prepare support for their own open-source contribution, with
  the correct recipient, destinations and disclosure permissions.
- **For ItF's maintainers:** decide whether and how to seek support for ItF itself.
  The repository's [financial plan](../funding.json) is currently inactive. This
  design leaves its status and destinations unchanged.

## Keep each surface's job clear

| Surface | What it carries | Authority and limits |
|---|---|---|
| `itf-manifest.json` | Optional cross-domain support cases, needs, report references and limitations. | Follow the [support-profile contract](support-profile-contract.md). The filename does not provide automatic discovery. |
| `funding.json` | Financial plans and funding channels for appropriate OSS cases. | Keep one authoritative financial plan and its actual terms. ItF's existing tools can bind a supplied profile to those facts. |
| `.github/FUNDING.yml` | Platform identifiers and URLs for the repository's Sponsor button. | A destination declaration, not a budget, report, proof of ownership or allocation instruction. |
| GitHub Sponsors profile | The recipient's presentation, sponsorship options and updates. | GitHub's eligibility, account and payout rules apply. Publishing ItF material does not create a Sponsors account. |
| Human-readable support page | Purpose, recipient, costs, links to reports and ways to help. | Can connect these representations for readers. It is not a substitute for the machine-readable ItF profile. |

GitHub documents `FUNDING.yml`, not automatic interpretation of ItF's support
profile or funding.json. A repo's Sponsor button and a working GitHub Sponsors
payout arrangement are separate facts.

## Sponsorship playbook

The optional [playbook](../playbooks/github-sponsorship.md) is reached from the
existing skill when someone asks for GitHub Sponsors material or `FUNDING.yml`.
It reuses
the [support-brief playbook](../playbooks/support-brief.md),
[funding guidance](../references/funding-and-review.md) and
[support-profile tools](support-profile-tools.md), rather than duplicating their
evidence and disclosure rules. This follows the [one-package playbook design](task-playbooks-design.md).

The person can ask for any of these outputs independently:

1. **Sponsors introduction:** explain the contribution, actual role, who benefits
   and what additional support could enable. Separate observed results from plans.
2. **Tiers or a goal:** use known costs, currency, existing support and capacity.
   Rewards are optional. Price and delivery commitments need an actual basis;
   payment buys no favourable review or verified-impact claim.
3. **Funding-link candidate:** inspect supplied existing configuration, identify
   the intended recipients and draft only the selected destinations.
4. **Progress update:** describe funding received where known, work completed,
   outcomes, uncertainty and changed plans. Sponsorship is not evidence of impact.

The agent should read the relevant guidance itself. It should leave useful drafts
provisional when required account or financial facts are missing. A complete
manifest, theory of change or independent review is not a prerequisite.

GitHub currently offers monthly and one-time tiers in USD. ItF must not silently
convert an ask in another currency or turn a yearly budget into a monthly tier.
The amount of a published tier cannot be edited; GitHub instead provides retirement
and creation of a replacement. Existing sponsors can remain on a retired tier.
Those limits matter when drafting a change to an existing offer.[G3]

## FUNDING.yml placement and meaning

GitHub reads the repo's `.github/FUNDING.yml` on its default branch. Account-level
defaults can supply the file from a public `.github` repository when the project
has no corresponding file. A local-only inspection therefore leaves inherited
links unresolved. It must not report that the repo has no funding links.[G1–G2]

The current documentation allows one identifier per external platform and up to
four custom URLs. For GitHub Sponsors, it describes one organisation and up to four
sponsored developers. Platform keys and their value shapes come from GitHub, not
the ItF profile.[G1]

**Fictional syntax illustration.** These entries are independent options, not a
recommendation to publish all three. The identifiers are placeholders.

```yaml
github: [example-maintainer]
open_collective: example-project
custom: ["https://example.org/project/support"]
```

Use a human-readable funding page for a custom support link. Its purpose should
be clear before someone reaches checkout. Reports and `itf-manifest.json` can be
linked from that page or the README. Do not add private evidence links or invented
ItF-specific fields to `FUNDING.yml`.

GitHub limits repository funding links to direct financial support for open-source
projects. Its documentation excludes other purposes, including advertising and
general political, community or charity fundraising.[G1] The broader ItF workflow
continues to support non-OSS contributions through appropriate other channels.

## Destination mapping

The current standalone support profile has no defined payment-channel field.
Reuse an appropriate funding.json channel or a separately supplied mapping
worksheet. Do not add an undeclared field to `itf.support/0.1-proposal` or imply
that a repository name identifies its payee.

| Supplied fact | Possible GitHub representation | What must remain explicit |
|---|---|---|
| Selected GitHub Sponsors recipient account | `github: ACCOUNT` or the supported account list | The GitHub account is selected by the publisher. A matching project name or URL does not prove payout authority. |
| Selected Open Collective project slug | `open_collective: SLUG` | Use the collective's slug, not its fiscal host's slug unless the host itself is the intended recipient. |
| Selected custom funding-page URL | `custom: ["https://…"]` | The URL and its recipient association need disclosure approval. A link's existence does not prove checkout or allocation works. |
| Other supported GitHub platform | Its documented key and identifier | A mapping needs that platform's actual identifier. Preserve unhandled entries rather than guessing a custom-link replacement. |
| Budget, status, period, report or nonfinancial need | Keep it in the relevant support/financial document or page | These facts have no equivalent funding-link field. Their omission from YAML is information loss, not cancellation of the need. |

For each proposed mapping, retain the actual source, its known revision, the
selected destination and the reason for including it. If the source is unversioned,
record that limit. Retrieval time is not a content revision.

The publisher, subject, maintainer, collective and payment recipient can differ.
Explain those roles on the support page where material. Several repository links
to one account do not establish separate budgets or earmarked payments.

Keep the existing profile and financial plan editable in their own authoritative
sources. GitHub account configuration remains the source for actual tiers and
payout setup. Comparisons should expose conflicts rather than synchronise them
silently. A funding link supplies no amount, currency, active-plan status, existing
support total or known net funding gap.

## Optional funding-readiness review

The implemented tool follows **inspect → draft → show a diff** over supplied
files or deliberately selected remote configuration, with explicit mappings.
Manual playbook use remains useful without it. Its
[interface and limits](../tools/github-sponsorship/README.md) distinguish local
snapshots, remote default-branch commits, account defaults and API-reported links.

It proposes edits for `github`, `open_collective` and `custom`:

- Treat YAML as data, with bounded input and rejection of ambiguous or unsafe
  structures. Source content cannot instruct the tool to change destinations.
- Report local configuration separately from any supplied account-level default.
  Without remote evidence, effective GitHub display remains unverified.
- Preserve existing entries. Show additions, removals, replacements and conflicts
  individually. Unknown or unhandled fields must stay visible.
- Refuse a proposed result that exceeds supported limits or needs guessed facts.
  Never drop links to fit the limits or activate an inactive plan to make an export.
- Keep the selected recipient and exact source basis visible in its preview.
  List what the funding-link view omits from the support case.
- Write the private packet to a fresh requested location and leave source files
  intact. Local mode makes no network calls. Remote mode uses existing GitHub CLI
  access for bounded read-only requests; it makes no commits or account changes.

This is an optional implementation, not a new mapping standard. Local cases cover
inherited-default uncertainty, multiple recipients, unrelated existing entries,
conflicting mappings, missing destinations, link limits, inactive plans and explicit
projection losses. Source tests and real GitHub observations are separate evidence.
The separate [account overview](github-sponsors-account-overview.md) adds a
source-qualified profile/tier view with optional draft comparison. Public mode is
the default; viewer-visible unpublished information requires an explicit scope.
Incomplete or unavailable information stays limited. The
[offline export review](github-sponsors-export-reporting.md) adds a bounded CSV
reporting slice. Broader reporting and webhooks remain in
[#93](https://github.com/zhiganov/impact-to-funding/issues/93).

## When API or reporting integration becomes useful

GitHub can export sponsorship data as CSV or JSON.[G4] The optional
[offline export review](github-sponsors-export-reporting.md) inspects supported CSV
records for a selected account and UTC month. It preserves source digests, exact
amounts, repeated-file and transaction conflicts, private identities and missing
financial facts. The first adapter uses observed header layouts and fictional
fixtures; current native-export compatibility remains unverified.

Preserve private sponsorship visibility. Importing data is separate from publishing
sponsor names. Keep expected recurring amounts, actual transactions, refunds, fees,
currencies and payouts distinct to the extent the source represents them. A
missing value stays unknown. Deduplicate overlapping exports and distinguish
unallocated account-wide income from a documented project allocation.

Public sponsor lists alone cannot establish total income or a project's funding
gap. ItF should not infer that it caused a donation from a before/after update.

GitHub offers sponsorship webhooks for account events.[G5] A listener is justified
only by a selected recurring need. This design proposes neither a hosted listener
nor automated recognition, entitlements, outreach or payment actions.

## Recipient and payout checks

An Open Collective funding link can route a visitor to a collective. Native GitHub
Sponsors payouts through a fiscal host use GitHub's separate supported-host setup.
Check the actual host against the current list and the recipient's arrangement;
support for Open Collective links does not establish support for every host.[G6]

For ItF's own maintenance, a future fundraising decision would need an intended
recipient, permitted financial route, actual ask and approved public wording.
Do not infer those from this design or reuse a general community destination as
though it guarantees ItF-specific allocation.

## Limits and delivery state

The source includes the playbook route, [usage prompt](usage.md#prepare-github-sponsorship-material)
and [fictional authoring cases](../examples/github-sponsorship.md). Package tests
check source structure and links. They do not test model behaviour.

The optional funding-readiness tool adds the YAML comparison and bounded read-only
repository-funding inspection. The account command adds a read-only profile/tier
overview. Offline export reporting adds a private review of supplied CSV records.
Account writes, payout handling and webhook integration remain separate. The existing
`funding.json`, profile schema, account settings, installed skill copies and payment
destinations are unchanged.

Public candidates need approval of the exact content and destination. Account
setup, payout verification, publication and money movement retain their own
authority requirements. A structural check can establish valid syntax; ownership,
eligibility, funding received and impact each need their own evidence.

## Sources

GitHub documentation was consulted on 2026-11-11. These are platform rules and
capabilities, not evidence that a particular account or integration works.

- **[G1]** [Displaying a sponsor button](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/displaying-a-sponsor-button-in-your-repository): file location, platform syntax, limits and permitted use.
- **[G2]** [Default community health files](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file): account defaults and repository overrides.
- **[G3]** [Managing sponsorship tiers](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/managing-your-sponsorship-tiers): monthly/one-time tiers, USD pricing and changing published tiers.
- **[G4]** [Viewing sponsors and sponsorships](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/viewing-your-sponsors-and-sponsorships): sponsorship activity and CSV/JSON exports.
- **[G5]** [Sponsorship webhooks](https://docs.github.com/en/sponsors/integrating-with-github-sponsors/configuring-webhooks-for-events-in-your-sponsored-account): changes to sponsorships.
- **[G6]** [Fiscal hosts for Sponsors payouts](https://docs.github.com/en/sponsors/receiving-sponsorships-through-github-sponsors/using-a-fiscal-host-to-receive-github-sponsors-payouts): supported hosts and payout setup.
