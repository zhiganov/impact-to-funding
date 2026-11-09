# Optional support-profile authoring worksheet

Use this only when a person requests a **machine-readable public support
candidate**. It is an agent-authoring aid, not a form everyone must complete, a
JSON template, evidence register or publication approval. An ordinary conversation,
private draft or non-financial contribution needs no tool, account or manifest.

Read the [usage guide](../docs/support-profile-tools.md),
[adopted field contract](../docs/support-profile-contract.md) and relevant
[claim](../references/claims.md), [contribution](../references/contributions.md)
and [disclosure](../references/funding-and-review.md) guidance. The contract, not
this worksheet, defines exact fields. Select only relevant prompts, use actual
known facts and remove worksheet instructions from the result. Do not fill gaps
with fictional identities, contact details, amounts, roles or permissions.

## Before authoring

- What support or contribution does the person want to describe? Non-software,
  non-financial and prospective work are first-class cases. No completed theory,
  past outcomes, independent review or fundraising account is required.
- May the selected agent/model process this material? Check host/provider
  processing, history and retention separately from permission to publish at a
  particular destination. A local file can still enter model context.
- Which facts and associations are cleared for this separately curated candidate?
  Keep private evidence, its identifiers/URLs/digests, participant material and
  funder-specific application drafts out. Do not export a private packet into
  this profile or use protected associations to explain missingness.
- Where will the private working files live? Use a selected private location
  outside the distributable skill/source copy. Naming a file public does not
  approve its contents or destination.

## Choose the representation

**General support document:** use a standalone JSON object with the exact profile
`itf.support/0.1-proposal`. It needs no standard filename, repository, software
licence, public contact or payment channel. This is normally the appropriate path
for non-OSS work; do not recast that work as software to fit a financial consumer.
Prefer `itf-manifest.json` when naming a standalone candidate; other filenames and
publisher-selected locations remain valid. A filename is not disclosure permission,
profile detection, authority or proof that a reader will discover the document.

**Optional OSS carrier:** only when appropriate real OSS financial facts exist,
the same support shape can appear at
`extensions["org.impact-to-funding.support"]` in funding.json v1.1.0. This is an
ItF convention, not an upstream namespace agreement. Embedded monetary cases
reference the enclosing financial plan; they do not carry a second money record.
The [local bind operation](../docs/support-profile-tools.md#bind-a-standalone-oss-candidate)
requires a separately supplied financial base and explicit mapping, not inferred
facts from this worksheet.

## Describe the selected public scope

- **Publisher and subject:** cleared publishing name; subject's actual name,
  kind, bounded role and description. Publisher, subject and financial recipient
  may differ. A name or URL does not verify identity or authority to speak for a
  collective.
- **Identity and revision:** actual local document/subject IDs and content
  revision. Profile version is not a content revision. Select one canonical
  editable support representation; include its cleared canonical URL only when
  known. Without it, identity stays local to the supplied source context.
- **Limitations:** selected scope, uncertainty, material contrary findings,
  shared contributions and what is not represented. Omitted cases/reports do not
  mean no needs, evidence or other work exist.

### Each selected support case, if any

- What would support enable, and why? Separate proposed benefits from observations.
- What is the case's actual status: `proposed`, `seeking`, `paused`, `completed`
  or `withdrawn`? Completion is not proof of impact or funds received.
- What financial or non-financial resources are needed? Describe actual versus
  proposed responsibility, capacity, dependencies and unconfirmed commitments.
  Do not assume unpaid availability.
- If monetary terms belong here, record their actual cost basis and existing
  support, explicitly unknown where unknown. A proposed gross amount is not an
  established net uncovered need. Amount and currency are either both present
  or both absent; an unpriced need is allowed. **0 means any amount**, not unknown
  or zero cost. Omit unknown frequency/status rather than inventing defaults.
- Use either standalone `money` or `fundingPlanRef`, never both. A reference must
  name the actual plan; include its financial content version only when actually
  known, never the profile/schema version. An omitted version leaves the reference
  unresolved. Unresolved terms stay unresolved, not silently repaired.
- Link only selected local report IDs already represented in this document, if
  useful. No report is compulsory for a prospective case.
- Retain relevant limits: existing support, shared costs, authority, feasibility,
  measurement and overlap with other asks. Reusing work or a shared plan does not
  create a new outcome or another charge for the same cost.

### Public report references, only when useful and cleared

- Use the actual safe public URL, declared scope and limitations; add a revision,
  period or publication date only at the precision actually known.
- A prospective learning plan is acceptable; do not present it as past results.
- Keep qualifications beside claims. A linked report is a publisher declaration,
  not evidence that the agent or local tool fetched or inspected it. Do not inherit
  a review, infer a report version from retrieval time or invent an endorsement.
- Do not put restricted evidence locators, private source crosswalks or per-funder
  packets in these references. Private evidence can remain meaningful without
  becoming public.

## Review and optional inspection

Draft strict JSON only when requested, following the linked contract rather than
copying this worksheet as data. Omit unknown optional fields; do not use `null`
as a substitute or invent required facts to make validation pass. If required
facts are missing, keep an honest prose draft and name the gap.

If requested and authorised, use the [optional local inspector](../tools/support-profile/README.md)
on the separately curated candidate. Its structural/relationship result is not
privacy clearance, authority, evidence verification, impact certification or
actual funder eligibility. It does not fetch report URLs. Known URL query strings
limit interpretation; a result without that warning is still not permission to
disclose a URL or native financial field.

Before any publication, separately establish exact content and actual destination
approval, disclosure rights, correction context and realistic retention limits.
Inspection and local output do not publish, submit, contact anyone or move money.
