# Guild curation: policy, attribution and portable views

**Date:** 2026-11-09. **Scope:** offline semantic/reuse assessment for [#52][I52],
including complementary individual and collective manifests. **Result:** use a
human-readable, versioned policy and attributed selection; reuse existing support
fields only for their defined discovery meanings. No extension, Lexicon, registry,
certification service, collector or native integration is adopted or implemented.

The [fictional curation case](../examples/guild-curation.md) carries two guilds'
selections and a policy change through those boundaries. It is authored reasoning,
not real curation, consent, model output, a user trial or evidence of impact.

## 1. What is being asserted, and by whom?

Keep these separate even where the same person fills several roles:

| Fact or action | Bounded meaning | Not supplied by it |
|---|---|---|
| Work and contribution | An actual author's account of selected work, roles, period and limits. | Exclusive ownership of shared outcomes, current guild membership or verified impact. |
| Curated selection | An identified curator chooses or interprets particular work under a stated policy/version. | The contributor's agreement with that interpretation, independent corroboration or a universal ranking. |
| Guild public representation | An exact public version with the guild's actual publication authority and disclosure basis. | Every member's endorsement, private-Space access, project approval or authority to bind contributors. |
| Scoped review | A finding actually made about the exact target/evidence examined, with conflicts and limits. | A review of a new selection, edited report or policy; membership or being selected is not review. |
| Allocation | A separately authorised resource decision under actual terms and responsibilities. | Curation weights, payment rights or financial authority merely because the work was selected. |

For each permitted view, distinguish the actual curator, the record/payload's
author, publisher, subject, contributors, reviewer and any resource decision-maker.
A transport author or group DID does not settle all of those roles. If collective
publication authority is unknown, retain a provisional account or a clearly
attributed curator's own interpretation, not a purportedly approved guild view.

## 2. Minimum useful policy and selection account

These are prose facts, not required JSON properties, a new schema or a public
policy store. Combine them in one suitable document where that is enough; leave
unknowns explicit and keep protected agreements outside public presentations.

| Useful fact | What the reader needs to understand |
|---|---|
| Purpose and scope | The actual domain, period or other selection boundary, why work is selected, and what selection/omission does and does not mean. Selection is partial, not a complete roster or proof of no other work. |
| Policy identity/version | Which policy and actual revision this selection uses. A new policy does not retroactively relabel old selections. A mutable link alone is not a version. |
| Curation and change authority | Who actually curated, the basis for representing the guild, who may revise the policy, and the decision/approval basis actually established for this version. Reuse the community's real rule; do not appoint a committee or assume consensus. |
| Selected work | The minimum cleared subject/work references, actual source versions where known, role/period and the curator's own interpretation and limits. Keep source declarations, actual inspection and version-match evidence distinct. |
| Conflicts and qualifications | Relevant known interests, coauthorship or limits on independence. Do not disclose a protected association to make a conflict field complete; narrow or omit an independence claim if its necessary basis cannot be safely shown. |
| Correction and contestation | The actual available way to question or correct the selection/policy, who can change which statement and any known limits. Unknown responsibility stays unknown; a status link is not a staffed appeal service. |
| Disclosure and continuity | What may be shared for the intended audience/use; how declined recognition, changed permissions, corrections and historical association are handled within actual authority and retention limits. No complete public graph or recall of third-party copies. |

The full working basis need not be public. Public prose must still carry the
material qualifications needed to avoid misleading readers. If that cannot be
done safely, withhold or narrow the presentation rather than expose restricted
sources, identifiers, digests, affiliations, allegations or their existence.

## 3. Reuse before any new type

The existing [#14 semantic packet and reuse assessment][C14] already distinguishes
authors, subjects, contribution context, exact references, disclosure and lifecycle.
Its [funding-reference correction][C14F] and [later URI warning][C14U] remain in force.
The following is a meaning-level comparison, not a new wire mapping or dependency.
The Hypercerts comparison reuses #14's inspection of source
`444b3145569dee21e2507a8ba1981adb171d72f4`, package `2.0.1`; no current schema or
deployment was reinspected for this assessment.

| Existing facility | Reuse that is sufficient here | What remains unsupported or must not be inferred |
|---|---|---|
| #14 narrative/semantic packet | Keep the policy/version, curator, subject, source basis, interpretation, limitations and correction relation in attributed prose with known version references. | No machine-enforceable guild curation policy, shared editor or complete policy/selection record contract is supplied. |
| Optional Hypercerts activity/contribution and collection candidates already inspected in #14 | Where their actual semantics fit, they may describe work/contributors or grouping. No such dependency is selected here. | Grouping is not policy-bound curation, endorsement, legal authority or causal credit. Optional contribution/collection weights cannot silently acquire those meanings. |
| Optional attachment/evaluation candidates already inspected in #14 | A suitable attachment can carry a permitted account; an evaluation is for actual scoped evaluation, not merely selection. | A generic link or score does not preserve every policy, consent, correction or exact-review meaning. Listing evaluator DIDs does not prove participation or independence. |
| [Support profile](support-profile-contract.md): `publisher`, `subject`, `limitations` | Describe an appropriate public person/collective support subject, actual publishing context, bounded roles and selection limits. | Publisher is not necessarily curator or payee. Local subject IDs are not DIDs. No contributor/guild relationship arrays, DID fields, private policy or membership graph are defined. |
| Support `reports` and local `reportRefs` | Refer to selected public accounts with their actual scope, declared revision when known and limits; the account may explain curation in prose. | Not a typed policy/selection edge or full evidence graph. Do not treat a policy document as a report merely to obtain a generic link field. Unknown source versions remain unresolved, not fabricated. |
| Support `canonicalUrl`, `statusUrl`, `derivedFrom` | Primary support-document location; safe correction context; exact known source/mapping basis for a transformed support document, respectively. | Not global identity, guaranteed retrievable history, a multi-source curation list or a shortcut to mutual recognition. `derivedFrom` is not the selected work, policy or relationship field. |
| Existing Groups metadata, roles and acceptance | Identify technical group relationships and capabilities under the upstream model. | No curation meaning belongs in standard membership/acceptance or protocol role fields. Technical access is not publication, consent, review or allocation authority. |

**Decision: documentation-only reuse, no contract change.** A reader can understand
who selected which version of work under which policy, and the limits, through a
permitted attributed account. The present need does not establish a requirement
for machine-queryable policy edges or a new exchange type. Current support-profile
tools can inspect their defined declarations, not verify the curation policy,
approval, identities or truth of that account. No new tool behaviour is claimed.

For a future structured consumer, expose losses rather than claim a lossless
round trip: prose policy/change rules are not executable; source/review/permission
bindings may remain unstructured; restricted facts may be deliberately absent;
target validators and reference paths may not support the chosen Spaces revision.
A mutable source, matching name or revision label alone proves neither byte/version
identity nor consent. Do not fetch, merge identities, mint identifiers or silently
choose latest content to fill a gap. An unsupported necessary meaning stays
unsupported; any later extension requires an actual consumer need and explicit
contract decision, not this assessment's existence.

## 4. Version changes, disputes and exit

Keep selection revision, policy revision, work/report revision and review target
distinct. A selection remains under the policy it actually used; a changed policy
requires a separately attributed new selection/candidate if re-selection is wanted.
Explain the changed interpretation and obtain whatever exact approval/disclosure
basis that new view actually requires. Do not transfer old consent or reviews.

Reuse [#16 decisions/dissent][C16], [#19 disputes/moderation][C19] and
[#20 portability][C20], not another governance or appeals system:

- A disagreement with selection or policy is not automatically abusive conduct,
  a review challenge or proof the work is false. Preserve a permitted objection
  and actual outcome without publishing protected allegations.
- A custodian's source-use change stops affected uses while scope and retention
  are checked; reassess dependent wording against remaining permitted evidence.
  It does not withdraw someone else's review or automatically disprove the work.
- A reviewer controls their own finding/withdrawal; a curator cannot rewrite it
  or continue to show a withdrawn statement as current endorsement.
- A contributor may decline public recognition or later association without an
  automatic membership penalty. Do not falsify authorship or omit attribution
  required by a source licence: omit the reused material or use another permitted
  presentation where necessary. Declining association is not guaranteed deletion
  of others' legitimate historical statements or copies.
- Departure is not a retraction of earlier work or unresolved dissent, nor current
  endorsement. Retain only history actually permitted; a safe correction pointer
  may replace a payload, and unavailable history must stay explicitly unavailable.

## 5. Complementary views and weights

An individual and a guild may each publish a selected `itf-manifest.json` support
view, or either may publish without the other. Each has its own publisher/source
context and canonical editable representation; one does not own the other's account.
If one actually transforms a support document, retain the contract's distinct
derivation/revision rules rather than claim independent authorship or attestation.
Refer to the same versioned shared work across views without copying its outcomes,
reviews, ownership or funding need into several independent claims. A missing
reciprocal view does not refute a contribution; reciprocal acknowledgement is scoped,
not independent corroboration or consensus.

Non-members may contribute; members may have nothing to report in a period. Omitted
affiliations are not inactivity or poor standing. Use ATProto DIDs as identity
references and changeable handles for readability, not name/handle-based global
identity merging or compulsory accounts for non-ATProto use. Do not place a DID
in a support-profile local ID or invent an undeclared identity field.

**Default: no numerical curation weight.** If a later actual use requires one,
preserve its specific meaning, owner, policy/version, scope/period, uncertainty,
conflicts and challenge/update rule. Updating or decaying weights can reduce
incumbency but can also distort historical recognition; neither is a universal
default. A weight does not become an impact percentage, reviewer-independence
measure, payment share, governance vote or control over another person's narrative.
Existing [#8 allocation policy][I8] remains separate; no formula or ranking is chosen.

## 6. Native and evidence limits

Reuse the [#53 native workflow mapping](guild-workflow-assessment.md): Groups
membership/access, application contribution/recognition and curated public views
are distinct layers. Member-authored records stay on supported member repo hosts;
group-authored views preserve the actual editor and separate approval basis.
Neither per-user nor shared group sessions supply collective consent. Application
content belongs in suitable modality spaces, not standard group-metadata buckets.

Space access is not E2EE from hosts/apps or consent for onward model processing.
Private MAC-based authenticity does not become public transferable attestation;
signatures, CIDs and DIDs do not prove truth, reviewer independence or impact. A
public derivative needs its own permitted content/version, not a private export
labelled certified. No automatic roster export or private-policy/evidence feed.

This assessment does not establish a supported deployed member-PDS/group-host/client
tuple, authorised disposable resources/operator, actual terms/costs/owner or
interoperable policy/selection records. Existing [#10][I10]/[#21][I21] runtime gates
remain; deferred #29 is not resumed. Source evidence is the existing pinned design
and accepted support contract, not fresh deployment inspection or behavioural
validation. No new source collection, funds, applications or outreach occurred.

[I52]: https://github.com/zhiganov/impact-to-funding/issues/52
[C14]: https://github.com/zhiganov/impact-to-funding/issues/14#issuecomment-6647672210
[C14F]: https://github.com/zhiganov/impact-to-funding/issues/14#issuecomment-6647784597
[C14U]: https://github.com/zhiganov/impact-to-funding/issues/14#issuecomment-6677072024
[C16]: https://github.com/zhiganov/impact-to-funding/issues/16#issuecomment-6665079951
[C19]: https://github.com/zhiganov/impact-to-funding/issues/19#issuecomment-6676914321
[C20]: https://github.com/zhiganov/impact-to-funding/issues/20#issuecomment-6676813792
[I8]: https://github.com/zhiganov/impact-to-funding/issues/8
[I10]: https://github.com/zhiganov/impact-to-funding/issues/10
[I21]: https://github.com/zhiganov/impact-to-funding/issues/21
