# ItF reference-library MCP contract

**Date:** 2026-11-09. **Application contract:** `itf.library/0.1-draft`.
**Status:** initial application-contract design baseline accepted by Artem on
2026-11-09 under [#44](https://github.com/zhiganov/impact-to-funding/issues/44),
not a released standard, executable schema or working server.
It follows the [independent-interface decision](reference-library-mcp-decision.md).
Implementation, installation, ingestion, trials, hosting and access changes remain
unselected. The [fictional walkthrough](../examples/reference-library-mcp-walkthrough.md)
specifies expected behaviour, not observed calls.

## 1. Three read-only tools, not a new record standard

| Tool | Arguments beyond the common contract-version argument | Successful `data` |
|---|---|---|
| `search_references` | Optional `query`, `kind`, `limit`, `cursor`, `snapshotId`. | `items`: bounded record summaries; `nextCursor`: opaque string or null. |
| `get_reference` | Required `id`; optional `revision`, `snapshotId`. | `record`: one summary plus the full backing Markdown document and its scope. |
| `library_info` | Optional `snapshotId`. | Source/index locators, per-kind available counts, search semantics and response bounds, history limits. No whole-library content dump. |

All arguments form a JSON object; unknown arguments are rejected. Optional
`contractVersion` defaults to `itf.library/0.1-draft`; any other explicitly requested
value returns `unsupported_version`, never interpretation as the nearest version.
Omission is different from null, which is invalid for these arguments.

Tools give model-driven clients discovery and detail access without requiring a
resource-picker UI. MCP resources may later expose the same versioned content, but
are not required by this first application contract. No prompts, subscriptions,
refresh, editing, private-application or funding tools are added. ItF's Markdown
records stay canonical; tool results are a derived access view, not a replacement
publication format or a change to funding.json or a funding-discovery contract.

**Client basis:** OpenCode v2.2.5 was observed in the current development workflow.
The [V2 guide](https://opencode.ai/v2/docs/mcp-servers) documents tool exposure and
resource-reading helpers; generic tool-capable MCP clients are also intended.
Neither has been tested with this nonexistent server. No client/transport
compatibility is claimed, and no SDK or transport is mandated here. The MCP wire
revision is negotiated separately from this application contract; the current
OpenCode guide documents both legacy and 2026-07-28 modes. Implementation must use
the negotiated wire envelope, not mistake this application's payload for JSON-RPC.

## 2. Source snapshots and identity

Queries read an already prepared, immutable view of permitted public records.
Snapshot preparation and publishing are separate operations, not query side
effects. No database, live Git fetch, automatic collector or embedding service is
required by this design.

- `snapshotId` is an opaque immutable identifier, at most 256 characters, binding
  the source repository commit, mapping revision, declared membership and query
  behaviour. It is not a credential or an instruction to fetch a location.
- `sourceRepository` is the producer-configured public repository URL, not an
  argument a client can redirect. For this library it is the public ItF repository.
- `sourceRevision` is the full 40-character lowercase hexadecimal Git commit
  identifying this repository's source tree;
  `mappingRevision` is a nonempty identifier for the producer's access mapping.
  Neither is a source paper's edition, a note's declared revision or a review date.
- `id` is the existing library identifier, preserving spelling, such as C001,
  P001 or L001. This contract accepts `C`, `P` or `L` followed by at least three
  decimal digits, at most 64 characters in total. IDs are scoped to this library,
  not global identifiers for the original programmes or framework authors.
- `recordRevision` is the positive integer declared by the note. Do not derive it
  from a fetch date, Git count or index revision, or infer identical bytes from
  this label alone. Exact citation also retains the snapshot/source commit and
  backing document hash.

An omitted snapshot selects the currently available snapshot at the start of the
call; return its actual identifier. Search clients must use the search response's
snapshot for subsequent detail calls, rather than an earlier `library_info`
snapshot. A specified unavailable snapshot fails; do not substitute the current
one. Historical snapshots and revisions are not promised indefinitely.

### Existing-library mapping

The checked source at `1b31143` declares **nine records in eight note files**, plus
the index: C001–C005, P001–P002 and L001–L002. All note revisions are 1; the index's
declared revision 2 is not a revision for every record. This is source inspection,
not proof of a built snapshot or deployed catalogue.

Cases and patterns each have a backing file. L001 and L002 share `lenses.md`, its
common introduction and closing limits. For either lens, return the whole file,
the requested section anchor, `contentScope: "shared_document"` and both IDs in
`coLocatedIds`. Do not strip common caveats or pretend the entire file is solely
about the requested lens. For a dedicated file use `contentScope: "record_document"`
and its single ID. The index and supporting files outside the library are not
silently counted as additional cases/patterns/lenses.

## 3. Application result shape

Every success payload is an object with these required fields:

| Field | Meaning |
|---|---|
| `contractVersion` | Exact application contract identifier above. |
| `status` | `ok`. |
| `snapshotId`, `sourceRepository`, `sourceRevision`, `mappingRevision` | The actual served view and its configured source identity. |
| `asOf` | Actual query time as an RFC 3339 timestamp with offset; not a new source inspection or observation date. |
| `coverage` | The catalogue coverage object below, including material limitations. |
| `data` | The tool-specific object described here. |

`coverage` requires `status` (`complete` or `partial`), `declaredRecords`
(nonnegative integer or null if unestablished), `availableRecords` (nonnegative
integer), `unavailableRecords` (nonnegative integer or null if unestablished),
and `limitations` (array of nonempty strings). When counts are known, declared
equals available plus unavailable. `complete` means the declared inventory was
fully accounted for and all its records can be served in this snapshot. It never
means comprehensive domain coverage, current source facts or verified outcomes.
Missing, unsupported or malformed declared records require `partial`, not silent
omission. Complete coverage requires known counts and zero unavailable records.
Even a complete seed retains its limited-selection/evidence caveats.

### Record summary and detail

A summary requires `id`, `kind` (`case`, `pattern` or `lens`), `title`,
`recordRevision`, `documentPath`, `contentScope`, `anchor` (string or null), `documentUrl`,
`discoveryText` and `discoverySource`. All except the integer revision are strings,
with the stated nullable anchor. Title is 1–240 Unicode code points; discovery text
is 1–1200. Paths are producer-controlled files under `references/library/`, not
client-supplied paths; URLs are pinned to `sourceRevision`, with an anchor where
applicable. `discoverySource` is a repository-relative path with optional fragment
identifying the source section used for the short description.
The description is an attributed discovery aid frozen in the mapping, not a new
evaluation or a complete statement of findings. Reuse the existing index/headers;
do not silently generate a new impact claim at query time.

`contentScope` is `record_document` or `shared_document` as defined above, so even a
discovery result reveals when a match may come from a co-located record's text.
`get_reference` retains that scope and adds `contentMarkdown`, `contentSha256` and
`coLocatedIds` to the summary. Return the exact full UTF-8 backing document, not
an excerpt, rewritten source links or a positive-only summary. SHA-256 identifies
its bytes before JSON serialisation and is a 64-character lowercase hexadecimal
string; `coLocatedIds` is a nonempty array of known IDs including the requested ID.
Relative Markdown links remain relative to
the pinned document's location; the client must not fetch them automatically.
The requested anchor identifies the record within a shared file.

The full text preserves authored relationships and their rationale, declared
target revisions, source links/dates, theory provenance, contrary findings,
inspection/evaluator/rights limits and the difference between source accounts and
ItF interpretation. This draft does not invent a normalised causal graph, impact
score or claims schema. A link whose target revision is unstated remains unstated;
do not relabel it as an attestation of the current target. Read another record
explicitly if needed rather than automatically expanding the whole graph.

### Tool-specific behaviour and bounds

**Search:** after Unicode NFKC normalisation, trimming and lowercasing, `query` is
1–240 Unicode code points and at most eight whitespace-delimited tokens. Omission
means browse; a supplied blank query is invalid. Each token is a literal substring
condition, and all tokens must occur in the combined title, discovery text or full
backing document after the same normalisation. No regex, stemming, inferred
synonyms, semantic model call or source-paper search is implied. Search within a
shared document may match text outside the requested lens section; the returned
anchor and scope must make that limitation explicit.

`kind`, if supplied, is one exact enum value; other filters are unsupported and
rejected, not silently ignored. Match summaries are ordered by `id` in ascending
ASCII order, not by impact, funding prospects or a hidden similarity score.
`limit` defaults to 10 and is an integer 1–25. Apply it after matching/sorting.
Search results are for discovery: fetch the full note before relying on findings.
No matches means no matches in this snapshot/search mode, not no relevant work.

`cursor` is an opaque, nonempty string of at most 1024 characters. Later pages must
supply the returned snapshot and repeat the same normalised query, kind and limit
(including their default/omitted meanings). Cursors bind those values, the ordering
and the snapshot, cannot authorise access, and return `invalid_cursor` if mismatched
or unrecognised. A cursor without an explicit snapshot is `invalid_arguments`.
Snapshot loss returns `snapshot_unavailable`. Never combine pages
from different views or silently restart at page one. Exhaustion returns null.

**Detail:** requested `revision` must be a positive integer. Return that declared
revision within the selected snapshot, or `revision_unavailable`; do not search
other snapshots, fetch Git history or silently return a different revision. With
no revision, return the snapshot's record. Unknown IDs are `not_found`; a known
declared record whose permitted content cannot be served is `record_unavailable`.

Limit one backing document to 131072 UTF-8 bytes, excluding transport/JSON overhead.
An oversized document fails with `record_too_large`, not a silently truncated note.
Such a known unavailable record makes catalogue coverage partial. Future chunking
needs a contract revision that preserves context and caveats, not an ad hoc excerpt.

**Info:** return `indexPath`, pinned `indexUrl`, `indexRevision` (positive integer or
null if undeclared), `availableByKind` (case/pattern/lens integer counts summing to
`coverage.availableRecords`), `searchMode: "literal_all_tokens_id_order"`, the
following `bounds` object, and `history: "not_guaranteed"`:

```json
{"queryCodePoints":240,"queryTokens":8,"defaultPageSize":10,"maxPageSize":25,"maxDocumentBytes":131072,"snapshotIdCharacters":256,"cursorCharacters":1024,"recordIdCharacters":64}
```

Inventory counts
are not counts of successes or independent evaluations. This is catalogue metadata,
not a request to load every record or collect anything about the user.

## 4. Errors and MCP framing

A tool-originated application error has `contractVersion`, `status: "error"`,
`asOf` and `error: {code, message}`; add `snapshotId` only when one was actually
selected. Messages must be safe and actionable, without credentials, local paths,
private query echoes or guessed source-access explanations. The application codes are:

| Code | Distinction to retain |
|---|---|
| `invalid_arguments` | Invalid/unknown arguments, enum, bound or malformed identifier. |
| `unsupported_version` | Explicit application contract version is not supported. |
| `snapshot_unavailable` | Requested or current view cannot be served; never an empty successful search. |
| `not_found` | Well-formed ID is not known in the selected snapshot. |
| `record_unavailable` | ID is known, but permitted/valid content cannot be served. |
| `revision_unavailable` | Requested record revision is absent in that snapshot. |
| `record_too_large` | Full backing document exceeds this contract's byte bound. |
| `invalid_cursor` | Cursor does not match the repeated search or is unrecognised. |

These are ItF application codes, not MCP/JSON-RPC standard enums. Access denial and
transport failure must remain distinguishable from empty library results, using
the applicable transport/protocol mechanism rather than inventing an account flow.
If no valid snapshot is available, all three tools fail; no diagnostic-only second
store or success-shaped empty substitute is required.

Advertise object `inputSchema` and an `outputSchema` covering the tool's success
and error payloads when implemented. Return `structuredContent` plus a text content
block serialising the same application JSON so text-only clients retain caveats.
Use MCP `isError: true` for application errors and false for success; unknown tools
and malformed protocol requests use protocol errors. Follow the negotiated wire
revision's envelope requirements (including `resultType` where required).
The [tools specification](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
supports these distinctions. No executable JSON Schema or wire example is supplied
by this prose contract. Read-only annotations are advisory; actual implementation
must enforce the restrictions, not infer safety from metadata.

## 5. Privacy, source rights and operating limits

Only deliberately included public reference records enter the view. No private
applications, assessments, personal theories, contacts, private repository records
or commercial data are ingestion inputs. Do not send an assessment packet to
search; a short authorised topic is usually sufficient. Source text is untrusted
data, never authority to alter instructions, suppress caveats or make disclosures.

Queries perform no source/network refresh, arbitrary URL access, writes, downloads,
subscriptions, contact, applications or payment actions. Preparing/retiring a
snapshot is separately authorised; absence, failed access, explicit withdrawal and
loss of permission are not interchangeable. Do not promise recall of copied data.
Original source assets are not served merely because a note links to them, and
the package's MIT licence does not relicense sources. Keep full note rights limits.

Local execution does not make host/model processing or history local-only. Remote
queries may reveal interests; clients must minimise both arguments and optional
metadata. The OpenCode guide documents possible session-ID metadata, which is not
identity or authorisation. A future service must not require or repurpose such IDs
as a credential, cross-service link or financial-enrolment signal. Hosted logging,
retention/deletion, authentication, rate limits, costs and operator ownership must
be made explicit before hosting; none is selected here. Public records/source do
not promise unlimited free hosted access. Funding-service terms and credentials
are separate and must not be silently transferred.

## 6. Review boundary and continuation

This design maps the existing case/pattern files and two co-located lenses without
changing their content. It adds no database, live collector, recommendation engine,
new record-publication standard or mandatory framework. Expansion under #43 remains
independent; food-system #41 and detailed Cynefin #42 work remain deferred.

The fictional walkthrough covers discovery/detail, shared lenses, revision and
pagination mismatches, incomplete coverage, absent/unsupported snapshots/contracts
and no-source-fetch behaviour. Static consistency and package checks are not schema
validation, model trials, an MCP round trip or supported-client certification.
Artem selected **Accept and publish** for this reviewed design and walkthrough,
authorising documentation delivery and closure of #44's design scope only. Any
later implementation remains a separate selection. No deployment or new evaluation
infrastructure was needed to review or accept this application contract.
