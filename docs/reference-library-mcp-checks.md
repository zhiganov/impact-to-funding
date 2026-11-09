# Local reference-library MCP checks — 2026-11-09

## Scope and result

The optional [stdio implementation](../mcp/README.md) was exercised with the
official MCP TypeScript SDK client **2.4.0**, server **2.4.0**, Ajv **8.17.1** and
Node.js **v22.18.0**. The lockfile pins the dependency graph; normal installation
with `npm ci --ignore-scripts --prefix mcp` completed successfully.

The application tests passed **25/25**, using entirely fictional in-memory notes.
Two preparation regressions passed **2/2** for exact commit identity.
The ordinary-client integration test passed **1/1**, executing the separate
preparation command and the actual stdio server command from outside the checkout.
It used deliberately included public notes, not private applications or source
papers. The initial module-load failure was an incorrect runtime-error import
from the SDK's core package. Imports were corrected against the installed
client/server package exports before the successful client run; no earlier
failed result is counted as a round-trip pass.

Source review subsequently found that the preparation check could peel an
annotated-tag object while retaining its hash as a commit identity. Preparation
now requires the supplied object itself to be a commit. Direct producer tests
reject an isolated annotated-tag object and confirm the canonical commit still
produces exactly the same nine-record snapshot identifier below. This
producer-only repair changed neither the server/query/framing code nor the served
snapshot; it was checked directly, not presented as another client round trip.

## Supplied public snapshot

- Source repository: `https://github.com/zhiganov/impact-to-funding`.
- Source commit: `7b36169f00b8d6185d16629b7784ac17ce7ea346`.
- Mapping revision: `itf.library.mapping/1`.
- Snapshot: `sha256:53cf94cbc6ecf1740ba683e6f4376b4e8a9701015e9463091dc2c0d63e8442e3`.
- Inventory: nine declared/available records in eight note files; five cases,
  two candidate patterns and two shared-file lenses. Note revisions are 1; index
  revision is 2. Catalogue completeness is not comprehensive domain coverage or
  evidence that all interventions succeeded.

The snapshot source commit identifies the records, not the implementation's Git
revision, the source papers' editions or the date of independent review. Snapshot
preparation is separate from queries and performs no network fetch.

## Observed protocol and application behaviour

| Check | Observed result |
|---|---|
| Legacy SDK negotiation | MCP `2025-11-25`; ordinary legacy result envelope. |
| Pinned modern negotiation | MCP `2026-07-28`; actual wire `resultType: "complete"` verified. |
| Tool discovery | Exactly three tools, object input schemas, success/error output schemas. |
| Result validation | Actual structured payloads validated against advertised schemas; the text block serialised the same full JSON. |
| Read-only calls | `library_info`, literal search, pagination and exact-revision detail returned their declared shapes and actual snapshot identity. |
| Content preservation | C001 and both shared lenses matched committed UTF-8 bytes/hashes; lens detail retained the whole document, anchors and both IDs. |
| Application failures | Invalid/unknown arguments, unsupported contract, absent ID/revision/snapshot and cursor mismatch remained distinct errors with `isError: true`. |
| Protocol failures | Unknown tools and malformed requests returned protocol errors, not empty library successes. |
| Missing/malformed artifacts | All three tools returned `snapshot_unavailable` in both eras. Diagnostics contained no local path, query or raw parser/read exception. |
| Shutdown | All six normal server subprocesses were closed and verified absent by PID; test-owned temporary files were removed. SDK probe-sibling disposal follows the inspected SDK teardown, not separate test PID assertions. |

The fictional application tests additionally covered Unicode NFKC/lowercase
normalisation, literal all-token/full-document matching (including linked
filenames), ASCII-ID ordering, default/explicit pagination limits, no snapshot
mixing, unknown/null arguments, exact byte bounds, partial/malformed membership,
invalid UTF-8, BOM/CRLF preservation, unavailable records, immutable caller state
and artifact tamper detection. These are contract checks, not impact findings.

## Limits

No OpenCode MCP configuration, interactive TUI, model-driven tool selection,
human usefulness, browser, hosted endpoint or funding-service integration was
tested or changed. The OpenCode skill-installation checks are separate evidence
about a different entrypoint. No authentication, account enrolment, live source
retrieval, private-data ingestion or package-registry release was performed.
Local process compatibility is not certification for every MCP client or evidence
of reliable model behaviour, source validity, fundraising effectiveness or impact.

Reproduce the checks with the commands in the [MCP guide](../mcp/README.md#checks-and-compatibility).
This record is implementation evidence; the
[fictional design walkthrough](../examples/reference-library-mcp-walkthrough.md)
remains authored expected behaviour, not an observed server transcript.
