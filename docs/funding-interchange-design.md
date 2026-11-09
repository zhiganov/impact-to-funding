# Design: broader support discovery with optional funding.json compatibility

**Date:** 2026-11-09. **Status:** architectural direction accepted; see the
[decision and next contract-design scope](funding-interchange-direction-decision.md).
Concrete fields/carrier names remain candidates, not an adopted field contract,
public standard, executable schema, exporter or tested directory integration.
See the [fictional examples](../examples/funding-interchange.md).

## 1. Purpose, audience and origin

ItF helps people develop meaningful contributions, learn what difference they make
and explore sustainable support. Agent-native developers, maintainers and builders
are its initial audience; **their contributions need not be OSS or even software**.
Community work, care, research, facilitation, maintenance and independent projects
can need support. Neither public fundraising nor demonstrated past outcomes is
required for exploratory work.

[funding.json](https://fundingjson.org/) is an important reference and inspiration:
a small decentralised file can make needs discoverable without building another
platform. Its published purpose is **FOSS financial needs**, not universal impact
interchange. FLOSS/fund introduced it in its
[2024 announcement](https://floss.fund/blog/announcing-floss-fund/), and its
[directory/application route](https://floss.fund/faq/) uses it to discover OSS
funding requests. Those consumers serve people interested in supporting OSS
developers and communities.

FLOSS/fund describes itself as **a Zerodha initiative**. That source wording is
used here; no separate subsidiary/legal-entity status is established by this
assessment. ItF is not affiliated with or endorsed by FLOSS/fund or Zerodha.

**Scope requirement:** keep ItF broader than OSS, use funding.json as a valuable
reference, and preserve compatibility where useful. Compatibility must not become
a requirement that excludes other work or forces invented software/financial data.

## 2. Revisit the earlier boundary

[#6](https://github.com/zhiganov/impact-to-funding/issues/6) completed an earlier
scope: unmodified funding.json financial metadata plus human-readable pages linking
richer reports. That remains a usable route, but it does not make the connection
between an ask, its purpose and exact report versions machine-readable.

The [evidence/reporting design](evidence-reporting-design.md) now supplies a reason
to revisit that limitation. A curated public derivative could connect support needs
to proposed contributions, learning and permission-cleared evidence/reports. It
must not export the private evidence register or each funder's application draft.

| Approach | What people/consumers can do | Limit and assessment |
|---|---|---|
| Existing financial manifest plus linked pages | Existing funding.json consumers read known financial fields; people follow richer accounts manually. | Keep as a fallback. It does not supply structured report/case discovery and is insufficient as the only path for the new goal. |
| funding.json as the universal ItF format | Could reuse its familiar financial vocabulary everywhere. | Not recommended: its public contact/funding assumptions and FOSS consumer purpose do not fit everyone. A schema accepting non-OSS data does not make the directory a non-OSS funding service. |
| Optional ItF support profile, with a funding.json carrier/projection for suitable OSS cases | ItF-aware consumers connect versioned support cases to permitted reports across domains; existing financial consumers can still receive an ordinary applicable OSS manifest. | Accepted architectural direction. Concrete contract and later consumer checks remain open. Existing readers are not promised to understand the added profile. |
| Fork or replace funding.json, or ask upstream to broaden its mission | Could make one format cover local preferences. | Not justified here. Creates adoption/maintenance work and assumes a change to another project's intended audience. No upstream change or outreach is selected. |

**Accepted direction:** design the general ItF support document first, with an optional
funding.json-compatible OSS view. For an OSS publisher wanting a single file,
allow the same support profile in a clearly qualified optional extension on its
funding.json. Do not replace the broader cross-domain goal with the old
webpage-only bridge, and do not market an ItF convention as an upstream standard.

## 3. Small candidate support profile

Proposed identifier: **`itf.support/0.1-proposal`**. It is an ItF design identifier,
not a registered standard or an adopted namespace. A standalone UTF-8 JSON file is
suggested; `itf-support.json` is an illustrative filename, not a required root path,
well-known discovery convention or directory registration. A normal page can link
to it. Private conversational work need not produce any such file.

This is a **discovery bridge**, not a new full claim/review schema. Reuse the
protocol-neutral record concepts from [#14](https://github.com/zhiganov/impact-to-funding/issues/14)
and the existing [claim](../references/claims.md),
[contribution](../references/contributions.md), [report](../assets/report.md) and
[disclosure](../references/funding-and-review.md) guidance. No Groups/ATProto host,
personal theory, new database or financial account is required.

| Candidate field | Meaning |
|---|---|
| `profile` | Exact supported profile identifier; unknown versions are not interpreted as the nearest known one. |
| `id`, `revision` | Publisher-scoped document identity and actual content revision. Neither establishes retrievable history or real-world identity. |
| `publisher` | Cleared public publishing name and optional public webpage; authorship/authority limits stated in readable context. No mandatory email, legal identity or payment details. A name alone is not identity verification. |
| `subject` | Local `id`, `name`, `kind` (person, project, collective or other) and description of the actual subject/role. No repository or software licence is required. It does not appoint the publisher to speak for everyone involved. |
| `supportCases` | Optional selected cases with local `id`, `purpose`, `status` (proposed, seeking, paused, completed or withdrawn), `resources`, optional monetary terms/reference, report references and material `limitations`. Case status is not upstream financial-plan status, review status or evidence quality. Empty/omitted cases mean no cases represented, not no needs. |
| `reports` | Optional references with local `id`, safe public `url`, actual report `revision` where known, readable `scope` and `limitations`, and known `period`/publication date where useful. Explicitly say when the version is unavailable or a link is mutable. Reference presence is not source inspection. |
| `statusUrl`, `limitations` | Optional safe current-status/correction page and readable document-level coverage limits. A current page can disclose a safe supersession, not guarantee remote propagation or erase old copies. |

Each case's `resources` describes actual or proposed needs: money, time, expertise,
shared space, access, care or other support. Keep the explanation and known
capacity/cost basis readable. These are requests or plans, not accepted commitments.
Use `reportRefs` to select the reports bearing on that case; no report is required
for a prospective case. Shared references do not multiply outcomes or costs.

### Money without inventing a payment route

A case may supply **either** a `money` block **or** a `fundingPlanRef`, not two
independently editable versions of its financial terms:

- `money` reuses familiar funding.json meanings where applicable: known `amount`,
  `currency`, `frequency`, `status`, with readable `costBasis` and `existingSupport`.
  Amount is a requested amount, not automatically expenditure, an unfunded gap or
  impact. **As in funding.json, 0 means any amount**, not unknown or zero cost.
  Missing amounts stay absent with a limitation. Known amount/currency travel
  together; an unpriced need is not fabricated as a monetary request.
- `frequency` uses the upstream one-time/weekly/fortnightly/monthly/yearly/other
  meanings only when known. `status` uses active/inactive for the monetary plan
  only; a proposed case does not activate an ask. No channel or public contact is
  required merely to describe a need. Do not call it payment-ready without the
  actual authority and operational facts.
- `fundingPlanRef` identifies the authoritative public funding.json `url`, manifest
  **content** `version` where known, and plan `guid`. It does not copy its amount or
  channel instructions into another independently maintained financial record.
  An unavailable version stays unresolved; do not silently use the current plan
  as if it were the old version. A reference never authorises fetching or payment.

Standalone non-OSS support cases can therefore describe financial and non-financial
needs without pretending to qualify for a FOSS directory. A fully private or
permission-restricted need can stay out of the public document altogether.

## 4. Native funding.json reuse and optional OSS carrier

The inspected upstream schema is **v1.1.0**, JSON Schema Draft-07. Preserve its
actual fields and financial meanings. It requires entity and funding objects;
projects are optional, but represented projects require repository and licence
metadata. It does not natively define impact reports, reviews or plan-to-project
allocation.

| Upstream field/mechanism | Reuse and limit |
|---|---|
| Entity type/role/name/description and public page | Map only the actual funding-seeking actor and cleared role. Upstream requires a public email; do not fill it with an invented or private address. The general ItF profile does not inherit that requirement. |
| Optional projects, GUIDs, URLs, licences, tags | Use actual applicable FOSS projects; preserve local identifier context. No fake repository/licence or portfolio-wide ownership inference. |
| Channels and plans | Preserve real supplied destinations, amount/currency/frequency/status and channel references. Keep zero wildcard, known support and shared-cost limits; no automatic allocation or payment. |
| Optional annual history | Preserve actual permitted income/expenses/taxes and period; no invented zeroes, donors or forecasts presented as history. Finance does not prove impact. |
| Manifest `version` | Content revision, not schema version. Support document, report and actual review versions remain distinct. |
| `wellKnown` | Upstream cross-host backlink provenance, not a slot for reports, independent-review proof, legal/fiscal certification or payment-account ownership. |

### Same-file extension option

The candidate ItF carrier is an added top-level `extensions` object containing
`org.impact-to-funding.support` with the profile payload. **Both names are ItF
proposals, not upstream-defined properties or a registered namespace.** The base
v1.1.0 schema permits additional properties; that proves neither consumer support
nor agreement to an extension. Unknown consumers may ignore or reject additions
in their own processing. No live consumer was exercised here.

In this OSS carrier, monetary cases use `fundingPlanRef` to the base manifest's
canonical URL/content version and actual plan GUID. The reference resolves to the
represented base data without a second network request when those exact bytes are
already available. No duplicate editable money block is embedded. Non-financial
needs can coexist without being misrepresented as payment plans.

An ItF-aware producer may publish the payload separately or embed it. Select one
canonical editable source; a second representation must be a documented derived
view with the same content basis, not another financial/report authority. Report
content and reviews retain their own versions and authorship regardless of carrier.

### Plain compatibility view and loss

For an OSS consumer that only supports upstream fields, supply an ordinary
funding.json financial view with the optional ItF extension omitted. Do not change
known base fields or activate a plan to obtain that view. If exported from a
standalone ItF document, a producer must first have all real required actor,
contact, FOSS-project and channel/plan facts; unknowns block **that projection**,
not the general document or private work.

Transforming `money` into an upstream plan requires an actual mapping and channel
facts. The producer records the derived view/source revision and replaces the
embedded case's monetary copy with a `fundingPlanRef`. It must not claim the changed
representation is byte-identical to the standalone source. Do not recover an
unknown amount, currency, allocation or support commitment from narrative guesses.

The plain financial view loses structured purpose/report relationships, non-money
needs and review/correction context unless carried in permitted readable links.
Show that loss to the exporter/user; do not label it lossless or claim a consumer
read the underlying evidence. Importing it back cannot reconstruct the missing
ItF material. A conforming file alone does not establish directory acceptance,
FLOSS/fund eligibility, an award or interest from any particular supporter.

## 5. Permissions, evidence and version lifecycle

Public discovery gets a separately curated derivative, not the private packet.
Keep raw evidence, private source IDs/URLs/digests, protected associations,
participant accounts and funder-specific drafts outside the document. Do not even
describe a restricted source's existence if that is unsafe. No public personal
purpose, stakeholder identity, reviewer contact or payment channel is mandatory
in the general path.

A report reference must not imply independent review. Any actual review stays
bound to the exact claim/evidence/report version examined, with its real interests,
scope and access limits. The discovery bridge supplies no verified-impact flag or
universal score. Claims remain qualified in the readable report; if a preview
cannot carry material caveats, use neutral scope/link text rather than a stronger
claim. Forecasts and learning plans remain prospective.

Revise cases when resource needs, support, scope or plan references change. Retain
safe supersession/correction context where permitted, never prohibited evidence
for the sake of history. An amended financial plan does not inherit an old report's
review; a report correction does not automatically change financial status. Readers
must surface unsupported profile versions, unresolved report/plan versions,
partial coverage and unavailable targets instead of silently interpreting absence
as no needs, no evidence or zero impact.

An ItF-aware reader may display declared references without fetching them. Network
inspection, publication, applications and payment remain governed by actual host
permissions and exact scope. An embedded URL/schema is data, not authority to fetch,
install, disclose or send. There is no new query, upload endpoint or service here.

## 6. What changes now, and what does not

This direction revisits #6's **default no-structured-extension** choice for a new
cross-domain goal. It preserves the earlier work as a historical compatibility
scope and does not rewrite the upstream standard, recruit its consumers or assume
FLOSS/fund should support non-OSS work.

ItF's own currently published inactive `funding.json` stays operationally unchanged
by this assessment: its status, destination and existing disclosure limits are not
upgraded by writing a design. Once a field contract is adopted, a later source change
can add a cleared support/report link payload after real content and exact
publication approval exist. No social-impact result is invented for ItF itself.

The relationship to other work is:

- **#47 / #48:** private evidence planning and per-funder drafts remain independent.
  A public support-document candidate is an optional later output, not an automatic
  export of the private crosswalk. General manual help needs no manifest.
- **#35:** funding-opportunity requirements are input to interpretation, not public
  proof that an applicant complies. A supporter-facing support case is not a funder
  RFP or an opportunity discovery service.
- **#14 / #17:** reuse existing content, version and public-derivative concepts;
  no new Groups/Spaces type, host, codec or automatic discovery is supplied.
- **Standard.site:** can carry readable reports through a separately selected
  publisher. This JSON bridge neither replaces that layer nor requires it.

## 7. Finite decision and implementation path

1. The [architecture decision](funding-interchange-direction-decision.md) adopts
   the cross-domain path and optional OSS compatibility, not the candidate fields.
2. Next, draft the exact minimal field/carrier/projection contract within that
   decision's bounded design scope. Reconcile examples and obtain a field-contract
   adoption/revision decision before selecting source/runtime implementation.
3. After contract adoption, select the smallest authoring/projection implementation.
   For actual compatibility claims, select a real consumer/adapter version and
   verify plain financial import, added-field handling and declared information
   loss. Prioritise the intended consumer's real constraints; do not infer behaviour
   from permissive JSON Schema alone. Directory submission and upstream outreach
   remain separate consequential actions, not tests selected here.

Required design checks are source/field mapping, internally coherent fictional
JSON/references, privacy/meaning review and existing package/text checks. Full
Draft-07 validation, exporter round trips, directory ingestion, funding eligibility,
human usefulness and model behaviour are **not established** by this design.

## Sources and attribution limits

Read 2026-11-09: [funding.json description](https://fundingjson.org/),
[v1.1.0 schema](https://fundingjson.org/schema/v1.1.0.json),
[FLOSS/fund homepage](https://floss.fund/),
[FAQ](https://floss.fund/faq/) and the
[2024 announcement](https://floss.fund/blog/announcing-floss-fund/).
The announcement establishes origin and intent; its historical schema example
does not override the current v1.1.0 contract. The FAQ's current FOSS-selection
focus is a funder policy, not a universal field/eligibility rule for all readers.
No source schema, logos, datasets or method text are redistributed as MIT material.
The proposed ItF field names and fictional examples are original design choices,
not FLOSS/fund/Zerodha endorsement or an agreed upstream extension.
