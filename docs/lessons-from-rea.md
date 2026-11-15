# Lessons from REA

[REA](https://github.com/morluto/rea) ("Reverse Engineer Anything") is an MCP server and agent skill for inspecting apps and binaries. Its job is very different from ItF's, but it solves several of the same problems: packaging a skill with a server, getting it into many hosts, and keeping conclusions tied to evidence. This note records what ItF could learn from it.

Read on 2026-11-15 at commit `04cb416`: the README, the main skill (`.agents/skills/reverse-engineer-anything/SKILL.md`, about 43,600 characters), the plugin manifests and the release-notes maintainer skill. REA wasn't installed or run. REA is MIT-licensed; any ItF text would be our own.

## Worth learning from

| # | REA practice | What ItF could do |
|---|---|---|
| 1 | **One setup command for skill and server.** `npx rea-agents setup` lets you choose agents, shows the planned changes, backs up existing config, then registers the MCP server and installs the matching skill. | ItF has the managed CLI (`itf`) for the skill and a library MCP that people register by hand. An `itf setup` could offer to register the library MCP, after showing a plan and backing up config. Tracked in [#105](https://github.com/zhiganov/impact-to-funding/issues/105). |
| 2 | **Plugin packages per host.** `.claude-plugin/` (with a marketplace file), `.codex-plugin/` and `.cursor-plugin/` each bundle the skill and the server. REA is also listed on skills.sh. Its skill treats plugin installs separately when recovering. | A Claude Code plugin bundling the skill and the library MCP. It needs a decision on how plugin installs coexist with the managed CLI. Tracked in [#106](https://github.com/zhiganov/impact-to-funding/issues/106). |
| 3 | **Connect only when needed.** The skill tells the agent not to run diagnostics or setup before every task. Recovery steps live in a separate reference, read only when something fails. | ItF already skips its update check silently (#83). Install and update troubleshooting could move into a reference read only on failure. Tracked in [#109](https://github.com/zhiganov/impact-to-funding/issues/109), which covers the update-notice section: the core has no install troubleshooting. |
| 4 | **Observations, inferences and unknowns kept apart,** with the evidence for each cited. At the end, the agent revisits the original questions and marks each answered, partly answered or unresolved. It doesn't call the work complete while questions stay open. | ItF's claim reference already separates support levels. The end-of-task check would fit the report and support-brief playbooks. Done in [#104](https://github.com/zhiganov/impact-to-funding/pull/104). |
| 5 | **Bounded searches stay bounded.** A search that found nothing reports what it covered, not that nothing exists. | For funder research: "no match in these sources on this date", never "no funders exist". #81 is close; one explicit line would settle it. Done in [#104](https://github.com/zhiganov/impact-to-funding/pull/104). |
| 6 | **A finding ledger** links each conclusion to its evidence, confidence, how far the search went, and what's still unknown. | A short ledger for work that spans sessions, such as a guild report, reusing the [evidence worksheet](../assets/evidence-crosswalk.md). Tracked in [#110](https://github.com/zhiganov/impact-to-funding/issues/110). |
| 7 | **Showcases, and an invitation to share cases** through an issue or PR with four fields: target, question, how REA helped, what was found. | A field-note issue template (what the person was working on, their question, how ItF helped, what changed), with consent and privacy rules. ItF has one field note (#57) so far. Done: the [field-note form](https://github.com/zhiganov/impact-to-funding/issues/new?template=field-note.yml). |
| 8 | **Maintainer skills in the repo** (`.agents/skills/`): release notes, CI audits and tool design. The release-notes skill works from pinned Git history, thanks contributors only by verified identity, never guesses handles, and doesn't authorise tagging or publishing. | A maintainer skill for release notes, based on how [v0.5.0's notes](releases/v0.5.0.md) were built, and another for rewriting issues under the rules in [`AGENTS.md`](../AGENTS.md). Release notes: tracked in [#107](https://github.com/zhiganov/impact-to-funding/issues/107). Issue rewrites: [#108](https://github.com/zhiganov/impact-to-funding/issues/108) was closed, because `AGENTS.md` already covers it; its missing step was added there instead. |
| 9 | **A notice about official sources:** a similar repo name or copied README doesn't make a download official. | A short note in the README, once ItF is listed in marketplaces. Done: the README's "Official source" note. |

## Not worth copying

- **Skill size.** REA's skill is about three times the size of ItF's core, which was trimmed on purpose (#83, #84).
- **"Keep your installation up to date."** REA asks users to update often. ItF updates are deliberate, with no automatic changes, which suits a tool people use for funding claims.
- **Marketing badges, trend widgets and a README in 25 languages.** That's a lot of upkeep before there's demand.

## Limits

This is a desk reading of documentation and skill text at one commit. It doesn't check whether REA's setup or plugins work as described, or that the practices help REA's users. The table notes which ideas are done and which have their own issue.
