# Optional coordination across conversations and reporting periods

**Status:** original portable manual guide with an
[authored fictional index](../examples/coordination-index.md). No project,
session graph, access boundary, automatic handoff or participant behaviour has
been tested. An index entry is not a session, permission grant or completed task.

Use this when several conversations or later reporting periods need organising.
A single document or conversation can still be enough. Ordinary Markdown and
non-Harmonica routes remain valid; no account, personal theory, framework,
database or new CLI is required by ItF's manual route. Chosen services have their
own requirements. Existing funding.json v1.1.0 financial fields are unchanged.

## Native direction versus the manual bridge

The intended Harmonica product direction is a **dedicated Impact to Funding
project type**: develop a contribution, hear from people affected, examine the
evidence and decide what to change. It should connect durable contribution,
claim/evidence, review and learning records with purpose-specific conversations
and selective context. That type is proposed, not implemented or deployed by
this guide. A renamed Standard project or one chain template would not deliver it.

Explicitly linked standalone sessions or an appropriate document exchange are
optional manual bridges, not the target architecture or a required preliminary
release. A generic project can help navigation only where its actual audience,
sources and inheritance are suitable. Do not infer a private claim ledger from
a team-memory feature, create a public topic by default, or retype an existing
project. Native controls and methodology compatibility require their own work;
this document does not specify working API fields or register a new type.

## 1. Start from the record and the next useful decision

Keep the human-readable [claim record](../references/claims.md) and
[periodic report](../assets/report.md) as the portable reference point. Record the
exact report/claim/evidence versions, relevant observation period, uncertainty
and decision. Harmonica may help elicit contributions, guide inquiry, support
interpretation and coordinate learning; it does not decide truth or funding.

Separate the builder's claims, affected people's accounts, the reviewer's finding
and the host/custodian's actual authority. Project membership or a role assignment
does not establish competence, independence, disclosure authority or willingness.
No actual operator, participant or responsibility is appointed by an index.

Choose only activities needed for the decision, in a suitable order:

| Activity | Appropriate initial context | Possible handoff, only if permitted |
|---|---|---|
| Affected-person account | Neutral functional brief and relevant period, not a desired verdict or other accounts | Faithful account/recap with correction status and use limits; see the [account guide](beneficiary-accounts.md). |
| Scoped expert review | Accepted exact question, claim/report and minimum authorised evidence packet | Actual reviewer-authored/adopted finding with versions and limits; see the [review guide](expert-review.md). |
| Builder/project reflection | Deliberately selected cleared accounts/findings, dissent and uncertainties | Separately attributed interpretation, revised report and proposed next decision, not edited reviewer words. |
| Later-period follow-up | Relevant intention and selectively permitted history | Fresh dated observations, non-use, harms or unknowns; not a prompt to confirm an earlier conclusion. |

These are branches, not a compulsory funnel. Review can use account material
only if that transfer is authorised. Missing permission or the absence of a
willing reviewer can stop that handoff without preventing unrelated permitted
reflection. An absent review, a missing account and a decision to stop are
legitimate states, not reasons to fabricate progress or invite replacements
automatically.

## 2. Keep a small private index

Store only necessary authorised metadata outside this distributable repository.
The index has its own access boundary: titles, identities, status and resource
links can expose sensitive facts. Do not share it with everyone participating in
one activity, or place protected challenge details in a shared index.

One table for activities and one for transfers can be enough:

```text
Record: project reference; report/claim versions; period; intended index audience
Activity: local label, purpose and relevant period
Resource: actual document/session/project reference if one exists; otherwise none
State: proposed / awaiting an identified dependency / actually performed,
  with actual dates and inspection limits; no inferred server state
Responsibility/access: actual agreed host/participants/custodian and readers,
  or explicitly unassigned/unknown
Output: participant statement, confirmed/corrected/unconfirmed recap,
  AI draft, reviewer-adopted finding or curator interpretation; exact version

Transfer: source version or dated snapshot -> exact recipient activity/service
Purpose/audience/use: actual authority, permitted processing/retention limits
Material: minimal packet, what was actually inspected and what was omitted
Readiness/delivery: proposed / authorised / actually supplied, separately recorded
Change: stale snapshot, corrected source, prior-version finding or use restriction;
  known affected derivatives, actual correction status and remaining uncertainty
```

Use the [fictional index](../examples/coordination-index.md) as an illustration,
not an executable schema. In real use, unknown dates, participants or permissions
stay unknown. A summary being available does not mean it was read or supplied.
A closed conversation does not establish consent, adoption or a verified claim.

Before each actual transfer, the authorised custodian/host checks exact material,
recipient, service/model processing, purpose, audience and permitted uses under
the [privacy guidance](../PRIVACY.md). A receiving person or tool's technical
access is not permission. Prefer a minimal useful derivative, not all transcripts
or a whole repository. If no safe packet is possible, do not transfer; narrow the
task or use an appropriate alternative without reconstructing restricted text.

## 3. Check the host's actual boundaries, not the folder name

For Harmonica, the public guides describe controls in the web interface:

- **Project readers and aggregation:** inspect actual project/session membership,
  visibility and who can read project knowledge before adding a session or
  synthesising sources. A restricted session's material is not automatically
  eligible for project aggregation or a wider audience. Keep incompatible
  material outside the shared container; do not grant project membership just
  to let someone contribute to one session.
- **Inherited context:** inspect the project's *Inherited by new sessions* card
  and its toggle where available. Check host organisational instructions,
  project/session sources, retrieval/tools, cross-pollination and participant
  links separately. Initial accounts/reviews must not inherit desired conclusions
  by default. Turning off one route does not establish isolation from the rest;
  standalone sessions can still inherit host context.
- **Sources and snapshots:** inspect each attached source and the actual version
  used. Documentation describes prior-session summaries as snapshots with an
  explicit Refresh action. Record that snapshot before use; do not silently
  refresh a running review or assume a later upstream edit reached downstream
  conversations. Retrieved passages and summaries may be incomplete or lossy.
- **Results and publication:** inspect actual host/editor/result access and
  provider handling. Host-only results are not anonymity or confidentiality.
  Project synthesis is not reviewer adoption, independent corroboration or a
  cleared public report. Publish only a separately reviewed, permitted derivative.

If the necessary control is unavailable on the current agent surface, inspect
and configure it through an available supported host surface before real use,
with actual authority. Do not invent MCP fields, infer web/API/MCP parity or
install/build a CLI to complete this guide. If the boundary cannot be verified,
use a suitable separate document/session route or do not transfer. Do not alter
shared host settings without authority.

Chains are for a selected bounded method whose order, accepted roles and every
context handoff are appropriate. The chain guide describes automatic downstream
session creation and summary inheritance; operational progression may notify
people or consume credits. It is not read-only grouping or the default for
independent listening/review. An index does not authorise launch, advancement,
summary generation, source attachment, notification or spending.

Official sources read 2026-11-07: [projects and inheritance](https://help.harmonica.chat/guides/hosts/managing-projects.md),
[context sources](https://help.harmonica.chat/guides/hosts/context-sources.md),
[session settings](https://help.harmonica.chat/guides/hosts/session-settings.md)
and [chains](https://help.harmonica.chat/guides/hosts/chains.md). This is dated
documentation guidance, not a live configuration, available-template check,
security audit or deployed parity finding. No private host internals are needed
to use the portable index.

## 4. Carry changes without manufacturing continuity

Retain account versus AI recap versus analyst interpretation versus reviewer
finding. Preserve contrary evidence, missing perspectives and access limits;
several summaries repeating one source do not become independent corroboration.
“Settled” memory denotes convergence, not proven impact.

On a source correction, record the new permitted version and identify known
dependent packets/reports. The original finding stays bound to what was actually
examined. Mark stale or uncertain downstream references; a corrected index does
not prove correction of every conversation/export. Reconsideration, contact or
refresh needs its own actual authority, not an automatic retry loop.

On a changed claim/report, mark earlier reviews as prior-version for the new
wording. On withdrawal or use changes, follow the
[canonical correction rules](../references/claims.md#updates-reviews-and-disputes):
separate reviewer withdrawal, evidence-use authority and reassessed claim support.
Stop affected uses, narrow/omit dependent claims where needed and keep only
authorised history. Removing a source, moving a session or closing a project
does not recall earlier context, provider logs, exports or public copies.

Use the existing report's evidence, harms/burden and next-decision sections.
Proposals, agreed responsibilities and completed changes remain distinct. No
impact score, funding allocation, new collection or native implementation follows
from completing the index.
