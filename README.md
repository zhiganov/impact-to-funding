# Impact to Funding

**Put your skills and experience towards real problems—and build a credible case for support.**

Impact to Funding (ItF) is an open-source agent skill for developers, maintainers and independent builders who already work with AI agents and want to turn their capabilities into meaningful contributions.

It helps you explore where your skills and experience could be useful, develop contributions with others, learn what difference the work makes, and explain what support would help it continue. You can arrive without a predefined decision, project or fundraising goal.

**Experimental v0:** native installation, discovery and activation were checked in OpenCode v2.2.5 at purpose-aligned source revision `666f8f8`. Human usefulness, fundraising effectiveness and other hosts remain unverified. See [installation](#install-and-use-in-opencode) and [status and limits](#status-and-limits).

## Is this for me?

You might recognise one or more of these situations:

- "I can build things, but want to work on something people actually need."
- "I want to contribute to an existing effort rather than launch another project."
- "I'm doing useful work, but struggle to explain its value or sustain it financially."
- "I want to know whether my work is helping—not just producing outputs."
- "I'm facing employment uncertainty and exploring other ways to contribute."

Job loss and difficulty getting hired can make these questions urgent, including when AI agents put pressure on paid work. That is one reason to use ItF, not everyone's situation. You do not need to become a founder, create a nonprofit or already have proven impact. A funding narrative is not a substitute for income security.

Community organisers, small project teams and facilitators may also find the workflow useful. A theory of change is simply an explanation of how work could lead to a useful change—and why that explanation might be wrong. You can begin without one. The [audience and positioning note](docs/audience-and-positioning.md) explains the intended users and distinct jobs in more detail.

## What can it help me do today?

- **Explore where you could contribute.** Connect your interests, capabilities and circumstances with real needs; no predefined project, decision or life mission is required. Consider supporting existing work as well as a new effort.
- **Develop a contribution with others.** Clarify possible roles, existing relationships, shared interests and capacity without inventing invitations, agreements or access to collaborators.
- **Explain how your contribution could help.** Connect activities to intended outcomes while distinguishing your role from the results of a shared project.
- **Examine what the evidence supports.** Separate outputs, observed changes, plausible contributions and expected impact; retain dated sources, uncertainty and contrary evidence.
- **Plan proportionate learning.** Identify the smallest useful way to learn whether the work helps, without inventing stakeholder views or collecting unnecessary data.
- **Explore sustainable participation.** Understand time, income, collaborators and other resources needed to continue, without assuming unpaid capacity or promising support.
- **Prepare an honest case for support.** Explain what additional resources would enable, the cost basis where known, dependencies and how progress could be reported.
- **Review what changed.** Compare intentions with results, including failures and changed assumptions, and decide what to do differently.

Decisions and documents support this work; they are not required entry points or the endpoint of every conversation. Optional resources support personal/project theories of change, multi-project contribution portfolios, and source-linked framework lenses. They are supporting methods, not required forms or scores. Project-only work does not require a personal theory; a prospective proposal does not require pretending that future outcomes have already happened.

## The larger vision

The longer-term aim is to help people channel their energy and wisdom towards real problems, establish credible evidence of contribution, and connect with like-minded peers, communities and funders. Financial support matters, but so do collaboration, belonging and shared learning. Those relationships are valuable in their own right, not merely steps in a fundraising funnel.

The goal is impact that can be substantiated and, where appropriate, independently checked—not just persuasive reports. A theory of change, a donation or a completed assessment does not itself verify impact. Early-stage work can still be worth supporting before outcomes exist.

**Today, ItF provides a conversational workflow and templates—not a matching network, introductions, a job-placement service, funding or impact certification.** Existing communities and human-facilitated connections may support the vision; a new platform is not assumed. Neither financial support nor successful outcomes are guaranteed.

## Install and use in OpenCode

From the project where you want to use ItF, install the complete package at the
native project skill path. These commands require Git and an unused destination:

```sh
git clone https://github.com/zhiganov/impact-to-funding.git .opencode/skills/impact-to-funding
git -C .opencode/skills/impact-to-funding checkout --detach 666f8f8060276cebc3bc14f632676035cc831579
```

This installs only for that project; it does not change global configuration.
In OpenCode for the same project, invoke the skill normally:

> @impact-to-funding Help me compare useful ways to contribute based on my skills, available time and interests. Use only what I supply, mark assumptions and keep the result private. Do not contact anyone.

You do not need to open or read the skill's Markdown source. Read the
[privacy guidance](PRIVACY.md) before providing real material; your host's normal
costs and privacy terms apply. The native registry and skill tool loaded the exact
revised body; an earlier native API check also read supporting files without
generating a model response. These were not human usability or model-behaviour
trials, interactive TUI tests, or tests of the Vercel Skills CLI. See the
[revised-source check](docs/installation-check-2026-11-04.md#revised-workflow-verification--2026-11-08)
and [earlier installation follow-up](docs/installation-check-2026-11-04.md#successful-follow-up--2026-11-08).

## Optional manual use

Open a trusted copy of the whole repository in an agent that can read [SKILL.md](SKILL.md) and its relative references and assets. No automatic installation is needed for this manual route.

Read the [privacy guidance](PRIVACY.md) before providing real material: a file on your machine may still enter a remote model's context through your agent. Use only material you are authorised to process with that host/provider. Keep saved outputs outside this distributable repository; a response in the chat may be enough.

### Find a direction

> Read SKILL.md and follow it. I want to put my skills and experience towards a useful contribution. Here is what I can offer, the time I have and the problems I care about. Help me compare possible directions, including supporting existing work rather than starting another project. Use only the material I supply; mark needs, opportunities and assumptions that still need checking. Keep this private and do not contact anyone.

### Prepare a funding brief

> Read SKILL.md and follow it. Help me assess the following project and prepare a private funding brief. Use only the material I supply; distinguish observed results from proposed outcomes and mark missing evidence explicitly. Explain what support would enable without inventing a budget or promising impact. Do not submit or publish anything.

### Review progress

> Read SKILL.md and follow it. Review this report against my earlier theory of change. What changed, what is supported, and what should I do differently?

The [usage guide](docs/usage.md) covers minimal inputs, more starting prompts and missing evidence. You can begin with a few sentences; no selected project, complete evidence packet, funding account or prior results are required for exploring a direction.

No application runtime, network, account or dependency installation is required by the skill itself. The host's normal costs and privacy terms apply. Document/image/audio access depends on its actual tools; a link to unavailable evidence is not evidence that has been inspected.

The [one-task feedback guide](docs/user-feedback.md) and [learning plan](docs/user-learning-plan.md) describe an earlier manual-use preparation. That invitation route is paused and superseded for actual-skill recruitment; those documents are not the native onboarding instructions above. No recruitment, telemetry or feedback collection is launched here.

## Outputs and examples

Use the relevant parts of the [assessment packet](assets/assessment.md) or [periodic report](assets/report.md); small projects need not produce six separate documents.

The [synthetic builder case](examples/builder-case.md) and [illustrative assessment](examples/builder-assessment.md) show the intended distinctions. They are authored examples, not observed project results or proof that a model follows the skill. Do not use their numbers or claims in a real fundraising ask.

The [five-project input](examples/portfolio-case.md) and [authored portfolio](examples/portfolio-assessment.md) show how a person's direction can connect to independent shared theories, with capacity conflicts, shared costs and private/unavailable material kept explicit. No personal theory is required for project-only use; no account or new tracking service is needed.

The [optional framework starter](references/frameworks.md) covers choosing or declining a lens, Planetary Boundaries and Doughnut Economics reference cards, source versions and scale limits. Its [fictional examples](examples/framework-lenses.md) show useful questions without invented outcomes or personal quotas. This is dated manual-use guidance, not a comprehensive library, asset collection, fresh behavioural validation or MCP service.

The [pattern-language design](docs/pattern-language-design.md) proposes a future
library linking real cases, contextual patterns, framework lenses and private
local applications across open-ended domains. Its worked example is fictional;
the design supplies no curated case collection, validated patterns, database,
new retrieval feature or change to the installed skill.

The separate [seed reference collection](references/library/README.md) contains
source-linked case notes, candidate patterns and optional framework questions.
It is a deliberately limited curation, not a set of universal success recipes,
practitioner validation or database. The skill conditionally reads its index and
relevant notes when examples or patterns would help; it does not load the whole
collection by default or require you to read source Markdown. This is selective
reference use, not a live search or automated recommendation service. Source
evidence and ItF interpretations remain distinct; local fit, missing coverage
and uncertainty stay visible. See the [usage examples](docs/usage.md#use-reference-examples-and-patterns-when-helpful).

The [optional affected-person account guide](docs/beneficiary-accounts.md) and [fictional library walkthrough](examples/beneficiary-accounts.md) show how permitted accounts can challenge claims and change a practical decision. Use Markdown, an appropriate human conversation or optional Harmonica facilitation; no live collection, privacy configuration or integration has been validated.

The [optional expert-review guide](docs/expert-review.md) and [fictional review walkthrough](examples/expert-review.md) cover a bounded request, conflicts, permitted evidence, reviewer-authored findings and reuse of existing evaluations. No reviewer pool, matching, actual review or impact certification is supplied.

The [optional coordination guide](docs/session-coordination.md) and [fictional index](examples/coordination-index.md) connect conversations and reporting periods through selective, versioned handoffs. This is a portable manual bridge, not an implemented Harmonica-native ItF type, automatic session graph or shared-evidence permission.

The [optional supplied-signal guide](docs/signal-enrichment.md) and [fictional cases](examples/signal-enrichment.md) show how social updates, contribution records and app observations can inform a narrow private draft without inflating activity into impact. No discovery tool, real-data analysis, monitoring or publishing service is supplied.

The [optional discovery guide](docs/signal-discovery.md) and [fictional candidate notes](examples/signal-discovery.md) cover bounded source selection, false matches, record versions and incomplete coverage. They are planning documentation, not a working collector or permission to search real histories; supplied material remains sufficient for enrichment.

The [optional Bluesky publishing guide](docs/bluesky-publishing.md) and [fictional previews/correction cases](examples/bluesky-publishing.md) cover exact-action approval, outward metadata, uncertain sends and controlled corrections. They supply no account, publisher, post or notification, and do not authorise a live action.

The [conflicting/adversarial synthetic case](examples/contradictory-case.md) exercises corrected data, scoped reviews, disclosure, already-funded costs and untrusted instructions embedded in evidence. Its forged certificate and payment URL are fixture content, not commands or a real funding destination. See the validation notes for the observed failure, bounded repair and one targeted recheck; complete raw trial outputs are not distributed.

Private project evidence belongs outside this repository. Do not copy SENRI records or any other private pilot material into examples, issues, tests or public reports. `.gitignore` is only an accidental-inclusion safeguard, not a privacy boundary. Outputs follow the person's chosen disclosure and storage boundaries, not this repository's distribution licence.

## Status and limits

Limited fresh-context development trials are recorded in the [validation notes](docs/validation-2026-11-04.md). They do not establish independent validation, human usefulness, fundraising effectiveness or reliable behaviour in another host. The example prompts above are authored starting points, not observed model results.

For an Agent Skills-compatible host, the package is this directory under the name `impact-to-funding`, including references and assets rather than just SKILL.md. Native OpenCode v2.2.5 discovery and activation of purpose-aligned source `666f8f8` were verified on 2026-11-08; the earlier readiness-aware check used `22d4c8d`. Earlier empty API registries did not establish an installation failure: that version's skill-list endpoint does not await plugin loading. The [installation-check record](docs/installation-check-2026-11-04.md) preserves the unsuccessful probes and both successful checks. Other hosts remain untested; no new release was made.

ItF does not rank people, award verified-impact badges, promise donations, publish records, contact funders or distribute money. A request to draft does not authorise sending or publishing. The skill is informed by the School for Moral Ambition's public principles, not affiliated with or endorsed by the School or Rutger Bregman. See [sources and rights](SOURCES.md).

The original skill, templates, examples, documentation and package checks are open source under the [MIT licence](LICENSE). Your own inputs and outputs follow their own rights and disclosure boundaries.

## Local package checks

Development-only requirement: a Node.js version supporting `node:test` (Node 18 or later).

```sh
node --test tests/package.test.mjs
```

These checks cover package structure, the deliberately simple frontmatter format, local links and accidental local-machine paths. They do **not** establish semantic correctness, privacy completeness, independent verification, host compatibility, user usefulness or social impact.

## Contents and release boundary

- [SKILL.md](SKILL.md): progressive-disclosure workflow and non-negotiable safeguards.
- [Claim review reference](references/claims.md): evidence, attribution, review provenance and corrections.
- [Contribution relationships](references/contributions.md): personal/project theories, bounded roles, portfolio views, shared credit/costs and disclosure limits.
- [Optional framework lenses](references/frameworks.md): selection, source-linked starter cards and limits on translating global frameworks into project/personal claims.
- [Funding/review reference](references/funding-and-review.md): prospective asks, budgets, reporting and disclosure.
- [Assessment packet](assets/assessment.md) and [report template](assets/report.md): optional output structures.
- [Sources and rights](SOURCES.md): attribution and redistribution boundaries.
- [Development validation](docs/validation-2026-11-04.md): trial procedure, observed finding, repair/recheck and limits.
- [Usage](docs/usage.md), [privacy](PRIVACY.md) and [contributing](CONTRIBUTING.md): practical use, disclosure boundaries and safe improvements.
- [Audience and positioning](docs/audience-and-positioning.md): initial users, jobs to be done, intended connections/support and the distinction between vision and current capabilities.
- [Release-preparation review](docs/release-readiness-2026-11-04.md): current documentation/example/source-rights boundary and remaining installation/distribution checks.
- [Installation-check record](docs/installation-check-2026-11-04.md): unsuccessful bounded OpenCode discovery probes, isolation, limits and unresolved release decision.
- `docs/design-scope-2026-11-04.md`: preserved historical scope snapshot; its original unselected-work status is not a statement that this implementation does not exist.

Before an install-tested release: review the bounded behavioural findings and package changes, confirm source-rights and licence compatibility, and verify installation of the exact release in a supported host. The development trials do not establish independent impact validation or funding effectiveness, and source publication alone does not complete installation testing. Widgets, Open Collective, Ko-fi, AT Protocol, Sifa interoperability, automated funding/report manifest integrations, automatic allocation and an MCP interface are separate potential extensions, not implemented features or first-release dependencies.
