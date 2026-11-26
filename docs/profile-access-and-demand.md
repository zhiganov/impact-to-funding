# Profile access and demand

Scoping for [#7](https://github.com/zhiganov/impact-to-funding/issues/7), 2026-11-26. It records the evidence available for public impact profiles and the smallest account-access work worth preparing. This is desk scoping only. It selects no implementation or external action.

## What is live

The browser app at [app.itfti.org](https://app.itfti.org) publishes an `org.itfti.profile` record in the author's ATProto account. Real-account publishing, editing, unpublishing and republishing were verified on 2026-11-26. The app has no central profile database.

The public relay's `com.atproto.sync.listReposByCollection` query returned **two accounts** holding an `org.itfti.profile` record at 2026-11-26T15:18:06Z. Both records were read successfully from their account servers. Neither linked a report, support profile or impact card at that time.

This is a point-in-time public inventory, not a count of active users. It cannot measure repeat use or unmet demand. One person beyond the project owner has published a profile. That is early evidence of interest rather than established adoption.

## Decisions this evidence supports

- **Keep the personal profile as the current use case.** Two published records do not justify a central index.
- **Prepare account guidance.** The current sign-in page only supports people who already have a handle or DID.
- **Document self-hosting as the existing no-account route.** It needs no new hosting or identity system.
- **Keep the static accountless fallback behind its evidence condition.** [#150](https://github.com/zhiganov/impact-to-funding/issues/150) retains its design decisions. A relay count cannot tell us how many builders need it.
- **Keep directory and search deferred.** Revisit them when people need to find profiles without receiving direct URLs, or communities need discovery across groups.
- **Keep mentor connections separate.** Their maintainer, willing-mentor and demand conditions remain unchanged.

## Guided account creation

### Smallest useful slice

Add an optional **Need an account?** route beside the existing sign-in. Experienced users keep the current direct path.

The guidance should explain only what is needed to continue:

1. An ATProto account gives the builder an identity and a personal data server for their profile record.
2. The account provider's official sign-up route is used. ItFtI does not ask for the account password.
3. The builder returns with their handle and approves access to the `org.itfti.profile` collection.
4. Publishing happens only after the builder reviews the public impact record and approves it.

The implementation must choose and verify a current provider sign-up route. Any PDS with compatible OAuth can hold the account. The app's name, photo and bio come from Bluesky's public API. Guidance must not promise those details for an account without a Bluesky profile.

This is a guided handoff, not an ItFtI-operated account service. The [ATProto account guide](https://atproto.com/guides/account-management) says apps generally provide their own account-creation flow and may run a default PDS. Native sign-up or an ItFtI-operated PDS would be a larger decision. Provider terms, account recovery, abuse handling and operations need separate decisions.

### Acceptance for the implementation issue

- [ ] Keep direct sign-in unchanged for existing accounts.
- [ ] Add a short, optional account-creation route with a verified official provider link and a clear return path.
- [ ] Explain public disclosure and collection-only access before the provider handoff.
- [ ] Cover keyboard, mobile, back-navigation and provider-link failure behaviour without losing an editor draft.
- [ ] Check the flow with fictional account data in the existing browser suite.
- [ ] Separately approve and verify one new-account sign-up, sign-in, publish, read, edit, unpublish and cleanup cycle. Do not use an established profile as a disposable fixture.
- [ ] Record what remains unknown about completion and drop-off. Do not add analytics through this work.

## Self-hosting without an ATProto account

The existing route is a static page on the builder's own site. It uses files ItF already produces:

- `itf-card.html` and `itf-card.css` from the [impact-card tool](../tools/impact-badge/README.md#add-it-to-a-website);
- an approved public report and, when useful, `itf-manifest.json`;
- optionally, files exported from a [portable-records packet](../tools/portable-records/README.md).

The guide should show the plain-HTML route first and link the existing Astro instructions. It should explain how the owner corrects or removes the page and regenerates the card when the report changes.

A portable packet retains its source restrictions. Publishing from it requires a deliberately curated public derivative. A self-hosted card also lacks the app profile's ATProto identity, shared record and compatible-app reads. State those limits once beside the choice.

## What to learn next

Use existing opt-in feedback and ordinary builder conversations when they arise. This note selects no recruitment or outreach.

- Did account creation or sign-in stop the builder from publishing?
- Did they publish once, return to edit, or add a report later?
- Did they need to find profiles without a direct link?
- Did self-hosting meet the no-account need, or was an ItFtI-hosted page necessary?

These observations can inform the next scope decision. They are not a telemetry programme or a target publication count.

## Limits

The public inventory is early and may lag network state. It provides no measurement of visits, sign-ins, drafts or accountless demand. This note approves no implementation or external action.
