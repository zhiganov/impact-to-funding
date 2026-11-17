# Library setup implementation checks

**Date:** 2026-11-17. **Status:** local implementation candidate; native OpenCode
acceptance remains open in [#105](https://github.com/zhiganov/impact-to-funding/issues/105).

The CLI adds a POSIX/OpenCode V2 project adapter, source-pinned runtime and
snapshot preparation, preview/apply, private backups, and selective undo.
It does not install the conversational skill. The helper version is `0.4.0`;
the skill and library server keep their own versions.

## Passed

- `npm test`: **157/157**, Node `26.13.1`, npm `11.20.0`, macOS arm64.
- Focused setup and JSONC tests cover no-write previews, preparation failure,
  config conflicts, inherited registrations, byte-exact backups, selective undo,
  changed snapshots/backups, pending receipts, stopped/live locks, changes during
  preparation or undo, saved Node executable identity, BOM/CRLF, comments,
  duplicate keys, malformed input and bounds.
- Independent code review identified four defects: an unguarded undo deletion,
  stale-lock recovery, Node-path-dependent receipt validation, and BOM removal.
  All four were repaired, covered by regressions and rechecked read-only.
- A disposable normal CLI apply cloned a selected local Git source, installed
  locked MCP dependencies with scripts disabled, prepared the public snapshot
  and completed the SDK stdio check.
- That SDK check listed exactly `library_info`, `search_references` and
  `get_reference`, then inspected coverage, searched and retrieved one
  source/snapshot-bound reference. The configured server was version `0.1.0`.
- The normal CLI undo removed the newly created test config. Private runtime
  artifacts were retained for inspection.

The runtime source was
`153ca8c48f2f56cf6f41af8caf3847714c568c26`. Its prepared snapshot was
`sha256:b49206f98ce2344302c2e4ab90dcadb4f08fa45205ae8036e2d6b43fde34a4ee`.
This is public library content, not user evidence or a fresh source review.

## Native-host gate: not passed

OpenCode reported `v2.3.0`. The checks used isolated home/config/data/cache
directories and no model calls.

The first invocation stopped at preflight because the worker terminal's PATH
did not contain the existing OpenCode executable. Supplying that installed
executable's directory fixed the invocation without installing software.

The subsequent normal apply and SDK check passed. A cold
`opencode --standalone mcp list` returned `No MCP servers configured`.
Upstream source shows that this command reads the current registry without a
startup-readiness wait, so that response alone does not prove config absence.

One bounded native recheck reused the prepared runtime and the byte-identical
config produced by setup. It started an isolated native server through its
stdio ownership lease. The native config endpoint returned the generated
`mcp.servers` entry. After the documented location-reload boundary, the explicit
connect endpoint returned HTTP 404 / `McpServerNotFoundError` for that name.

The native route stopped there. The cause is unresolved. Reading the config and
passing the SDK check do not establish that OpenCode exposes the server or its
tools. No additional fixture, retry runner or alternate host was introduced.

The owned native server exited with code 0, its process was verified exited,
and the restored test config was removed. Normal user configuration and other
services were unchanged.

## Sources and limits

- [OpenCode V2 MCP configuration](https://opencode.ai/docs/mcp-servers)
- [OpenCode V2 API](https://opencode.ai/docs/api)
- [CLI list handler](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/cli/src/commands/handlers/mcp/list.ts)
- [MCP registry implementation](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/core/src/mcp/index.ts)

The upstream source inspection is not proof that every byte matches the
installed binary. Native checks remain incomplete. These results establish no
model behaviour, human usefulness, hosted service or integration with FtI or
OpenHaven.
