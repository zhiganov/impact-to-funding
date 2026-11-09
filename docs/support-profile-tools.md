# Author a support profile and use the optional local tools

Use this guide when you want a **machine-readable public support candidate** or
local inspection of one. A candidate is a separately curated draft, not permission
to publish. Ordinary ItF conversation, private assessment and support exploration
need no JSON, Node.js, dependencies, account, theory of change or evidence funnel.

The [adopted contract](support-profile-contract.md) defines exact fields and
meaning; the [baseline decision](support-profile-baseline-decision.md) and
[architecture decision](funding-interchange-direction-decision.md) explain the
design. This guide applies that design to authoring. The optional
[tool package](../tools/support-profile/README.md) is separate from the skill;
this page is usage guidance, not an execution or compatibility-test record.

## Choose only what helps

| Your purpose | Appropriate path |
|---|---|
| Explore a contribution, relationships or support | Continue the conversation; no profile required. |
| Prepare a machine-readable support candidate in any domain | Author a standalone support document using cleared facts. Non-financial and prospective cases are welcome. |
| Check a supplied standalone or enriched OSS candidate locally | Use `inspect` if requested; it checks structure and declared relationships. |
| Connect a suitable standalone OSS candidate to existing financial facts | Use `bind` with a separately supplied real funding.json base and explicit case-to-plan mapping. |
| Obtain the ItF-free financial view of an enriched OSS input | Use `financial-view`; read its loss notes before considering any subsequent use. |

These commands help you describe your contribution and support needs. They do not
ask you to design or implement ItF features, or to create tracker issues in your
own project; maintaining the tool is separate from authoring your profile.

## Author only the public candidate

An agent can use the [optional worksheet](../assets/support-profile.md) to draft
from authorised supplied material. It should read that resource itself rather
than ask you to navigate source Markdown. The worksheet is prose guidance, not a
pre-filled JSON object: missing required facts stay missing, not invented names,
contacts or amounts. The [fictional walkthrough](../examples/funding-interchange.md) illustrates
the field shapes, not real needs, destinations, model behaviour or consumer results.

For example, ask:

> Help me draft a standalone machine-readable public support candidate using only
> the facts I supply and have cleared for this purpose. Describe non-financial
> needs and proposals honestly; do not invent results, costs, contacts, permissions
> or a software project. Keep private evidence and funder-specific drafts out.
> Mark missing required facts before producing JSON. Keep any saved draft in my
> selected private work directory, not in the skill copy. Do not fetch report
> links, publish, apply, contact anyone or pay.

Before material enters an agent, establish that its processing with the selected
host/provider is permitted. Check retention, history, backups and sharing under
the [privacy guidance](../PRIVACY.md). That is separate from approving the exact
public content and actual publication destination later. A local CLI does not
make the surrounding agent session confidential or local-only.

The candidate must exclude private evidence IDs, URLs and digests, participant
material, protected associations and per-funder application packets. It is not
#48's private evidence/collection-plan crosswalk or an export of that work. A report
reference can be a cleared prospective plan without past outcomes or independent
review. A reference is a declaration; it is not an inspection record.

Use only cleared absolute HTTPS URLs and their permitted associations. Do not
include signed/private locators, credentials or protected source identifiers;
syntactically acceptable URLs are not permission to disclose their destinations.

### Preserve meaning while drafting

- Use exactly `itf.support/0.1-proposal`. Local IDs identify records within this
  document; names and matching URLs do not merge identities or establish authority.
- Prefer **`itf-manifest.json`** for a standalone support document. This is a
  naming convention, not a required root path or automatic discovery mechanism;
  other filenames remain valid and the exact `profile` selects interpretation.
- A standalone object has no mandatory filename, repository, licence, public
  contact or payment account. Do not convert non-OSS needs into software to fit a
  financial projection.
- Use actual content revisions, not schema versions or invented retrieval-based
  report revisions. Select one canonical editable support representation.
- Represent only selected cases/reports. Missing optional properties mean not
  represented/unknown, not false, none or zero. Omit unknown optional values;
  `null` is not a substitute.
- Distinguish case status from monetary-plan status, commitments, support received
  and impact. Do not activate an ask to make an export work.
- In standalone `money`, retain cost basis and existing support. Amount/currency
  can both be absent for an unpriced need. **0 means any amount**, never unknown
  or a zero-cost activity. Known terms must not be rounded, converted or defaulted.
- Use `money` or `fundingPlanRef`, never both. Embedded monetary cases use the
  enclosing manifest's plan reference, not duplicate editable financial terms.
- Preserve contrary evidence, other contributors, shared costs and limitations.
  Several cases can reference one plan without multiplying its amount or outcomes.
  Unknown existing support is not zero and a gross ask is not a known net gap.

## Prepare the optional tool, only if needed

The local package requires **Node.js 22 or later**, Ajv **8.17.1** and
jsonc-parser **3.3.1**. Dependency installation is confined to
`tools/support-profile`: from that directory in a trusted source copy, run
`npm ci --ignore-scripts --no-audit --no-fund`. Dependency setup may contact the
npm registry; do not supply profile data to that setup operation. The runtime
commands make no network calls. There is no root install or host/SDK/configuration
setup required. Normal skill use needs none of these dependencies.

For the commands below, the working directory is your selected **private
workspace**, with a trusted source copy at `./impact-to-funding` and private inputs
under `./work`. These are illustrative relative paths. Author inputs and mappings
outside the distributable copy; do not put real candidates in repository fixtures.
The destination directories shown must not already exist. Commands below are
instructions, not a record that they were executed.

## Inspect a candidate

```sh
node ./impact-to-funding/tools/support-profile/cli.mjs inspect ./work/itf-manifest.json
```

Optionally supply `--source-url URL` for the actual cleared public source locator;
this supplies context, not fetch permission or verified control of that location.
The inspector accepts a standalone support document or the exact ItF carrier in
a funding.json v1.1.0 input. It does not fetch reports or external plans.

It writes a JSON report to stdout, not a rewritten candidate. Exit codes:

| Code | Meaning |
|---|---|
| `0` | Valid supported interpretation within the reported local checks. |
| `2` | Limited interpretation; read the specific gaps, do not call it fully supported. |
| `3` | Invalid input/declarations. |
| `4` | Unsupported profile or representation. |
| `1` | Usage or I/O failure. |

Inputs are limited to **1 MiB** and **64 levels of nesting**. Strict JSON is
required: no comments, trailing commas, duplicate keys or unsafe numeric rounding.
Despite the parser dependency's name, JSONC is not accepted. Refusal is not an empty
successful profile. Diagnostics do not echo unknown property names, raw source
values or URLs; keep the input and any operation reports in appropriate storage.

Unknown profile versions are unsupported, not guessed. Unknown properties in a
supported profile limit interpretation; an unknown enum in a known field is
invalid. Local `reportRefs` must resolve to unique report IDs. External report
references remain publisher declarations, not fetched evidence. Missing versions,
unresolved/conflicting financial references and unsupported financial meanings
must stay visible rather than silently acquiring substitutes.

Known URL query strings are treated as limited; the reader does not guess whether
a query is private. A query-free URL or a structurally valid native financial URL
or origin is **not privacy-cleared**. All source financial fields still need their
own disclosure and authority review.

The report separates `checks.fundingSchema` (the pinned upstream structural
schema) from `checks.fundingMeaning` and redacted `financialIssues` (local financial
meaning/completeness). For example, an upstream schema can permit a negative
number while this tool refuses to use it as an ask. That does not make a recorded
historical credit/correction invalid: supplied negative history values and permitted
empty optional native metadata are preserved. Required facts must still be real
and nonempty. An unsupported explicit financial `$schema` declaration limits
interpretation; the tool never fetches or compiles that input URL.

## Bind a standalone OSS candidate

This narrower operation does not create financial facts. Supply:

- `INPUT`: the authored, curated **standalone** OSS support candidate;
- `BASE`: a separate real funding.json v1.1.0 financial base with known content
  version and actual required actor/contact/channel facts, plus actual repository
  and licence facts for any represented projects;
- `MAP`: a local strict-JSON object whose keys are case IDs and values are plan
  GUIDs. It must cover **all and only cases with `money`**. Unknown or extraneous
  mappings are blocked, not ignored.

```sh
node ./impact-to-funding/tools/support-profile/cli.mjs bind ./work/itf-manifest.json --funding ./work/base.json --map ./work/map.json --destination-url https://example.org/funding.json --revision support-view-r2 --mapping-revision map-r1 --output ./work/bound-candidate
```

The example URL and revision labels illustrate syntax only. Supply the actual
cleared destination, new support content revision and actual mapping revision.
The standalone source needs its actual `canonicalUrl` or `--source-url URL` for
versioned derivation. No source or destination URL is fetched.

Known money terms must match the selected supplied plan. The tool does not parse
resource prose into a budget, infer a recipient/channel, convert currency, supply
defaults or activate an ask. Valid supported declarations **and** a valid supported
financial base are required in this first slice. Limited/unknown data, missing
facts and reference conflicts block transformation with a specific gap. Keep the
standalone/prose/manual path where appropriate; do not start monitoring, invent
facts or force a non-OSS case through the projection.

The derived embedded payload has a new support revision, the supplied destination
as its canonical URL, and `derivedFrom` identifying source URL, source revision and
mapping revision. Monetary cases reference the existing enclosing plans instead
of retaining `money`. Their cost basis and existing-support meaning carry into
case limitations; they are not discarded or duplicated as another ask. Financial
base values, its content version and plan statuses stay authoritative. Existing
ItF carriers are not replaced by this operation.

## Produce an ItF-free financial view

```sh
node ./impact-to-funding/tools/support-profile/cli.mjs financial-view ./work/enriched.json --output ./work/financial-candidate
```

Optional `--source-url URL` supplies the actual source context when needed. This
requires an enriched OSS input with the **exact** ItF carrier, a valid supported
financial base and known financial source basis. A standalone general profile is
not a financial base. Limited declarations or unresolved/conflicting references
block this transformation too.

The operation removes only `extensions["org.impact-to-funding.support"]`, and the
`extensions` wrapper only if empty. Other extensions, properties, base values and
the financial content version remain. Other retained extensions are disclosed,
not declared supported by an upstream consumer. The notes identify the source
basis, operation and losses: support cases, non-money needs, report relationships
and correction context cannot be reconstructed from the financial view alone.
This is not a byte-identical manifest or a lossless round trip; do not overwrite
the canonical enriched source as if nothing changed.

### Output and approval boundary

Both writing commands validate before writing. Each creates a **new** output
directory containing `funding.json` and `projection-notes.json`, using private
permissions (`0700` directory, `0600` files). The directory must not exist; no
overwrites are allowed. Stdout is a brief operation report, not the source/output
data. File modes do not settle model processing, backup retention or disclosure
rights. These local files are candidates, not approved public artifacts.

The tool has no network, publisher, application, payment or source-collection
function. It does not fetch reports, install/configure authentication, publish a
schema endpoint, submit a directory entry or make a payment. Validation addresses
structure and declared relationships, **not privacy permission, identity,
authority, truth, independent review, impact or actual funder eligibility**.
Upstream consumer/version compatibility remains untested until an actual selected
consumer test establishes it; a schema pass is not that evidence.

Changing these source files does not update the separately installed skill at
`fbb8993`. Native installation of this updated source and reliable model routing
to this guide have not been tested by writing the documentation. Authored examples
and expected command behaviour must not be reported as observed passes.

## Sources and rights

The optional package vendors the **unmodified** funding.json v1.1.0 upstream
schema under **CC-BY-SA 4.0**; see its
[NOTICE](../tools/support-profile/vendor/NOTICE.md). ItF code and its own support
schema remain **MIT**; the written guide and worksheet use
[CC BY-SA 4.0](../LICENSE-CONTENT.md), with earlier MIT grants preserved.
Do not describe the vendored schema as MIT or imply upstream,
FLOSS/fund or Zerodha endorsement. The qualified carrier is an ItF convention,
not upstream agreement. Your candidate's content keeps its own rights and
disclosure limits; neither licence permits publication of private records.
