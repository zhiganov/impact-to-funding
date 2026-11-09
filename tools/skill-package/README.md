# Skill package tools

Optional Node.js 22+ and Git tooling for the [version/provenance contract](../../docs/skill-version-provenance.md)
and [managed installation/update/rollback](../../docs/managed-skill-updates.md).
There are no package dependencies; ordinary conversation needs neither this
helper nor Node. No hooks, global configuration, telemetry or model call is run.
An optional [in-skill notice](../../docs/update-notices.md) requires per-copy
consent and host tool/network permissions; user-visible delivery is unverified.

## Managed CLI

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf --help
```

This obtains the experimental CLI from the mutable GitHub default branch; pin a
reviewed full CLI commit instead of `main` for reproducibility. It is not the older
`v0.2.0` skill release, and no npm registry publication is required. From a trusted
complete checkout, use `node tools/skill-package/itf.mjs ...` instead.

`install`, `check`, `update`, `adopt`, `rollback`, `recover` and `notice` require an explicit
harness and project/personal scope. Changes require `--apply`; `check` never
writes. Read the [managed guide](../../docs/managed-skill-updates.md) for source
pins, duplicates, private receipts/backups, failure recovery and limitations.

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
extra files, raw origin URLs or credentials are emitted. This inspector makes no
network request, checkout, update, configuration change or receipt write.

An official-looking local origin is not authentication. `authenticated: false`
is intentional. A manual copy, missing Git, a containing project's repository or
an incomplete inspection must not become an invented source commit or clean
state. A clean tracked tree does not mean there are no untracked/ignored files.

## Compare already-retrieved release records

The #54 exports `parseVersion`, `compareVersions`, `validateRelease`,
`releaseFromGitHub`, `selectRelease` and `inspectInstallation`. See the contract
for the JSON shapes and an example. These are local functions, not a GitHub
fetcher or an updater. Complete pagination, tag peeling and trust in the source
of supplied release records remain the caller's responsibility. The separate
`githubCatalogue` adapter retrieves public release records; `createManager().run`
provides the explicit managed lifecycle. The optional notice path invokes their
read-only comparison during skill use only after per-copy opt-in and subject to
host permissions.

## Checks

```sh
node --test tools/skill-package/tests/*.test.mjs
node --test tests/package.test.mjs
git diff --check
```

Tests use local synthetic Git repositories, mock HTTP records and disposable
project/home directories, with owned fixtures removed afterward. They cover
version/channel/pin behaviour, native-folder placement, adoption, changed files,
interrupted/error recovery, rollback and simulated notice logic—not native host
activation or observed user-visible notices.
The helper's own version is independent of the skill version.

Original software/tests are [MIT](../../LICENSE-CODE); documentation follows the
repository's [content licence scope](../../LICENSE).
