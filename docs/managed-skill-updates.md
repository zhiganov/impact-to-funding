# Managed skill installation and updates

The optional ItF CLI installs a complete source snapshot into a chosen native
Claude Code, Codex CLI or OpenCode folder. It uses the
[version/provenance contract](skill-version-provenance.md), existing public GitHub
releases and Git—not a registry, hosted service, plugin or background updater.
Node.js 22+, npm/npx and Git are needed for this route, not for conversation.

## Start with a plan

From the project where you want to use ItF:

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf install --harness codex --scope project --channel prerelease
```

This runs the experimental CLI from GitHub's **mutable default branch**, not
`v0.2.0`, which predates the manager. For a reviewed, repeatable CLI, replace
`#main` with `#<full-cli-commit>`. The CLI version and the skill source selected
for installation are separate. No npm registry publication is required; npm
obtains the public Git package and uses its normal local cache.
The cached npm artifact is a **CLI bootstrap**, not an installable skill bundle;
it excludes unrelated local dependencies. The manager separately stages the
complete selected Git snapshot, including its references, assets and licences.

Without `--apply`, the command only reports a plan. Review the exact target,
current/target source, scope, duplicates and private-state location. To install,
repeat the selected command with `--apply`. It prints that execution's plan
before changing files. Use `--commit <full-sha>` if you want exactly a reviewed
source rather than a channel that may have changed since preview.

Choose `--harness claude`, `codex` or `opencode`. Project scope uses `.claude/skills`,
`.agents/skills` or `.opencode/skills`, respectively. `--scope personal` deliberately
chooses the corresponding home folder; OpenCode follows `XDG_CONFIG_HOME` or the
default `.config/opencode/skills`. `--project <directory>` selects project context.
No other harness, scope, global settings or project content is changed.

The equivalent from a complete trusted local checkout is
`node tools/skill-package/itf.mjs ...`. Use an external CLI copy, such as the npx
package, when replacing an installation; the manager refuses to replace itself
while executing from inside that selected skill.

## Check, select, update and restore

Use the same CLI prefix, explicit harness and scope:

| Command/options | Effect |
|---|---|
| `install --channel prerelease` | Preview the newest eligible public source release. `--apply` installs only into an unused destination. |
| `check` | Read-only comparison using the managed copy's saved channel/pin. It never writes, even with `--apply`. Errors/incomplete metadata are not “up to date.” |
| `update` | Preview the saved policy's source; `--apply` replaces only this managed copy after validation. |
| `--release vX.Y.Z` | Select and lock a published tag and its resolved full SHA. A moved locked tag is refused. |
| `--commit <full-sha>` | Pin an explicit source commit from the fixed public ItF repository; it need not be a release or host-tested. |
| `--follow-channel` | Deliberately leave a pin. `--apply` is needed to persist the changed policy. |
| `adopt --commit <full-sha>` | Assert ownership and preview adoption of an existing Git/manual copy. `--apply` records provenance only after matching the complete source; it does not overwrite it. |
| `rollback` | Preview the previous retained complete copy; `--apply` restores it locally and keeps the displaced version recoverable. |
| `recover` | Inspect interrupted state. `--apply` clears a provably stopped lock and restores the previous state only when files are still identifiable. |

A saved pin is intentionally not a claim of the newest channel version. Use
`check --follow-channel` for a read-only comparison outside the pin. An update to
an older version requires `--allow-downgrade`; rollback is itself an explicit
older-state selection. Published prereleases are excluded from the stable channel,
even when their tags have no SemVer prerelease suffix.

No change is automatic. Do not update during the turn that first notices a newer
version; request it separately and begin a new agent session afterward. This is
not an enforced cross-harness turn detector. Claude's skill watching, Codex's
discovery/restart fallback and OpenCode's refresh behaviour are described in the
[installation guide](install.md#3-check-discovery-then-try-a-bounded-conversation).

For an optional per-copy notice during skill use, see
[in-skill update notices](update-notices.md). The installed source must contain
its helper, and the person must explicitly enable it; actual host delivery has
not been verified.

## Protect existing work

Default-folder discovery checks project ancestors within the repository boundary
and known personal roots for same-name skills, including OpenCode compatibility
folders. It does not query a live harness registry or inspect arbitrary configured,
enterprise, admin, cloud or hosted sources. Verify the host actually uses your
selected copy. Other discoverable copies require `--ack-duplicates` to apply;
acknowledgement neither changes nor removes those copies.

Linked installations, symlinked install/state paths and submodule/worktree Git
metadata are refused, not silently replaced. Keep their existing source/team
management route. Adoption requires an explicitly owned complete copy with
matching source, not an unverified directory that happens to contain `SKILL.md`.

Changed, untracked, ignored or unknown files stop replacement; the manager never
discards them. It stages a fresh complete Git checkout, verifies the selected SHA,
actual bytes, inventory, references and licences, then replaces the live directory.
Git hooks, global Git filters/configuration and credential prompts are disabled
for source preparation. Package source files are not executed by installation.

### Adopting a Windows clone

A copy cloned on Windows with Git's default `core.autocrlf=true`, which includes
any clone made by following the [installation guide](install.md) before
`.gitattributes` fixed line endings, has CRLF text files. The manager compares
exact bytes, so `adopt` refuses it as modified even when `git status` is clean.
This is deliberate: integrity checks do not ignore line endings.

First back up the entire owned installation, including Git metadata, ignored
files and private material, to an unused safe location. Inspect local work
carefully; ordinary `git status` omits ignored files. Only if the status below
prints nothing and you have preserved any other edits, re-check out the same
commit with LF endings and preview adoption again:

```sh
git -C "$target" status --porcelain --untracked-files=all --ignored=matching   # must print nothing
git -C "$target" config core.autocrlf false
git -C "$target" rm -q -r --cached .
git -C "$target" reset -q --hard
```

This rewrites the index and tracked files; `git rev-parse HEAD` stays the same.
`reset --hard` discards tracked modifications and may remove untracked files or
directories obstructing checkout. A clean status alone is not a backup.

## Private state and recovery

Receipts, locks, journals, staging and retained backups live under the home
directory's `.local/state/impact-to-funding/`, keyed by target path and outside
every skills-discovery root. The plan reports the exact location. State may contain
private paths or previous local Git configuration: do not publish it. No project
ignore rules are edited. Backups are retained, not automatically purged; inspect
and preserve needed data before manually removing owned state.

The previous copy moves to private backup before the validated candidate moves
into place. This uses **two directory renames**, not an uninterrupted atomic swap.
Ordinary errors restore the prior copy; an interrupted process can leave a pending
journal for explicit recovery. Recovery validates its restore source before
displacing a usable current installation. New edits, unknown ownership or ambiguous
state stop recovery rather than being overwritten. A running/unknown lock owner
is not displaced; a stopped lock is recoverable even without a pending journal.

Directory renames require compatible filesystems. A cross-device failure leaves
the prior installation intact; successful cross-volume replacement is not claimed.
This is process-interruption recovery, not power-loss durability or an atomic
filesystem snapshot. Do not delete state or a lock simply to retry.

Release metadata uses anonymous, bounded public GitHub reads: five seconds per
request and a 15-second overall catalogue deadline, with complete pagination and
actual tag peeling. No prompt, project content or local path is sent. Rate limits,
offline access or incomplete responses stop selection; they do not trigger sign-in
requests or imply no updates. Git source preparation also requires public access.

## Compatibility and source choice

File placement and local lifecycle tests do not establish native activation,
model reliability or usefulness. Existing limited Claude, Codex and OpenCode
checks retain their older exact-source SHAs and limits, including the limited
Claude Code check at `4566892`. These tools do not supply a host sign-in, model
trial, guaranteed host notice, hook, telemetry or global configuration change.

The bounded comparison with Vercel Skills CLI at
[`d3701c1`](https://github.com/vercel-labs/skills/tree/d3701c11b1101251af14c9d148f026e1a47ebe17)
found root-package discovery/copy support, but its
[live replacement path](https://github.com/vercel-labs/skills/blob/d3701c11b1101251af14c9d148f026e1a47ebe17/src/installer.ts#L193-L208)
deletes the destination without ItF's local-material preservation or rollback.
The small Git-based wrapper therefore owns those safeguards; no Skills CLI
installation, telemetry event or extra dependency was required for that decision.

See the [tool usage and checks](../tools/skill-package/README.md) and
[#55](https://github.com/zhiganov/impact-to-funding/issues/55).
