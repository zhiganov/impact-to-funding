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

At that stage, only the status and file comparisons were observations. The
following trial exercises selected parts of the evidence workflow. Revision
conflict handling and failure recovery remain contract-only observations.

## Bounded synthetic evidence trial

On 2026-11-15, REA `6.9.0` inspected a fictional, two-file JavaScript package:
129 bytes of package metadata and 292 bytes of source. The source declares one
Electron IPC handler, `fixture:read-sample`, returning a fictional title and an
unknown outcome. It has no network, filesystem or subprocess operations.

The package was inspected statically and never executed. No dependencies were
installed. One producer call succeeded without a correction, using a 30,000 ms
per-source analysis budget and a 256 MiB analyzer old-space budget. Those bounds
are not a total-process-memory or end-to-end time guarantee.

### What happened

| Question | Observation |
|---|---|
| Does a summary distinguish itself from its source? | Yes. The returned summary had its own Evidence ID and named a different complete parent ID. |
| Can a later operation reuse that parent? | Yes. A four-row module page and a literal-channel trace used the retained parent. The trace named that same source and matched one seed, with five nodes and four edges. There was one application-analysis producer call. |
| Does complete graph coverage imply complete understanding? | No. The application graph was marked complete, while semantic coverage stayed unknown with three semantic unknowns. The trace retained both observed and inferred facts, plus an explicit runtime-reachability limitation. |
| Do records survive export, reset and import? | Yes. Six Evidence records and one explicitly tracked question were exported. Reset cleared the ledger; import restored all six records and the question. Reading the same module page returned its original Evidence ID. The re-export was byte-for-byte identical to the pre-reset bundle. |
| Does an unresolved runtime question become resolved during reuse? | No. The question about whether the handler had processed a real message stayed open at revision 1, with no resolution and a requirement for observed controlled-replay evidence. |
| Was the investigation cleaned up? | Yes. A final bundle was saved, then the investigation was cleared. Final status reported no open target, retained records, question revisions, retained bytes or pending cleanup. |

The module page contained four graph nodes for the same source path. These were
different graph identities, not four independent sources. The three embedded
semantic unknowns also remained distinct from the one question explicitly added
to the question registry. That question had null target scope because this
target-free analysis opened no binary session; linking supporting Evidence did
not select its scope.

### Evidence anchors

The complete bundles remain private. These IDs identify the retained records in
those bundles; they are not public download or access links.

- Source: `ev_e4750c0201b6f47add05a2fce050925325ba4a97747e38507390525e6ffb7ddf`.
- Initial summary: `ev_9873d22217cbf20f89ecf56b9fb2b52195b18442d28fc14a83905a9e72b3c929`.
- Module page before and after import: `ev_d3f62e073257cc86e1d4c0bff0e9abb7f0b1a216039de8df4925de2cca37fab7`.
- Trace: `ev_24cb5a32c4fb799e907de67201420282f77db7cb799dcf9a6544d573793b9e87`.
- Open question: `unk_0880039794a7ec4f8bd25bfa608ea9feaef4365238d04b16d893ff984375b243`.
- Before-reset, checkpoint, round-trip and final bundles: 126,994 bytes each,
  SHA-256 `f3e56e03023041171626faf7a84f25c1d1c37216b5ab48b23a7aa53c517b98b0`.

### What this changes for ItF

These mechanisms now have a small observed example behind the contract review:
exact source/view identity, reuse without another producer call, explicit
unresolved questions, and lossless export/import within the tested scope.

For [#110](https://github.com/zhiganov/impact-to-funding/issues/110), compare the
existing worksheet and portable records with these behaviours. Preserve the
difference between reading all supplied material, understanding its meaning and
establishing an outcome. Source and question scope should be deliberate.
Existing version and review bindings already cover much of this.

The result supports that focused comparison, not a new evidence service or a
mandatory ledger. No further REA fixture is needed for the agreed trial.

### Trial limits

This was one 421-byte synthetic package. Export/reset/import used the same
running REA server; it did not test restart or crash recovery. The trial did not
exercise malformed imports, stale revisions, timeout/cancellation handling,
native engines, application execution or model behaviour. A successful
round trip preserves recorded content and uncertainty; it does not validate the
real-world truth of that content.

## Not worth copying

- **Skill size.** REA's skill is about three times the size of ItF's core, which was trimmed on purpose (#83, #84).
- **"Keep your installation up to date."** REA asks users to update often. ItF updates are deliberate, with no automatic changes, which suits a tool people use for funding claims.
- **Marketing badges, trend widgets and a README in 25 languages.** That's a lot of upkeep before there's demand.

## Limits

The earlier review is a desk reading at one source commit. The second adds
installed-file comparisons, connected contracts and a status response. The third
adds the bounded static-analysis and evidence round trip described above.
Setup, plugins and user benefit remain untested. The tables distinguish existing
delivery from ideas still being assessed.
