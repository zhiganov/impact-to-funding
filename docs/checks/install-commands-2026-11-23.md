# Short install commands: discovery checks

Checked on 2026-11-23. The question: do short, one-line install commands give Codex and OpenCode a working copy of ItF v0.6.0, and does the [skills CLI](https://www.npmjs.com/package/skills) install ItF correctly?

These are **discovery checks only**. No agent had model credentials, so no model ran. They show the agent finds the skill and reads its `SKILL.md`. They don't show how well the agent then follows it.

## Setup

- A fresh Linux container, each check in its own throwaway Git project.
- Codex CLI 0.171.0 (`@openai/codex`), OpenCode 1.19.6 (`opencode-ai`) and skills CLI 1.9.0 (`skills`), installed from npm into a scratch folder. Nothing global changed.
- Codex used an empty, separate `CODEX_HOME`. The skills CLI ran with `DO_NOT_TRACK=1` and `DISABLE_TELEMETRY=1`.

## One-line clone of v0.6.0

```sh
git clone --depth 1 --branch v0.6.0 https://github.com/zhiganov/impact-to-funding <folder>
```

The copy was at `22baece`, the v0.6.0 commit, in both projects.

| Agent | Folder | How it was checked | Result |
|---|---|---|---|
| OpenCode 1.19.6 | `.opencode/skills/impact-to-funding` | `opencode debug skill` lists every skill OpenCode can load | Exactly one `impact-to-funding`, from the installed `SKILL.md` |
| Codex 0.171.0 | `.agents/skills/impact-to-funding` | `codex debug prompt-input` shows what the model would receive, without calling it | `impact-to-funding` listed once among the available skills |

## Skills CLI

```sh
npx skills add zhiganov/impact-to-funding#v0.6.0
```

- **It finds one skill** in the repository and installs it.
- **With `#v0.6.0`,** or the `…/tree/v0.6.0` URL, it pins the release commit `22baece` and records it in `skills-lock.json`. Without a tag it installs the current `main`.
- **Folders:** with `-a claude-code -a codex -a opencode` it put a copy in `.claude/skills/` for Claude Code, and one in `.agents/skills/` shared by Codex and OpenCode. OpenCode found the skill there.
- **It asks which agents to install for** unless `-a` names them. It sends usage telemetry unless turned off.

## Problem found

Installed from `main` into `.agents/skills/`, OpenCode listed two skills: `impact-to-funding` and the maintainer skill `itf-release-notes`, which lived inside the package at `.agents/skills/itf-release-notes/SKILL.md`. OpenCode loads every `SKILL.md` inside an installed package. Codex listed only ItF. The file is also in v0.6.0. Fixed by moving it out of `SKILL.md` form in [#146](https://github.com/zhiganov/impact-to-funding/pull/146).

## Limits

- No model ran, so these checks don't cover the agent reading references or following the skill. The earlier [installation checks](installation-check-2026-11-04.md) include model runs, on older versions.
- Linux only. No Windows or macOS run.
- Claude Code installs through the skills CLI weren't checked in Claude Code itself.
- One run each.
