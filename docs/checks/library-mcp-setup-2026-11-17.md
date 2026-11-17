# Library setup implementation checks

**Date:** 2026-11-17. **Status:** local/SDK and native OpenCode connection checks
passed for the OpenCode project-scope implementation in
[PR #117](https://github.com/zhiganov/impact-to-funding/pull/117).

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

## Initial native-host checks: failed before activation

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

The native route stopped there. Reading the config and passing the SDK check
did not establish that OpenCode exposed the server or its tools. The subsequent
bounded recovery below supersedes that unresolved native status.

The owned native server exited with code 0, its process was verified exited,
and the restored test config was removed. Normal user configuration and other
services were unchanged.

## Bounded recovery: native connection passed

One separately approved recovery reused the same runtime and byte-identical
setup-generated config. No product code, dependencies, fixture framework or
global configuration changed.

Source inspection identified the missing lifecycle boundary. The built-in
`opencode.config.mcp` plugin populates the registry. Configuration loading and
location reload can complete before plugin activation; registry reads and
explicit connect do not await activation. The existing provider-list handler
awaits the plugin-activation latch before returning inventory.

The corrected native sequence used the same isolated stdio-owned server:
read config → reload location → `GET /api/provider` to await activation →
explicit connect → read MCP registry. All operations succeeded. The registry
reported `itf_setup_trial` as `connected`; the retained native logs reported
three discovered tools. The earlier SDK round trip remains the evidence for
coverage, search and exact-reference reads; it was not repeated.

The implementation checked was
`06a087017dc8b91b53d23632615db1ea59cf81f6`, with the runtime/snapshot pins above.
OpenCode remained `2.3.0`. The native server exited with code 0, its process exit
was verified, and the test config was removed.

The previous 404 was therefore an observation before the required activation
boundary, not evidence that the emitted registration was defective. This
recovery establishes the native connection and tool discovery, not host-agent
execution of library queries or model behaviour.

## Sources and limits

- [OpenCode V2 MCP configuration](https://opencode.ai/docs/mcp-servers)
- [OpenCode V2 API](https://opencode.ai/docs/api)
- [CLI list handler](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/cli/src/commands/handlers/mcp/list.ts)
- [MCP registry implementation](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/core/src/mcp/index.ts)
- [MCP configuration plugin](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/core/src/config/plugin/mcp.ts)
- [Provider inventory activation boundary](https://github.com/anomalyco/opencode/blob/34d93d4cd54e604bfdf898c8a6aafad9271728ab/packages/server/src/handlers/provider.ts)

The upstream source inspection is not proof that every byte matches the
installed binary. Native connection was observed as described above. These
results establish no model behaviour, human usefulness, hosted service or
integration with FtI or OpenHaven.
