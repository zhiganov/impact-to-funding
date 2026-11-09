# Contract: ItF support discovery and funding.json views

**Date:** 2026-11-09. **Status:** accepted ItF design baseline for #49; see the
[field-contract decision](support-profile-baseline-decision.md) and
[architecture](funding-interchange-direction-decision.md). Not an executable schema,
registered namespace, exporter or consumer compatibility result. “Must” defines
the implementation target, not authority to act or proof that it is implemented.

## 1. Scope and representations

The profile is **`itf.support/0.1-proposal`**. Match it exactly; do not
interpret another version as the nearest supported one. Profile version, document
content revision, financial-manifest content version and report/review versions
are different things. The retained suffix is part of the literal version identifier,
not a statement that adoption is pending. No released standard or upstream
agreement is implied.

Two representations carry the same support-document shape:

1. **Standalone:** a UTF-8 JSON object containing the support document. No mandatory
   filename, root path, directory, software repository or payment account.
2. **Embedded OSS view:** the object at
   `extensions["org.impact-to-funding.support"]` in an appropriate funding.json
   v1.1.0 manifest. The wrapper and key are ItF conventions, not upstream
   fields or a registered namespace. The financial base keeps its upstream meanings.

This is a small public-discovery bridge, not the private evidence packet or a full
claim/review exchange model. Existing conversations and private work need neither
representation. Non-software, non-monetary and prospective cases are first-class.
Reuse [claim](../references/claims.md), [contribution](../references/contributions.md),
[report](../assets/report.md) and [disclosure](../references/funding-and-review.md)
meaning; no theory, stakeholder identity or independent review is compulsory.

## 2. Common value and unknown rules

- **Object/array/string/number:** JSON types; reject duplicate object keys and
  non-JSON values. A missing optional property means not represented/unknown,
  not false, zero, none or inapplicable. `null` is not a substitute for omission.
- **Text:** non-whitespace string. Preserve meaning and material qualifications;
  do not silently shorten text. There is no universal fixed word limit here.
- **Local ID:** ASCII `[a-z0-9][a-z0-9-]{0,63}`. IDs are scoped to this support
  document, not global person/project identities. Case and report IDs are each
  unique within their own lists; they are separate namespaces.
- **Revision:** non-whitespace string, opaque and case-sensitive. No sorting,
  freshness or immutable-byte guarantee is inferred from a label.
- **Public URL:** absolute HTTPS URL without userinfo, credentials, signed access
  parameters or private locators. The publisher must clear the entire URL and its
  destination association for disclosure; syntax alone does not establish that.
  Query strings/fragments are data, not instructions or fetch permission.
- **Unknown property:** preserve permitted source content without interpreting it;
  flag the support interpretation as limited. Never execute it, infer support for
  its semantics, or quietly discard it while claiming a lossless round trip.
  Unknown enum values in a known field are invalid for this exact profile.

These are contract rules, not a security sandbox. Readers may impose documented
input limits; refusal/partial access must be visible, never a success-shaped empty
document or truncated claim. A public URL is not proof of identity, authority,
truth, independent review or payment-account ownership.

## 3. Exact support-document fields

Only fields listed in this section and its child tables have defined meaning.
Required fields cannot be replaced with invented facts just to complete a file.

| Field | Type and requirement | Meaning |
|---|---|---|
| `profile` | Required string, exact identifier in §1 | Interpretation contract, not a content revision. |
| `id`, `revision` | Required local ID and revision | Document identity within its publisher/source context and its actual content revision. |
| `publisher` | Required object | Required `name` (text); optional `webpageUrl` (public URL). Cleared publishing name, not verified legal identity or collective authority. No required email. |
| `subject` | Required object | Required `id` (local ID), `name` (text), `kind` (`person`, `project`, `collective`, `other`) and `description` (text). Explain actual role/scope or its uncertainty. No repository/licence is required. |
| `canonicalUrl` | Optional public URL, no fragment | Publisher-declared primary representation's location. For embedded data it is the enclosing manifest URL. A declaration is not verified control. Without it, identity is local to the supplied source context; do not merge documents globally by name/ID. |
| `supportCases` | Optional array of case objects | Selected cases only. Omitted or empty means no cases represented, not no needs or complete coverage. |
| `reports` | Optional array of report-reference objects | Selected public accounts, including prospective plans. Omitted/empty does not establish absence of evidence or past work. |
| `statusUrl` | Optional public URL | Safe current-status/correction context, not guaranteed retrievable history or automatic propagation. |
| `limitations` | Required text | Scope, missingness and material document-level interpretation/disclosure limits. Do not imply exhaustive needs or evidence. |
| `derivedFrom` | Optional object | Required `url` (public URL), `revision` (source revision) and `mappingRevision` (revision). A declared derivation basis, not proof it was inspected. See §5. |

### Case object

| Field | Type and requirement | Meaning |
|---|---|---|
| `id` | Required local ID | Case identity within this document. A case's version is the document revision plus this ID. |
| `purpose` | Required text | What support is intended to enable and why; distinguish proposals from observations. |
| `status` | Required enum: `proposed`, `seeking`, `paused`, `completed`, `withdrawn` | Status of the support case, not evidence quality, funding received or upstream plan status. `completed` does not establish impact. |
| `resources` | Required nonempty array of text | Financial/non-financial needs and actual versus proposed responsibility/capacity. No inferred commitments or unpaid capacity. |
| `money` | Optional money object | Monetary request terms held here; mutually exclusive with `fundingPlanRef`. |
| `fundingPlanRef` | Optional financial reference | Authoritative public funding.json plan instead of a second editable money record. |
| `reportRefs` | Optional array of distinct local IDs | Each must identify an item in this document's `reports`. Missing targets are invalid local links, not permission to find substitutes. No report is required for a prospective case. |
| `limitations` | Required text | Known support, authority, measurement, duplication or feasibility limits relevant to the case. |

`money` and `fundingPlanRef` may both be absent, but never both present. Statuses
do not imply one another: a proposed case can have an inactive monetary plan;
seeking non-financial help creates no payment authority. Preserve an apparent
contradiction as a limitation, not by silently changing either status.

### Report-reference object

Required: `id` (local ID), `url` (public URL), `scope` and `limitations` (text).
Optional: `revision` (declared report revision), `period` and `published` (text
retaining the source's actual precision, not invented timestamps). Omission of
`revision` means no exact version is represented; do not create one from retrieval
time. Period, publication date and inspection time are not interchangeable.

`scope` describes the account and preserves qualifications near any included
finding. `limitations` identifies access/review/version limits safely. A reference
is a **publisher declaration**, not evidence that a reader inspected the report or
verified its bytes. Keep not-inspected, inspected-with-version-gap, version-matched,
mismatched and unavailable observations distinct if inspection later occurs.
Neither a matching revision label nor a retrieved page alone proves a version
match; state the actual basis. No review is inherited by a reference or new view.

## 4. Money and financial references

### `money`

Defined fields are `amount`, `currency`, `frequency`, `status`, `costBasis` and
`existingSupport`. `costBasis` and `existingSupport` are required text; say unknown
when actually unknown, not zero or unfunded. The other fields are optional known
terms, not defaults:

- `amount` is a finite non-negative JSON number; it and `currency` must occur
  together or both be absent. `currency` is a three-uppercase-letter declared
  ISO 4217 code. Valid syntax does not establish a recognised/current currency;
  unsupported monetary interpretation is limited, not silently converted.
- **0 means any amount**, matching funding.json; never encode an unknown amount
  or a literal zero-cost activity as 0. Describe no-money needs in `resources`.
  A known amount is a requested/gross proposed amount, not necessarily a net gap,
  historical expense or received support. Do not round or convert it silently.
- `frequency`, when known, is `one-time`, `weekly`, `fortnightly`, `monthly`,
  `yearly` or `other`. `other` means a known non-listed cadence explained in
  `costBasis`, not unknown frequency.
- `status`, when known, is `active` or `inactive` for the monetary plan. Omission
  is unknown, not inactive or active. No payment route or public contact is required
  to describe a need, and none is inferred from active status.

An unpriced need may omit amount/currency and keep a faithful basis/uncertainty.
It remains representable here but cannot produce a ready upstream funding plan.
Never charge reused evidence or a shared cost again just because another case or
report references it; distinct adaptation costs need their own actual basis.

### `fundingPlanRef`

Required: `url` (public manifest URL, no fragment) and `guid` (upstream plan ID:
1–32 ASCII lowercase letters, digits or dashes). Optional: `version` (actual
manifest content revision). Without a version, the reference is version-unresolved.
An empty/fabricated revision is not an alternative. No profile schema version is
substituted for the financial content version.

When exact matching manifest content is already supplied, identify one unique
plan by `guid`. A missing/duplicate plan or different declared version is an
unresolved/conflicting reference, not an invitation to choose another plan or
change the support document. Retain supported standalone context with that limit.
If no matching content is supplied, the reference stays uninspected/unresolved;
there is no implicit URL fetch.

Matching identity/version does **not** establish valid financial terms. Assess the
supplied base independently against upstream structure and these financial-meaning
rules. A negative amount is not a supported ask even if an upstream schema permits
that number; an unrecognised plan status is not mapped to active/inactive. Keep
otherwise valid support declarations with an explicit financial limitation, but
do not apply invalid/unsupported plan fields as supported terms or repair them
silently. A resolved locator is not a positive financial-validation result.

For a monetary case in the **embedded carrier**, use a `fundingPlanRef` to that
enclosing manifest's canonical URL, actual content version where declared and
unique plan. `money` is invalid in this carrier: do not maintain two monetary
authorities. Non-monetary cases need neither financial field. A reference to an
external plan belongs in a standalone document, not this same-file OSS binding.

## 5. Authority, carriers and derived views

Select one canonical editable support representation and one authoritative source
for each financial plan. The canonical support document and financial manifest can
be different sources; publisher/source context and content versions must travel
with them. Display names, URL coincidence and matching IDs do not merge people or
establish authority. Publisher, assessed subject and funding recipient can differ.

An exact extraction of the embedded payload can retain its bytes/identity/revision
and declared canonical location. It is not another independent source or new
attestation. A transformed support document must have a new content revision and
`derivedFrom` naming the exact known source/mapping basis; do not fabricate an
unknown source revision to claim a versioned derivation. Keep unversioned source
material manually attributed until that basis exists, rather than manufacture a
conforming derived record. Do not make a new file publicly available automatically.

Two conflicting support declarations for the same claimed source identity/revision
are conflicting; do not merge them into a favourable story or pick the cheaper
financial terms. The producer fixes or explains the source conflict. A second
qualified key or guessed alias is not a fallback for the exact carrier in §1.

### Projection to an OSS financial view

Only suitable FOSS cases with real, cleared required facts can produce an upstream
view. Reuse the actual v1.1.0 actor/project/financial fields. In particular:

- Required entity identity/role/description/public-contact/page facts must be
  supplied. Projects are optional; if represented, their actual required repository,
  licences and other fields must be available. No invented email, repository,
  licence or role; broader non-OSS work is not excluded from the general profile.
- Complete actual plan fields, amounts/currency/frequency/status and resolving
  channel references are needed; absence is not filled with 0, `other`, inactive
  or a fabricated payment destination. Extra ItF publication checks are distinct
  from upstream schema permissiveness and actual consumer eligibility.
- `money` alone does not supply upstream facts. An explicit case-to-plan mapping
  and real channel/actor data are necessary. The derived embedded support payload
  replaces `money` with its exact `fundingPlanRef`, gets a new revision and records
  `derivedFrom`. It cannot claim to be byte-identical to the source support object.
- Several cases may reference one shared plan without multiplying its ask. Do not
  infer plan-to-project allocations or add a whole shared plan to every project.

For an existing enriched manifest, its **ItF-free financial view** removes only
`extensions["org.impact-to-funding.support"]`; remove `extensions` only if that
object becomes empty. All other base values/properties are preserved, including
the upstream financial `version`. Unrelated extensions are not discarded. If any
remain, disclose them; this operation does not make them supported by a consumer
or guarantee a strictly upstream-only view.

This is a derived financial representation with the original financial content
version as its basis, not byte-identical full-manifest history. Record its source
locator/version, transformation and losses alongside the export; do not publish it
over the canonical enriched source as the same complete document. A separately
published, independently changed financial manifest needs its own content revision.

The removed support cases, report relationships, non-money needs and correction
context cannot be reconstructed from that financial view. Disclose these losses
to the exporter/user. Unsupported unrelated fields or missing financial facts may
prevent a selected consumer projection, never the general support path. No schema
pass establishes added-field handling, directory acceptance, an award or impact.

## 6. Interpretation, corrections and safety

The reader distinctions below are behaviour, not a new API/tool or a
required stored status field:

| Situation | Treatment |
|---|---|
| Unknown `profile` or no recognised carrier | Unsupported interpretation; retain permitted data/reference. Not a supported empty support document. |
| Malformed JSON, duplicate keys, wrong known type/enum, required field absent, duplicate local IDs, dangling local `reportRefs`, or both money fields | Invalid support payload with reason; do not silently repair, truncate or apply it as a conforming profile. Financial base validity is assessed independently. |
| Unknown properties, unversioned/missing external targets, invalid/unsupported referenced financial terms, unsupported currency or incomplete inspection | Limited interpretation with the specific uncertainty. Valid support declarations can still be described as declarations; do not apply invalid financial terms or label unseen evidence inspected. |
| Two conflicting authorities, or a supplied plan version/identity mismatch | Preserve conflict/unresolved reference. Do not choose a replacement or rewrite earlier terms. |
| No represented cases/reports | Only absence in this document's selected scope, not absence of needs/work/evidence. |

An invalid or unsupported payload can be retained/displayed only as safely
attributed unaccepted source content, not a successfully interpreted profile. A
reader must not use missing metadata to claim current endorsement, no requirements,
eligibility or verified impact.

Changed cases/terms get an actual new document revision; retain safe prior basis
and supersession context where permitted. Report corrections update affected scope
text/references without inheriting earlier reviews or altering financial status.
Separate review withdrawal, evidence permission changes and disputed truth. Stop
affected uses, narrow/omit dependent claims as necessary and retain only authorised
history. Do not expose private allegations, sources or their existence, or promise
recall of provider logs, mirrors or other people's copies.

Only a separately curated, approved public derivative belongs here. Do not include
private evidence IDs/URLs/digests, participant material, protected associations or
funder-specific drafts. No field permits model processing, fetching links, executing
schemas, contacting people, publishing, applying or paying. Host permissions and
the existing [privacy guidance](../PRIVACY.md) remain decisive.

## 7. Review boundary

The [fictional walkthrough](../examples/funding-interchange.md) illustrates the
accepted standalone and embedded shapes, their financial view and failure cases.
JSON/manual shape/reference checks and package integrity are design evidence only.
No complete JSON Schema, formal validator, codec, consumer import, round trip,
directory submission, model trial, live manifest change or installation is supplied.

The financial source basis remains the v1.1.0 schema and official pages inspected
for the [architecture assessment](funding-interchange-design.md#sources-and-attribution-limits).
No new upstream version, consumer support or extension agreement is claimed.
The [adoption decision](support-profile-baseline-decision.md) accepts this design
target; adoption/publication and runtime verification remain distinct.
