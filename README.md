# Impact to Funding

**Put your skills and experience towards real problems, and build a credible case for support.**

Impact to Funding (ItF) is a skill for your AI agent. It helps you:

- **make claims that hold up:** what you did, kept apart from what it caused, and checked against your evidence;
- **learn from others' work:** a [library](references/library/README.md) of source-linked cases, patterns and lenses, null results included;
- **ask funders that fit:** a support brief built from funders' own pages, with open or closed status and the date checked.

It also helps you find where your skills could be useful and develop shared work with others.

ItF is one half of [ItFtI](https://itfti.org). The other half, [Funding to Impact](https://itfti.org/fti), is a file format funders publish to say what they fund. It's a draft looking for its first funders.

Start with your situation. You don't need a theory of change, a project, evidence or a fundraising goal.

ItF is open source. It's for developers, maintainers and independent builders who already use AI agents. Community organisers, small teams and facilitators may find it useful too.

**Experimental, latest release v0.7.0:** ItF offers conversation, optional templates, reference material and optional local tools. It doesn't find collaborators, provide funding or certify impact. We haven't yet tested how useful it is to people or whether it helps them raise money.

**What's new:** [v0.7.0 release notes](docs/releases/v0.7.0.md).

[Get started](#install-and-use) · [Choose a task](#four-ways-to-start) ·
[See an example](#outputs-and-examples) · [What's available](#what-is-available) ·
[Together](#together-live-and-planned) ·
[Privacy and limits](#status-and-limits)

## Install and use

**Claude Code:** install the plugin. It also brings the optional library server, which needs Node.js 22+.

```sh
claude plugin marketplace add https://github.com/zhiganov/impact-to-funding.git
claude plugin install itf@impact-to-funding
```

Then type `/itf:impact-to-funding`.

**Codex, OpenCode and other agents:** from your project, run

```sh
npx skills add zhiganov/impact-to-funding#v0.7.0
```

It asks which agents to install for. Without Node.js, clone the release into your agent's skill folder instead, for example for Codex:

```sh
git clone --depth 1 --branch v0.7.0 https://github.com/zhiganov/impact-to-funding .agents/skills/impact-to-funding
```

For OpenCode use `.opencode/skills/impact-to-funding`. Then type `$impact-to-funding` in Codex or `@impact-to-funding` in OpenCode.

**What's been checked:** v0.6.0 ran in Claude Code 2.1.328. v0.7.0 installs and updates as the Claude Code plugin with its library server connected, and Codex 0.171.0 and OpenCode 1.19.6 find it. No model ran in those checks ([record](docs/checks/install-commands-2026-11-23.md)).

The [installation guide](docs/install.md) covers installing an exact checked commit, personal installs, updates, removal and troubleshooting. Conversation needs no signup or plugin. Your agent's model costs and privacy terms still apply.

**Official source:** ItF is published only from [this repository](https://github.com/zhiganov/impact-to-funding) and its [releases](https://github.com/zhiganov/impact-to-funding/releases). A copy elsewhere, a similar name or a copied README doesn't make a download official. Check that install commands point here.

**Updates:** on GitHub, choose **Watch → Custom → Releases**, or check the [releases page](https://github.com/zhiganov/impact-to-funding/releases). A notification tells you a version exists. It doesn't change your installed copy. See [release and update guidance](docs/releases.md).

You can also turn on an [in-skill update notice](docs/update-notices.md) for copies installed with the managed CLI. It never updates the copy itself. We haven't confirmed that agents show the notice.

An experimental managed CLI can install, update and roll back copies for you. See the [installation guide](docs/install.md#optional-the-managed-cli).

Read the [privacy guide](PRIVACY.md) before you use real material. You don't need to open the skill's Markdown files yourself.

## Optional manual use

Open a trusted copy of the whole repository in an agent that can read [SKILL.md](SKILL.md) and its references. Ask it to read and follow SKILL.md, then describe your situation. This works without installing, but your agent may not find and load the skill on its own.

## Four ways to start

After you invoke the skill, try one of these. They're starting points, not commands or steps. For manual use, ask the agent to read SKILL.md first.

### Find a useful contribution

> Help me explore where my skills and available time could be useful, including contributing to existing work. Use only what I tell you, say what you're assuming, and keep this private. Do not contact anyone.

### Develop shared work and learn

> Help me describe my role in this shared project, check it against my capacity, and examine what we know about its effects. Include the other people involved and where we disagree. Do not collect or publish anything.

### Learn from others' work

> Find cases in the reference library where a theory of change like mine was tested. Tell me what held up, what didn't, and what might not transfer to my situation.

### Explain what support would help

> Help me prepare a private case for sustaining this work. Keep what happened apart from what I'm proposing, use only known costs and commitments, and say what's uncertain. Do not invent impact, submit an application or contact a funder.

For this task, the current source includes a [support-brief playbook](playbooks/support-brief.md). For GitHub-specific drafts, use the optional [sponsorship playbook](playbooks/github-sponsorship.md). The versions the install steps above give you don't include these playbooks.

A few sentences are enough to start. A useful result might be a possible contribution, a clearer question, a smaller commitment or a decision to stop. It doesn't have to be a report. The [usage guide](docs/usage.md) has more prompts and examples with incomplete evidence.

To understand an existing project's unstated theory of change, use the optional [reconstruction playbook](playbooks/reconstruct-theory-of-change.md). It keeps stated intentions, inferred pathways, people's accounts and supported observations apart. The [fictional walkthrough](examples/theory-reconstruction.md) shows how. The versions the install steps above give you don't include it.

## Outputs and examples

**A fictional illustration, not a real model result:** 60 copies of an access guide were handed out. That doesn't mean 60 households repaired appliances. The [worked example](examples/builder-assessment.md) separates the copies handed out, a small self-reported benefit, repairs nobody measured and future costs nobody confirmed. It also keeps a cheaper alternative to another print run.

ItF helps with that kind of distinction. Describe your actual role, keep claims within their evidence and learn whether the next contribution is worth it. A careful account still isn't verified impact or a funding decision.

To help an existing organisation without starting a project, use the optional [organisation contribution playbook](playbooks/organisation-contributions.md). It covers needs the organisation has shared, and paid or pro bono work. Its [cases](examples/organisation-contributions.md) are fictional. The versions the install steps above give you don't include it.

Other starting points:

- a [five-project portfolio](examples/portfolio-assessment.md) with shared work and competing commitments,
- optional [assessment](assets/assessment.md) and [report](assets/report.md) templates.

You don't need your own theory of change to work on a shared project. Supporting existing work or taking on less can be the right outcome.

## What is available?

This table describes the current source. Older installed versions may not have everything. Ordinary use needs none of the optional software.

| Capability | What it does | Main limit |
|---|---|---|
| [Conversational skill](SKILL.md) and optional templates | Guides you through finding a contribution, working with others, learning what difference it makes and asking for support. | Results vary by agent and model. It doesn't match people, fund work or judge it independently. |
| [Reference library](references/library/README.md) | Cases, candidate patterns and lenses from others' work, with sources. Your agent reads them as part of the skill, or searches them through an optional [local MCP server](mcp/README.md) (Node.js 22+). | Few domains so far, and patterns aren't recipes. The server runs on your machine, uses a saved copy of the library and doesn't search the web. |
| [Framework](references/frameworks.md) and [systems](references/systems-and-complexity.md) guidance | Optional questions drawn from frameworks such as Doughnut Economics, and for work where conditions change and effects are delayed. | No framework is required. These aren't official methods. |
| [Claim objections](references/claims.md#before-a-claim-goes-public-look-for-what-counts-against-it) | Before a claim goes public, the agent asks what counts against it and keeps what it finds. | It's a prompt to look, not an independent review. |
| [Evidence planning](references/evidence-reporting-design.md) | Guidance and an [optional private worksheet](assets/evidence-crosswalk.md) for reusing evidence with different funders. | Whether evidence fits, and whether you may share it, are separate checks. It doesn't collect evidence or contact funders. |
| [Support profiles](references/support-profile-tools.md) | An optional public file, `itf-manifest.json`, saying what support would help, plus local tools to check it. Needs Node.js 22+. | Not just for open source. Nothing requires the file or finds it automatically. The tools don't fetch, publish, apply or pay. |
| [Managed CLI and update notices](docs/managed-skill-updates.md) | An optional CLI that installs, checks, updates and rolls back copies, and opt-in [update notices](docs/update-notices.md). Needs Node.js 22+ and Git. | Experimental. It never updates on its own or changes global settings. Agents may not show the notices. |
| [Impact badge and card](tools/impact-badge/README.md) | Builds a README badge and a small card for one approved public report. Needs Node.js 22+. | Shows what kind of evidence a report rests on, not that the work had impact. The card is text only for now ([#144](https://github.com/zhiganov/impact-to-funding/issues/144)). |
| [Three-month check-back](references/check-back.md) | If you agree, the agent asks once, three months later, whether ItF was useful. It can turn your answers into a public note you submit yourself. Needs Node.js 22+. | It never sends anything itself. |
| [Readability check](tools/readability/README.md) | Flags long sentences, passive voice and adverbs in your drafts. Needs Node.js 22+. | Simple rules, English only. Readable writing isn't necessarily accurate. |
| [Portable records](tools/portable-records/README.md) | Converts versioned records between JSON and Markdown, keeping their review links. Needs Node.js 22+. | Files only. It doesn't publish anywhere. |
| [GitHub funding-readiness review](docs/github-funding-readiness.md) | Checks the funding links in repos you choose, and drafts private findings and changes. Needs Node.js 22+; remote mode uses your GitHub CLI login. | Changes nothing. A link the API reports doesn't prove what's shown publicly, who's paid, or payouts. |
| [Sponsors account overview](docs/github-sponsors-account-overview.md) | Reviews a Sponsors profile and its visible tiers, and can compare them with a draft. Uses the same Node.js package and your GitHub CLI login. | Public data only by default. Changes no settings. |
| [Sponsorship export reporting](docs/github-sponsors-export-reporting.md) | Reviews Sponsors CSV exports you supply, for one account and month, with exact amounts. Runs offline. | Covers only the records you supply, not a full ledger or verified payouts. Keeps sponsor names out of summaries. |
| [Additional practice guides](docs/README.md) | Guidance and fictional cases for hearing from affected people, review, coordination and publishing plans. | No reviewer pool, recruitment, monitoring or publishing service. |

## Together: live and planned

ItF is meant for working with others, not only alone. Belonging, mutual help and shared learning matter in their own right, not only as steps towards funding.

- **Profiles (live):** publish an impact profile at [app.itfti.org](https://app.itfti.org). It's stored in your own ATProto account. Real-account publishing, editing, unpublishing and republishing are verified ([itfti-website#22](https://github.com/zhiganov/itfti-website/issues/22)). See [profile access and demand](docs/profile-access-and-demand.md) for the early adoption evidence and account options. The skill can [prepare a JSON draft](references/profile-draft-handoff.md) for human review in the app; it doesn't connect to the account or publish.
- **Mentors (live, in conversation):** ItF helps you find people, communities and mentoring programmes that could help, including people you don't know yet, and draft a short first message you send yourself. There's no shared mentor pool.
- **Guilds (planned):** voluntary groups that see each other's work and needs in their community's dashboard. See the [guild concept](docs/guilds-itfti-atproto.md) and the [workflow](docs/guild-workflow-assessment.md) and [curation](docs/guild-curation-assessment.md) assessments.
- **Matchmaking (planned):** organisations can publish needs in FtI's [needs format](https://itfti.org/fti/needs). Matching builders to them isn't built.

We can't promise introductions or opportunities. See the [design index](docs/README.md) for other future work.

## Status and limits

- **Private by default.** A local file can still go to a remote model when the agent reads it. Use only material you may share with that provider. Keep private evidence and saved outputs outside this repository; `.gitignore` won't protect them. Read [PRIVACY.md](PRIVACY.md).
- **No action without your say-so.** A draft doesn't authorise publishing, contacting people, uploading evidence, applying, changing accounts or paying. If the agent couldn't open a link, it hasn't checked that evidence.
- **No certification or ranking.** Outputs, donations, signatures and completed assessments don't prove impact. The [responsible-assistance rules](references/responsible-assistance.md) are about real harm and deception. They don't judge whole sectors or people's worth.
- **Limited evidence.** [Development trials](docs/checks/validation-2026-11-04.md) were small, and the examples are fiction. We haven't verified reliable model behaviour, untested agents, usefulness to people or fundraising results.
- **No affiliation.** ItF draws on public Moral Ambition principles. It isn't affiliated with or endorsed by the School for Moral Ambition or Rutger Bregman. [Sources and rights](SOURCES.md) separates original material from third-party sources.

### Licence

Original written content is [CC BY-SA 4.0](LICENSE-CONTENT.md): you can reuse it, commercially too, with credit and under the same licence. Original software is [MIT](LICENSE-CODE). Your own inputs and outputs aren't covered. See [LICENSE](LICENSE) for older versions and third-party parts.

## More documentation

- [Install, update and remove](docs/install.md), [usage](docs/usage.md) and [audience](docs/audience-and-positioning.md): how to install, how to start and who ItF is for.
- [Skill instructions](SKILL.md), [claims](references/claims.md) and [contributions](references/contributions.md): the core workflow.
- [Docs index](docs/README.md): practice guides, contracts, examples and designs, each with its own status.
- [Reports](docs/reports/README.md): shareable project analyses, including the OpenHaven theory-of-change reconstruction.
- [Check records](docs/checks/README.md): ItF source reviews, tests and agent observations.
- [Installation evidence](docs/checks/installation-check-2026-11-04.md): the exact-version checks, earlier attempts and their limits.
- [Development validation](docs/checks/validation-2026-11-04.md) and [earlier release review](docs/checks/release-readiness-2026-11-04.md): small observations and an earlier rights review. They don't prove the current release.
- [Contributing](CONTRIBUTING.md): how to report problems safely, source rights, and the local package checks.

Publishing new code doesn't update installed copies.
