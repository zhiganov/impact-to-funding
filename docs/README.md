# Docs

Guides, design notes and check records for Impact to Funding (ItF). Most of these notes are designs. The [Limits](#limits) section says what that means.

## Install and update

- [Install guide](install.md): install in a project or personal folder, invoke the skill in each host, update, remove and troubleshoot. The [installation check record](installation-check-2026-11-04.md) lists limited command-line checks in Codex, Claude Code and OpenCode.
- [Releases](releases.md): how to follow releases and pick a version. [v0.4.0](releases/v0.4.0.md) is the current experimental prerelease. [v0.3.0](releases/v0.3.0.md) and [v0.2.0](releases/v0.2.0.md) are kept for history.
- [Version and provenance](skill-version-provenance.md): how released versions, channels and pins are recorded. The [local inspector](../tools/skill-package/README.md) reads them.
- [Managed updates](managed-skill-updates.md): a command-line tool to install, check, update, adopt, roll back and recover copies of the skill.
- [Update notices](update-notices.md): optional notices inside the skill. Each copy needs its own consent.

## Who ItF is for and how it behaves

- [Audience and positioning](audience-and-positioning.md): builders who work with AI agents are the first audience. Others are welcome. Losing a job or struggling to get hired is one reason people come, not a requirement.
- [Responsible assistance](responsible-assistance.md): the skill's conduct rules. It doesn't blacklist sectors, screen people or rank causes. See the [nine fictional cases](../examples/responsible-assistance.md).
- [Task playbooks](task-playbooks-design.md): maps common jobs to guidance. The first playbook is the [support brief](../playbooks/support-brief.md).
- [Individual theories and shared projects](individual-project-contributions.md): how a person's own theory of change connects to shared projects through bounded contributions. The [contribution reference](../references/contributions.md) is the working guidance. Tracked in [#22](https://github.com/zhiganov/impact-to-funding/issues/22) and [#16](https://github.com/zhiganov/impact-to-funding/issues/16).
- [User feedback guide](user-feedback.md) and [initial-user learning plan](user-learning-plan.md): earlier plans for manual-use feedback. No feedback is being collected through them now.

## Reference library

- [Pattern language design](pattern-language-design.md): linked cases, contextual patterns and optional framework lenses, across any domain.
- [Seed collection](../references/library/README.md): the first original, source-linked notes. Its pattern links are provisional, and it covers few domains. The [skill reads relevant notes](../SKILL.md#use-reference-knowledge-selectively) when they help.
- [Library MCP decision](reference-library-mcp-decision.md): why the library gets its own optional MCP interface, separate from funding discovery. Plain Markdown use stays independent of it.
- [Library MCP contract](reference-library-mcp-contract.md) and [fictional walkthrough](../examples/reference-library-mcp-walkthrough.md): the read-only `itf.library/0.1-draft` interface from [#44](https://github.com/zhiganov/impact-to-funding/issues/44).
- [Local library MCP](../mcp/README.md): a local stdio server for that interface, using prepared public snapshots. Its [check record](reference-library-mcp-checks.md) lists what was tested and the limits of each client.

## Evidence, reporting and support

- [Evidence and reporting design](evidence-reporting-design.md): link private evidence to claims, plan collection in proportion and adapt one body of evidence to different funders' reports. See the [fictional walkthrough](../examples/evidence-reporting.md), the [evidence worksheet](../assets/evidence-crosswalk.md) and the [check record](evidence-reporting-checks.md).
- [Support profiles and funding.json](funding-interchange-design.md): why ItF uses its own support profile, which works beyond open-source projects and can project financial facts into funding.json. See the [direction decision](funding-interchange-direction-decision.md), the [field decision](support-profile-baseline-decision.md) and the [fictional examples](../examples/funding-interchange.md).
- [Support-profile contract](support-profile-contract.md): the accepted fields, types, money rules and how the financial view handles losses.
- [Support-profile tools](support-profile-tools.md): local tools to write, inspect and bind profiles and produce financial views. They make no network calls. See the [check record](support-profile-checks.md).
- [Readability check](../tools/readability/README.md): a local check for drafts and manifest descriptions. It flags long sentences, passive voice and adverbs.
- [Impact badge contract](impact-badge-contract.md) and [tool](../tools/impact-badge/README.md): a repo badge and card that link to an approved public report and state its evidence basis.
- [Optional writing tools](optional-writing-tools.md): the readability check and Pangram, an online AI-text detector you can use from your agent through MCP.
- [Standard.site publishing](standard-site-publishing.md): how approved public reports could use existing Standard.site metadata and tools.
- [AI Registry and Skills CLI](ai-registry-distribution.md): compares registry listings with direct Git distribution.

## Guilds

- [Guilds concept note](guilds-itfti-atproto.md) and [fictional Atmospheric Group walkthrough](../examples/guilds-itfti-atproto.md): ItF users working together as guilds, sharing practice, recognition and learning before any funding.
- [Guild workflow assessment](guild-workflow-assessment.md): how a guild could cooperate, mapped onto Atmospheric Groups ([#53](https://github.com/zhiganov/impact-to-funding/issues/53)). It recommends documentation only.
- [Guild curation assessment](guild-curation-assessment.md) and [fictional policy-change case](../examples/guild-curation.md): how a guild's attributed selection of work can travel between tools ([#52](https://github.com/zhiganov/impact-to-funding/issues/52)). It adds no schema, registry or ranking.

## History

- [Scope snapshot, 2026-11-04](design-scope-2026-11-04.md): the original product and method boundary, kept verbatim. Its notes on implementation and licensing are out of date. The [project README](../README.md) has current status, and the [licence](../LICENSE) explains which licence covers what.

## Limits

- A design note describes a proposal. Only five pieces are working code: the support-profile tools, the local library MCP, the version inspector, the managed-update tool and the readability check.
- Skill guidance tells the agent what to do. Whether a given host and model follow it hasn't been checked.
- Fictional cases and walkthroughs show what we expect. They aren't observed model behaviour.
- Check records list what was run. They don't show that any host, consumer, directory, funder or Atmospheric Groups deployment works with ItF beyond those checks.
- Demand and usefulness haven't been tested with real users.
- ItF doesn't supply matching, introductions or funding. Nothing here approves publication, integrations or moving money.
