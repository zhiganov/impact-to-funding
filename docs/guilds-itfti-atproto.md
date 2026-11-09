# Draft: ItFtI, guilds and Atmospheric Groups

**Date:** 2026-11-09. **Status:** source-linked concept note and proposed design
direction, not an implemented integration or adopted protocol amendment.
**ItFtI** is a working codename connecting the independent Impact to Funding (ItF)
and Funding to Impact (FtI) lines of work, not a repository rename or new standard.

An Atmospheric Group of ItF users working together can be framed as a **guild**:
a community sustaining a domain of contribution through shared practice, mutual
help, learning and accountable stewardship. Funding can support that work; it is
not what makes every interaction worthwhile, and membership does not require an
application, account with a funding service or public impact profile.

This is an adaptation to explore, not a claim that every chat group implements
the full Guild Guild architecture. The [fictional example](../examples/guilds-itfti-atproto.md)
shows the social relationships and technical boundaries without real records.

## 1. What the two articles contribute

### Guilds: a Reference Architecture — 6 June 2025

[Zargham and Gist's reference architecture][G1] separates productive work from
membership/attribution/weighting and from resource receipt/reserves/distribution.
Its principles include structural minimalism, participant autonomy and sufficient
transparency. It describes numerical weights and a Protocol Guild configuration,
but also recognises conventional financial infrastructure and manual distribution.

**Learning for ItFtI:** keep helping people contribute and learn distinct from
deciding who belongs, how work is recognised and who may distribute money. Guilds
could supply locally legitimate relationships and decisions; an agent cannot
manufacture those simply by creating readable records.

### The Prestige Ponzi and the Guild Response — 29 June 2026

[The later essay][G2] describes a feedback loop in which recognition attracts
resources and contributors, while credit flows back to already-visible people.
It recognises narration and fundraising as real work; the concern is their becoming
control over other people's attribution and resources. It also warns that a
meta-guild or certification service can recreate the same dependency.

**Learning for ItFtI:** improve people's ability to understand and examine work,
not their dependence on an ItFtI endorsement. Maintenance, care, facilitation,
documentation, coordination and learning must not disappear merely because they
produce fewer easily counted or publicly visible artifacts.

The articles propose mechanisms and describe an example. Their broad claims about
funding, retention, efficiency and anti-capture are not independently validated
by this note. The blog's use of “ponzi” describes a structural criticism, not a
basis for accusing a particular person or guild of fraud.

## 2. Distinct roles, reinforcing work

| Actor or layer | Useful role | Authority not implied |
|---|---|---|
| Person | Explore interests, contribution and relationships; keep a bounded record of actual/proposed work and learning. | Membership does not disclose personal purposes, prove unique personhood or transfer ownership of a portfolio. |
| Shared project | Maintain its own purpose, theory, evidence and agreed responsibilities. | A contributor's account or a guild's affiliation does not approve a project theory on everyone's behalf. |
| Guild | Help people work together, recognise contributions, steward shared artifacts and contest decisions. | Neither its most visible spokesperson nor a group administrator automatically owns all results or funding authority. |
| ItF | Assist inquiry, collaboration, claim/evidence interpretation and permission-bounded views. | An AI summary is not a collective decision, independent review or universal impact score. |
| FtI | Make funders' stated intentions, opportunities and conditions understandable to permitted consumers. | Discovery or apparent relevance is not eligibility, an offer, a commitment or permission to disclose private guild material. |
| Funder, fiscal host or allocator | Exercise its actual, disclosed responsibilities and agreed terms. | A group DID, wallet, publication or incoming donation alone proves none of those responsibilities. |

People, projects and guilds have many-to-many relationships. Guild membership is
not employment, project membership, representation authority or an allocation share.
A guild can support several projects, and one contribution can appear by reference
in several views without becoming several outcomes or costs. Preserve the existing
[contribution relationships](../references/contributions.md),
[claim rules](../references/claims.md) and [private crosswalk](../assets/evidence-crosswalk.md).

### Complementary individual and guild manifests

Allow both views under the preferred `itf-manifest.json` filename, without making
either compulsory or requiring every contributor or association to be listed:

| Publisher-controlled view | What it can present | What it does not establish |
|---|---|---|
| Guild / collective | Shared purpose, selected work, support needs and permission-cleared recognition of contributors. | A complete roster, every member's approval, exclusive credit or authority to represent or receive funds for everyone. |
| Individual / person | Selected contributions across projects and guilds, with actual roles, periods and limits. | A complete public portfolio, current membership, the guild's recognition or a mandate to speak for it. |

A guild view can stand without individual manifests; an individual view can stand
without guild manifests. Each publisher controls its own statements, not the
other party's account. Optional reciprocal references can acknowledge a specific
relationship or statement at a particular version; they are not independent
corroboration, consensus or blanket endorsement. A missing reciprocal reference
does not by itself refute a contribution claim.

Membership and contribution are different: a non-member may contribute, a current
member may have no contribution in a period, and historical work is not continuing
membership or endorsement. People may decline public attribution or omit sensitive
affiliations. Omission is not evidence of inactivity or poor standing, and no
complete public social graph is required.

For ATProto identity references, use DIDs as identifiers and handles as readable,
changeable labels, not identity keys. Handles are not specific to Bluesky as an
application. Neither a DID nor a handle proves the contribution or authority;
ordinary non-ATProto ItF use requires no such account.

Both views should reference the same versioned shared work rather than copy it
into separate claimed outcomes, reviews, ownership or funding needs. Separate
real support costs remain possible when their scope and overlap are clear.

This is a presentation/design direction, not a JSON example or contract amendment.
The [current support profile](support-profile-contract.md) already permits `person`
and `collective` subjects, but defines no contributor/guild relationship arrays or
DID fields. Its existing descriptions, scoped report references and limitations
can explain permitted context; typed relationships need an explicit reuse/gap and
contract decision under [#52][I52]. The filename alone defines no semantics.

## 3. The ATProto-specific opportunity and boundary

The [Groups introduction][A1] demonstrates the intended cross-application pattern:
the same group identity and relationships can serve more than one application.
The [pinned Groups proposal][A2] places governance outside the group standard's
scope. The [pinned Spaces proposal][A3] describes access control, not end-to-end
confidentiality. These are proposals/source descriptions, not a working ItFtI deployment.

| Protocol surface | Possible guild use | Required distinction |
|---|---|---|
| Group DID | A collective identity usable across applications and stewardship changes. | A network identity is not a legal entity, fiscal sponsor, trustworthy claim or mandate to speak for members. |
| Group `meta` and `members` spaces | Group presence/rules, roles and membership relationships as defined upstream. | These are not a universal bucket for ItF evidence. A declared space index can be incomplete; absence is not proof of no private work. |
| Application/modality spaces | Collaborative theories, contribution accounts, review requests, decisions and learning reports where a selected record model actually supports them. | Inspect/reuse existing domain models before specifying missing records. No ItF Lexicon namespace, field schema or deployed app is selected here. |
| Member-authored repositories | Preserve who actually authored a contribution or review across group views. | Member data lives on member repo hosts, not automatically on the group host. Group-DID authorship is different from personal authorship and does not prove collective approval. |
| Roles, access and group OAuth | Limit what a user/application may do as the group and read in selected spaces. | Protocol grants do not establish editorial acceptance, review independence, collective consent, applicant eligibility or payment authority. A shared admin-authorised session is not every member's consent. |
| Independent clients and derived views | People can collaborate through appropriate applications without rebuilding the group or surrendering its identity to one interface. | A client that reads records correctly is not necessarily a collaborative editor, allocator or impact evaluator. Data portability is not complete workflow interoperability. |

In the pinned Groups proposal, role grants combine by union, not deny-overrides;
member acceptance affects the roster, not by itself the entire access policy.
Treat actual role/space grants and application rules as separate design inputs.
Do not infer that a visible roster enumerates everyone who could process a record.

Space access is a coarse boundary, not a promise of per-claim or per-funder privacy.
If two audiences must not see the same material, a client-side filter is not enough:
the design must use a suitable supported access boundary, a separately curated
view, or omit the material. Hosts and authorised applications can process data;
group access does not authorise transfer to an AI provider or funding service.

Space commits use MAC-based authenticity in the pinned proposal, not transferable
public signatures of every private record. Public signatures, MACs, CIDs and DIDs
have bounded provenance meanings; none proves truth, independent judgement or impact.

Keep three layers distinct in the native design: **Groups membership/access
records**, **application-level contribution claims and recognition**, and
**separately curated public manifests**. None is an automatic export or substitute
for the others. Public presentation needs its own permission and approval basis;
a technical roster or access grant does not authorise disclosing an association.

## 4. Collaborative practice before ranking or treasury automation

A guild-oriented journey could let people:

1. Find an appropriate shared practice or project without requiring a public
   personal theory, compulsory funding search or claimed past impact.
2. Agree bounded contributions and capacity, with project and guild purposes
   remaining distinct from each person's private motivations.
3. Bring permitted accounts, artifacts and concerns into reflection with others;
   preserve contrary findings, invisible work and uncertainty instead of optimising
   an activity leaderboard.
4. Request or contribute scoped peer review, keeping actual relationships and
   version-specific findings distinct from independent evaluation.
5. Approve only the statements or collective decisions they actually agree to;
   retain dissent and corrections without publishing protected associations.
6. Explore individual or shared support needs where useful. Only a separately
   authorised, destination-approved view travels to a funder or public profile.

These are proposed product behaviours, not instructions to recruit a guild, collect
member data or start a workflow. They do not make a numerical contribution score,
treasury, token, wallet, blockchain payment or formal funding application compulsory.

If a guild chooses allocation weights, they are its policy choices for a defined
purpose and period—not causal-impact percentages or a ranking of human worth.
Contribution recognition, compensation, governance power and editorial authority
must not be silently collapsed into one number. Payment operations remain separate.

## 5. Explicit, contestable governance and anti-capture

The guild framing adds questions that transport alone cannot answer:

- **Domain and membership:** what shared work is recognised, how people enter and
  leave, what current/historical membership means and how newcomers can contribute.
- **Attribution:** what counts, how shared or less-visible work is represented,
  who may make a claim, and how disputed attribution is handled without coercive publicity.
- **Weighting, if used:** who chooses the method, period and update process; treatment
  of seniority, current work and dissent. Decay can limit incumbency but can also
  undermine promised historical recognition; it is not a universal default.
- **Allocation, if used:** actual resources, purpose, decision authority, conflicts,
  recipient eligibility, fiscal/payment arrangements and correction/appeal limits.
- **Stewardship and disputes:** policy versions, genuine decision/approval records,
  conflicts and recusal, challenge routes, and limits of administrators' technical power.
- **Exit and succession:** permitted records and history, authority changes and
  continuing obligations without claiming distributed erasure or compulsory public portfolios.

ItFtI should not become a mandatory guild certifier or funding gateway. Make
interpretation and selection rules inspectable, preserve source versions and
permitted portability, and keep alternative clients and human judgement possible.
Narrative and fundraising are contributions, not automatic ownership of allocation.
Joining, being listed or buying a service must not itself count as verified merit.

## 6. Existing design, runtime gates and next work

Carry forward the completed ItF Groups designs rather than reopening them as
unfinished merely because “guild” is a new framing: identity/roles, evidence
privacy, content/review, collaboration, discovery, sync, disputes and portability
are already covered by [#11–#20 under the Groups roadmap][I9]. Guild-specific deltas
need focused design/implementation issues with explicit reuse and dependencies.
Report-informed allocation remains a separate [decision under #8][I8].

The focused new backlog separates [native guild collaboration #53][I53] from
[policy-bound curation portability #52][I52]. The former must map the intended
ATProto experience rather than treating a manual guide as proof of native support;
the latter must assess existing record/policy facilities before proposing any type.
The [guild-workflow assessment](guild-workflow-assessment.md) now covers #53's
offline journey and native mapping; its extended fictional example is not a live
workflow test. #52's curation assessment remains unfinished. Allocation-specific
questions extend #8 instead of a duplicate issue.

[Readiness #10][I10] still lacks a confirmed supported deployed member-PDS/group-host/
client tuple and an authorised disposable-resource arrangement with actual operating
terms, costs and owner. [#21][I21] owns bounded synthetic pilot execution; this note
does not rerun it, choose a replacement stack or require a new host/test harness.
The deferred community-platform/re-platforming work is not resumed by this analysis.

Record-based design and a fictional walkthrough can proceed without claiming that
runtime gate is closed. A future native workflow must verify its selected upstream
revisions and actual permissions, denial-versus-deletion behaviour, correction and
handover limits. Group repo migration does not automatically move host-private
moderation history, join requests or OAuth sessions.

## Source and reuse limits

Read for this analysis on 2026-11-09. This is original attributed synthesis and
proposed application, not copied diagrams, a redistributed method manual or an
endorsement by Guild Guild, the article authors, Bluesky or any funder. The blog
feed declares all rights reserved; ItF's own licence does not relicense its sources.
Protocol Guild's current operation and the essays' claimed systemic benefits were
not independently evaluated. No real group, account, record, consent, payment,
funding offer, deployment, model test or participant outcome is represented here.

[G1]: https://paragraph.com/@guildguild/guilds-reference-architecture
[G2]: https://paragraph.com/@guildguild/the-prestige-ponzi-and-the-guild-response
[A1]: https://atproto.com/blog/atmospheric-groups-intro
[A2]: https://tangled.org/opensocial.group/proposal/blob/2b41a9bf9171c03a1aa5ee26c6e39823ba27c79d/proposal.md
[A3]: https://github.com/bluesky-social/proposals/blob/9e86df35b17f828294333a4c5b95dce22bcbf323/0016-permissioned-data/README.md
[I8]: https://github.com/zhiganov/impact-to-funding/issues/8
[I9]: https://github.com/zhiganov/impact-to-funding/issues/9
[I10]: https://github.com/zhiganov/impact-to-funding/issues/10
[I21]: https://github.com/zhiganov/impact-to-funding/issues/21
[I52]: https://github.com/zhiganov/impact-to-funding/issues/52
[I53]: https://github.com/zhiganov/impact-to-funding/issues/53
