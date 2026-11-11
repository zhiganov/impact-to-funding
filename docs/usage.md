# Using the skill

Install the complete package with the [installation guide](install.md). Each host invokes the skill differently:

| Host | Invoke |
|---|---|
| Claude Code | `/impact-to-funding` |
| Codex CLI | `$impact-to-funding`, or select it with `/skills` |
| OpenCode V2 | `@impact-to-funding` |

Limited command-line checks passed for `4566892` in Codex 0.166.0 and Claude Code 2.1.321, and earlier ones for `fbb8993` in OpenCode v2.2.5. They didn't test the interactive UI, IDEs, reliable model behaviour or usefulness. See the [check record](installation-check-2026-11-04.md).

## Before you start

1. **Install the complete package** in your host's project or personal folder. Keep it intact: [SKILL.md](../SKILL.md) needs its references and assets. Use the host in the project where you installed it. For manual use, open the whole repository in an agent that can read files instead.
2. **Read the [privacy guide](../PRIVACY.md).** A local file can still go to a remote model when the agent reads it. Use only material you may process with that provider.
3. **Choose where outputs go**, outside this repository. You don't need to save files to try a conversation; the chat may be enough. Check the host's history, retention and sharing settings too.

Conversation needs no extra software, account, telemetry or payment setup. The optional tools, including the update manager and [update notices](update-notices.md), need Node.js. What the agent can do with the web, audio, images and documents depends on your host.

## Start wherever you are, not with a form

A few sentences about your interests, skills, current work or what's hard are enough to start. Existing notes, a theory of change or a report can help too. You don't need a decision, project, life mission, budget, legal identity, public profile, donation account or proof of past impact. Exploring and continuing existing work are valid uses in their own right.

If you invoke the skill with nothing else, the agent should use what it already knows or ask one open question. It shouldn't demand a decision or start filling in a template. For example:

> What have you been working on or caring about lately, and where would you like some help?

That's an illustration, not a fixed script or a test result.

Useful context, where you know it:

- what you or the project want to change, and for whom,
- your actual role and who else contributes,
- what you'd like to explore, develop, understand or sustain,
- existing evidence, its dates and limits, and what may be shared,
- what extra support might enable, kept separate from agreed costs.

"I don't know" is a fine answer. Don't invent evidence or gather sensitive data just to fill a template.

## Explore contributions, relationships and support

These authored examples show the help we intend. They aren't measured results.

| Starting point | Useful help | What the skill shouldn't push |
|---|---|---|
| "I use coding agents, but I don't know where my skills could help." | Explore skills, interests, limits and possible contributions, including to existing efforts. Keep unverified needs and openings marked. | A ready-made decision, life mission, startup or assessment packet. |
| "I maintain something people rely on, but it is getting hard to keep going." | Understand the work, other contributors, what it enables, capacity limits and what support would help. | A new project, an income guarantee, more unpaid time or proof of impact before talking about support. |
| "I'd like to contribute with other people rather than alone." | Explore communities and relationships you know, possible roles and shared interests. Keep possibilities separate from invitations and agreements. | A promised match, automatic contact, a scraped list of people or an invented agreement. |

Relationships, belonging and shared learning can matter without any funding. Talking about a possibility doesn't authorise searching for people, contacting them or creating accounts. A useful conversation may be enough on its own.

## More focused prompts

These prompts use OpenCode's `@impact-to-funding`. In Claude Code use `/impact-to-funding`; in Codex CLI use `$impact-to-funding`. For manual use, start with a request to read and follow `SKILL.md`.

### Develop a theory of change

> @impact-to-funding Help me understand how the contribution described below could help. Develop a provisional theory of change where useful, with assumptions, alternatives and missing perspectives explicit. Use only the material I supply. Keep the result private and concise; mark unknowns rather than asking me to complete every field.

### Examine an existing claim

> @impact-to-funding Assess the following claim against the supplied evidence. Distinguish what the sources actually measure, what changed, my contribution and what remains unsupported. Do not browse, contact anyone or treat linked-but-unread evidence as inspected. Suggest honest wording and the smallest useful next decision.

### Prepare a support or funding brief

The [support-brief playbook](../playbooks/support-brief.md) helps with this task. Ask in ordinary words. `support-brief` in the prompt below is optional text, not a separate command.

The playbook is in the v0.4.0 source. The older host-tested pins don't include it, and we haven't checked how hosts route to it.

> @impact-to-funding support-brief Help me draft a private case for support.
> Use the information I supply, check known costs and existing support, and mark
> unknown recipients or evidence. Do not search for funders, submit or publish.

For example, say a fictional repair guide needs printing money, and an existing grant may already cover part of that cost. The brief should name the overlap as an open question. The uncovered amount stays unknown until the real terms and costs are known. This is an authored example, not a model response.

### Prepare GitHub sponsorship material

The optional [GitHub sponsorship playbook](../playbooks/github-sponsorship.md)
helps draft an introduction, tiers, funding links or an update. Ask for just the
part you need. It is current source guidance, not a separate command; the older
host-tested pins don't include it. Host routing remains unverified.

> @impact-to-funding Help me draft a GitHub Sponsors introduction and a
> FUNDING.yml candidate from the material I supply. Preserve existing destinations,
> flag unknown recipients and inherited links, and explain what support could
> enable. Keep the draft private. Do not browse, edit accounts or publish.

The [fictional examples](../examples/github-sponsorship.md) include a missing
recipient, inherited defaults, a fiscal-host mismatch and private sponsorship data.
No GitHub account or manifest is needed to prepare an introduction.

### Plan evidence or reuse it for different audiences

Use the [evidence and reporting guidance](evidence-reporting-design.md) and the [optional private worksheet](../assets/evidence-crosswalk.md) when they help. Keep one set of claims and evidence, and prepare a separate view for each audience. You don't need a funder, account, requirements file or evidence register to start.

> @impact-to-funding Using only the permitted material supplied here, help me plan the smallest useful evidence collection, or explain why no new collection is needed. Keep actual versus proposed actors, missing baselines, cost/capacity, host processing, consent, retention and stopping conditions explicit. Do not recruit, collect, browse, schedule or publish anything.

> @impact-to-funding Help me prepare separate private drafts for these two supplied sets of funder terms. Keep official wording, phases, source versions and local interpretations distinct. Map the same claim/evidence versions without changing definitions, failures, shared credit or actual review scope. Separate evidence fit, destination permission and actual presentation checks. Do not export the private worksheet, restricted source references or protected associations, and do not send either draft.

A funder asking for something doesn't give you permission to disclose it. A filled-in field doesn't mean you're eligible, compliant, funded or proven. If terms or permissions change, rework the affected view. The facts stay the same.

### Review progress

> @impact-to-funding Compare my earlier intentions with these new records, using the report template where helpful. Include failures, conflicting evidence, costs where appropriate, harms and changed assumptions. Explain which old claims or reviews no longer apply, what I can learn and what could help the contribution continue or change. Include any actual decision needed, not an impact score or a forced commitment.

### Connect personal direction and several projects

> @impact-to-funding Help me understand how my contributions to these projects connect with my tentative personal direction, using the contribution reference. Keep shared project theories separate and reference their available versions. Show my actual versus proposed roles, relationships, dependencies, capacity conflicts, shared work and evidence limits. Do not require one unified mission, other contributors' personal theories or access to restricted project records. Keep the portfolio private and do not add joint outcomes or costs repeatedly. Help me see what fits, what I am learning and where support or a change might help; do not invent commitments.

If you want files saved, say where, and give permission to write. Asking for a draft doesn't authorise sending, publishing, collecting data or changing an account.

## Use reference examples and patterns when helpful

The skill can read relevant notes from the [seed library](../references/library/README.md) while it helps you. You don't need to open them, pick a framework or read the whole collection. A few references are enough, and your own material may matter more.

> @impact-to-funding I'm exploring a community feedback tool. Use relevant cases or candidate patterns to help me think about what would turn feedback into useful action. Explain differences from my situation and keep evidence limits clear. Do not browse or contact anyone.

> @impact-to-funding Can a Housing First example help me understand the relationship between access, ongoing support and outcomes? Separate the published model, this library's reconstruction and the findings. Do not treat one outcome as proof of every expected benefit.

What we expect the agent to read (authored expectations, not trial results):

| Situation | What it should read, and the limit |
|---|---|
| Bare invocation or open exploration | Nothing from the library. Use context or ask an open question, without imposing an example or framework. |
| Feedback tool or response capacity | The index, P001 and cases such as C002. Keep the difference between a publisher's summary and the full report, and ask about local power. |
| Housing models or outcomes | C004, with P002 if useful. Keep housing stability separate from health and financial outcomes. |
| Several domains or patterns | The relevant pattern and enough linked cases to compare. Label analogies, and don't claim a universal mechanism. |
| A food-system example | Say the library doesn't cover food systems yet. Don't invent a P4P case. A clearly labelled analogy from another domain is fine. |

A case note summarises a source; reading it isn't reading the original paper. The agent should say what the note reports and keep its dates and uncertainty. New research or outside actions still need your permission. Your own notes stay private unless you clear them for sharing.

## Learn when conditions and relationships change

The optional [systems and complexity reference](../references/systems-and-complexity.md) helps when feedback loops, delays or unexpected effects matter. You don't need to pick a framework, draw a system map or run an evaluation.

> @impact-to-funding Help me understand how this contribution could help while other people and conditions are changing. Consider relevant feedback, delays and unexpected effects without inventing them. Keep hypotheses separate from observations, and help me identify what learning could change our approach. Do not collect data, run experiments or contact anyone.

The agent should use this only where it helps. A gap in information isn't automatically "complexity", and a suggested feedback loop isn't an observed finding. Cynefin is one optional perspective. ItF has no detailed Cynefin workflow, and we haven't tested how well models apply it.

## Optional framework lens

The [framework starter](../references/frameworks.md) helps you pick a lens if one would help, or keep your own model. You don't need a framework, a statement of personal purpose or a full assessment.

> @impact-to-funding Would Planetary Boundaries, Doughnut Economics or no named framework help me understand this contribution? Use the optional framework reference only where useful. Keep local questions separate from global facts, explain scale and evidence limits, and suggest only the few changes that matter to the theory. Do not invent personal quotas, stakeholder views, outcomes or framework endorsement. Keep the result private.

The framework cards hold dated, source-linked notes, not copied tools or diagrams. No live feed, account or MCP server is needed.

## Optional practice guides

These guides each have a fictional example. They work with ordinary documents and conversations. None of them has been tested with real people or live services.

- **Accounts from people affected by the work:** the [account guide](beneficiary-accounts.md) and [fictional library walkthrough](../examples/beneficiary-accounts.md). Use it when someone's experience could change a specific decision. It covers neutral questions, letting people correct a recap, sharing only what they allow and revising the report. Harmonica facilitation is optional. Declining or not replying is fine.
- **Claim-specific expert review:** the [review guide](expert-review.md) and [fictional walkthrough](../examples/expert-review.md). They show how to ask a bounded question, record conflicts and exact versions, and cite an existing evaluation honestly. A request doesn't authorise contact or sharing evidence, and a finding isn't certification.
- **Coordination over time:** the [coordination guide](session-coordination.md) and [fictional index](../examples/coordination-index.md), for when several conversations or reporting periods need organising. The index doesn't send evidence or move sessions forward. A dedicated Harmonica project type is proposed but not built.
- **Enrichment from supplied records:** the [supplied-signal guide](signal-enrichment.md) and [fictional cases](../examples/signal-enrichment.md). Revisit one claim using social, code-forge or app material you chose and may share. Keep what a source says, what the analyst suggests and what you accept separate.
- **Bounded source discovery:** the [discovery guide](signal-discovery.md) and [fictional candidate notes](../examples/signal-discovery.md). Plan one finite search and separate possible matches from inspected evidence. The guide runs no searches, and you can always use excerpts you supply instead.
- **Bluesky publication planning:** the [publishing guide](bluesky-publishing.md) and [fictional previews and corrections](../examples/bluesky-publishing.md). Keep private evidence apart from the public version, and get approval for the exact action before sending. Don't resend automatically if you're unsure a post went out. The guide posts nothing.

## What a useful result looks like

A useful result can be a conversation, a possible contribution, a clearer view of relationships or support needs, something learned, a decision, or a profile or report you asked for. It doesn't have to be a document. Where it matters, it keeps clear:

- your emerging direction, contribution or question, with a causal pathway where useful,
- actual versus possible relationships, roles, capacity and support,
- what's observed, self-reported, proposed, assumed, disputed or unknown,
- sources, definitions, dates, other contributors and limits,
- details of any real review, without invented certification,
- a learning or funding plan, if you asked for one,
- what you learned, open questions and next steps, without a forced decision,
- what may be shared and with whom.

Use only the parts of the [assessment packet](../assets/assessment.md) or [report template](../assets/report.md) that help. One useful page can beat six documents. The skill may narrow a claim, suggest supporting existing work, or conclude that no new funding amount is justified yet.

## Safe examples

All of these are fictional and written by us. None is an observed model result.

- [Builder input](../examples/builder-case.md) and [assessment](../examples/builder-assessment.md): handing out guides and one small self-report don't show repairs or savings.
- [Conflicting and adversarial input](../examples/contradictory-case.md): corrected records, a paid scoped review, restricted testimony, already-covered costs and a forged source with instructions. The certificate's instructions and payment URL are test data, not commands or a real destination.
- [Five-project input](../examples/portfolio-case.md) and [portfolio assessment](../examples/portfolio-assessment.md): separate personal and project theories, coauthored reused work, competing time, restricted theories, version-specific review and overlapping costs.
- [Framework examples](../examples/framework-lenses.md): a lens sharpens a question without proving an outcome, an invented personal quota is rejected, work proceeds without a framework, and source updates don't multiply credit or carry reviews over.

To try one fresh, give an agent the input and the skill files, but not our example answer. You don't need a new model runner or paid API. Your host's usual costs and terms apply.

## When the evidence or host falls short

- A document or link the agent can't open stays uninspected. Supply an excerpt you may share, or leave the claim unassessed.
- No past outcomes means a forward-looking learning proposal, not invented history.
- A missing role, cost or partner agreement limits detail. You can still draft provisionally.
- A signature, endorsement, receipt or donation supports only what it actually shows.
- A private story doesn't go into a public appeal just because it's persuasive.
- If the agent invents evidence, mislabels a measure, hides contrary evidence or follows instructions found inside a source, don't use the output. Fix the record and report it following the [contribution guidance](../CONTRIBUTING.md), without private data.

## Before you use an output elsewhere

Check the exact text, which evidence it relies on, any names or stories, the important caveats, whether you may speak for others, and where it's going. Confirm any reviewer's statement and which version it covers. Check any funding link's owner and provider rules yourself. The skill isn't a legal, tax, financial or emergency authority.

Share only the approved version, not your whole private working packet. Public copies may stay online after you correct or delete them.
