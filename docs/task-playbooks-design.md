# Task playbooks for Impact to Funding

**Status:** design assessment for [#57](https://github.com/zhiganov/impact-to-funding/issues/57).
Reviewed source: `8df16a66196837e60c6d62ded9862702558350a3`. Later source work
for [#70](https://github.com/zhiganov/impact-to-funding/issues/70) adds the
[support-brief playbook](../playbooks/support-brief.md). This document records the
design; host behaviour for the new route remains unverified.

## Recommendation

Keep `impact-to-funding` as one person-first skill and distribute one complete
package. The first optional playbook covers **a support brief**.
The person can still describe their situation in ordinary language. The agent chooses
the useful guidance; a command or menu is not required.

When the skill is invoked without a task, it can reuse available context or ask one
open question. It does not need a project, theory or funding goal to begin.

A [field note on #57](https://github.com/zhiganov/impact-to-funding/issues/57#issuecomment-6753943272)
describes a small-grant session where the agent had to assemble the preparation
steps itself. The reported sequence caught an overlap with existing support. This
is a useful reason to organise that task; it is one observation, not proof that a
playbook will work reliably for everyone.

[Impeccable's source](https://github.com/pbakaus/impeccable/blob/f866ce13beb3a065fabfce90f8c784eedad84117/scripts/build.js#L44-L64)
records its move from standalone skills to one root with task subcommands. ItF
can reuse that modular shape without adopting Impeccable's bare-invocation menu.

This choice does not make fundraising the main purpose of ItF. People may explore
their direction, contribute to existing work, seek paid work or learn with others
without preparing a funding brief.

## User jobs and current sources

| Job | Existing guidance | Why a separate playbook now? |
|---|---|---|
| Explore a direction | [Skill entry](../SKILL.md) and [starting prompts](usage.md) | The root already handles an open conversation. Keep it the default. |
| Develop a contribution with others | [Contribution relationships](../references/contributions.md) | Existing guidance separates personal direction, shared projects, roles and capacity. No distinct routing problem is established. |
| Understand what work changes | [Claim review](../references/claims.md) and [evidence planning](evidence-reporting-design.md) | Existing guidance supports proportionate learning and uncertain claims. Add a playbook later if a specific need emerges. |
| Explore sustainable support | [Skill entry](../SKILL.md) and [audience guidance](audience-and-positioning.md) | Support can mean income, time, access or help from others. A grant brief is only one possible task. |
| Prepare a support brief | [Funding and disclosure](../references/funding-and-review.md), [assessment](../assets/assessment.md) and [evidence crosswalk](../assets/evidence-crosswalk.md) | A focused playbook can connect the steps reported in the field note. It should reuse these sources. |
| Report progress | [Report template](../assets/report.md) and [funding/reporting guidance](../references/funding-and-review.md) | Reporting is its own job. The existing template is available when requested. |

These are possible starting points, not a prescribed journey. A person can change
direction, stop, or work on only one of them.

## First playbook: support brief

Use the following order when it fits the person's request. Reuse supplied material
and leave unknowns visible. A provisional draft can be useful before every detail
is settled.

1. **Purpose and costs:** describe what support would pay for, the cost basis and
   the person's actual or proposed role.
2. **Recipient:** identify who would receive support and any relevant legal-entity
   or fiscal-host questions. Do not infer eligibility or authority.
3. **Existing support:** compare actual costs, periods and commitments across
   asks. Separate possible overlap from charging the same cost twice. Applicable
   funder rules and unknown support remain explicit.
4. **Evidence and permission:** check what each inspected source supports and
   whether it can be cited for the intended audience. Restricted evidence can
   inform a private draft; leave unknown support or permission visible.
5. **Possible funders:** if research is requested and permitted, inspect relevant
   primary sources. Record the actual terms and source limits. A shortlist records
   possibilities; an actual offer must be established separately.
6. **Brief:** explain what additional support enables, the known costs and the
   learning or progress the person can reasonably describe.
7. **Optional representation:** only if requested and appropriate, prepare a
   `funding.json` candidate using real financial facts. A general support document
   can instead use the [support-profile guidance](support-profile-tools.md).

At the reviewed revision, the funding reference called for a concise theory of
change. Current source explains the rationale where useful and makes a named or
completed theory optional.

[#70](https://github.com/zhiganov/impact-to-funding/issues/70) tracks the source
implementation.

## Compare the shapes

| Shape | Benefit | Trade-off |
|---|---|---|
| Root and current references | Already works as source guidance. It keeps one entry and one package. | The agent must assemble task order from several files. |
| Root and optional playbooks | Gives a task a focused guide while sharing the root's safeguards. Only relevant material needs to be read. | Selection remains model-mediated. A named phrase is not a guaranteed command. |
| Separate native shortcuts | A host can list a shortcut in its command interface. | Each host needs its own registration and update handling. A shortcut must preserve the selected skill path and shared safeguards. |
| Separate skills | A genuinely independent task can have its own description and discovery entry. | More entries can collide or compete for context. Shared rules and package updates can drift. |

Start with the second shape. Consider a separate skill only when the job has a
distinct audience or trigger and is useful independently of the root. A format,
framework or template alone is not enough reason to split it.

## How people would start

These examples use each host's **existing root invocation**. The `support-brief`
words are task text, not a new registered command.

| Host | Example |
|---|---|
| Claude Code | `/impact-to-funding support-brief Help me describe what support would enable.` |
| Codex CLI | `$impact-to-funding support-brief Help me describe what support would enable.` |
| OpenCode V2 | `@impact-to-funding support-brief Help me describe what support would enable.` |

Claude Code passes text following a skill invocation as input. Codex selects the
skill with `$` or `/skills`; the rest is prompt text. OpenCode selects the skill
with `@`; its separate slash commands use their own registry. These host paths do
not establish that a model will follow the new route.

Sources: [Claude skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/build-skills),
[OpenCode V2 skills](https://opencode.ai/v2/docs/skills) and
[OpenCode V2 commands](https://opencode.ai/v2/docs/commands).

## Source layout and migration

- Keep `SKILL.md` as the shared entry. Its conditional route points to
  `playbooks/support-brief.md`; load that file only for the relevant task.
- The playbook links to existing claim, contribution, funding and evidence
  references. Shared privacy and responsible-assistance rules remain in their
  existing sources.
- The funding reference makes a theory optional, and `docs/usage.md` includes a
  short example. Package checks cover the relative links.
- Resolve every path from the **selected** skill copy. Keep its complete files,
  source version and the existing managed-update and opt-in notice boundaries.
  Old pinned copies remain unchanged until their owner deliberately updates.
- Keep manual file-reading available. The playbook should not require Node.js,
  a plugin, a new installer or a funding account for conversation.

The first implementation can be reviewed with the existing package checks and
fictional examples where they clarify the task. A future host observation should
name its exact source, host and scope; it should not be inferred from this design.

## Limits

Record actual reviewers, source permission, recipient authority, eligibility and
outcomes when relevant. Leave unknown facts open. A private draft, a public
candidate and an application have different disclosure and action boundaries.
The person retains authority over outreach, submission, publication and money.
