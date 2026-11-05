# Individual theories, shared projects and contribution portfolios

**Date: 2026-11-05. Status: agreed conceptual direction with core manual-use instructions implemented in source.**
This records the relationship discussed with the project owner. The
[contribution reference](../references/contributions.md) is the operational
guidance for the skill; this document preserves the design rationale and scope.
The implementation is instructions, templates and synthetic examples, not a
tracking application, published schema, adopted pilot mission or authority to
publish, provision accounts, monitor activity or move money. Native activation,
model adherence and real-world usefulness are not established by these changes.

## Decision

Treat individual and project theories of change as **separate but connected**.
Connect them through specific contributions, not a compulsory ownership hierarchy.
A project may appear within someone's personal portfolio without becoming
subordinate to their purpose or belonging to them.

| Concept | Question it answers | Boundary |
|---|---|---|
| Individual theory of change | What changes do I want to contribute to, and why are these uses of my capabilities worthwhile? | May contain several pathways and uncertainty; no compulsory unified life mission. |
| Project theory of change | What change are we collectively trying to produce, through what mechanisms and assumptions? | Has its own subject, scope and responsibility; not the sum of members' personal ambitions. |
| Contribution | What does this person actually do or propose to do, and how might that support a specific project pathway? | A role, membership or intention does not establish delivery, causality or exclusive credit. |
| Personal portfolio view | How do my contributions fit together, compete for capacity or change my direction? | A view over related work, not another mandatory theory document or a sum of impact scores. |

One person can contribute to many projects; one project can have many contributors.
A project can support several personal goals, and several projects can support
one personal pathway. Project-to-project dependencies can be described where useful
without forcing every relationship into a tree.

## Alignment without forced agreement

An individual theory explains why participation makes sense for that person. A
project theory explains the shared purpose and change pathway. Contributors can
have different motivations while agreeing to a bounded project contribution.
They do not need identical personal missions or written personal theories to join.
Sharing a private personal theory is not a condition of participation.

The relationship is reciprocal: project experience may challenge an individual's
direction, and contributors may propose changes to the project theory. Neither
change implies the other people agreed. Preserve authorship, objections and the
actual authority to approve a shared version; an AI cannot supply collective consent.

Projects remain independent initiatives, including when used as private pilots
for this skill. Their mission, funding and delivery decisions are not automatic
prerequisites for developing the reusable product.

## Five projects do not require five personal theories

Use one personal theory, or several personal pathways where that is more honest,
with links to the relevant contributions. Maintain each project's shared theory
once at its own source rather than copying it into every personal assessment.
Different projects may reinforce each other, overlap, compete for time or explore
a direction that does not yet fit. Make those tensions visible rather than invent
a coherent story or prescribe a moral ranking.

A contribution link needs only the information useful for the current decision:

- Person/chosen identity and project reference; the relevant theory version or
  pathway when available. An unavailable theory stays unavailable, not invented.
- Actual or proposed role, scope and period; distinguish intentions from work done.
- Why this contribution fits, explores or challenges the personal direction,
  if the person chooses to explain it.
- Expected mechanism, dependencies and the person's limited responsibility.
- Capacity/effort where known and decision-relevant; unknown allocations stay unknown.
- Evidence and claim references, other contributors, uncertainty and learning.
- Disclosure limits and a review point when useful; no invented schedule or consent.

These are optional narrative prompts, not required database fields or a demand
for seven separate records. A short Markdown section can be sufficient.

## Separate records, connected views

- The project view explains shared intentions, progress, evidence and contributions.
- The personal view explains the person's direction and actual contributions
  across the selected projects.
- A contribution can reference shared evidence without inheriting the project's
  outcome claims, causal credit, reviews or funding authority.
- Use stable local references and explicit versions when linking claims, reports
  and actual reviews. A changed theory can prompt reassessment of alignment;
  it does not rewrite earlier intentions or automatically revalidate old findings.
- If a referenced project theory or evidence is restricted or unavailable, show
  the limit within the permitted audience. Do not fetch it, reveal its private
  locator or infer its contents merely to complete the portfolio.
- Public derivatives require their own content/audience approval. Linking private
  projects can itself disclose sensitive associations; do not merge identities
  or publish portfolio membership automatically.

Shared outcomes may appear with attribution in both views, but must not be added
as independent outcomes. Do not invent percentage shares of causal credit or
convert time allocation into impact allocation. Do not double-count the same
work or cost across contributions, personal asks and project asks. Distinct costs
can be funded separately when their actual scope and existing support are clear.

## Entirely fictional illustration

Person A wants to strengthen practical cooperation. Their portfolio links to
five invented projects: Lantern (repair sessions), Bridge (accessible meeting
materials), Seed (a garden-tool library), Compass (volunteer orientation) and
Harbour (a community noticeboard). Each has its own shared change pathway.

A's Lantern contribution is arranging a venue, not personally delivering every
repair or causing every participant benefit. A's Bridge contribution is drafting
materials with another author; the same drafting work is referenced, not counted
again, if Compass reuses it. Harbour is an exploratory contribution whose fit is
uncertain. These are legitimate differences within one portfolio, not reasons
to invent five personal missions or a combined impact score.

This authored illustration is not a disguised pilot, model response, observed
result, evidence of usefulness or a mandatory project taxonomy.

## Implementation handoff

Existing coverage was checked on 2026-11-05:

- [#11 identity and membership](https://github.com/zhiganov/impact-to-funding/issues/11)
  already separates people, projects, groups and contributions, including
  many-to-many relationships. Its completed design need not be reopened.
- [#14 portable records](https://github.com/zhiganov/impact-to-funding/issues/14)
  already supports protocol-neutral content, roles, versions and shared credit.
  This clarification is not evidence that its proposed transport is implemented.
- [#16 collaborative theories and reports](https://github.com/zhiganov/impact-to-funding/issues/16)
  covered shared authorship, dissent and cross-project contributions at the initial
  check. Its requirements now explicitly include the personal/project theory
  relationship and portfolio views, as described below.

The selected implementation is a **manual-use skill improvement**, not a new
hosted application. It adds the contribution reference, skill routing, optional
assessment/report sections, usage guidance and a fictional five-project input
with a separately authored assessment. The existing package checks include the
new distributed files and their fictional/example labels. These are source and
package checks, not a fresh behavioural trial. Runtime and protocol integration
remain separate scopes.

### Core-skill implementation — issue #22

[Implement individual/project contribution portfolios in the core skill](https://github.com/zhiganov/impact-to-funding/issues/22)
was filed and read back on 2026-11-05. The implementation scope is:

**Outcome:** help someone connect their own direction to one or several shared
projects without duplicating theories, claiming all shared impact or requiring
an account, group, database or application.

**Scope and acceptance — core manual-use source implementation:**

- [x] Use this design as the conceptual contract; update SKILL.md and the smallest
  relevant reference/template sections to distinguish personal theory, project
  theory and contribution. Keep one canonical explanation rather than repeating it.
- [x] Support a project-only assessment without requiring contributors' personal
  theories, and a personal portfolio without forcing one unified mission.
- [x] Provide optional contribution/portfolio output that preserves role, period,
  alignment, capacity limits, dependencies, evidence and uncertainty, with unknown
  or restricted project material handled honestly.
- [x] Add an entirely fictional five-project example, including shared work,
  conflicting capacity or uncertain fit, and no whole-project credit inheritance.
- [x] Preserve version-scoped reviews, privacy of personal motivations and project
  associations, shared outcomes and duplicate-cost safeguards in reports/asks.
- [x] Review the changed content and run the existing package/text checks. Keep
  authored expectations distinct from behavioural evidence; no paid trial,
  installation retry or new validation infrastructure is included by default.

The four package checks pass, including local links, text integrity and the new
example inventory/labels. A separate read-only AI content review found no material
issues in the guidance, templates and input/answer consistency. That review is not
an independent impact evaluation or a fresh-context behavioural trial. These
source-level acceptance marks do not assert remote delivery, native activation
or successful model behaviour. The experimental v0.1.0 release remains unchanged.

Coordinate with #16 for collaborative workflows and #14 for any later selected
structured representation. Groups runtime readiness is not a dependency for this
Markdown/manual-use slice. Filing this issue does not select implementation,
source publication, a release, monitoring, fundraising or payment operations.

### Collaborative workflow extension — issue #16

The [existing issue](https://github.com/zhiganov/impact-to-funding/issues/16) was
updated and read back on 2026-11-05, preserving its earlier requirements and open
status. Its added scope is:

Extend the collaborative journey to show how an independently authored personal
theory connects through a bounded contribution to an explicitly approved shared
project theory. Include several contributors with different motivations, one
person working across five projects, unavailable/private personal theories,
changed project versions, dissent and historical contributions after departure.

Acceptance should demonstrate project and personal report views referencing the
same underlying shared work without duplicating outcomes, silently transferring
reviews or requiring personal-purpose disclosure. Carry forward #11/#14 rather
than reopening completed design or introducing a mandatory new graph service.
The protocol-neutral core-skill issue owns manual-use implementation; #16 owns
the collaborative workflow design. Neither selects live Groups integration.

Tracker filing, design preservation and core-skill implementation are distinct
stages; none by itself establishes published source delivery, a release or runtime
verification. The core instructions do not complete #16's collaborative workflow
design. No private pilot facts were included. Hosting, Groups integration,
framework imports and native-installation recovery remain outside this slice.

## Basis and limits

This is ItF's original product design, consistent with the existing
[skill](../SKILL.md), [claim guidance](../references/claims.md) and
[historical scope](design-scope-2026-11-04.md). It is not attributed to the School
for Moral Ambition or Rutger Bregman as an official method or endorsement.
No private pilot evidence or new external methodological research was used.
