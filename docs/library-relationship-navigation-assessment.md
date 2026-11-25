# Reference-library relationship and source navigation

**Assessment, 2026-11-25. Status: proposed bounded extension; implementation not
selected.** This responds to [#152](https://github.com/zhiganov/impact-to-funding/issues/152).
It preserves the accepted [three-tool library contract](reference-library-mcp-contract.md)
and the independently usable local server. No graph database, live collector or
new source-ingestion route follows from this assessment.

## The client question

An agent is considering P001, **Put usable response capacity behind information**.
It asks: **which cases inform this candidate, what does each relationship mean,
and what basis would I need to inspect before applying the idea?**

The existing `get_reference` returns the whole pattern, including its case links,
basis and caveats. A client can then request the named cases. It cannot ask for
those links as bounded structured results or distinguish a claim's evidence from
its source-discovery role without interpreting the prose. A client without the
ItF skill receives no separate relationship or source model.

That is a narrow interoperability gap. It does not make the current full-text
interface unusable, and it does not justify generic graph traversal.

## What should be exposed

The smallest useful unit is an **authored relationship statement**, not a graph
edge generated from shared keywords:

| Field | Meaning to preserve |
|---|---|
| `from`, `to` | Existing library IDs and their declared record revisions. |
| `relation` | A small vocabulary such as `informs`, `challenges`, `complements`, `tension` or `inspired_by`. |
| `rationale` | Why this particular relationship was authored, including the aspect it does not establish. |
| `scope` | The relevant mechanism, outcome or interpretation, not a claim about the entire source work. |
| `author` | The actual source author or the ItF note author's interpretation. |
| `basis` | Pointers to supporting or challenging claims and their exact source versions where mapped. |
| `status` | Whether this is a source-published relationship, ItF interpretation, candidate or disputed reading. |

A **source reference** should identify the work, author/publisher, revision or
publication date, locator, retrieval/observation dates where relevant, inspected
material, rights and access limits. Its role is claim-specific: author argument,
programme theory, reported learning, independent evaluation, teaching exercise,
discovery lead or comparison. One source can play different roles for different
statements.

For example, C002 revision 1 informs P001 revision 1 through publisher-reported
learning about relationships with actors able to respond. This is ItF's
interpretation of a programme account, not verified effectiveness or proof that
this arrangement is sufficient elsewhere. The relationship must not be promoted
to causal corroboration by putting it in JSON.

## Interface options

| Option | What the client can do | Trade-off |
|---|---|---|
| **A. Current interface** | Read the whole pattern and follow its Markdown links. | Already works with tool-only clients. No typed relationship query or claim-specific source registry. |
| **B. Add optional arrays to existing record detail** | Retrieve links and mapped sources with a pattern or case. | Small change but changes an accepted payload. Couples detail size and snapshot semantics to an evolving relationship model. It risks making every client process unneeded metadata. |
| **C. Separate read-only relationship/source tool family** | Search inbound/outbound relationships and inspect a relationship or source by ID. | A bounded extension for the client question. Existing three tools and their contract remain untouched. Needs explicit mapping and version boundaries, not a second canonical record store. |
| **D. Generic graph service** | Arbitrary traversal and inferred neighbourhoods. | Too broad for the identified need. Layout, transitivity and shared labels can create unsupported meaning. |

**Recommendation: C, after a fictional contract walkthrough.** Use a new optional
family with its own application-contract version and mapping revision. Keep the
existing `itf.library/0.1-draft` tools and their exact payloads unchanged. The
family can share a snapshot identity and server while retaining independent
capabilities and access rules. No tools should be silently added to the existing
contract version.

A minimal candidate surface is:

- `search_relationships`: required anchor record ID; optional direction,
  relation and bounded cursor. Return typed relationship summaries in stable ID
  order. A requested record's revision binds the relationship; do not silently
  point at the newest target.
- `get_relationship`: required relationship ID. Return its rationale, scope,
  status, author and mapped basis with exact versions.
- `get_source`: required source-reference ID. Return its role for the relevant
  statement, work/version, locator, inspection and rights limits. It does not
  fetch the external URL or imply permission to reuse the work.

These names and fields are **assessment candidates**, not an approved new
application contract. The smallest implementation may combine the latter two
reads if their meaning remains clear. The family must not require resources,
prompts or a graph-aware client; ordinary MCP tool calls are sufficient.

## Canonical and derived records

The Markdown notes remain canonical. A producer-controlled mapping is an
explicit derived view, with a source commit, mapping revision, record versions
and immutable snapshot identity. Missing, malformed or conflicting relationship
or source mappings must be visible as partial coverage, never omitted to make
the catalogue appear complete.

Do not manufacture a stable identity for a claim that the note does not make.
Where no relationship has been mapped, return none and explain that it is
unmapped rather than unsupported or nonexistent. The current three tools' full
Markdown remains the fallback when no structured mapping is available.

The existing case–pattern–lens links are a small initial corpus. Map their
actual reasons and limits, including P003's distinct basis in teaching
exercises. Do not infer additional links from co-occurrence, transitivity,
framework labels or similar text.

## Fictional round-trip acceptance

Before implementation, a wholly fictional pattern P900 and case C900 should
exercise this route:

1. `get_reference` P900 returns the canonical note under the unchanged contract.
2. `search_relationships` P900 returns C900 as `challenges`, not `supports`, for
   one stated scope. The target and relationship carry exact record revisions.
3. `get_relationship` identifies the ItF interpretation and its contrary case;
   it does not convert that relationship into a general effectiveness claim.
4. `get_source` returns a publisher report's exact revision, relevant locator,
   role and inspection limit. The report's availability is not independent
   evaluation, current programme operation or redistribution permission.
5. A changed mapping revision or target record version changes the snapshot or
   produces `revision_unavailable`, rather than transferring an old review to
   new content. Missing relationships and unavailable source records remain
   visibly partial. Repeating the same bounded request returns the same ordering.

The test is whether meaning, direction, uncertainty, provenance and rights
survive a tool-only round trip. A graph drawing, keyword match or successful
JSON parse does not establish that outcome.

## Source lessons and limits

The Necessary Tangle supplies useful comparisons: [explicit semantics](https://github.com/antlerboy/the-necessary-tangle/blob/main/documentation/explicit-semantics.md),
[source roles](https://github.com/antlerboy/the-necessary-tangle/blob/main/documentation/snowden-cynefin-sources.md),
[contribution intake](https://github.com/antlerboy/the-necessary-tangle/blob/main/documentation/contribution-intake.md)
and [rights](https://github.com/antlerboy/the-necessary-tangle/blob/main/RIGHTS.md).
Its source argues that every connection needs meaning, evidence, scope and status,
and that a map's proximity does not create a relation. Its author archives and
organisational sites have different evidentiary roles.

Converge's Network Toolkit suggests keeping declared needs, offers of help,
relationships and reported network learning distinct. It does not justify a
social graph or universal network-health score. Karma's documented API suggests
similar mapping cautions for listing authority, computed lifecycle, programme
records, reported milestones and actual payments. Neither source supplies an ItF
relationship schema or a live ingestion source.

## Boundaries and next decision

The proposal adds no database, external fetching, automatic recommendations,
funding discovery, private project ingestion, user graph or hosted service.
Source curation and publication remain separate authorised work. The hosted
connector in #96 can later expose the separate family after a compatible
contract is chosen; this assessment does not resume it.

Next decide whether to approve a **fictional contract walkthrough for the
separate family**. Implementation, mapping changes and a new application-contract
version need that reviewed walkthrough and an explicit selection. If the current
full-text route is sufficient for actual clients, retain it and document why.
