# Optional Standard.site publishing and discovery

**Date:** 2026-11-06
**Status:** design note; no exporter, publisher integration or round-trip test is implemented.

**Later assessment, 2026-11-09:** the [funding-interchange proposal](funding-interchange-design.md)
revisits #6's no-structured-extension default for a broader cross-domain support
document. The unchanged-financial-fields statements below describe this publishing
note's scope, not a permanent ban on a separately designed optional ItF extension.
The candidate is not adopted and no financial manifest or publisher changed here.

## Purpose and decision

[Standard.site](https://standard.site/docs/) could make an explicitly approved public ItF report easier to discover and read through existing ATProto publishing tools. It is an optional publishing/discovery layer, not an impact-assessment standard, certification service, funding format or requirement for using the skill.

Keep three responsibilities separate:

| Layer | Responsibility |
|---|---|
| ItF | Theory of change, bounded contribution/claim, evidence and uncertainty, actual review scope, learning and an honest case for support |
| Standard.site | Publication/document metadata, canonical web references and discovery by supporting tools |
| funding.json | Existing financial support metadata, unchanged v1.1.0 fields, with richer reports linked through curated human-readable pages |

The preferred baseline is an existing publisher plus ordinary human-readable files/pages. Do not build an ItF publishing service, custom content lexicon, default impact extension, mandatory report index or automatic export merely to adopt the standard. Existing manual Markdown use remains sufficient.

## Relationship to completed design

This note applies the [#17 public-discovery/export baseline](https://github.com/zhiganov/impact-to-funding/issues/17#issuecomment-6665579580), preserving its public-derivative, access, exact-version, correction and stale-copy boundaries. It supplies no runtime proof or implementation of discovery, sync/indexing, widgets or the #21 pilot.

[#29](https://github.com/zhiganov/impact-to-funding/issues/29) tracks the optional skill/platform relationship. This note describes one possible public-output connection without requiring any particular community platform, group account, Spaces deployment or Groups beta. Native skill compatibility is documented separately in the [installation record](installation-check-2026-11-04.md).

## Minimal document mapping

The following reflects the [official document reference](https://standard.site/docs/lexicons/document/) read on 2026-11-06, not a pinned Lexicon revision or a tested publisher/reader contract. Before any later implementation, identify the actual schema revision and chosen tool's supported fields; do not assume every consumer renders them.

| Standard.site property | Minimal ItF mapping and boundary |
|---|---|
| `site` — required | An existing publication's `at://` reference, or a publication/base `https://` URL for a standalone document as documented. No new group DID or publication hierarchy is required by ItF. Choose the real approved location; do not invent an account or imply domain control. |
| `title` — required | Approved report/document title. Keep it neutral or qualify any substantive claim; a headline must not imply verified impact, independent review or current endorsement. |
| `publishedAt` — required | Actual publication timestamp, not the reporting period, date of underlying evidence or a fabricated earlier publication date. Those dates belong in the report with their real precision. |
| `path` — optional | The public path used with the site's/publication's URL to locate the canonical web document. Preserve the actual destination; no private identifiers, signed parameters or restricted locators. |
| `description` and `tags` — optional | Cleared summary and discoverability terms. Material limitations must travel with claims; if a preview cannot carry them, use a neutral description/link instead. Tags are not ratings or proof of eligibility. |
| `textContent` — optional | Plain-text rendering of the approved public derivative, without Markdown formatting as required by the documentation. Keep headings/meaning, claim qualifications and source/review access limits understandable. Do not copy the private assessment packet. |
| `content` — optional | Reuse a chosen publisher's supported content type if appropriate. The open union does not create a universal Markdown/rich-text format; do not invent a new ItF `$type` for this capture or assume a reader understands another platform's blocks. |
| `updatedAt` — optional | Actual edit timestamp. It is not an immutable revision history, evidence revalidation date, review renewal or proof that a report is current. Keep the report's own cleared version, period, status and exact review targets in the readable content. |
| `contributors` — optional | Actual, permission-cleared additional contributors with the documented DID/role/display-name fields, if useful. Editorial credit is not a claim-specific review, independence finding or blanket endorsement. Do not force contributors or reviewers to disclose an identity or acquire an ATProto account to use ItF. |
| `links` — optional | Use only relationship types the chosen publisher/consumer actually supports. Ordinary links in the readable report remain sufficient for cleared sources, corrections and approved funding pages; this note specifies no new report index or impact relationship extension. |
| Other optional properties | Use images, labels or `bskyPostRef` only when relevant, permission-cleared and supported. An image can leak private material; a comment-post reference does not authorise creating a Bluesky post or soliciting reviews. None is required for the minimal slice. |

The readable report remains where claims, limitations, actual evidence access and review meaning are explained. Use the relevant [report template](../assets/report.md), [claim guidance](../references/claims.md), [contribution guidance](../references/contributions.md) and [funding/review guidance](../references/funding-and-review.md). A metadata-only reader must not be presented as having inspected the full report or its evidence.

## Existing-tool route, not a new service

The [official implementations list](https://standard.site/docs/implementations/) documents existing options such as Leaflet for reading/publishing, Sequoia for publishing existing content, and indexes/readers including Read on Pckt and Docs.surf. This is a list of documented options, not a verification of their current availability, terms, grants, field support, privacy or interoperability.

For a permission-cleared public report, check whether an existing publishing route
can emit the required metadata and retain a readable canonical page. If it can,
use that rather than building an exporter. If it cannot preserve essential
qualifications, keep the ordinary page/file route or explain the gap; do not
compensate with misleading metadata or unsupported “open in any app” promises.

Discoverability depends on a consumer's actual indexing, discovery and rendering support. Listing a record does not guarantee distribution, audience, reader comprehension, complete content export or a lossless move between hosts. Owning a copy of metadata is not a guarantee of permanent hosting or availability of every linked resource.

## Approval, privacy and meaning

- Publish only a separately curated public derivative approved for its exact version, destination and audience. Private use, membership, source access and permission to send material to a model do not supply publication rights. Follow [PRIVACY.md](../PRIVACY.md).
- Do not copy private evidence, personal theories, rosters, protected project associations, source IDs/digests, signed evidence URLs, identifying dissent or restricted reviewer details into records, titles, descriptions, tags, images, attachment names or link metadata. A merely unlisted URL is not private storage.
- Domain/page verification confirms the relationship between a web destination and an ATProto record through the documented backlink mechanism. It does not verify factual claims, impact, review independence, payment authority or ownership of a funding account. A record signature has similarly bounded provenance meaning.
- Document recommendations and subscriptions are social/discovery signals, not evaluator findings, community approval or automatic funding eligibility. This note does not select either graph feature, a ranking or a verified-impact badge.
- Keep personal and project theories distinct; do not duplicate shared outcomes, costs or review credit when the same report appears in multiple readers or portfolios. No public personal theory is required.
- Keep funding.json v1.1.0 financial fields unchanged. Curated report/entity pages may contain approved funding-page links; no report/review field, automatic allocation or promise that a funding-manifest reader will follow those links is introduced. The published inactive manifest and its support status are unchanged.

## Corrections, withdrawal and copies

Apply #17's existing correction contract, rather than treating `updatedAt` as a complete lifecycle mechanism:

1. The actual author/publisher updates the readable report and any controlled record summaries, previews, downloads and links. Keep a safe status/correction route and explicit public version; do not silently transfer an earlier review to changed text.
2. Keep a reviewer's correction/withdrawal, changed evidence-use/access, challenge status and the claim's remaining support separate. Reassess affected wording; do not automatically declare the claim false or all support withdrawn.
3. Publish only the status/history appropriate and safe for the audience. A correction notice must not reveal a protected allegation, reporter, reviewer, private association or even a challenge's existence when that would be identifying. Do not retain prohibited payloads merely for a public audit trail.
4. State what was actually updated or checked and where propagation is unknown. Indexers, mirrors, downloaded text and search previews may retain older material. Record deletion or access changes do not guarantee recall, cache purge or removal from another operator's storage; a failed fetch is not proof of deletion.

Standard.site's edit timestamps and canonical links are helpful metadata, not an immutable history, automatic review-renewal system or verified correction propagation. No universal refresh interval, continuous monitoring service or complete deletion guarantee is specified here.

## Future acceptance boundary

Before implementing a publisher connection, identify the public artifact/version,
publisher and correction contact, actual access route, supported schema/content
fields and consumer limits. A round-trip check should use a safe test artifact;
none has been run for this note, and publishing is optional for ordinary skill use.

This is a design note, not a working exporter or verified publisher-reader pair.
Package/text checks do not establish discovery results, privacy enforcement,
funding effectiveness or user usefulness. No public report or ATProto record was
created through this work.

## Sources

Official pages read 2026-11-06: [overview](https://standard.site/), [introduction](https://standard.site/docs/introduction/), [document reference](https://standard.site/docs/lexicons/document/), and [implementations](https://standard.site/docs/implementations/). The overview documents domain/publication and page/document backlinks; see also its linked [verification guide](https://standard.site/docs/verification/) before any selected implementation. The linked guide was not separately inspected for this capture.

No platform assets or source schemas were imported or relicensed. This is original ItF application guidance, not an official Standard.site methodology, certification or endorsement.
