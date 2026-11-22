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

**Experimental, latest release v0.6.0:** ItF offers conversation, optional templates, reference material and optional local tools. It doesn't find collaborators, provide funding or certify impact. We haven't yet tested how useful it is to people or whether it helps them raise money.

**What's new:** [v0.6.0 release notes](docs/releases/v0.6.0.md). `main` is ahead of v0.6.0; rows marked "Not in v0.6.0" below are coming in the next release.

[Get started](#install-and-use) · [Choose a task](#four-ways-to-start) ·
[See an example](#outputs-and-examples) · [What's available](#what-is-available) ·
[Together](#together-live-and-planned) ·
[Privacy and limits](#status-and-limits)

## Install and use

Use the CLI agent you already have and are signed in to. Install ItF once, in that host's folder, and use that host's command.

| Host | Project skill folder | Invoke in the agent | Version checked |
|---|---|---|---|
| Codex CLI | `.agents/skills/impact-to-funding` | `$impact-to-funding` or `/skills` | `4566892` on Codex 0.166.0 |
| Claude Code | `.claude/skills/impact-to-funding` | `/impact-to-funding` | `22baece` (v0.6.0) on Claude Code 2.1.328 |
| OpenCode V2 | `.opencode/skills/impact-to-funding` | `@impact-to-funding` | `fbb8993` on OpenCode v2.2.5 |

The [installation guide](docs/install.md) has safe install commands, personal installs, discovery checks, updates, removal and troubleshooting. Claude Code users can instead [install ItF as a plugin](docs/install.md#optional-install-as-a-claude-code-plugin), which also brings the optional library MCP. Conversation with ItF needs no signup, Node.js, MCP server or plugin. Your host's model costs and privacy terms still apply.

**Official source:** ItF is published only from [this repository](https://github.com/zhiganov/impact-to-funding) and its [releases](https://github.com/zhiganov/impact-to-funding/releases). A copy elsewhere, a similar name or a copied README doesn't make a download official. Check that install commands point here.

**Updates:** on GitHub, choose **Watch → Custom → Releases**, or check the [releases page](https://github.com/zhiganov/impact-to-funding/releases). A notification tells you a version exists. It doesn't change your installed copy. See [release and update guidance](docs/releases.md).

You can also turn on an [in-skill update notice](docs/update-notices.md) for managed copies. It never updates the copy itself. We haven't confirmed that hosts show the notice.

An experimental CLI can install, update and roll back copies for you. See the [installation guide](docs/install.md#optional-the-managed-cli).

### Codex CLI quick start

From the project where you want to use ItF, with Git:

```sh
target='.agents/skills/impact-to-funding'
if [ -e "$target" ] || [ -L "$target" ]; then
  echo "Destination already exists; stop and inspect: $target"
else
  git clone https://github.com/zhiganov/impact-to-funding.git "$target" &&
    git -C "$target" checkout --detach 4566892ad990131fb36f760e14c73e5f275600cc
fi
```

Open Codex in that project, find ItF with `/skills`, and try:

> $impact-to-funding Help me explore a useful contribution with my skills and available time. Use only what I supply, mark assumptions and keep this private. Do not contact anyone or create files.

The check confirmed that Codex selected the skill, read a bundled reference and gave a bounded answer, in one non-interactive run. It didn't test the interactive selector, IDE or desktop apps, personal installs or usefulness.

### Claude Code

Use the `.claude/skills/impact-to-funding` folder from the guide and invoke `/impact-to-funding`. A limited check passed for `22baece` (v0.6.0) on Claude Code 2.1.328: one non-interactive `claude -p` run loaded the skill and read a bundled reference, and changed no files. An earlier check covers `4566892` on Claude Code 2.1.321. It didn't test the `/` menu, automatic triggering, IDE or desktop apps, personal installs or usefulness.

### Install and use in OpenCode

These commands install an older snapshot that was install-tested in OpenCode. Use an empty destination:

```sh
git clone https://github.com/zhiganov/impact-to-funding.git .opencode/skills/impact-to-funding
git -C .opencode/skills/impact-to-funding checkout --detach fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b
```

This installs the complete package for that project only. It doesn't change global settings. In OpenCode, in the same project, invoke:

> @impact-to-funding Help me compare useful ways to contribute based on my skills, available time and interests. Use only what I supply, mark assumptions and keep the result private. Do not contact anyone.

**Version note:** the OpenCode snapshot `fbb8993` is older than the Codex pin `4566892` and the Claude Code pin `22baece`. It lacks the responsible-assistance guidance, the evidence and reporting worksheets and the optional local tools. Later commits on `main` aren't host-checked and don't update your copy. See the [check record](docs/checks/installation-check-2026-11-04.md).

Read the [privacy guide](PRIVACY.md) before you use real material. You don't need to open the skill's Markdown files yourself.

## Optional manual use

Open a trusted copy of the whole repository in an agent that can read [SKILL.md](SKILL.md) and its references. Ask it to read and follow SKILL.md, then describe your situation. This works without installing, but it doesn't show that a host will find and load the skill on its own.

## Four ways to start

After you invoke the skill, try one of these. They're starting points, not commands or steps. For manual use, ask the agent to read SKILL.md first.

### Find a useful contribution

> Help me explore where my skills and available time could be useful, including contributing to existing work. Use what I supply, mark assumptions, and keep this private. Do not contact anyone.

### Develop shared work and learn

> Help me describe my role in this shared project, check it against my capacity, and examine what we know about its effects. Preserve other contributors and disagreement. Do not collect or publish anything.

### Learn from others' work

> Find cases in the reference library where a theory of change like mine was tested. Tell me what held up, what didn't, and what might not transfer to my situation.

### Explain what support would help

> Help me prepare a private case for sustaining this work. Separate observations from proposals, use only known costs and commitments, and keep uncertainty visible. Do not invent impact, submit an application or contact a funder.

For this task, the current source includes a [support-brief playbook](playbooks/support-brief.md). For GitHub-specific drafts, use the optional [sponsorship playbook](playbooks/github-sponsorship.md). The host-tested pins above don't include these playbooks.

A few sentences are enough to start. A useful result might be a possible contribution, a clearer question, a smaller commitment or a decision to stop. It doesn't have to be a report. The [usage guide](docs/usage.md) has more prompts and examples with incomplete evidence.

To understand an existing project's unstated theory of change, use the optional [reconstruction playbook](playbooks/reconstruct-theory-of-change.md). It keeps stated intentions, inferred pathways, people's accounts and supported observations apart. The [fictional walkthrough](examples/theory-reconstruction.md) shows how. The host-tested pins above don't include it.

## Outputs and examples

**A fictional illustration, not a real model result:** 60 copies of an access guide were handed out. That doesn't mean 60 households repaired appliances. The [worked example](examples/builder-assessment.md) separates the copies handed out, a small self-reported benefit, repairs nobody measured and future costs nobody confirmed. It also keeps a cheaper alternative to another print run.

ItF helps with that kind of distinction. Describe your actual role, keep claims within their evidence and learn whether the next contribution is worth it. A careful account still isn't verified impact or a funding decision.

To help an existing organisation without starting a project, use the optional [organisation contribution playbook](playbooks/organisation-contributions.md). It covers needs the organisation has shared, and paid or pro bono work. Its [cases](examples/organisation-contributions.md) are fictional. The host-tested pins above don't include it.

Other starting points:

- a [five-project portfolio](examples/portfolio-assessment.md) with shared work and competing commitments,
- optional [assessment](assets/assessment.md) and [report](assets/report.md) templates.

Project work doesn't need a personal theory. Supporting existing work or taking on less can be the right outcome.

## What is available?

This table describes the current source. Older host-tested pins may not have everything. Ordinary use needs none of the optional software and no manifest.

| Capability | What it does | Main limit |
|---|---|---|
| [Conversational skill](SKILL.md), contribution and claim guidance, optional templates | Guides exploration, collaboration, learning and support, with authored examples. | Behaviour varies by host and model. It doesn't match people, fund work or evaluate it independently. |
| [Reference library](references/library/README.md) and optional [framework](references/frameworks.md) and [systems](references/systems-and-complexity.md) lenses | A small, source-linked set of cases, candidate patterns and questions. The agent reads them when useful. | It covers few domains. Patterns aren't recipes, and no framework is required. |
| [Claim objections](references/claims.md#before-a-claim-goes-public-look-for-what-counts-against-it) | Before a claim goes public, the agent asks what counts against it and keeps what it finds. | Not in v0.6.0. It's a prompt to look, not an independent review. |
| [Evidence planning and audience-specific drafting](references/evidence-reporting-design.md) | Manual guidance and an [optional private worksheet](assets/evidence-crosswalk.md) for reusing evidence across funders. | Whether evidence fits, may be disclosed and is presented well are separate checks. It doesn't collect evidence or connect to funders. |
| [Local reference-library MCP](mcp/README.md) | An optional local server with three read-only tools over a prepared public snapshot. Needs Node.js 22+. | It isn't hosted, doesn't search live sources and doesn't refresh itself. See the [check record](docs/checks/reference-library-mcp-checks.md). |
| [Support-profile authoring and tools](references/support-profile-tools.md) | An optional worksheet and local tools to inspect profiles and bind open-source financial plans. Needs Node.js 22+. | Support profiles aren't limited to open source. The tools don't fetch, publish, apply or pay. See the [check record](docs/checks/support-profile-checks.md). |
| [Skill versions and managed updates](docs/managed-skill-updates.md) | An optional CLI to install, check, update, adopt, roll back and recover copies, plus opt-in [update notices](docs/update-notices.md). Needs Node.js 22+ and Git. | Experimental. It never updates automatically and changes no global settings. Hosts may not show the notices. |
| [Impact badge and card](tools/impact-badge/README.md) | Builds a README badge and a small card for one approved public report. Needs Node.js 22+. | Shows what kind of evidence a report rests on, not that the work had impact. The card is text only for now ([#144](https://github.com/zhiganov/impact-to-funding/issues/144)). |
| [Three-month check-back](references/check-back.md) | If you agree, the agent asks once, three months later, whether ItF was useful. It can turn your answers into a public note you submit yourself. Needs Node.js 22+. | Not in v0.6.0. It never sends anything itself. |
| [Readability check](tools/readability/README.md) | A local check that flags long sentences, passive voice and adverbs in drafts and manifest descriptions. Needs Node.js 22+. | Simple rules for English. A low score doesn't make writing accurate. |
| [Portable records](tools/portable-records/README.md) | Converts versioned records between JSON and Markdown, keeping their review links. Needs Node.js 22+. | Files only. It doesn't publish anywhere. |
| [GitHub funding-readiness review](docs/github-funding-readiness.md) | Checks the funding links in repos you choose, and drafts private findings and changes. Needs Node.js 22+; remote mode uses your GitHub CLI login. | Changes nothing. A link the API reports doesn't prove what's shown publicly, who's paid, or payouts. |
| [Sponsors account overview](docs/github-sponsors-account-overview.md) | Reviews a Sponsors profile and its visible tiers, and can compare them with a draft. Uses the same Node.js package and your GitHub CLI login. | Public data only by default. Changes no settings. |
| [Sponsorship export reporting](docs/github-sponsors-export-reporting.md) | Reviews Sponsors CSV exports you supply, for one account and month, with exact amounts. Runs offline. | Covers only the records you supply, not a full ledger or verified payouts. Keeps sponsor names out of summaries. |
| [Additional practice guides](docs/README.md) | Guidance and fictional cases for hearing from affected people, review, coordination and publishing plans. | No reviewer pool, recruitment, monitoring or publishing service. |

For a public, machine-readable support profile, name the file **`itf-manifest.json`**, as the [support-profile contract](references/support-profile-contract.md) recommends. Nothing requires it or discovers it automatically. This repository's own `funding.json` describes funding for maintaining ItF, and its financial plan is inactive. You don't need either file to develop a contribution.

## Together: live and planned

ItF is meant for working with others, not only alone. Belonging, mutual help and shared learning matter in their own right, not only as steps towards funding.

- **Profiles (being verified):** publish an impact profile at [app.itfti.org](https://app.itfti.org). It's stored in your own ATProto account. Publishing from real accounts is still being checked ([itfti-website#22](https://github.com/zhiganov/itfti-website/issues/22)). The skill doesn't connect to the app yet.
- **Mentors (live, in conversation):** ItF helps you think of people you already know who could help, and draft a short request. There's no shared mentor pool.
- **Guilds (planned):** voluntary groups that see each other's work and needs in their community's dashboard. See the [guild concept](docs/guilds-itfti-atproto.md) and the [workflow](docs/guild-workflow-assessment.md) and [curation](docs/guild-curation-assessment.md) assessments.
- **Matchmaking (planned):** organisations can publish needs in FtI's [needs format](https://itfti.org/fti/needs). Matching builders to them isn't built.

We can't promise introductions or opportunities. See the [design index](docs/README.md) for other future work.

## Status and limits

- **Private by default.** A local file can still go to a remote model when the agent reads it. Use only material you may share with that provider. Keep private evidence and saved outputs outside this repository; `.gitignore` won't protect them. Read [PRIVACY.md](PRIVACY.md).
- **No action without your say-so.** A draft doesn't authorise publishing, contacting people, uploading evidence, applying, changing accounts or paying. A link to evidence nobody could open isn't inspected evidence.
- **No certification or ranking.** Outputs, donations, signatures and completed assessments don't prove impact. The [responsible-assistance rules](references/responsible-assistance.md) address concrete harm and deception, not sectors or people's worth.
- **Limited evidence.** [Development trials](docs/checks/validation-2026-11-04.md) were small, and the examples are fiction. We haven't verified reliable model behaviour, untested hosts, usefulness to people or fundraising results. A passing package check confirms the files. It doesn't test installation.
- **No affiliation.** ItF draws on public Moral Ambition principles. It isn't affiliated with or endorsed by the School for Moral Ambition or Rutger Bregman. [Sources and rights](SOURCES.md) separates original material from third-party sources.

### Licence

Original written content is [CC BY-SA 4.0](LICENSE-CONTENT.md). Commercial reuse is allowed with attribution and ShareAlike. Original software, tests and executable schemas are [MIT](LICENSE-CODE). The older OpenCode snapshot keeps its earlier MIT licence, and those grants stay valid. The [licence scope](LICENSE) covers the transition and third-party exceptions, including the vendored funding.json schema. Your inputs and outputs aren't relicensed. Copied or adapted ItF text can carry obligations.

## Local package checks

For development only, you need a Node.js version with `node:test` (Node 18 or later).

```sh
node --test tests/package.test.mjs
```

These checks cover package structure, metadata, local links and accidental local paths. They don't test reasoning, privacy, host compatibility or impact. The [MCP](mcp/README.md#checks-and-compatibility), [support-profile](tools/support-profile/README.md#local-checks) and [skill metadata](tools/skill-package/README.md#checks) packages have their own optional checks. Ordinary conversation needs none of them.

## Contents and release boundary

- [Install, update and remove](docs/install.md), [usage](docs/usage.md) and [audience](docs/audience-and-positioning.md): how to install, how to start and who ItF is for.
- [Skill instructions](SKILL.md), [claims](references/claims.md) and [contributions](references/contributions.md): the core workflow.
- [Docs index](docs/README.md): practice guides, contracts, examples and designs, each with its own status.
- [Reports](docs/reports/README.md): shareable project analyses, including the OpenHaven theory-of-change reconstruction.
- [Check records](docs/checks/README.md): ItF source reviews, tests and host observations.
- [Installation evidence](docs/checks/installation-check-2026-11-04.md): the exact-version checks, earlier attempts and their limits.
- [Development validation](docs/checks/validation-2026-11-04.md) and [earlier release review](docs/checks/release-readiness-2026-11-04.md): small observations and an earlier rights review. They don't prove the current release.
- [Contributing](CONTRIBUTING.md): how to report problems safely, source rights and checks.

A new install-tested release needs its exact package checked in a supported host. Publishing new source doesn't update installed copies.
