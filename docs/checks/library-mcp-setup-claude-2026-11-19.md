# Library setup checks: Claude Code local scope

**Date:** 2026-11-19. **Status:** tests, a real setup, a native Claude Code
connection check and undo passed for the Claude Code local-scope adapter
([#105](https://github.com/zhiganov/impact-to-funding/issues/105)).

The adapter registers the local library MCP for one project at Claude Code's
local scope. It writes through the Claude Code CLI and never copies or rewrites
Claude Code's config file. It doesn't install the conversational skill.

## Tests

- `npm test` in `tools/skill-package`: **110/110** passed, Node 22.23.4, Linux.
  This includes the existing OpenCode setup tests, unchanged.
- The 8 new tests in `tests/setup-claude.test.mjs` use a stand-in for the Claude
  Code CLI. They cover:
  - a preview that writes nothing and calls nothing;
  - preparation and the SDK check before any registration;
  - a write that changes only the setup-owned entry, leaving account data, user
    servers, other projects and other servers unchanged;
  - a receipt that contains none of the config file's other values;
  - read-only repeat apply and `--check`;
  - undo that removes only the owned entry and keeps the runtime;
  - refusal of names owned in local scope, user scope or the shared `.mcp.json`;
  - a conflicting entry appearing during preparation;
  - a CLI that records an unexpected entry, and undo refusing a changed entry;
  - malformed config and unsupported scopes.
- Package checks at the repository root: 16/16 passed.

## Real setup and native connection

Run in a disposable project and an isolated Claude Code config folder
(`CLAUDE_CONFIG_DIR`), so no existing configuration was touched.

- **Host:** Claude Code 2.1.328, Node 22.23.4, Linux.
- **Runtime source:** `986f4aa9bc18a0089505b20c194077f242bc5f23` (skill
  version 0.5.0, library server 0.1.0).
- **Preview:** listed the config file, the private state folder and the four
  preparation steps. It reported no file backup and the CLI write.
- **Apply:** cloned the source, installed the locked MCP dependencies with
  scripts disabled, prepared snapshot
  `sha256:d2724c7168d133aca7267fd57125f9e76913f173cf67eb0e3c8185cb3d3bd3c5`,
  and passed the SDK check: exactly `get_reference`, `library_info` and
  `search_references`, with `library_info`, a search and one exact read.
- **Native connection:** `claude mcp get itf_library` reported
  `Scope: Local config (private to you in this project)` and `Status: Connected`.
  `claude mcp list` reported the server as connected after its health check.
- **`--check`:** passed, read-only.
- **Undo:** removed the entry. Claude Code then reported no server with that
  name. All other top-level keys of the config file were unchanged.
- The test's private state was deleted afterwards.

## Limits

The native check shows Claude Code can start and connect to the server. It
doesn't run a model or show the tools being used in a conversation. Only one
host version and one platform were checked. The real run used an isolated
`CLAUDE_CONFIG_DIR`; the default `~/.claude.json` location is covered by tests
only. A review before merging found and fixed one defect: setup had set
`CLAUDE_CONFIG_DIR` even when it wasn't selected, which would have moved Claude
Code's other files during that call. Codex, Claude Code's user and
project scopes, and Windows remain unimplemented.
