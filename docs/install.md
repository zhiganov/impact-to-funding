# Install and use in a CLI agent

ItF is an instruction-only skill package. Use your existing Claude Code, Codex CLI
or OpenCode installation, with its normal sign-in, model costs and privacy terms.
Git is needed for the clone/update route below. ItF itself needs no signup,
credentials, Node.js, MCP server, plugin or additional installer for conversation.
If your host needs sign-in, complete its normal flow in your own terminal; do not
paste tokens or passwords into an agent conversation.

**Verification boundary:** the commands below pin source
`4566892ad990131fb36f760e14c73e5f275600cc`. A limited Codex CLI 0.166.0 check
passed for a GitHub clone at the native project-local path: explicit
`$impact-to-funding` invocation loaded the selected skill and read its bundled
`references/contributions.md`, with captured contents matching the frozen source.
All 106 tracked files remained unchanged; no web or MCP calls occurred.

That was one ephemeral, read-only `codex exec` check with user configuration
omitted but user-level agent instructions still inherited—not a clean-account,
interactive UI, IDE or usability test. A matching limited Claude Code 2.1.321
check also passed at this source: explicit `/impact-to-funding` in one
non-interactive `claude -p` run loaded the project skill and read the same bundled
reference, with all tracked files unchanged and no web or MCP calls. OpenCode
activation at this source remains unverified. Historical OpenCode v2.2.5 checks cover source
`fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b` separately. Checks are tied to those exact
source revisions, not later documentation commits or latest main. Personal scope, manual
copying, updates and removal below are documented, not runtime-checked routes.
See the [exact-version check record](installation-check-2026-11-04.md).

## 1. Choose one host and scope

Start in the project where you intend to use ItF. A project-local installation is
the default here: it does not change global settings or install a personal skill.
Choose **one** target, not all three:

| Host | Project-local target | Native invocation | Verification |
|---|---|---|---|
| Claude Code | `.claude/skills/impact-to-funding` | `/impact-to-funding` | `4566892`: limited CLI 2.1.321 check passed using explicit `/impact-to-funding` in `claude -p`, not the interactive menu. |
| Codex CLI | `.agents/skills/impact-to-funding` | `$impact-to-funding` or select it through `/skills` | `4566892`: limited CLI 0.166.0 check passed using explicit `$impact-to-funding`, not the interactive menu. |
| OpenCode V2 | `.opencode/skills/impact-to-funding` | `@impact-to-funding` | `4566892`: documented candidate only; historical v2.2.5 checks cover `fbb8993` separately. |

For example, set the target for your chosen host in your terminal:

```sh
# Claude Code; replace this line with your chosen target from the table.
target='.claude/skills/impact-to-funding'
```

**Optional personal scope:** only if you intentionally want it across projects,
use `target="$HOME/.claude/skills/impact-to-funding"` for Claude Code,
`target="$HOME/.agents/skills/impact-to-funding"` for Codex, or
`target="$HOME/.config/opencode/skills/impact-to-funding"` for OpenCode's default
global location. These are alternatives, not steps required by project-local use.
Respect any host-specific configuration location and organisation policy.

Before installing, check for an existing ItF skill in the project, ancestor
projects and personal scope. Claude Code can prefer a personal skill over a
project skill; Codex can list duplicate names without merging them. OpenCode also
recognises compatibility folders such as `.claude/skills` and `.agents/skills`.
Do not add another copy merely because one invocation is missing; first identify
the discovered path and version.

These are CLI native-folder instructions, not a plugin distribution release.
OpenAI's current documentation prefers plugins for reusable distribution and
shared ChatGPT surfaces; local skill folders remain a CLI authoring/use route.
This guide does not deliver or verify desktop, cloud marketplace or Cowork
support. No plugin marketplace setup is required here.

## 2. Clone the complete package at an exact revision

The Codex and Claude Code native project-local clone routes have the limited checks
described above; the OpenCode route at this revision remains a documented candidate.
With `target` set above, run from the intended project. The guard refuses an
existing directory, file or symlink; inspect it rather than overwriting it.

```sh
revision='4566892ad990131fb36f760e14c73e5f275600cc'
if [ -e "$target" ] || [ -L "$target" ]; then
  echo "Destination already exists; stop and inspect: $target"
else
  git clone https://github.com/zhiganov/impact-to-funding.git "$target" &&
    git -C "$target" checkout --detach "$revision" &&
    git -C "$target" rev-parse HEAD
fi
```

Confirm the printed commit is the full chosen SHA before using the skill. If
checkout fails after cloning, stop: the directory may still contain the clone's
default revision. Do not treat that as a pinned installation or rerun into the
existing target.

Keep `SKILL.md` and the complete package together, including `references/`,
`assets/`, `docs/`, examples and licence files. **Do not copy only `SKILL.md`.**
No dependency installation or setup is needed for the bundled optional
MCP/software directories. Keep private inputs and outputs outside this
distributable skill directory.

Optional manual copying is also possible: obtain a trusted complete snapshot at
your chosen revision, then copy its files into an unused target from the table,
excluding any source `.git` metadata. Record the source revision separately and
preserve all relative paths.
This is not a Git-managed installation; the Git update steps below do not apply.

The clone route creates a nested Git repository. Do not accidentally stage it as
an embedded repository when committing your project. If sharing the skill in the
project's history, use a deliberately managed complete copy or Git submodule
arrangement instead. This guide changes no project ignore rules or team policy.

Opening the repository and asking an agent to read `SKILL.md` is a separate
[manual-use alternative](../README.md#optional-manual-use), not proof of native
discovery.

## 3. Check discovery, then try a bounded conversation

Open the chosen host in the same project:

- **Claude Code:** inspect `/skills` and the `/` command menu for
  `/impact-to-funding`. Changes are watched; if the top-level skills directory was
  created after the session began, use `/reload-skills`.
- **Codex CLI:** inspect `/skills`, then select ItF or invoke
  `$impact-to-funding`. It watches new files; restart the CLI if the skill still
  does not appear after checking the path.
- **OpenCode V2:** use `@impact-to-funding`. Skill/configuration changes refresh
  automatically; use `/reload` if needed rather than routinely restarting.

Check that discovery refers to the target you chose, especially if more than one
copy exists. `git -C "$target" rev-parse HEAD` identifies that Git copy's revision;
an entry with the right name alone does not prove the host selected it.

After your host's invocation, try this genuinely fictional, non-sensitive prompt:

> This is a fictional practice case. I can spend two hours a week helping maintain
> a community repair guide, but I do not know what readers need or whether it
> helps. Help me explore a useful contribution, including supporting existing
> work or doing less. Use only this description, mark assumptions and keep the
> response in this conversation. Do not browse, contact anyone, create files or
> claim impact or funding.

For example, prefix it with `/impact-to-funding` in Claude Code,
`$impact-to-funding` in Codex, or `@impact-to-funding` in OpenCode. These are host
commands/mentions, not shell commands. Expected help is bounded exploration with
unknowns visible—not a promised opportunity, mandatory intake form, proven impact
or guaranteed income. This prompt describes intended behaviour, not an observed
test result or evidence of usefulness.

To check bundled-reference access separately, invoke the skill and ask:

> Read the installed skill's bundled `references/contributions.md` using your
> file-reading tool. Report the actual source path you read and briefly explain
> how it distinguishes my contribution from shared project results. Do not
> browse, create files or treat reading instructions as verified impact. If you
> cannot read the reference, say so rather than reconstructing it.

Confirm the tool actually read the reference under your chosen installation, not
another checkout or a personal duplicate. A plausible answer or path asserted
without a file read does not establish reference access. Discovery, invocation,
reference access and a useful response are different checks; none proves social
impact or fundraising effectiveness. For more starting points, see
[Using the skill](usage.md). Read the [privacy guide](../PRIVACY.md) before using
real material: local installation does not mean local-only model processing.

## Update deliberately

### Know when an update is available

On the [GitHub repository](https://github.com/zhiganov/impact-to-funding), choose
**Watch → Custom → Releases**. In your GitHub notification settings, enable the
watching notifications you want on GitHub or by email. This is optional: ItF
itself needs no account, and you can instead check the
[releases page](https://github.com/zhiganov/impact-to-funding/releases).
Delivery depends on your GitHub settings; ItF has no notification service or
background update check. Starring the repository or installing the skill is not
a release subscription. Notifications are not sent for every source commit.

Read a release's changes, migration/licensing notes and exact host-check limits
before deciding to update. A newer source release is not automatically checked
in your host. See the [release policy](releases.md) for versioning and boundaries.

### Choose and apply a version

Updates are opt-in. A published source change does not update an installed copy.
Choose and review a full commit SHA; do not automatically follow latest main or
assume an earlier host check covers a newer revision.

For a Git clone, `git -C "$target" rev-parse HEAD` shows the installed SHA. You can
fetch tags with `git -C "$target" fetch origin --tags` and resolve a chosen release
with `git -C "$target" rev-parse 'refs/tags/<chosen-release>^{commit}'`. Replace the
placeholder with the exact tag shown on its release page, confirm the origin
first, and review the resolved commit before using it as `revision` below.
Fetching downloads repository metadata/objects; it does not switch the installed
files. These are shell commands, not an instruction to let the skill update itself.

For a Git installation only, set `target` to the installation you own and
`revision` to the reviewed full SHA. Before running the block, inspect
`git -C "$target" remote -v` and confirm it is the intended public repository.
The block checks that the target itself is the Git root and refuses tracked or
untracked local changes. It does not discard work, force checkout or change
global configuration.

```sh
revision='<reviewed-full-commit-sha>'
(
  set -e
  root=$(git -C "$target" rev-parse --show-toplevel)
  actual=$(cd "$target" && pwd -P)
  if [ "$root" != "$actual" ]; then
    echo 'Target is not the installation Git root; stop and inspect.'
    exit 1
  fi
  changes=$(git -C "$target" status --porcelain --untracked-files=all)
  if [ -n "$changes" ]; then
    echo 'Installation has local changes; preserve and review them first.'
    exit 1
  fi
  git -C "$target" fetch origin
  git -C "$target" checkout --no-overwrite-ignore --detach "$revision"
  git -C "$target" rev-parse HEAD
)
```

Record the previous SHA before updating so you can return to it with the same
clean-install procedure. Recheck discovery, the selected path, invocation and
bundled-reference access after an update. For a manually copied installation,
prepare a new complete snapshot in an unused location and preserve the old copy
before replacing it; do not merge new files over unknown edits.

## Disable or remove without losing work

Only change an installation you own. First inspect its full contents and, for a
Git clone, its status. Preserve local changes, ignored files and any private
material separately; a clean Git status does not prove ignored files are absent.
Do not remove a shared installation or assume an existing folder belongs to you.

Prefer moving the **whole installation** to a new, unused backup location outside
**every** host's skills-discovery roots. Renaming it within a `skills/` directory
may leave it discoverable. Keep the backup until you no longer need recovery;
moving it back to the original unused target restores the files. No recursive
delete command is needed. Refresh discovery using the host-specific steps above
and confirm ItF is no longer selected; another discovered copy may remain.

Removing a skill does not erase conversation history, model-provider retention,
backups or separately saved outputs. Review those surfaces under their own rules.

## Troubleshooting

| Symptom | Smallest useful check |
|---|---|
| Clone refuses the destination | Inspect the existing target, including symlinks; do not delete or overwrite it to retry. |
| Checkout failed | Inspect `git -C "$target" rev-parse HEAD`; do not use an unintended default-branch copy as the chosen pin. |
| Skill is missing | Confirm project, scope and exact `SKILL.md` location; avoid an extra wrapper folder. Use the host's discovery/refresh steps above. |
| Wrong or duplicate skill appears | Inspect discovered paths and each copy's revision. Claude precedence and Codex duplicate listing differ; do not assume names are merged. |
| A reference cannot be read | Confirm the complete package was installed, the tool used the selected copy, and host file permissions permit access. Do not substitute invented content. |
| Host needs sign-in or denies use | Use its normal user-owned sign-in flow or check organisation permissions. Authentication or policy failure alone is not an ItF defect; do not provide credentials to the skill. |
| Response invents evidence or acts outside the request | Do not rely on it. Preserve a non-sensitive description and report it using the [contribution guidance](../CONTRIBUTING.md), without private data or credentials. |

Host documentation for these folder and invocation conventions:
[Claude Code skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/skills),
[OpenAI plugins](https://developers.openai.com/plugins/build/plugins), and
[OpenCode V2 skills](https://opencode.ai/v2/docs/skills).
Documentation compatibility is not a substitute for the exact-version checks
recorded by this project.
