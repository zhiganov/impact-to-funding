# Filed issue for My Community: ItF module

A draft issue for [Citizen-Infra/my-community](https://github.com/Citizen-Infra/my-community), written for [#102](https://github.com/zhiganov/impact-to-funding/issues/102) on 2026-11-15. Filed on 2026-11-15 as [my-community#140](https://github.com/Citizen-Infra/my-community/issues/140), from this draft at `6391045`; follow that issue for changes. Issue numbers carry their repository name so they don't link to ItF issues here. 

**Proposed title:** ItF module: members' profiles, contributions and needs

---

## Outcome

Let members of a community see each other's work and requests for help in the dashboard. An Impact to Funding (ItF) module would show, for the selected community:

- members' profiles: what they work on, with links to approved public reports;
- recent contributions, including maintenance, coordination and care;
- open needs: requests for bounded help, with rough effort and a date.

Each member keeps these as records in their own ATProto account, like the standing availability record (my-community#49). My Community reads them; it stores nothing new.

## Reuse

- **Module model** (my-community#48 and the [ATProto module study](https://github.com/Citizen-Infra/my-community/blob/904e8ae/docs/research/2026-07-13-atproto-module-interop-spike.md)): the community enables the module in community-admin, community-admin supplies member DIDs (community-admin#53), My Community reads each member's PDS, and each member can show or hide the tile.
- **Reading:** the generic DID-to-PDS resolver and read-any-collection helper the study proposes as the first step.
- **Report links:** my-community#139 already covers approved reports and funding destinations. The ItF module links to the same reports and shouldn't duplicate that navigation.
- **Decisions:** group decisions stay in Community Input. The module adds no voting or approval.

## Record formats

ItF has a validated sketch of the three records: [`docs/itf-records-sketch.md`](https://github.com/zhiganov/impact-to-funding/blob/main/docs/itf-records-sketch.md). They use the availability record's community `scope` shape, and needs expire by default. The namespace is a placeholder until one is chosen.

## Acceptance for design

- [ ] Decide placement: a tile of its own, or needs inside Participation and profiles elsewhere.
- [ ] Show loading, empty, stale, expired and source-error states, as other feeds do.
- [ ] Show each report link's ItF state (`current`, `corrected`, `out-of-date` or `withdrawn`), matched to the draft, approved, superseded and unavailable labels in my-community#139. A `corrected` or `withdrawn` link points to its `statusUrl`. See the [handoff answer in ItF #29](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6892201609).
- [ ] Show no counts, rankings or "most active" lists. A member with nothing this period looks the same as anyone else.
- [ ] Hide the module for private communities until there's a members-only route, as availability publishing does today. Ordinary ATProto records are public.
- [ ] Decide what email-only members see. They can read; they can't publish records without an ATProto account.
- [ ] Assess the smallest useful version within the current dashboard before adding a new feed type.

## Scope

Design and interface contract only. Implementation, writing records from My Community, and private needs are not selected by filing this issue.

## Connected scopes

- ItF guild view: https://github.com/zhiganov/impact-to-funding/issues/102
- ItF handoff contract: https://github.com/zhiganov/impact-to-funding/issues/29
- Report and funding navigation: my-community#139
- Module model: my-community#48; community-admin aggregation: community-admin#53
