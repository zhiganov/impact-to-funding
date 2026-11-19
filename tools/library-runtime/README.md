# Release-prepared library runtime

A maintainer build step for the ItF repository. It turns one release commit into a
self-contained folder that runs the reference-library MCP with `node` alone: no Git
history, no `npm install`, no network.

## Setup

Requires Node 22 or later, with the npm that ships with it. On Windows the build
runs that bundled npm directly, because Node won't start `npm.cmd` without a
shell. Run once in this directory in a trusted source copy:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

The build-time MCP client (`@modelcontextprotocol/client`) resolves from this
package. It never enters the built folder. This command may contact the package
registry; it receives no review data.

## Build

From the repository root, on a clean checkout, with the target commit fetched:

```sh
node tools/library-runtime/build.mjs --commit FULL_SHA [--output EMPTY_DIR] [--source LOCAL_CHECKOUT] [--verify-deterministic]
```

The default output is `outputs/library-runtime/`. The build refuses a dirty source
checkout, a commit that is neither on `main` nor tagged, and a non-empty output
directory. `--source` builds from a local Git checkout of the ItF repository
instead of GitHub; tests use it with fictional local repositories. Nothing is
written to the output until the whole build and its check have passed.

The output holds `server/` (the three MCP server files, copied unchanged),
`node_modules/` (the production packages only, with their licence files),
`library-snapshot.json`, `THIRD_PARTY_LICENSES.md` and `provenance.json`. The
server runs as:

```sh
node library-runtime/server/server.mjs --snapshot library-runtime/library-snapshot.json
```

Node's module resolution finds `node_modules/` at the folder root from
`server/` without any change to the server code.

## provenance.json

`itf.library-runtime/0.1` records the source commit and release tag, the skill
and server versions, the snapshot ID, each dependency's name, version, lockfile
integrity and licence, the Node version used to build, and the SHA-256 of every
file in the folder except `provenance.json` itself. Field names follow
`docs/skill-version-provenance.md`.

## Checks

Each build verifies its own output by starting the server from the folder and
running the same three-tool round trip as `itf setup`. `--verify-deterministic`
builds a second time from the same commit and fails, naming the files, if the
two builds differ. The comparison covers every file including `provenance.json`.

```sh
npm test
```

Tests use fictional local source repositories and never contact the network.

## Limits

The build prepares the runtime; it does not publish it. Where the folder is
published for a Claude Code plugin (a generated branch, a separate repository or
a committed folder) is a separate decision tracked in
[#106](https://github.com/zhiganov/impact-to-funding/issues/106). `itf setup` is
unchanged. Original code/tests are MIT; written guidance is CC BY-SA 4.0. The
bundled packages keep their own licences, recorded in `THIRD_PARTY_LICENSES.md`.
