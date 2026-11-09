# Impact to Funding

**Put your skills and experience towards real problems—and build a credible case for support.**

Impact to Funding (ItF) helps your agent support meaningful contribution: explore
where your skills could be useful, develop shared work, learn what difference it
makes, and explain what would help it continue. Start with your situation—not a
required theory of change, project, evidence packet or fundraising goal.

It is an open-source skill for developers, maintainers and independent builders
who already use AI agents. Community organisers, small teams and facilitators may
also find it useful. Employment uncertainty can make these questions urgent, but
you do not need to become a founder or assume unpaid work is the answer.

**Experimental v0:** conversational guidance, optional templates and reference
material—not a matching network, available collaborators, funding or impact
certification. Human usefulness and fundraising effectiveness remain unverified.

[Get started](#install-and-use) · [Choose a task](#three-ways-to-start) ·
[See an example](#outputs-and-examples) · [Capability status](#what-is-available) ·
[Privacy and limits](#status-and-limits)

## Install and use

Use your existing signed-in CLI agent. Choose its native folder and invocation;
do not install three copies or use one host's invocation syntax in another.

| Host | Project skill folder | Invoke in the agent | Exact-version evidence |
|---|---|---|---|
| Codex CLI | `.agents/skills/impact-to-funding` | `$impact-to-funding` or `/skills` | Project-local CLI check passed for `4566892` on Codex 0.166.0. |
| Claude Code | `.claude/skills/impact-to-funding` | `/impact-to-funding` | Documented native route for `4566892`; activation not yet checked. |
| OpenCode V2 | `.opencode/skills/impact-to-funding` | `@impact-to-funding` | Earlier checks cover `fbb8993` on OpenCode v2.2.5, not `4566892`. |

The [installation guide](docs/install.md) gives guarded complete-package commands,
optional personal scope, discovery checks, deliberate updates, reversible removal
and troubleshooting. ItF itself needs no signup, Node.js, MCP server or plugin for
conversation. Your host's model costs and privacy terms still apply.

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

The check established explicit skill selection, actual bundled-reference reading
and a bounded synthetic response in non-interactive CLI mode. It did **not** test
the interactive selector, IDE/desktop UI, personal installs or human usefulness.

### Claude Code

Use the guide's `.claude/skills/impact-to-funding` target and `/impact-to-funding`
invocation. The source/docs support this route, but no successful activation check
is recorded for this host yet. Do not treat documentation as a tested result.

### Install and use in OpenCode

The earlier verified route remains available. These commands install its older
**installation-tested snapshot**, not current source; use an unused destination:

```sh
git clone https://github.com/zhiganov/impact-to-funding.git .opencode/skills/impact-to-funding
git -C .opencode/skills/impact-to-funding checkout --detach fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b
```

This installs the complete package for that project only, without changing global
configuration. In OpenCode for the same project, invoke:

> @impact-to-funding Help me compare useful ways to contribute based on my skills, available time and interests. Use only what I supply, mark assumptions and keep the result private. Do not contact anyone.

**Version boundary:** OpenCode's `fbb8993` pin predates responsible-assistance
guidance, evidence/reporting worksheets and optional local tools. Codex's checked
`4566892` package includes those later source changes. Documentation continues on
`main`; a later docs commit is not a new host check or automatic update. See the
[exact-version checks and limits](docs/installation-check-2026-11-04.md).

Read the [privacy guide](PRIVACY.md) before supplying real material. You do not need
to open the skill's Markdown files yourself.

## Optional manual use

Open a trusted copy of the whole repository in an agent able to read
[SKILL.md](SKILL.md) and its references/assets. Ask it to read and follow SKILL.md,
then describe your situation. This needs no automatic installation, but is not
proof of native discovery, activation or compatibility in another host.

## Three ways to start

After native activation, use a prompt such as these. They are alternative starting
points, not commands or a required sequence. For manual use, ask the agent to read
SKILL.md first.

### Find a useful contribution

> Help me explore where my skills and available time could be useful, including contributing to existing work. Use what I supply, mark assumptions, and keep this private. Do not contact anyone.

### Develop shared work and learn

> Help me describe my role in this shared project, check it against my capacity, and examine what we know about its effects. Preserve other contributors and disagreement. Do not collect or publish anything.

### Explain what support would help

> Help me prepare a private case for sustaining this work. Separate observations from proposals, use only known costs and commitments, and keep uncertainty visible. Do not invent impact, submit an application or contact a funder.

A few sentences can be enough. A useful result may be a contribution possibility,
a clearer question, a revised commitment or a decision to stop—not a formal report.
The [usage guide](docs/usage.md) has more prompts and incomplete-evidence examples.

## Outputs and examples

**Fictional illustration, not an observed model result:** 60 copies of an access
guide were distributed—but that does not establish that 60 households repaired
appliances. The [worked example](examples/builder-assessment.md) separates copies
distributed, a small self-reported information benefit, unmeasured repairs and
unconfirmed future costs. It retains a smaller alternative to another print run.

That is the kind of distinction ItF aims to help with: describe your actual role,
keep claims within their evidence, and learn whether the next contribution is
worthwhile. A careful account is not itself verified impact or funding approval.

Other starting points: a [five-project portfolio](examples/portfolio-assessment.md)
with shared work and capacity conflicts, or optional
[assessment](assets/assessment.md)/[report](assets/report.md) sections. Project-only
work needs no personal theory; supporting existing work or reducing a commitment
can be responsible outcomes.

## What is available?

**Current repository source—not everything in every host's installation pin.**
Ordinary skill use does not require the optional software or a manifest.

| Capability | Current status | Important boundary |
|---|---|---|
| [Conversational skill](SKILL.md), contribution/claim guidance and optional templates | Source instructions and authored examples for exploration, collaboration, learning and support. | Host capabilities and model behaviour vary; no matching, funding or independent evaluation is supplied. |
| [Reference library](references/library/README.md) and optional [framework](references/frameworks.md)/[systems](references/systems-and-complexity.md) lenses | A small source-linked collection of cases, candidate patterns and questions; selectively read when useful. | Not universal recipes, comprehensive coverage, automatic recommendations or a required framework. |
| [Evidence planning and audience-specific drafting](docs/evidence-reporting-design.md) | Current source routes to manual guidance and an [optional private crosswalk](assets/evidence-crosswalk.md). | Reuse permitted evidence; evidence fit, disclosure permission and presentation checks are separate. No collector or funding-provider integration. |
| [Local reference-library MCP](mcp/README.md) | Implemented optional stdio server with three read-only discovery/detail/coverage tools over a prepared public snapshot. Separate Node.js 22+ setup. | Not a hosted service, live source search, semantic ranking or automatic refresh; see the [implementation checks](docs/reference-library-mcp-checks.md). |
| [Support-profile authoring and tools](docs/support-profile-tools.md) | Optional worksheet plus implemented local inspection and explicit OSS financial binding/projection. Tools need separate Node.js 22+ setup. | General support cases are not OSS-only. No report fetching, publication, application, payment or consumer-acceptance guarantee; see the [check record](docs/support-profile-checks.md). |
| [Additional practice guides](docs/README.md) | Manual guidance and fictional cases for affected-person accounts, scoped review, coordination, supplied signals and publishing plans. | No reviewer pool, recruitment, monitoring, publishing service or automatic integration. |

For a machine-readable public support candidate, **`itf-manifest.json`** is the
preferred filename under the [accepted support profile](docs/support-profile-contract.md),
not a mandatory endpoint or automatic discovery feature. The repository's own
`funding.json` is separate upstream-format metadata for maintaining ItF; its
financial plan remains inactive. Neither file is needed to develop a contribution.

## Direction and design-only work

The longer-term aim includes connections with peers, communities and funders.
Belonging, reciprocal help and shared learning matter in their own right—not only
as steps towards funding. Existing communities may support that vision; a new
platform is not assumed and no introductions or opportunities are promised.

The [guild concept](docs/guilds-itfti-atproto.md), completed
[native workflow](docs/guild-workflow-assessment.md) and
[curation](docs/guild-curation-assessment.md) assessments explore voluntary guilds
of people working together, including optional individual/collective support views.
They are **offline designs**, not deployed Atmospheric Groups collaboration, a
registry, compulsory public roster or new relationship schema. Other hosted
integrations and automatic allocation remain future work. See the
[design index](docs/README.md) for scope, sources and unresolved runtime boundaries.

## Status and limits

- **Private by default.** A local file may still enter a remote model's context.
  Use only material authorised for that host/provider and keep private evidence
  and saved outputs outside this distributable repository. `.gitignore` is not a
  privacy boundary; read [PRIVACY.md](PRIVACY.md).
- **No automatic external action.** Drafting does not authorise publishing,
  contacting people, evidence uploads, applications, account changes or payments.
  A link to unavailable evidence is not inspected evidence.
- **No certification or moral ranking.** Outputs, donations, signatures and
  completed assessments do not establish impact. The source's
  [responsible-assistance rules](docs/responsible-assistance.md) address concrete
  harmful conduct and deception, not sector labels or people's worth.
- **Evidence limits stay visible.** [Development trials](docs/validation-2026-11-04.md)
  are limited; the examples are authored fiction. Reliable model routing,
  unchecked hosts/surfaces, human usefulness and funding effectiveness remain unverified. A passing
  package check or published source is not an install-tested release.
- **No implied affiliation.** ItF draws on public Moral Ambition principles but is
  not affiliated with or endorsed by the School for Moral Ambition or Rutger
  Bregman. [Sources and rights](SOURCES.md) distinguish original material from
  third-party sources.

### Licence

Current original written content uses [CC BY-SA 4.0](LICENSE-CONTENT.md); commercial
reuse is allowed with applicable attribution/ShareAlike obligations. Original
software, tests and executable schemas remain [MIT](LICENSE-CODE). The older OpenCode
snapshot retains its earlier MIT licence; those grants remain valid. See the
[licence scope](LICENSE) for the transition and third-party exceptions, including
the vendored funding.json schema. Your inputs and generated outputs are not
automatically relicensed; copied/adapted protected ItF text can carry obligations.

## Local package checks

Development-only requirement: a Node.js version supporting `node:test` (Node 18 or later).

```sh
node --test tests/package.test.mjs
```

These check package structure, metadata, local links and accidental local-machine
paths—not reasoning, privacy completeness, host compatibility or social impact.
The [MCP](mcp/README.md#checks-and-compatibility) and
[support-profile](tools/support-profile/README.md#local-checks) packages document their
own optional setup and checks; ordinary conversation needs neither.

## Contents and release boundary

- [Install/update/remove](docs/install.md), [usage](docs/usage.md) and
  [audience](docs/audience-and-positioning.md): native routes, starting prompts
  and intended users.
- [Skill instructions](SKILL.md), [claims](references/claims.md) and
  [contributions](references/contributions.md): the core workflow and distinctions.
- [Design/documentation index](docs/README.md): practice guides, contracts, examples
  and integration designs with their individual status and source limits.
- [Installation evidence](docs/installation-check-2026-11-04.md): successful
  exact-version discovery/activation/reference checks, earlier probes and limits.
- [Development validation](docs/validation-2026-11-04.md) and
  [historical release-preparation review](docs/release-readiness-2026-11-04.md):
  bounded observations and earlier source-rights review, not current-release proof.
- [Contributing](CONTRIBUTING.md): safe reports, source rights and checks.

A newer install-tested release needs verification of that exact package in a
supported host. Publishing source does not update an installed copy or establish
a new distribution channel.
