# Claude Code plugin check

**Date:** 2026-11-19. **Status:** the plugin build, `claude plugin validate`, and a
real install in an isolated config folder passed for the optional Claude Code
plugin ([#106](https://github.com/zhiganov/impact-to-funding/issues/106)). The
plugin is not published; the archive distribution starts with the next release
that carries the zip.

## Build

- `node tools/claude-plugin/build.mjs --commit 9a7f104e18596f2c6d29151ab26f104bbad1cec8 --output outputs/claude-plugin --verify-deterministic`
  on Node 26.13.1, macOS arm64, on a clean checkout.
- 1059 files: the skill tree, the linked examples, tool guides and
  `mcp/README.md`, the linked licence files, the release-prepared library
  runtime (its own provenance and probe embedded), and a generated
  `itf.library-runtime`-shaped provenance over every file.
- The runtime check passed inside the plugin layout: the three library tools,
  one search-and-read round trip, source-bound to `9a7f104`, snapshot
  `sha256:f61793bb4665ae253b203237d0db7b5f22dc824d85474a320c9a5db577503fcb`.
- Two full builds from the same commit matched, including `provenance.json`.
- `tools/skill-package` and `tests/` package checks: 113/113 and 18/18.
- New plugin-build tests: **8/8** with fictional local source repositories and a
  simulated runtime build; no network, no npm.

## `claude plugin validate`

Claude Code **2.1.296**, macOS arm64. `Validation passed` with no warnings for
the built folder (the manifest carries the skill's description, version 0.5.0
and author; `skills: "."`; one inline `itf_library` server).

## Real install in an isolated config

An isolated `CLAUDE_CONFIG_DIR` and a local marketplace
(`directory` source, the built folder as a relative-path plugin entry), so no
existing configuration was touched. Host: Claude Code **2.1.296**, Node
26.13.1.

- **Install:** `itf@itf-local-check` installed at user scope, enabled, version
  0.5.0. Component inventory: one skill (`impact-to-funding`, so
  `/itf:impact-to-funding`), one MCP server (`itf_library`), always-on token
  cost ~140.
- **Server:** `claude mcp list` showed `plugin:itf:itf_library` **Connected**,
  launched from the plugin folder.
- **Round trip:** the three library tools answered from the installed plugin
  paths, returning source commit `9a7f104` and the snapshot above.
- **One owner per project (#122):** with the plugin enabled,
  `itf setup --harness claude --scope local` refused and named
  `itf@itf-local-check`. With the plugin disabled, the same command produced a
  normal preview plan (`pluginCheck: "none-found"`, applied: false, nothing
  written — `.claude.json` shows no `itf_library` entry).
- **Missing Node:** with `node` off `PATH`, `claude mcp list` reported
  `itf_library` as **Failed to connect (ENOENT)** — visible, not silent. The
  skill's files are unaffected; a model conversation was not run.
- **Disable, then uninstall:** disable cleared the server (`No MCP servers
  configured`); uninstall left the plugin list empty; the marketplace removal
  and isolated config were cleaned up. The config file kept only its
  first-run fields.
- **Auto-update, observed:** the isolated `settings.json` recorded no
  auto-update key — only `enabledPlugins` and `extraKnownMarketplaces`. The
  plugin updates only when the user runs the update command.

## Limits

No zip was attached to any GitHub release, and no `.claude-plugin/marketplace.json`
exists yet in the repository: the archive distribution starts with the next
release, through the release-notes steps. `claude plugin validate`'s MCP-entry
checks need Claude Code 2.1.281 or later; the host checks above ran on 2.1.296.
No model conversation, marketplace publication, shared-listing submission,
Codex or Cursor variant, or usefulness trial was run.
