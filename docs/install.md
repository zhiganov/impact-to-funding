# Install and use in a CLI agent

ItF is a skill made of instructions and reference files. Use your existing Claude Code, Codex CLI or OpenCode, with its normal sign-in, model costs and privacy terms. You need Git for the install route below. Conversation needs no signup, credentials, Node.js, MCP server or plugin. If your host asks you to sign in, do it in your own terminal. Never paste tokens or passwords into an agent conversation.

The optional [managed CLI](managed-skill-updates.md) can install, check, update and roll back copies for you. It needs Node.js 22+, npm and Git, and changes nothing until you add `--apply`. The Git steps below work without it.

## What has been checked

The commands below pin source `4566892ad990131fb36f760e14c73e5f275600cc`.

- **Codex CLI 0.166.0:** a limited check passed. In one read-only `codex exec` run, `$impact-to-funding` loaded the skill and read its bundled `references/contributions.md`. The file contents matched the source, all 106 tracked files stayed unchanged, and no web or MCP calls happened. User configuration was left out, but user-level agent instructions still applied.
- **Claude Code 2.1.321:** a matching limited check passed. In one non-interactive `claude -p` run, `/impact-to-funding` loaded the skill and read the same reference, with no files changed and no web or MCP calls.
- **OpenCode:** not checked at this source. Earlier OpenCode v2.2.5 checks cover source `fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b`.

These checks cover those exact sources only. They didn't test a clean account, the interactive UI, IDEs or usefulness. Personal installs, manual copying, updates and removal below are documented but not checked. See the [check record](installation-check-2026-11-04.md).

## 1. Choose one host and scope

Start in the project where you'll use ItF. Install into the project by default: it changes no global settings. Pick **one** row:

| Host | Project folder | Invoke | Checked at `4566892` |
|---|---|---|---|
| Claude Code | `.claude/skills/impact-to-funding` | `/impact-to-funding` | Yes, with `claude -p` (not the interactive menu) |
| Codex CLI | `.agents/skills/impact-to-funding` | `$impact-to-funding`, or select it in `/skills` | Yes, with `$impact-to-funding` (not the interactive menu) |
| OpenCode V2 | `.opencode/skills/impact-to-funding` | `@impact-to-funding` | No; earlier checks cover `fbb8993` |

Set the target for your host in your terminal:

```sh
# Claude Code; replace this line with your chosen target from the table.
target='.claude/skills/impact-to-funding'
```

**Personal install (optional):** to use ItF across projects, set one of these instead:

- Claude Code: `target="$HOME/.claude/skills/impact-to-funding"`
- Codex: `target="$HOME/.agents/skills/impact-to-funding"`
- OpenCode: `target="$HOME/.config/opencode/skills/impact-to-funding"` (its default global location)

Follow any host-specific settings and your organisation's policy.

**Look for existing copies first.** Check the project, parent folders and your personal folder for another ItF skill. Claude Code may prefer a personal copy over a project copy. Codex may list duplicates without merging them. OpenCode also reads `.claude/skills` and `.agents/skills`. If the skill seems missing, find out which copy the host sees before adding another.

These steps use CLI skill folders. They aren't a plugin release. OpenAI's documentation prefers plugins for sharing skills across ChatGPT surfaces. This guide doesn't cover desktop apps, cloud marketplaces or Cowork, and you don't need a plugin marketplace.

## 2. Clone the complete package at an exact revision

With `target` set, run this from your project. It stops if anything already exists at the target, so you can inspect it instead of overwriting it.

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

Check that the printed commit is the full SHA you chose. If the checkout fails, stop. The folder may hold the default branch instead, so don't treat it as pinned or rerun into it.

Keep the whole package together: `SKILL.md`, `references/`, `assets/`, `docs/`, the examples and the licence files. **Don't copy only `SKILL.md`.** The optional software folders need no setup. Keep your private inputs and outputs outside this folder.

**Manual copy (optional):** get a trusted complete snapshot at your chosen revision. Copy its files, without `.git`, into an empty target from the table, keeping all relative paths. Note the revision somewhere. The Git update steps below won't apply to this copy.

**If your project uses Git:** the clone is a nested repository. Don't commit it by accident as an embedded repository. To share the skill through your project's history, use a complete copy you manage or a Git submodule.

Opening the repository and asking an agent to read `SKILL.md` is a separate [manual-use option](../README.md#optional-manual-use). It doesn't show that the host will find the skill.

## 3. Check discovery, then try a bounded conversation

Open your host in the same project:

- **Claude Code:** look for `/impact-to-funding` in `/skills` and the `/` menu. If you created the skills folder after the session started, run `/reload-skills`.
- **Codex CLI:** check `/skills`, then select ItF or type `$impact-to-funding`. If it still doesn't appear after you check the path, restart the CLI.
- **OpenCode V2:** type `@impact-to-funding`. Changes load automatically; use `/reload` if needed.

Make sure the host is using the copy you installed, especially if there's more than one. `git -C "$target" rev-parse HEAD` shows a Git copy's revision. A matching name alone doesn't prove which copy the host picked.

Then invoke the skill with this fictional prompt:

> This is a fictional practice case. I can spend two hours a week helping maintain
> a community repair guide, but I do not know what readers need or whether it
> helps. Help me explore a useful contribution, including supporting existing
> work or doing less. Use only this description, mark assumptions and keep the
> response in this conversation. Do not browse, contact anyone, create files or
> claim impact or funding.

Put `/impact-to-funding` (Claude Code), `$impact-to-funding` (Codex) or `@impact-to-funding` (OpenCode) in front of it. These are commands inside the host, not shell commands. A good answer explores options and keeps unknowns visible. It shouldn't promise opportunities, demand a form or claim impact or income. This describes what we expect, not a test result.

To check that the skill can read its bundled files, invoke it and ask:

> Read the installed skill's bundled `references/contributions.md` using your
> file-reading tool. Report the actual source path you read and briefly explain
> how it distinguishes my contribution from shared project results. Do not
> browse, create files or treat reading instructions as verified impact. If you
> cannot read the reference, say so rather than reconstructing it.

Confirm the agent actually read the file from your chosen copy. A plausible answer, or a path it names without reading, doesn't count. Discovery, invocation, file access and a useful answer are separate checks.

For more prompts, see [Using the skill](usage.md). Read the [privacy guide](../PRIVACY.md) before you use real material: installing locally doesn't mean the model runs locally.

## Update deliberately

### Know when an update is available

On the [GitHub repository](https://github.com/zhiganov/impact-to-funding), choose **Watch → Custom → Releases**, then turn on the notifications you want in your GitHub settings. Or check the [releases page](https://github.com/zhiganov/impact-to-funding/releases) yourself. ItF has no notification service and doesn't check for updates in the background. Starring the repository doesn't subscribe you, and you won't get a notification for every commit.

Before you update, read the release's changes, migration and licensing notes and which hosts were checked. A newer release isn't automatically checked in your host. See the [release policy](releases.md).

### Choose and apply a version

Updates happen only when you choose. New source on GitHub doesn't change your copy. Pick and review a full commit SHA. Don't follow `main` automatically, and don't assume an older host check covers a newer revision.

For a Git clone:

- `git -C "$target" rev-parse HEAD` shows the installed SHA.
- `git -C "$target" fetch origin --tags` fetches release tags. It downloads data but doesn't change the installed files.
- `git -C "$target" rev-parse 'refs/tags/<chosen-release>^{commit}'` resolves a release to its commit. Replace the placeholder with the exact tag from the release page, and review the commit before you use it.

These are shell commands for you to run. The skill doesn't update itself.

Before you run the block below, set `target` to your own installation and `revision` to the reviewed full SHA. Run `git -C "$target" remote -v` and confirm it points to the right public repository. The block checks that the target is the installation's Git root and stops if there are any local changes. It never discards work, forces a checkout or changes global settings.

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

Note the previous SHA first, so you can go back with the same steps. After updating, check discovery, the selected copy, invocation and file access again.

For a manual copy, prepare the new complete snapshot in an empty location and keep the old copy until you're done. Don't copy new files over edits you haven't reviewed.

## Disable or remove without losing work

Change only an installation that's yours. First look at everything in it, and for a Git clone, check its status. Save any local changes, ignored files and private material separately. A clean Git status doesn't show ignored files.

The safest removal is to move the **whole folder** to a new backup location outside **every** host's skills folders. Renaming it inside a `skills/` folder may leave it visible to the host. To restore it, move it back. You don't need a recursive delete. Afterwards, refresh discovery with the steps above and confirm ItF no longer appears. Another copy may still be installed.

Removing the skill doesn't delete conversation history, provider retention, backups or outputs you saved. Each follows its own rules.

## Troubleshooting

| Problem | What to check |
|---|---|
| Clone refuses the destination | Look at what's already there, including symlinks. Don't delete or overwrite it to retry. |
| Checkout failed | Run `git -C "$target" rev-parse HEAD`. Don't use a default-branch copy as if it were pinned. |
| Skill is missing | Check the project, scope and exact `SKILL.md` location, and that there's no extra wrapper folder. Use the host's refresh steps above. |
| Wrong or duplicate skill appears | Check which paths the host found and each copy's revision. Claude Code and Codex handle duplicates differently. |
| A reference can't be read | Check that the whole package is installed, the agent used your chosen copy, and file permissions allow access. Don't accept invented content. |
| Host needs sign-in or blocks use | Use the host's own sign-in or check your organisation's permissions. Never give credentials to the skill. |
| Answer invents evidence or does more than asked | Don't rely on it. Report it with a non-sensitive description, following the [contribution guidance](../CONTRIBUTING.md). |

Host documentation for skill folders and invocation:
[Claude Code skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/skills),
[OpenAI plugins](https://developers.openai.com/plugins/build/plugins) and
[OpenCode V2 skills](https://opencode.ai/v2/docs/skills).
Matching their documentation doesn't replace this project's version checks.
