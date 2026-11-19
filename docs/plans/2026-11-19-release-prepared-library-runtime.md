# Plan: a release-prepared library runtime

**Issue:** #106 (prerequisite for a Claude Code plugin). **Written:** 2026-11-19 against
`main` at `77da622`. **For:** an implementing agent. Open one pull request, per `AGENTS.md`.

## Goal

Add a maintainer build step that turns one ItF release commit into a self-contained
library runtime folder. The folder runs the reference-library MCP with `node` alone:
no Git history, no `npm install`, no network.

A Claude Code plugin needs this because an installed plugin has no Git history and
doesn't install dependencies. `itf setup` today prepares the same runtime on the
user's machine by cloning the source, running `npm ci` and reading Git blobs
(`tools/skill-package/lib/setup-runtime.mjs`).

## What the runtime needs (measured at `77da622`)

- `mcp/server.mjs`, `mcp/library.mjs`, `mcp/schemas.mjs`.
- Three production packages from `mcp/package-lock.json`:
  `@modelcontextprotocol/server` 2.4.0 and `@modelcontextprotocol/core` 2.4.0
  (Apache-2.0), and `zod` 4.6.7 (MIT). `@modelcontextprotocol/client` and `ajv` are
  dev-only.
- A snapshot JSON from `node mcp/prepare.mjs --revision <commit> --output <file>`. It
  reads committed blobs listed in `mcp/mapping.json`, so it must run in a Git checkout.
- Node 22 or later.

## Output

A folder, `outputs/library-runtime/` by default (already gitignored):

```
library-runtime/
  server/            server.mjs, library.mjs, schemas.mjs (copied unchanged)
  node_modules/      the three production packages, with their LICENSE and NOTICE files
  library-snapshot.json
  provenance.json
  THIRD_PARTY_LICENSES.md
```

`provenance.json` records: the source commit and release tag, skill and server
versions, the snapshot ID, each dependency's name, version and lockfile `integrity`,
the SHA-256 of every file in the folder, and the Node version used to build.
Reuse the field names in `docs/skill-version-provenance.md` where they fit.

The server must run as
`node library-runtime/server/server.mjs --snapshot library-runtime/library-snapshot.json`.
If `server.mjs` resolves packages relative to `mcp/`, keep the layout that makes Node's
module resolution find `node_modules/` without changing the server code. Change the
server only if there is no such layout, and say why in the PR.

## Steps

1. Add `tools/library-runtime/build.mjs` with `--commit <full sha> --output <empty dir>`.
   Refuse a dirty tree, a commit that isn't on `main` or a tag, and a non-empty output.
2. Prepare in a temporary clean clone at that commit, reusing `prepareFromGitHub`,
   the lockfile checks and the `npm ci --ignore-scripts` call from
   `setup-runtime.mjs`, with `--omit=dev`. Move shared code into a small module
   rather than copying it.
3. Run `prepare.mjs` in that clone to write the snapshot.
4. Copy the server files and production `node_modules/` into the output. Write
   `THIRD_PARTY_LICENSES.md` from each package's licence text, and keep Apache-2.0
   `NOTICE` files where present.
5. Write `provenance.json`, then verify the folder: start the server from the output
   with a copy of `probeRuntime` (the client package stays a build-time dependency),
   and check the three tools and one search-and-read round trip against the source
   commit.
6. Build twice from the same commit and compare the file hashes. Report any file that
   differs, and fix it or explain it in the PR.
7. Tests in `tools/library-runtime/tests/` with a fictional local source repo, like the
   existing setup tests: refusal cases, the provenance contents, a runtime that runs
   with no `node_modules` above it, and missing Node 22.
8. Docs: a short `tools/library-runtime/README.md`, and one line in
   `.agents/skills/itf-release-notes/SKILL.md` saying when to build it.

## Decisions for Artem

- **Where the built folder is published.** Leave this to the plugin plan. Options: a
  generated branch, a separate distribution repo, or a folder committed at release time.
  A Claude Code plugin installs from a Git source, so a release asset alone may not be
  enough. Confirm against current Claude Code plugin docs before choosing.
- **Whether `itf setup` should later use the prepared runtime** instead of building on
  the user's machine. It would remove the `npm ci` step and could help Windows support.
  Out of scope here.

## Checks before the PR

- The new tests, `node --test tests/*.test.mjs` and `tools/skill-package` tests.
- One real build from the current `main` commit, run with Node 22, with its
  `provenance.json` summary in the PR.

## Limits

No plugin manifest, marketplace entry, publication or host check. No change to
`itf setup` or the server's behaviour.
