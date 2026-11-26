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

## v0.7.0 recheck, 2026-11-26

The same discovery checks, rerun at v0.7.0 (`5bedf2d`) with the same Codex 0.171.0, OpenCode 1.19.6 and skills CLI 1.9.0, plus checks of the Claude Code plugin. No model ran.

| Install | Codex lists | OpenCode lists |
|---|---|---|
| One-line clone into `.agents/skills/` | `impact-to-funding` once | `impact-to-funding` once, from `.agents/skills` |
| One-line clone into `.opencode/skills/` | not checked | `impact-to-funding` once |
| `npx skills add zhiganov/impact-to-funding#v0.7.0`, for Codex, OpenCode and Claude Code | `impact-to-funding` once | `impact-to-funding` once, from `.claude/skills` |

- **The maintainer skill is gone.** At v0.6.0, OpenCode also listed `itf-release-notes` from a copy in `.agents/skills`. At v0.7.0 it doesn't, which confirms [#146](https://github.com/zhiganov/impact-to-funding/pull/146).
- **The skills CLI** pinned commit `5bedf2d` in `skills-lock.json`, and put copies in `.claude/skills/` and `.agents/skills/`. OpenCode reads both and lists the name once.

### Claude Code plugin

In throwaway Claude Code 2.1.331 configs, so no real setup changed:

- **Fresh install:** `claude plugin marketplace add https://github.com/zhiganov/impact-to-funding.git`, then `claude plugin install itf@impact-to-funding`. It installed version 0.7.0, and `claude mcp list` showed `itf_library` connected.
- **Update:** 0.6.0 was installed from a local copy of the marketplace at the commit before [#156](https://github.com/zhiganov/impact-to-funding/pull/156). After moving that copy to the current `main`, `claude plugin marketplace update` and `claude plugin update itf` reported "updated from 0.6.0 to 0.7.0". The library server connected afterwards.
- **The zip** downloaded from the release matched GitHub's digest and the marketplace SHA-256 (`0f5528d1…d765`). It opened cleanly, with 1,062 files and `plugin.json` at 0.7.0.

### Limits

As above: discovery and install only, Linux only, one run each. The update check used a local copy of the marketplace for the starting point. It downloaded the 0.7.0 zip from GitHub.
