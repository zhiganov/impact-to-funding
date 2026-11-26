# Claude Code plugin build

A maintainer build step for the ItF repository. It turns one release commit into
a self-contained Claude Code plugin folder: the skill, its linked examples and
tool guides, and the release-prepared library runtime, with a generated
`plugin.json` and `provenance.json`.

## Build

Requires Node 22 or later and a clean checkout, with the target commit fetched:

```sh
node tools/claude-plugin/build.mjs --commit FULL_SHA [--output EMPTY_DIR] [--source LOCAL_CHECKOUT] [--verify-deterministic]
```

The default output is `outputs/claude-plugin/`. The build refuses a dirty source
checkout, a commit that is neither on `main` nor tagged, and a non-empty
output. It also refuses a source commit whose runtime files still link into
`docs/`: the plugin ships `SKILL.md`, `playbooks/`, `references/`, `assets/`,
the linked `examples/`, the linked tool READMEs and `mcp/README.md`, and never
`docs/` or `tools/skill-package/`. Nothing reaches the output until the whole
build, including the runtime's own probe, has passed.

The build runs the [library-runtime build](../library-runtime/README.md) for
the same commit, so its prerequisites apply. The plugin folder holds:

```
claude-plugin/
  .claude-plugin/plugin.json     name "itf", the skill's version, skills ".",
                                 one inline itf_library server over the bundled runtime
  SKILL.md, playbooks/, references/, assets/
  examples/ and the linked tool READMEs and mcp/README.md
  library-runtime/               the release-prepared runtime, node-alone
  LICENSE, PRIVACY.md, SOURCES.md
  provenance.json                source commit, tag, embedded runtime provenance,
                                 SHA-256 of every file except itself
```

`provenance.json` (`itf.claude-plugin/0.1`) embeds the library runtime's own
provenance and check, and follows the field names of
`docs/skill-version-provenance.md`.

## Validate and check

Validate the built folder with Claude Code 2.1.281 or later:

```sh
claude plugin validate outputs/claude-plugin
```

For a real-host check, use an isolated `CLAUDE_CONFIG_DIR` and a local
marketplace whose entry lists the built folder as a relative-path source. The
recorded check lives in `docs/checks/`.

## Release distribution

The decided route (see the
[plugin plan](../../docs/plans/2026-11-19-claude-code-plugin.md)) is an
`archive` source: zip the built folder, attach the zip to the GitHub release,
and point `.claude-plugin/marketplace.json` in this repository (marketplace name
`impact-to-funding`) at that release's zip URL with its SHA-256. The **Release plugin** workflow
(`.github/workflows/release-plugin.yml`) does this when a release is published,
and opens the marketplace pull request. Built files stay out of Git.

`zip.mjs` makes the archive reproducible: entries under `itf/`, sorted, with one
fixed date and mode 0644, using only Node's built-in zlib:

```sh
node tools/claude-plugin/zip.mjs outputs/claude-plugin/itf itf-claude-plugin-vX.Y.Z.zip --date YYYY-MM-DD
```

```sh
npm test
```

Tests use fictional local source repositories and a simulated runtime build. No
network, no npm.

## Limits

The build prepares the plugin; it does not publish it. Listing ItF in any
shared or official marketplace needs separate approval. No Codex or Cursor
plugin. The plain skill folder, the managed CLI and `itf setup` stay supported.
Original code/tests are MIT; the bundled skill content keeps its own licence
(see `LICENSE` and `SOURCES.md`).
