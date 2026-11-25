# Import external knowledge into the reference library

**Assessment, 2026-11-25. Status: candidate import routes; no import selected.**
This is the content-acquisition counterpart to the
[relationship-navigation assessment](library-relationship-navigation-assessment.md).
It concerns knowledge for the existing independent library MCP, not funding
opportunity discovery or private project records.

## The benefit

The current library contains eleven original records. Its MCP serves only those
records. A client exploring systems practice cannot retrieve the richer public
teaching material, concept relationships or network methods in the sources
recently reviewed unless someone writes a new ItF note.

Importing selected external knowledge could let a client:

- retrieve a public systems-method exercise with its scenario, checks and limits;
- inspect a concept's relationship to a method or practice, with the original
  source and status;
- find network-learning methods such as rapid coordination alongside ItF's
  contribution guidance;
- use the MCP without requiring ItF's skill or navigating several source sites.

This is a substantive expansion of the library's coverage, not just a query
feature. The library can contain imported records with their own provenance,
while the existing ItF-authored records and interpretation remain distinct.

## Candidate sources and content

### The Necessary Tangle

The most promising first source is its
[systems-methods practice pack](https://transduction.systems/systems-thinking/practice/).
Selected exercises could be represented as **practice records** rather than
mislabelled as outcome cases or ItF-authored candidate patterns.

For example, import `transposing-theory`, `participative-inquiry` and
`evaluation-and-reflexivity` with their original case, requested outputs,
repair, changed case and comparison material. Retain the source author,
canonical URL, exact source revision, exercise status and the explicit limit
that a technical dry run does not establish competence with real people.

The repository's [RIGHTS](https://github.com/antlerboy/the-necessary-tangle/blob/main/RIGHTS.md)
states CC BY-SA 4.0 for original atlas text, public data and editorial material,
and MIT for original software. Third-party works retain their own terms. Its
licence permits sharing and adaptation with attribution, change indication and
compatible share-alike treatment. It does not imply endorsement or relicense
linked courses and resources.

A later separate route could import selected concept–method–practice statements
from the atlas, preserving relation direction, scope, status, source locator and
formation method. Do not import the entire atlas merely because its data is
public. Its [explicit semantics](https://github.com/antlerboy/the-necessary-tangle/blob/main/documentation/explicit-semantics.md)
shows what a faithful projection must preserve.

### Converge Network Toolkit

A small candidate is [Rapid Coordination](https://www.converge.net/toolkit/rapid-coordination),
with its purpose, group size, timing, participant prompt, offer-of-help and
participant-owned follow-up. Related network-health questions and group
agreements can be separate method records, not an automatic network score.

The inspected pages state CC BY-SA 4.0. Review each selected page and any
third-party assets before importing. A public method is not evidence of its
effectiveness in a new context, and participation does not imply consent to
publish personal network data.

### Karma

Karma belongs in the separate ItF #35/FtI #38 discovery assessment. Its MCP
requires credentials in the observed initialize check. Its published terms do
not establish permission to copy or redistribute its records. It is a candidate
for user-directed links or a future read-only adapter with appropriate access
and reuse terms, not for importing into the public reference snapshot now.

## Three different acquisition routes

| Route | Benefit and cost | Suitable use |
|---|---|---|
| **Curated snapshot import** | The client gets complete selected records locally, with deterministic versions, provenance and independent use. It requires rights review, attribution, explicit mappings and updates. | Selected Necessary Tangle exercises or Converge methods. |
| **Source-qualified external link** | Cheap to maintain and useful for discovery. The client still needs to fetch and interpret another site; linked availability is not verified by the MCP. | A broader catalogue of leads where full content is unnecessary or rights are unresolved. |
| **Read-only external-provider adapter** | Queries the provider's current interface without copying its corpus. It depends on access, query disclosure, protocol and freshness behavior, and adds external failure states. | A justified provider with a documented compatible API and appropriate terms. |

These routes can coexist. Start with a curated snapshot for content that the
MCP should answer from directly. Links and provider access do not substitute
for complete offline records.

## Required record and query changes

The current vocabulary is case, pattern and lens. **Practice/method material is
not a historical outcome case.** Do not silently relabel it to fit the existing
IDs or counts. An imported exercise needs an explicit kind, stable imported ID,
source owner, canonical URL, source revision and imported snapshot revision.
Keep source-published text distinct from ItF commentary and mapping.

A compatible access view could expose:

- source record and edition;
- imported record ID, kind and revision;
- original content or an explicitly identified adapted excerpt;
- attribution, changes, licence and third-party exclusions;
- method, purpose, inputs, outputs, checks and limitations where applicable;
- typed relationships to ItF records, each marked as imported or ItF-authored;
- coverage of selected sources, including omissions and failed or unreviewed
  records.

The existing three tools need not change their contract version. A separately
versioned imported-record family can share the snapshot/server. Alternatively,
a deliberate later contract revision could broaden the common record kind.
Choose only after the import mapping is demonstrated. Do not add imported
records to existing counts while calling their kind a case.

## A bounded first import

Propose three Necessary Tangle practice exercises:

1. transposing theory;
2. participative inquiry;
3. evaluation and reflexivity.

The check should use exact source content at a pinned commit, not live URLs
copied at query time. Preserve the complete exercise needed for independent
practice, rather than reducing it to a summary. Attribute The Necessary Tangle
and Benjamin P Taylor, link CC BY-SA 4.0, and identify ItF's mapping/adaptation.
Do not copy third-party images, linked resources or unrelated atlas content.

Verify that a client can:

1. discover the imported practice kind and its source coverage;
2. retrieve one complete exercise with its source revision and rights;
3. distinguish source content from ItF's P003 interpretation;
4. follow a source-qualified relationship between the exercise and P003;
5. repeat the same snapshot query with identical ordering and bytes, and see a
   deliberate new source revision only in a new snapshot.

This first import needs review of the exact source files and proposed mapping
before any code or publication change. The current PR #151 is independent.

## Maintenance and boundaries

A source revision is not a current endorsement, truth guarantee or automatic
refresh trigger. Record failures and omissions. A later source update needs a
new prepared snapshot and rights/relevance review. Imported public knowledge
must remain independent of private project applications, personal relationships,
participant contacts and confidential evidence.

This assessment selects no download, file import, new schema, collector,
implementation, hosted service or publication. The next useful step is a
reviewable mapping and fictional client walkthrough for the three selected
exercises, including their exact attribution and reuse treatment.
