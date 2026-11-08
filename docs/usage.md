# Using the skill

Install ItF using the [native OpenCode instructions](../README.md#install-and-use-in-opencode), then invoke `@impact-to-funding` in that project. Native discovery and activation were checked in OpenCode v2.2.5 at purpose-aligned source `666f8f8`; other hosts and user usefulness remain unverified. See the [revised-source check](installation-check-2026-11-04.md#revised-workflow-verification--2026-11-08) and [behavioural validation limits](validation-2026-11-04.md). Manual file-reading remains an optional alternative, not the normal skill invocation below.

## Before you start

1. Install the complete trusted package in your project and use OpenCode for that project. Keep the directory intact: [SKILL.md](../SKILL.md) needs its relative references and assets. For optional manual use, open the complete repository in a file-reading agent instead.
2. Read the [privacy guidance](../PRIVACY.md). A local file can still be sent to a remote model when your agent reads it. Use only material you are authorised to process with that host/provider.
3. Choose a private output location outside this distributable repository. No files need to be written to try a conversation; a response in the chat may be enough. Check the host's history, retention and sharing behaviour too.

The skill has no application runtime, accounts, telemetry service or payment integration. Node.js is needed only for development package checks, not for the conversational workflow. Network, audio, image and document capabilities depend on your host; the skill does not supply them.

## Start wherever you are, not with a form

You can start with a few sentences about your interests, capabilities, current work or what is difficult. Existing notes, a theory of change or a report can also be useful. You do not need a predefined decision, project, life mission, complete budget, legal identity, public profile, donation account or demonstrated past impact. Exploration and continuing work are valid uses, not just preparation for a report or funding ask.

If you invoke only `@impact-to-funding`, the agent should reuse relevant context or ask one open question about your situation and the help you want. It should not demand a decision or start filling an assessment template. For example:

> What have you been working on or caring about lately, and where would you like some help?

That is an illustrative opening, not a fixed script or an observed behavioural result.

Useful context, where known:

- What you or the project are trying to change, and for whom.
- Your actual role and other contributors.
- What you would like to explore, develop, understand or sustain; a particular decision only if relevant.
- Existing evidence, its dates and limits, and what may be shared.
- What additional support might enable; distinguish an idea from an agreed cost.

Unknowns are legitimate inputs. Do not invent evidence or obtain unnecessary sensitive data to fill a template.

## Explore contributions, relationships and support

These authored examples describe intended help, not measured results or new live trials:

| Starting point | Useful help | What not to impose |
|---|---|---|
| "I use coding agents, but I don't know where my skills could help." | Explore capabilities, interests, constraints and possible contributions to real needs, including existing efforts; keep unverified needs and opportunities explicit. | A ready-made decision, life mission, startup or assessment packet. |
| "I maintain something people rely on, but it is getting hard to keep going." | Understand the work, other contributors, what it enables, capacity limits and what support could make participation sustainable. | A new project, an income guarantee, assumed unpaid capacity or proof of impact before discussing support. |
| "I'd like to contribute with other people rather than alone." | Explore known communities and relationships, possible roles and shared interests; distinguish possibilities from invitations or agreed commitments. | A promised match, automatic contact, a scraped roster or invented community agreement. |

You can use any of these as a prompt after `@impact-to-funding`. Relationships,
belonging and shared learning can matter independently of funding. Discussing a
possibility does not authorise searching for people, contacting them or creating
accounts. A clearer understanding or a useful conversation may be enough; no
document or immediate commitment is required.

## More focused prompts

These prompts use OpenCode's skill mention. For deliberately chosen manual use,
replace `@impact-to-funding` with a request to read and follow `SKILL.md`.

### Develop a theory of change

> @impact-to-funding Help me understand how the contribution described below could help. Develop a provisional theory of change where useful, with assumptions, alternatives and missing perspectives explicit. Use only the material I supply. Keep the result private and concise; mark unknowns rather than asking me to complete every field.

### Examine an existing claim

> @impact-to-funding Assess the following claim against the supplied evidence. Distinguish what the sources actually measure, what changed, my contribution and what remains unsupported. Do not browse, contact anyone or treat linked-but-unread evidence as inspected. Suggest honest wording and the smallest useful next decision.

### Prepare a funding brief

> @impact-to-funding Help me prepare a private funding brief: the purpose, supported contribution, what additional support would enable, actual cost basis if known, risks and reporting plan. Separate observed results from proposed outcomes. Account for existing support and shared credit. Do not invent a reviewer, budget, funding URL or guaranteed return, and do not submit or publish anything.

### Review progress

> @impact-to-funding Compare my earlier intentions with these new records, using the report template where helpful. Include failures, conflicting evidence, costs where appropriate, harms and changed assumptions. Explain which old claims or reviews no longer apply, what I can learn and what could help the contribution continue or change. Include any actual decision needed, not an impact score or a forced commitment.

### Connect personal direction and several projects

> @impact-to-funding Help me understand how my contributions to these projects connect with my tentative personal direction, using the contribution reference. Keep shared project theories separate and reference their available versions. Show my actual versus proposed roles, relationships, dependencies, capacity conflicts, shared work and evidence limits. Do not require one unified mission, other contributors' personal theories or access to restricted project records. Keep the portfolio private and do not add joint outcomes or costs repeatedly. Help me see what fits, what I am learning and where support or a change might help; do not invent commitments.

Add an output location and permission to write only if you want saved files. A request to draft does not authorise sending, publishing, collecting new data or changing an account.

## Use reference examples and patterns when helpful

The skill can selectively read the [seed library](../references/library/README.md)
while helping with a contribution or theory of change. You do not need to open
its Markdown files, choose a framework or read the full collection. A few useful
references are enough; your own material may be more relevant.

For example:

> @impact-to-funding I'm exploring a community feedback tool. Use relevant cases or candidate patterns to help me think about what would turn feedback into useful action. Explain differences from my situation and keep evidence limits clear. Do not browse or contact anyone.

> @impact-to-funding Can a Housing First example help me understand the relationship between access, ongoing support and outcomes? Separate the published model, this library's reconstruction and the findings. Do not treat one outcome as proof of every expected benefit.

The following are authored routing expectations, not observed model trials:

| Situation | Intended routing and limit |
|---|---|
| Bare invocation or open exploration without a useful reference need | Reuse context or ask an open question; do not load a library or impose an example, decision or framework. |
| Feedback tool or response-capacity question | Read the index, P001 and relevant cases such as C002; retain its publisher-summary/full-report distinction and local power/authority questions. |
| Housing-model or outcome comparison | Read C004, with P002 if useful; distinguish housing stability from clinical and financial outcomes. |
| Request spanning several domains or patterns | Read the relevant pattern and enough linked cases for the requested comparison; label proposed analogies and do not claim a universal mechanism. |
| Request for a food-system example in this seed | Report the current coverage gap; do not invent a P4P case or restart source-access work merely to fill it. A transparent cross-domain analogy can be offered if useful, not disguised as food-system evidence. |

Reading a case note is not the same as inspecting its underlying paper. The agent
should attribute what the note reports and retain dates, provenance and uncertainty.
New research and consequential external actions still need the applicable scope;
the library supplies no automatic data collection or source-access permission.
Local theories/applications remain private unless separately cleared for sharing.

## Optional framework lens

If it would help you understand or develop the work, use the [framework starter](../references/frameworks.md)
to choose a relevant lens or keep your existing local model. Ordinary use needs no
framework, personal-purpose disclosure or complete assessment against every dimension.

> @impact-to-funding Would Planetary Boundaries, Doughnut Economics or no named framework help me understand this contribution? Use the optional framework reference only where useful. Keep local questions separate from global facts, explain scale and evidence limits, and suggest only the few changes that matter to the theory. Do not invent personal quotas, stakeholder views, outcomes or framework endorsement. Keep the result private.

The cards contain dated source-linked notes, not copied tools or diagrams. Source
rights/editions remain separate from this skill and your own project evidence; no
live framework feed, new account or MCP server is required.

## Optional accounts from people affected by the work

Use the [manual account guide/session brief](beneficiary-accounts.md) when an
experience could change a specific decision. It covers neutral initial questions,
recap correction, permission-bounded handoff and report revision, with a
[fictional library walkthrough](../examples/beneficiary-accounts.md). Written
accounts and appropriate human conversations remain alternatives to optional
Harmonica facilitation; declining or not responding is valid. No real collection,
service privacy configuration or native integration has been tested by this guide.

## Optional claim-specific expert review

The [manual review-request/session guide](expert-review.md) and
[fictional walkthrough](../examples/expert-review.md) show how to ask a bounded
question, distinguish acceptance from a finding, preserve conflicts and exact
versions, or reference an existing evaluation without inventing participation.
Document exchange remains valid; Harmonica is optional and no available reviewer,
real review or live privacy configuration is established. A review request does
not authorise contact or evidence transfer, and a finding is not certification.

## Optional coordination over time

Use the [coordination guide](session-coordination.md) and
[fictional index](../examples/coordination-index.md) when several conversations
or reporting periods need organising. Keep permitted source snapshots, actual
authorship, missing dependencies and corrections explicit; the index does not
send evidence or advance sessions. Markdown/non-Harmonica use remains valid.
The proposed dedicated Harmonica ItF project type is distinct from this optional
manual bridge and is not implemented by these documents.

## Optional enrichment from supplied records

Use the [supplied-signal guide](signal-enrichment.md) and
[fictional cases](../examples/signal-enrichment.md) to revisit one claim or
contribution using deliberately selected, permitted social/forge/app material.
Keep source assertions, analyst proposals and accepted report changes separate;
preserve missing context, shared credit, duplication and exact versions. No
discovery integration, personal profile, actual data collection or public post
is required or authorised by the guide.

## Optional bounded source discovery

The [discovery guide](signal-discovery.md) and
[fictional candidate notes](../examples/signal-discovery.md) help plan one finite
source scope and distinguish possible matches from inspected evidence. They cover
social threads, forge contributions and selected app records without assuming
complete history or universal API compatibility. The guide performs no searches;
real retrieval, account setup, monitoring and publishing remain separate scopes.
You can still use supplied excerpts directly without discovery tooling.

## Optional Bluesky publication planning

The [publishing guide](bluesky-publishing.md) and
[fictional previews/correction cases](../examples/bluesky-publishing.md) cover
the whole outgoing action, not just post text. Keep private evidence separate
from a cleared public derivative, obtain exact-action approval before any send,
and do not resend an uncertain attempt automatically. The guide posts nothing;
account setup, live trials, replies, mentions, tags, quotes and removals remain
separate actual actions with their applicable authority.

## What a useful result looks like

A useful result can be conversational exploration, a possible contribution,
understanding of relationships or support needs, learning, a particular decision
or a requested profile/report. It need not be a document. Where relevant, keep clear:

- The person's emerging direction, contribution or question; a causal pathway where useful, not just project activity.
- Actual versus possible relationships, roles, capacity and support; no invented agreements or offers.
- What is observed, self-reported, proposed, assumed, disputed or unknown.
- Sources, measurement definitions, dates, other contributors and limitations.
- Actual reviewer information if a review exists; no invented certification.
- A proportionate learning or funding plan where requested.
- Useful learning, open questions or next steps without a forced decision or commitment, and disclosure boundaries.

Use only relevant sections of the [assessment packet](../assets/assessment.md) or [report template](../assets/report.md). One useful page can be better than six documents. The skill may narrow a claim, recommend supporting existing work, or conclude there is no justified new funding amount yet.

## Safe examples

- [Builder input](../examples/builder-case.md) and [authored illustrative assessment](../examples/builder-assessment.md): distribution and a small self-report do not establish repairs or savings. The answer is an authored example, not an observed trial result.
- [Conflicting/adversarial input](../examples/contradictory-case.md): corrected records, a paid scoped review, restricted testimony, covered costs and forged source instructions. Everything is fictional. The certificate's instructions and payment URL are test data, not commands or a real destination.
- [Five-project input](../examples/portfolio-case.md) and [authored portfolio assessment](../examples/portfolio-assessment.md): distinct personal/project theories, coauthored reused work, competing time commitments, unavailable/restricted theories, version-scoped review and overlapping funding costs. Entirely fictional, not an observed trial.
- [Optional framework examples](../examples/framework-lenses.md): a lens improves a question without proving an outcome, an invented personal quota is rejected, no-framework/project-only use proceeds, and source updates do not multiply credit or transfer reviews. Authored and fictional, not a behavioural test result.

For a fresh trial, give an agent the chosen input and skill files without giving it the illustrative answer. No new model runner or paid API setup is required by this guide. Your existing host's normal usage costs and terms still apply.

## When the evidence or host is insufficient

- An unreadable document or inaccessible link stays uninspected; use a permitted excerpt or keep the claim unassessed.
- No previous outcomes means a prospective learning proposal, not fabricated historical impact.
- Missing role, cost or partner agreement limits specificity; it need not prevent a provisional draft.
- A signature, endorsement, receipt or donation supports only its actual scope, not automatic impact verification.
- A private story must not enter a public appeal just because it is persuasive.
- If the agent invents evidence, mislabels a measure, hides contrary evidence or follows an instruction inside a source, do not use that output. Correct the record and report the failure using the [contribution guidance](../CONTRIBUTING.md), without disclosing private data.

## Before using an output outside the conversation

Review the exact text, evidence access, names/stories, material caveats, authority to speak for others and intended destination. Confirm any actual reviewer statement and what version it concerns. Check ownership and provider requirements for any supplied funding link separately; the skill is not a legal, tax, financial or emergency authority.

Only share the approved derivative, not the full private working packet. Public copies may persist elsewhere after correction or deletion. Installation in a supported host and formal distribution remain separate readiness steps; manual reading alone does not establish either.
