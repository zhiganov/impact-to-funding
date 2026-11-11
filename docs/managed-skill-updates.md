# Managed skill installation and updates

The optional ItF CLI installs a complete source snapshot into a Claude Code, Codex CLI or OpenCode skills folder. It uses Git, public GitHub releases and the [version and provenance contract](skill-version-provenance.md). It isn't a registry, hosted service, plugin or background updater. It needs Node.js 22+, npm and Git. Conversation with the skill doesn't.

## Start with a plan

From the project where you want to use ItF:

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf install --harness codex --scope project --channel prerelease
```

- **Which CLI runs:** this takes the experimental CLI from GitHub's default branch, which changes over time. For a repeatable result, replace `#main` with `#<full-cli-commit>` after reviewing it. `v0.2.0` is older than the manager and doesn't include it.
- **CLI versus skill:** the CLI version and the skill version it installs are separate. npm fetches the CLI from GitHub, not the npm registry, and caches it as usual. The cached package is only the CLI. The manager fetches the full skill snapshot separately, with its references, assets and licences.
- **Nothing changes yet:** without `--apply`, the command only prints a plan. Review the target, current and new source, scope, duplicates and where private state will go. To install, run the same command with `--apply`. It prints the plan again before it changes anything. Add `--commit <full-sha>` if you want exactly the source you reviewed, since a channel may move after your preview.

**Hosts and folders:** choose `--harness claude`, `codex` or `opencode`. Project scope uses `.claude/skills`, `.agents/skills` or `.opencode/skills`. `--scope personal` uses the matching folder in your home directory; for OpenCode that's `XDG_CONFIG_HOME` or the default `.config/opencode/skills`. `--project <directory>` sets the project. Nothing else changes: no other host, scope, global setting or project file.

From a complete trusted local checkout, the same commands run as `node tools/skill-package/itf.mjs ...`. To replace an installation, run the CLI from a copy outside it, such as the npx package. The manager won't replace the copy it's running from.

## Check, select, update and restore

Use the same CLI prefix, host and scope each time:

| Command or option | What it does |
|---|---|
| `install --channel prerelease` | Previews the newest eligible public release. With `--apply`, installs only into an empty destination. |
| `check` | Compares the copy with its saved channel or pin. Read-only, even with `--apply`. An error or missing data never counts as "up to date". |
| `update` | Previews the source the saved policy points to. With `--apply`, replaces only this managed copy, after validation. |
| `--release vX.Y.Z` | Selects a published tag and locks its full SHA. If the tag later moves, the manager refuses it. |
| `--commit <full-sha>` | Pins a commit from the public ItF repository. It doesn't have to be a release or host-checked. If it's the commit of exactly one published release, the plan and receipt record that release's tag and version. |
| `--follow-channel` | Leaves a pin and follows the channel again. Needs `--apply` to save the change. |
| `adopt --commit <full-sha>` | Takes over an existing Git or manual copy you own. With `--apply`, it records where the copy came from, after confirming the files match. It doesn't overwrite them. |
| `rollback` | Previews the previous saved copy. With `--apply`, restores it and keeps the replaced version recoverable. |
| `recover` | Inspects an interrupted run. With `--apply`, clears a lock whose process has stopped, and restores the previous state if the files can still be identified. |

A pinned copy stays on its pin even when the channel has a newer version. To compare with the channel anyway, run `check --follow-channel`; it's read-only. Moving to an older version needs `--allow-downgrade`, except through `rollback`. The stable channel skips anything published as a prerelease, even if its tag has no prerelease suffix.

Nothing updates automatically. If the agent notices a newer version, don't update in that same turn. Ask for the update separately, then start a new agent session. The manager can't enforce this across hosts. How each host picks up changed files is in the [installation guide](install.md#3-check-discovery-then-try-a-bounded-conversation).

For an optional notice while you use the skill, see [in-skill update notices](update-notices.md). The installed source must include its helper, and you have to turn it on. We haven't confirmed that hosts show it.

## Protect existing work

**Duplicates:** before installing, the manager looks for other copies with the same name in parent folders inside the repository and in known personal folders, including OpenCode's compatibility folders. It doesn't query the host or check enterprise, admin, cloud or custom locations, so confirm the host uses your copy. If other copies exist, `--apply` needs `--ack-duplicates`. That only acknowledges them; it doesn't change or remove them.

**What it refuses:** linked installations, symlinked install or state paths, and Git submodules or worktrees. Keep managing those the way you already do. `adopt` needs a complete copy that you own and whose files match the source. A folder that merely contains `SKILL.md` isn't enough.

**How replacement works:** changed, untracked, ignored or unknown files stop a replacement. The manager never discards them. It prepares a fresh Git checkout, checks the SHA, file contents, inventory, references and licences, and only then replaces the live folder. Git hooks, global Git filters and settings, and credential prompts are turned off while it prepares the source. Installation never runs the package's own files.

### Adopting a Windows clone

On Windows, Git's default `core.autocrlf=true` gives text files CRLF line endings. That includes any clone made with the [installation guide](install.md) before `.gitattributes` fixed line endings. The manager compares exact bytes, so `adopt` treats these files as modified even when `git status` is clean. This is deliberate: the integrity check doesn't ignore line endings.

First back up the whole installation, including Git data, ignored files and anything private, to a safe unused location. Check for local work carefully; plain `git status` doesn't list ignored files. Then, only if the first command below prints nothing and you've saved any other edits, check out the same commit again with LF endings and preview adoption again:

```sh
git -C "$target" status --porcelain --untracked-files=all --ignored=matching   # must print nothing
git -C "$target" config core.autocrlf false
git -C "$target" rm -q -r --cached .
git -C "$target" reset -q --hard
```

This rewrites the index and tracked files. `git rev-parse HEAD` stays the same. `reset --hard` discards tracked changes and may remove untracked files that get in the way. A clean status isn't a backup.

## Private state and recovery

**Where state lives:** receipts, locks, journals, staging and backups go under `.local/state/impact-to-funding/` in your home directory, one entry per target, outside every skills folder. The plan shows the exact location. State may include private paths or old Git settings, so don't publish it. The manager never edits project ignore rules. Backups are kept until you remove them; check them for anything you need first.

**How a replacement can be interrupted:** the old copy moves to a private backup, then the checked new copy moves into place. That's two folder renames, not one atomic swap. On an ordinary error, the old copy comes back. If the process is interrupted, a pending journal stays for `recover`. Recovery checks its backup before replacing a working copy. It stops, rather than overwriting, if it finds new edits, unclear ownership or unclear state. It won't take over a lock from a running or unknown process; a lock from a stopped process can be cleared.

**Limits:** renames need compatible filesystems. A failure across devices leaves the old installation in place; we don't claim replacement across volumes works. This handles interrupted processes, not power loss. Don't delete state or a lock just to retry.

**Network use:** release data comes from anonymous public GitHub reads, with a five-second limit per request and 15 seconds overall. The manager reads every page and resolves tags fully. It sends no prompts, project content or local paths. Rate limits, offline use or incomplete responses stop the selection. They never trigger a sign-in prompt or mean there are no updates. Fetching the source also needs public Git access.

## Compatibility and source choice

The local install and update tests check file placement only. They don't show that a host loads the skill, that a model follows it or that it's useful. The earlier limited host checks keep their own exact SHAs and limits, including the Claude Code check at `4566892`. The manager adds no sign-in, model trial, host notice, hook, telemetry or global setting change.

We compared it with Vercel Skills CLI at [`d3701c1`](https://github.com/vercel-labs/skills/tree/d3701c11b1101251af14c9d148f026e1a47ebe17). That tool can find and copy a root package, but its [replacement step](https://github.com/vercel-labs/skills/blob/d3701c11b1101251af14c9d148f026e1a47ebe17/src/installer.ts#L193-L208) deletes the destination. It doesn't preserve local material or support rollback, so ItF uses its own small Git-based wrapper for those safeguards. The comparison needed no Skills CLI install, telemetry or extra dependency.

See the [tool usage and checks](../tools/skill-package/README.md) and [#55](https://github.com/zhiganov/impact-to-funding/issues/55).
