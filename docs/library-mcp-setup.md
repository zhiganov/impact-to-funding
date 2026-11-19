# Set up the optional library MCP

`itf setup` prepares a private local library runtime and registers it in one
OpenCode V2 project, or for one project at Claude Code's local scope. It previews
every operation before changing anything.
The conversational skill still works without this setup.

**Experimental implementation.** Runtime preparation, SDK reads, undo and an
OpenCode V2.3.0 native connection check passed. Native connection was checked
using the byte-identical setup-generated config after built-in plugin activation.
No model run was performed. See the [check record](checks/library-mcp-setup-2026-11-17.md).
For Claude Code, setup, a Claude Code 2.1.328 connection check and undo passed;
see its [check record](checks/library-mcp-setup-claude-2026-11-19.md).

**Implemented targets:** macOS and Linux, Node.js 22+, npm and Git, with either
OpenCode V2.3 or later within V2 (project scope) or Claude Code 2 or later (local
scope). Windows, Codex, Claude Code's user and project scopes, and
personal/global setup are not implemented; Windows support is tracked in
[#132](https://github.com/zhiganov/impact-to-funding/issues/132).

**On Claude Code, the plugin is the simpler route.** From v0.6.0, the
[Claude Code plugin](install.md#optional-install-as-a-claude-code-plugin) bundles
the skill, the server and a prepared snapshot, and works on Windows too. Use one
or the other: setup stops while the plugin is enabled (see "One owner per
project" below).

## Preview, then apply

From the project that should use the library:

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf setup \
  --harness opencode --scope project \
  --commit 153ca8c48f2f56cf6f41af8caf3847714c568c26
```

The CLI above comes from mutable `main`. Pin a reviewed full CLI commit instead
of `main` for repeatability. The separate `--commit` pins the **library runtime
and public notes**, not the CLI. It must contain the library MCP and producer.
Use another reviewed full source commit when you deliberately want another
library version.

The preview shows the project config, server name, exact command, private runtime
and backup locations, and dependency/preparation operations. It makes no network
request and creates no files. Running `npx` itself can download the CLI.

To perform that plan, repeat the same command with `--apply`. It prints the
current plan before preparation. Local runtime directory names identify each
attempt, so they can differ from an earlier preview.

You can use `--project <directory>` from another directory. From a trusted full
checkout, the equivalent CLI is `node tools/skill-package/itf.mjs`.
`--source <local-git-checkout>` copies the selected Git commit from a local ItF
repository instead of cloning GitHub. It still downloads locked dependencies
when they are not cached. Declared Git origins and matching hashes are
provenance observations, not independent publisher authentication.

## What apply does

1. Clone the pinned source into private state outside skill-discovery folders.
2. Install its locked MCP dependencies with package scripts, audit and funding
   requests disabled. This uses the npm registry and cache, with empty private
   user/global npm configs. It installs no global software.
3. Prepare a snapshot from the pinned committed public notes.
4. Start the local server for a bounded SDK check: list its three tools, inspect
   `library_info`, search, and read one exact reference.
5. Save a private config backup and ownership receipt, then add one entry under
   `mcp.servers`. It leaves the skill and other services unchanged.

The default connection name is `itf_library`; `--name <name>` chooses another.
Existing inherited registrations and entries owned by another installer are
left alone. Setup does not migrate plugin configuration.

With no existing project config, setup creates `opencode.jsonc` with mode `0600`.
It can also edit one existing `opencode.json`, `opencode.jsonc`,
`.opencode/opencode.json`, or `.opencode/opencode.jsonc`, preserving comments
and unrelated settings. Multiple project config files, duplicate keys, linked
paths, hard-linked files and ambiguous ownership stop setup. External
`OPENCODE_CONFIG` or `OPENCODE_CONFIG_CONTENT` overrides also stop it.

The config contains machine-specific absolute paths. Inspect it before sharing
or committing it. Setup never changes ignore rules. Private state is under
`~/.local/state/impact-to-funding/library-setup/`, keyed by project and connection.
It contains source, dependencies, snapshots, backups and receipts; keep it private.

## Check what is working

```sh
itf setup --harness opencode --scope project --check
opencode mcp list
```

Use the same CLI prefix as above if `itf` is not installed on your PATH.
`--check` starts a temporary local server and performs the SDK round trip. It
does not change configuration. Its result explicitly says the **host connection
was not checked**. Host connection requires separate verification. A cold
`opencode mcp list` can read the registry before it is populated; an empty list
does not establish that the configuration is absent. OpenCode manages the
configured server's lifetime.

For an automated native check, OpenCode's read-only `GET /api/provider`
inventory endpoint awaits plugin activation. Registry/config reads and a location
reload alone do not await it. This is a diagnostic lifecycle boundary, not an
extra setup step for every conversation.

The result reports the runtime source, declared skill/server versions, snapshot
and operation checks separately. A config entry is not proof of a connection;
neither check establishes model behaviour or usefulness.

## Undo without losing later work

```sh
itf setup --harness opencode --scope project --undo
itf setup --harness opencode --scope project --undo --apply
```

Use the same `--project` and `--name` if you supplied them at setup.
Undo restores the exact original bytes when the whole config is unchanged.
For a newly created untouched config, it removes that file. If other settings
changed later, it removes only the matching setup-owned entry, preserving those
edits and comments. Empty `mcp`/`servers` containers can remain.

If the owned entry or backup changed, undo stops. A pending receipt after an
interrupted config write also uses this undo route; setup never assumes it
finished. Applied undo clears a stopped process's validated lock, including a
preparation-only interruption. It preserves locks with live or unknown owners.
Runtime-preparation failures leave the project config unchanged.
Failed attempts and completed/undone runtimes remain in private state for
inspection; a later explicit attempt uses a fresh directory. Backups and runtime
data are not automatically deleted.

## Claude Code: local scope

Claude Code's local scope is a private entry for one project, kept in Claude
Code's own config file (`~/.claude.json`, or `$CLAUDE_CONFIG_DIR/.claude.json`).
From the project:

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf setup \
  --harness claude --scope local \
  --commit <reviewed-full-commit>
```

Add `--apply` to perform the plan, and use `--check`, `--undo` and
`--undo --apply` as for OpenCode. Runtime preparation and the SDK check are the
same. The registration step differs:

- **Setup writes through the Claude Code CLI.** It runs
  `claude mcp add-json --scope local` for one entry, then reads the file back
  and checks the entry matches. Undo runs `claude mcp remove --scope local`
  only if the entry still matches what setup wrote.
- **Setup never copies or rewrites Claude Code's config file.** That file also
  holds account data, so there is no file backup. The private receipt records
  only the setup-owned entry.
- **Names owned elsewhere are refused.** Setup stops if the name already exists
  in this project's local entries, in user-scope servers, or in the project's
  shared `.mcp.json`. Claude Code itself would accept a local entry with the same
  name as a shared one, so setup checks this itself.
- **One owner per project.** Setup stops if an enabled plugin already provides
  the library here: a plugin named `itf` or `impact-to-funding`, or one that
  declares a server with the same name. Claude Code would otherwise load both,
  because it hides a plugin's server only when a manual server has the identical
  command. Setup reads `claude plugin list --json`; if that list is unavailable,
  the plan says so. Disable the plugin first, or keep it and skip setup.

To confirm Claude Code can connect, run `claude mcp get itf_library` from the
project. It should report `Connected`. That checks the connection, not model use.

User scope and the shared project `.mcp.json` aren't offered: the entry contains
absolute paths into private setup state, which suit neither.

## Limits

This registers only the local reference library. FtI discovery, OpenHaven,
accounts, service terms and hosting remain separate. Setup installs no skill,
Node.js or agent CLI, and runs no model or application.

The snapshot contains public library notes. A local MCP does not make the
agent's model processing or conversation history local. Keep queries short and
authorised; private evidence is unnecessary.

Updates are deliberate: undo the existing registration, then preview setup with
the chosen source. The skill manager and library runtime have separate ownership
and update paths. See the [library contract and checks](../mcp/README.md).
