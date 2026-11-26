# Lessons from impeccable

[impeccable](https://github.com/pbakaus/impeccable) is a frontend design skill with a command-line tool, an editor extension and a native engine. It ships to many agents. This note records what ItF could learn from how it releases.

Read on 2026-11-26 from a shallow clone at `2fc5e14` and its tag list. It wasn't installed or run, and its release pages weren't opened.

## How it releases

- **Five parts, versioned separately:** the skill, the CLI, the extension, the engine and "loop", with 128 tags between them, such as `skill-v4.11.1` and `engine-v…`.
- **A maintainer runs one script.** `node scripts/release.mjs <part>` tags and publishes a release. It refuses:
  - a dirty tree;
  - unpushed code;
  - a missing changelog entry;
  - for the skill, generated files that no longer match what a fresh build makes.
- **Binaries are built by a workflow.** Pushing an `engine-v…` tag builds the engine for every platform, signs the Windows build and publishes the binaries with SHA-256 files beside them. A manual run only rehearses the build: signing and publishing happen only on a tag.
- **One source, many agents.** The plugin folder is committed in the repository, and the marketplace points at it (`"source": "./plugin"`). A workflow regenerates copies for about 20 agents, including Cursor, Codex, Gemini, Kiro and OpenCode, whenever the skill changes. The repository holds a folder for each.
- **CI on every pull request,** and third-party actions pinned to exact commits.

## How ItF compares

- **Starting a release:** ItF tags and publishes when a version bump merges, with no local script. impeccable's script runs on a maintainer's machine, and its checks happen there.
- **What people install:** ItF ships the Claude Code plugin as a release zip pinned by SHA-256. impeccable ships it as a folder in the repository. ItF's way keeps built files out of Git. impeccable's needs no release step for the plugin.
- **Other agents:** ItF relies on `npx skills add` or a clone of the tag. impeccable maintains its own copy for each agent.

## Worth adopting

- **Tests on every pull request,** and **actions pinned to exact commits**. REA does both too: see [lessons from REA](lessons-from-rea.md#release-engineering).
- **Refuse to release when generated files have drifted.** If ItF ever commits generated output, such as a library snapshot or per-agent copies, the release should check it matches a fresh build.

## Not now

Per-agent generated copies matter only if ItF ships plugins for Codex, Cursor or others. Separate versions per part suit a project with several products. ItF has one.
