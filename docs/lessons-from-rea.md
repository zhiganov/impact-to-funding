# Lessons from REA

[REA](https://github.com/morluto/rea) ("Reverse Engineer Anything") is an MCP server and agent skill for inspecting apps and binaries. Its job is very different from ItF's, but it solves several of the same problems: packaging a skill with a server, getting it into many hosts, and keeping conclusions tied to evidence. This note records what ItF could learn from it.

The earlier repository review, on 2026-11-15 at commit `04cb416`, read the README, the main skill (`.agents/skills/reverse-engineer-anything/SKILL.md`, about 43,600 characters), the plugin manifests and the release-notes maintainer skill. That review did not install or run REA. A later installed-skill and connected-contract check is recorded below. REA is MIT-licensed; any ItF text would be our own.

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

## Installed skill and connected contracts

A second check on 2026-11-15 read the installed skill and its evidence,
JavaScript and recovery guides, inspected focused connected tool schemas, and
called `binary_session({})`. It opened no target and ran no analysis.

### What was observed

| Check | Result and scope |
|---|---|
| Connected server identity | The status response reported `rea-agents` and server version `6.9.0`, expected skill version `62`, and a catalogue of 255 MCP tools. |
| Installed skill | Its metadata declared version `62` and 255 tools. All nine installed skill/reference files had the same SHA-256 hashes as the copies bundled with the local server package. |
| Exact skill bytes | `SKILL.md` SHA-256: `9312fa145b251ea428809634f039fb4ac15f18d59a32d6004a638b2de7d22016`. |
| Current state | No open target, retained Evidence, tracked question history or pending cleanup was reported. |
| Availability | The status advertised target-free operations, including JavaScript analysis and evidence handling. Native decompiler candidates were unavailable in this installation. Availability remains operation- and host-specific. |

The server reported no build commit. Matching installed and bundled files
establishes byte consistency, not an authenticated source revision. The status
response left its own alignment assessment unknown because no expected identity
was supplied. The local comparisons above are separate observations.

Reading an installed skill is not inherently stronger than reading the same
text on GitHub. The extra evidence here is the match to the installed package,
the connected contracts and the successful status call. No advertised analysis
operation has been exercised by this check.

### More precise lessons for ItF

| Connected contract or skill instruction | Implication for ItF and existing work |
|---|---|
| **A view and its source have different identities.** `inspect_analysis_view` gives a summary or page its own Evidence ID; `normalized_result.parent_evidence_id` identifies its complete retained source. Referencing it does not rerun the producer. | A report excerpt or funder-facing summary should remain linked to the exact evidence and claim versions it derives from. A summary must not silently replace its source or inherit a broader review. Assess this in [#110](https://github.com/zhiganov/impact-to-funding/issues/110), reusing the [evidence worksheet](../assets/evidence-crosswalk.md) and [portable records](../tools/portable-records/README.md). |
| **Retention, source coverage and page coverage are separate.** A complete retained record can describe partial analysis. Exhausting its pages says nothing more about the unexamined source. `detail: "summary"` reduces delivery, not analysis work. | Keep “all supplied records read” separate from “the relevant population covered” and “the outcome established.” A shorter answer is not evidence of less processing. #110 can compare these distinctions with existing evidence guidance rather than introduce another completeness score. |
| **Questions have history, not just a final label.** `record_unknown` links supporting and contradicting evidence. `update_unknown` requires the expected revision and appends a revision. `verify_unknown_resolution` distinguishes verified, withdrawn and out-of-scope dispositions. | Preserve why an earlier claim or question changed. Dropping a question is different from answering it. Reuse exact review bindings and correction links; #110 owns the remaining gap assessment, while [#29](https://github.com/zhiganov/impact-to-funding/issues/29) owns portable handoffs. REA's technical verification rules are not a social-impact certification model. |
| **Reuse and persistence have explicit boundaries.** Retained references belong to the current connection. `close_binary` keeps Evidence in memory; export saves a bundle, import validates and merges it, and reset clears history unless it is saved first. | A later session needs the permitted source records, not merely an identifier or a polished summary. Assess continuity with the existing private files and converters in #110. Exporting a record neither grants a new audience permission nor establishes that it contains every linked source. |
| **Tool registration and actual capability are distinct.** `binary_session` separates server identity, client features, provider candidates and operation availability. Recovery guidance distinguishes plugin-owned from setup-owned registration and client rejection from provider failure. | Refine [#105](https://github.com/zhiganov/impact-to-funding/issues/105) and the [#106](https://github.com/zhiganov/impact-to-funding/issues/106) plugin alternative. Keep skill, helper, server and host versions distinct using the existing [provenance design](skill-version-provenance.md). Optional setup should not silently add funding discovery or broaden permission. |
| **The material and question select the route.** Static JavaScript analysis accepts its target directly; it needs no preliminary binary session. Guidance sends recovery work to a separate reference when a failure warrants it. | [#111](https://github.com/zhiganov/impact-to-funding/issues/111) assesses starting useful work from supplied material. [#109](https://github.com/zhiganov/impact-to-funding/issues/109) keeps update details out of the core. Both preserve a lightweight conversation; ordinary use needs no forensic workflow. |

These are refinements to existing scopes. They do not select a new evidence
database, mandatory ledger, integration or REA dependency. Existing ItF work
already covers much of the intended behaviour.

### Sources and evidence level

- Installed skill version `62`: `SKILL.md`,
  `references/evidence-workflows.md`, `references/javascript-applications.md`
  and `references/connection-and-recovery.md`.
- Connected contracts: `binary_session`, `analyze_javascript_application`,
  `inspect_analysis_view`, `trace_application_feature`, `get_evidence_bundle`,
  `export_evidence_bundle`, `import_evidence_bundle`, `compare_bundles`,
  `record_unknown`, `update_unknown`, `verify_unknown_resolution`,
  `close_binary` and `reset_investigation`.
- Upstream explanation: [retained application Evidence](https://github.com/morluto/rea/blob/main/docs/mcp-contracts.md)
  and [CLI evidence reuse](https://github.com/morluto/rea/blob/main/docs/cli.md).
  These links track upstream main; the local observations above identify the
  inspected installation.

The status and file comparisons are observations. Evidence reuse, revision
handling, export/import and recovery behaviour were inspected as contracts,
not tested. A separate bounded synthetic trial could examine those behaviours;
it is not a delivery requirement for ItF.

## Not worth copying

- **Skill size.** REA's skill is about three times the size of ItF's core, which was trimmed on purpose (#83, #84).
- **"Keep your installation up to date."** REA asks users to update often. ItF updates are deliberate, with no automatic changes, which suits a tool people use for funding claims.
- **Marketing badges, trend widgets and a README in 25 languages.** That's a lot of upkeep before there's demand.

## Limits

The earlier review is a desk reading at one source commit. The second adds
installed-file comparisons, connected contracts and one status response. Neither
checks REA's setup, plugins or target-analysis behaviour, or establishes benefit
to users. The tables distinguish existing delivery from ideas still being assessed.
