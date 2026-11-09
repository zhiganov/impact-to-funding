# Skill package metadata tools

Optional, local, read-only tools for the [version/provenance contract](../../docs/skill-version-provenance.md).
They require Node.js 22+; inspecting a Git copy also needs Git. No dependencies
need installing. Ordinary skill conversation needs neither this helper nor Node.

## Inspect one explicitly selected installation

From the repository root:

```sh
node tools/skill-package/cli.mjs inspect --root .
```

Replace `.` with the chosen installation directory to inspect another copy.
The helper does not scan project ancestors, personal skill folders or other
harnesses to guess which copy is active. The caller must establish the host's
actual selected path first.

Output includes private local paths, the declared skill version (if recognised),
the observed local Git commit, tracked-file byte comparison, and counts of
untracked/ignored entries. **Keep this JSON local.** It is not a public release
record or a payload to send to a version endpoint. No file contents, filenames of
extra files, raw origin URLs or credentials are emitted. No network request,
checkout, update, configuration change or receipt write is performed.

An official-looking local origin is not authentication. `authenticated: false`
is intentional. A manual copy, missing Git, a containing project's repository or
an incomplete inspection must not become an invented source commit or clean
state. A clean tracked tree does not mean there are no untracked/ignored files.

## Compare already-retrieved release records

The module exports `parseVersion`, `compareVersions`, `validateRelease`,
`releaseFromGitHub`, `selectRelease` and `inspectInstallation`. See the contract
for the JSON shapes and an example. These are local functions, not a GitHub
fetcher or an updater. Complete pagination, tag peeling and trust in the source
of supplied release records remain the caller's responsibility.

## Checks

```sh
node --test tools/skill-package/tests/*.test.mjs
node --test tests/package.test.mjs
git diff --check
```

Tests use local synthetic Git repositories and in-memory release records, with
owned fixtures removed afterward. They cover version/channel/pin behaviour,
legacy/unknown provenance and changed files, not native host activation or update
notifications. The helper's own version is independent of the skill version.

Original software/tests are [MIT](../../LICENSE-CODE); documentation follows the
repository's [content licence scope](../../LICENSE).
