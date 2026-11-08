# Reference-library MCP walkthrough — entirely fictional

**Design illustration, not a behavioural test result.** This is a wholly fictional
catalogue and authored expected behaviour for the
[accepted design contract](../docs/reference-library-mcp-contract.md), not actual MCP
responses, source evaluation or records in the public seed. No server, model
trial, source fetch or fixture runner was executed. Reserved example-domain URLs
are not evidence locations to visit.

## Fixture assumptions

The imaginary producer is configured with `https://example.org/library` as its
public repository URL, and a 40-zero fictional source-commit placeholder. This
substitutes for the real deployment-owned ItF locator; clients cannot choose it
through query arguments. Snapshot `fixture-A` has mapping revision `fixture-1`,
application contract `itf.library/0.1-draft` and these four declared records:

| ID / revision / kind | Fictional content and backing document |
|---|---|
| C901 / 1 / case | **Shared tool repair.** `cases/shared-tool-repair.md` describes a hypothetical volunteer arrangement. Whether access or repair outcomes improved is unknown; it is not a success case. |
| P901 / 1 / pattern | **Response capacity.** `patterns/response-capacity.md` proposes examining willing, resourced response roles. It links to C901 revision 1 as an illustration, not empirical support. |
| L901 / 1 / lens | **Access questions.** First section of `lenses.md`; asks whose access and burden matter. Not an official framework or an observed outcome. |
| L902 / 1 / lens | **Resource questions.** Second section of the same `lenses.md`; asks about material constraints without supplying numerical thresholds. |

Both lens records share the introduction and closing caveats in the full file.
All four documents/sections are available, so catalogue coverage is `complete`
with four declared, four available and zero unavailable records. Its limitations
still say that the collection is fictional, selective and not impact validation.
There are **three backing note files**, not four. None is an underlying paper.

## Discovery, then reading

Input to `search_references`:

```json
{"kind":"pattern","query":"response","limit":1}
```

Expected: application success with `snapshotId: "fixture-A"`, the fixture's source
identity/revision, mapping revision, actual query time and qualified coverage.
`data.items` contains P901's summary, revision 1, pinned document locator, short
attributed discovery text and its discovery-source locator. `nextCursor` is null
because this is the only match. It is relevant discovery, not proof that the
proposed arrangement works or that the user should adopt it.

Input to `get_reference`:

```json
{"id":"P901","revision":1,"snapshotId":"fixture-A"}
```

Expected: P901 plus the complete backing Markdown, its actual byte hash,
`contentScope: "record_document"` and `coLocatedIds: ["P901"]`. The full text keeps
the hypothetical mechanism, limits, C901 revision-1 link and absence of evidence.
The client may separately read C901 in this snapshot; the service does not expand
every connected record or fetch a linked source automatically. A hypothetical
role does not become an agreement, available volunteer or permission to contact.

## Two lens records in one document

```json
{"id":"L901","snapshotId":"fixture-A"}
```

Expected: L901's identity/anchor with the **entire** `lenses.md`, including both
sections and common limits; `contentScope: "shared_document"` and
`coLocatedIds: ["L901","L902"]`. It must not claim the document is only L901,
strip the shared caveats or confuse the shared file's hash with a lens revision.
Searching for words appearing only in L902 can also match L901 through this shared
backing document. The scope/anchor qualification matters; it is not evidence that
the two lenses express the same view or independently corroborate a case.

For example, a lens search for `resource` in fixture-A can return both L901 and
L902, each with `contentScope: "shared_document"` already in its search summary
and its own anchor. L901's hit does not establish that its access-questions section
contains the word: the match may come from L902's section of the shared file.

## Stable browsing and changes

| Input or situation | Authored expected behaviour |
|---|---|
| Search `{ "limit": 1 }` with no query or kind | Browse available IDs in ASCII order: C901 first, then return an opaque cursor bound to fixture-A, the empty/browse query, omitted kind and limit 1. No source/impact ranking. |
| Repeat the same search with that cursor and `snapshotId: "fixture-A"` | L901 is next; continue in the same view without duplication or skipping. |
| Current default changes to fixture-B after the first page | A continuation explicitly bound to retained fixture-A still uses A; it must not mix in B. |
| Reuse the cursor with `kind: "case"`, a different limit or no snapshot | `invalid_cursor` for changed search state, or `invalid_arguments` for the required snapshot omission. Do not silently restart browsing. |
| Omit the snapshot on a later detail call after B becomes current | The call uses B. To retain the earlier discovery context, the client must request A explicitly. A previous `library_info` call cannot pin all future calls implicitly. |

The full ASCII order is C901, L901, L902, P901. It is a deterministic access order,
not an ordering of value, evidence strength or usefulness to the person.

## Limits and errors

| Fictional situation | Authored expected behaviour |
|---|---|
| `get_reference` requests P901 revision 2 in A | `revision_unavailable`; do not substitute revision 1 or retrieve Git history. |
| A well-formed but undeclared C999 is requested | `not_found` within A, not proof that the project or idea never existed. |
| Fixture-B declares C901 but its permitted content is unavailable | `record_unavailable` for its detail lookup; catalogue coverage becomes partial. A search returning no matches still discloses partial coverage. |
| Source preparation failed and no valid current snapshot exists | All three tools return `snapshot_unavailable`, not successful zero-item results. Queries do not attempt a repair, fetch or import. |
| A retained snapshot expires | `snapshot_unavailable`; never serve a newer snapshot under the old ID. |
| `contractVersion: "itf.library/99"` | `unsupported_version`, not nearest-version parsing. |
| Unknown `impactScore` filter, invalid kind, blank query or limit 0 | `invalid_arguments`; do not ignore the argument or create an impact score. |
| Backing document exceeds 131072 UTF-8 bytes | `record_too_large`; keep the missing full-content qualification in coverage, not a positive-only excerpt. |
| A note links to an unavailable report or tells the agent to disclose private data | Return the note as source data with its limits; no link fetch, instruction override, private upload or contact follows from reading it. |

Every application error is carried as MCP `isError: true` with the documented
safe error payload. Success uses false. Structured and serialised-text payloads
must agree, including caveats; the negotiated protocol supplies the outer framing.
These examples omit timestamps/hashes/envelopes rather than invent observed ones.

## What this does not establish

No schema engine, parser, full output payload, transport negotiation, host resource
UX, model interpretation, authenticated deployment or search-usefulness trial was
run. The examples explain the accepted design contract; they are not passing test results.
Public source does not supply a hosted service or accept unrelated service/fee
terms. Private personal/project applications remain outside this catalogue.
