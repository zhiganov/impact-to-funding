# Plan: an optional Claude Code plugin for ItF

**Issue:** #106. **Written:** 2026-11-19 against `main` at `8020c3a`.
**Depends on:** [the release-prepared library runtime](2026-11-19-release-prepared-library-runtime.md).
Start this only after that build is merged. **For:** an implementing agent. Open one
pull request, per `AGENTS.md`.

## Goal

Offer Claude Code users one optional install that brings the ItF skill and the local
reference-library MCP together. The plain skill folder, the managed CLI and `itf setup`
stay supported and stay the default in the docs.

## Claude Code facts this plan relies on

From the current Claude Code docs (plugins reference and "Create a marketplace"),
read 2026-11-19. Recheck them before building.

- `.claude-plugin/plugin.json` holds the manifest; `name` is its only required key.
- `skills` takes directories to scan; `"."` names the plugin root, so a root
  `SKILL.md` works without a `skills/` copy.
- `mcpServers` accepts inline server configs, and `${CLAUDE_PLUGIN_ROOT}` resolves in
  their `command` and `args`.
- Component paths must stay inside the plugin directory; `..` fails
  `claude plugin validate`.
- `engines.claude-code` needs Claude Code 2.1.323 or later, and older versions reject
  the manifest with that key. Leave it out unless a feature needs it.
- A marketplace (`.claude-plugin/marketplace.json`) can list a plugin from a relative
  path, `github`, `git-subdir`, a git `url`, an `archive` (a zip over HTTPS) or `npm`.
  Git sources can be pinned to a ref or SHA.
- Plugins are namespaced: the skill appears as `/itf:impact-to-funding` if the plugin
  is named `itf`. A standalone `/impact-to-funding` copy can exist alongside it.

## Package contents

A build step, `tools/claude-plugin/build.mjs --commit <sha> --output <empty dir>`,
assembles a self-contained folder:

```
itf-plugin/
  .claude-plugin/plugin.json
  SKILL.md, playbooks/, references/, assets/
  examples/, and the tool READMEs the skill links to
  library-runtime/        output of the runtime build
  LICENSE, PRIVACY.md, SOURCES.md, provenance.json
```

- Include every file the skill's runtime files link to, so all relative links resolve
  inside the plugin. Today that means `examples/`, `mcp/README.md` and the READMEs of
  `tools/github-sponsorship`, `tools/impact-badge`, `tools/readability` and
  `tools/support-profile`. Since #126 the skill links nothing in `docs/`, so `docs/`
  stays out.
- Leave out `tools/skill-package/`. A plugin copy has no manager receipt, so the update
  notice can't run; `references/update-notice.md` already says to skip it silently.
  Plugin updates come from Claude Code's plugin manager.
- `plugin.json`: `name: "itf"`, `version` equal to the skill's `metadata.version`,
  `skills: "."`, and one inline server `itf_library` running
  `node ${CLAUDE_PLUGIN_ROOT}/library-runtime/server/server.mjs --snapshot
  ${CLAUDE_PLUGIN_ROOT}/library-runtime/library-snapshot.json`.
- `provenance.json` records the source commit, the runtime build's provenance and the
  SHA-256 of every file, as the runtime build does.

## Distribution: decided 2026-11-19

**Decision: an `archive` source** (approved by Artem on 2026-11-19). Attach the built zip to each GitHub release, and
list it in a `.claude-plugin/marketplace.json` in this repo that points at that
release's zip URL. Built files stay out of Git, each version is a fixed download, and
a person gets a new version only when the marketplace entry changes and they update.

Not chosen: a `git-subdir` source pinned to a SHA, which means committing the built
runtime (including `node_modules`) to Git; or a separate distribution repo.

A `marketplace.json` in this repo is self-hosted. Listing ItF in any shared or official
marketplace still needs separate approval, as #106 says.

## Steps

1. Build step and tests: link closure (every relative link resolves inside the
   package), no `..` paths, manifest fields, server paths, file hashes, two builds
   matching.
2. `claude plugin validate` on the built folder.
3. Real-host check in an isolated config folder (`CLAUDE_CONFIG_DIR`), with a local
   marketplace pointing at the built folder. Record in
   `docs/checks/claude-plugin-<date>.md`:
   - install; `/itf:impact-to-funding` is listed;
   - `claude mcp list` shows `itf_library` connected; one `library_info`, search and
     read round trip returns the release's source commit;
   - with a standalone copy and an `itf setup` entry present: both skills listed, and
     `itf setup` stops because the plugin provides the library (#122);
   - with `node` older than 22 or missing: ordinary skill use still works, and the
     server's failure is visible, not silent;
   - disable, then uninstall: the skill and server are gone, and nothing else changed;
   - the effective auto-update setting for the marketplace, recorded as observed.
4. `docs/install.md`: add the plugin as one option after the existing routes, with its
   update behaviour, the Node 22 requirement and how to remove it.
5. Add the zip build, its upload to the GitHub release and the `marketplace.json`
   update to the release-notes skill's steps, after the tag exists.

## Limits

No shared or official marketplace listing. No Codex or Cursor plugin. No change to the
plain skill folder, the managed CLI or `itf setup`. Model behaviour and usefulness stay
unverified unless separately checked.
