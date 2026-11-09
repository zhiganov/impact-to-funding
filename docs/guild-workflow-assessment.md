# Native guild collaboration: workflow assessment

**Date:** 2026-11-09. **Scope:** offline assessment for [#53][I53], including its
complementary-manifest clarification. **Result:** a documentation-only cooperation
layer over the existing contribution and collaborative-project designs, with a
native Groups mapping. This is not an implemented application, an adopted guild
process, a user trial or evidence that collaboration improves impact or income.

The [guild concept](guilds-itfti-atproto.md) supplies the framing. The
[entirely fictional Harbour journey](../examples/guilds-itfti-atproto.md) supplies
the worked example, including declined help, capacity, changed plans and departure.
Guilds are people sustaining useful practice together, not merely applicant lists.

## 1. Reuse and the actual gap

| Existing source/design | Already sufficient | Remaining guild-level job |
|---|---|---|
| [Contribution guidance](../references/contributions.md) | Bounded roles, selected portfolios, capacity, shared credit, privacy and historical participation. | Apply it to reciprocal help across independent projects, not a new individual-purpose form. |
| [Collaborative workflow #16][C16] | Proposals, integration, exact-version decisions, separately accepted responsibilities, dissent and learning reports. | Let a guild help with several projects without becoming their approver or requiring a report for every interaction. |
| [Report template](../assets/report.md) | Intentions, observations, failures, learning, resources and next decisions. | Use a short relevant section only when useful; no guild-specific cadence or additional reporting template. |
| #11–#14 identity, grants, privacy and content designs | Technical identity and access separated from human authority; protocol-neutral content semantics. | Map the help journey to those boundaries, not a new charter, editor, roster or Lexicon. |
| #15 and #19–#20 review, disputes and portability | Version-bound review, correction, dissent/moderation distinctions and bounded exit. | Do not turn helpful advice into evaluation or technical moderation into a verdict on contribution. |

**Recommendation:** retain the core skill, report template and existing contracts
unchanged. Add this small cooperation guide and extend the existing fictional
walkthrough. The gap is the guild-level journey and native mapping, not a missing
impact score, matching service or another mandatory record type. #52's independent
curation assessment remains open; this assessment does not settle typed relationships.

## 2. Smallest useful cooperation journey

These are human actions and optional prose sections, not new API states or fields.
One permission-appropriate, versioned account can carry several steps. An ordinary
conversation need not become a permanent record; keep only what the action requires.

| Moment | Who does what | Minimum useful account and boundary |
|---|---|---|
| Find shared practice | People identify work they want to help sustain, existing efforts and relevant limits. | A provisional shared purpose can coexist with different or undisclosed personal motivations. Belonging is not agreement with every project theory. No peers or willing participants are supplied by ItF. |
| Offer/request bounded help | A person describes a concrete task or question to an appropriate audience, with context, effort/capacity and timing only where known. | Separate an offer, a request and an actual agreement. Public availability or membership is not availability to help; silence is not acceptance. Do not expose a protected project merely to make the request legible. |
| Accept, narrow or decline | Each intended contributor decides what they can do; the project's actual responsible people agree any changed project plan. | State the accepted role, scope and period where established. A guild editor cannot assign another person's effort. Declining, renegotiating or not reporting work is not poor standing. No unpaid availability is presumed. |
| Work and support others | Contributors do the agreed work and may provide care, maintenance, facilitation, coordination or practical advice. | Describe actual work separately from proposals and benefits. Preserve coauthors and enabling work without requiring a visible artifact, public story, score or causal-credit percentage. |
| Learn and reconsider | At an actually agreed useful point, people compare intentions with what happened, missing perspectives, burden and uncertainty. | Use the existing report or a short conversation. AI may help formulate questions and alternatives; people interpret meaning. Advice is formative, not claim-specific review or proof of impact. No new survey or collection is implied. |
| Change a plan | The affected contributors revise their commitments; the actual project approvers consider an exact changed candidate under their own rule. | Reuse #16's versioned decisions and dissent. Preserve earlier intentions, unresolved objections and capacity conflicts. Neither a summary, silence nor a group signature supplies consensus. |
| End or continue | People may complete, reduce or end help, leave a guild or stay involved in a project. | Record a role ending where useful and permitted; replacement responsibility needs actual acceptance. Historical work and unresolved dissent do not vanish or become current endorsement. No universal erasure or ongoing obligation is invented. |

One guild may support several projects, one project may draw on several guilds,
and a person may contribute without membership. Each project keeps its own purpose
and decision authority. Withheld affiliations are not gaps to collect before help
can be considered. Membership, effort, compensation and contribution are not
interchangeable measures of human worth.

## 3. Native Groups mapping—not a manual substitute

The intended native experience uses the same group identity across compatible
applications, while keeping people, projects, commitments and public presentation
distinct. The map below carries forward the [#12 permission design][C12] and
[#14 content/transport design][C14], interpreted against their pinned
[Groups][A1] and [Spaces][A2] proposals. It is a proposed application use of those
primitives, not a claim that a deployed client supports these steps.

| Journey surface | Intended native carrier/actor | What must be checked or kept separate |
|---|---|---|
| Guild identity and technical relationships | Group DID; upstream group metadata/membership spaces. | DIDs identify accounts/groups; changeable handles are display labels, not identity keys or evidence. Governance, project authority and financial mandates do not follow from a DID or roster. |
| Personal help request, response or contribution | Individually attributed application content on the member's supported repo host, using the relevant personal session/grants and permitted modality space. | Do not assume an ordinary PDS login supports Spaces storage/sync or grants access to that audience. Reuse #14's semantic packet/version conventions; no help-request collection or schema is adopted here. |
| Guild-authored selection or working account | Where supported, group-authored application content via an appropriately authorised group session. | Prefer a per-user group session: the host authenticates the authorising person through their own PDS and checks their current roles. A shared application session is instead authorised by an admin; the host checks that admin, so the app must separately authenticate and check the actual acting member's current effective permissions for each action. Preserve the acting author/editor and exact decision basis. Neither session supplies every member's consent. |
| Project agreement and accepted help | Separately attributed proposals, exact candidate and actual decisions under #16's model. | Writing as the group does not appoint project approvers, accept personal commitments or resolve conflicting edits. A shared editor is not supplied by the protocol. |
| Audience and access | Actual supported Space boundaries and role grants. | Roster acceptance is not the access gate; role grants combine by union, not deny overrides. A space index may be incomplete. No per-record secrecy is inferred from a client filter or absent index entry. |
| Non-member help | Use only a channel and disclosure basis actually available to that person. A permitted attributed account can be brought into the application by an authorised participant. | Do not grant non-members automatic read/write access, impersonate them as member authors or copy protected source references. If no suitable supported access route exists, that interaction remains outside the native workflow rather than being counted as interoperable. |
| Reflection and correction | Same versioned work/decision references, with permitted report excerpts and corrections under #16–#18. | A new summary or claim version inherits no review. Space access is not consent to send material to an AI provider, funding service or another application. |
| Optional public presentation | Separately curated personal and/or collective `itf-manifest.json` views. | Neither is mandatory, reciprocal or exhaustive. No automatic roster export, private-Space access, review, representation mandate or double-counted work/cost follows. Current support fields have no contributor/guild relationship arrays or DID fields. |
| Departure and handover | Reassess actual role grants, personal/group sessions, authored repos and application responsibilities. | A roster change alone is insufficient proof of denial or revocation. Migration does not automatically carry host-private join/moderation history or OAuth sessions. Keep only permitted history; distributed copies may remain. |

Application content belongs in suitable modality spaces, not a universal group
metadata bucket; member-authored data remains on member repo hosts rather than
automatically moving to the group host. Technical authenticity is bounded:
Spaces access is not E2EE from hosts/apps, and private MAC-based authenticity is
not transferable public attestation. No signature, CID or DID verifies a contribution,
review independence or impact.

If audiences must not share material, use a suitable supported access boundary,
a separately approved derivative, or omit it. When those capabilities are absent,
say the step is unsupported. Permission-appropriate local documents can still
help people collaborate, but do not demonstrate the intended native experience.

## 4. Independent work and readiness

This assessment supplies no reviewer/mentor pool, check-in programme, recruitment,
matching, notification, treasury or service. Formative cooperation does not complete
[#36 check-ins][I36] or [#37 mentor scoping][I37], and neither is a prerequisite.
Claim-specific review stays with #15, curation semantics with #52 and allocation
with #8. Funding and independent opportunity discovery remain optional.

**Assessment complete; native execution unverified.** This document and the
fictional journey close the offline workflow gap, not an implementation gate.
The existing next runtime dependency is [#10][I10]: an actually supported deployed
member-PDS/group-host/client tuple and authorised disposable resources/operator,
terms, costs and owner. [#21][I21] retains bounded synthetic execution. The record
model and permissions must be checked against that selected stack before use;
this assessment selects no implementation, new host, test harness or live recheck.
Deferred #29 remains deferred.

The sources establish design intent, not working access. No participant, account,
help request, commitment, consent, data collection, model trial or outcome was
observed or created. The fictional story tests explanatory coverage only; it is
not user validation. No third-party schema, method text or private provider design
is reproduced.

[I53]: https://github.com/zhiganov/impact-to-funding/issues/53
[C12]: https://github.com/zhiganov/impact-to-funding/issues/12#issuecomment-6647200776
[C14]: https://github.com/zhiganov/impact-to-funding/issues/14#issuecomment-6647672210
[C16]: https://github.com/zhiganov/impact-to-funding/issues/16#issuecomment-6665079951
[I36]: https://github.com/zhiganov/impact-to-funding/issues/36
[I37]: https://github.com/zhiganov/impact-to-funding/issues/37
[I10]: https://github.com/zhiganov/impact-to-funding/issues/10
[I21]: https://github.com/zhiganov/impact-to-funding/issues/21
[A1]: https://tangled.org/opensocial.group/proposal/blob/2b41a9bf9171c03a1aa5ee26c6e39823ba27c79d/proposal.md
[A2]: https://github.com/bluesky-social/proposals/blob/9e86df35b17f828294333a4c5b95dce22bcbf323/0016-permissioned-data/README.md
