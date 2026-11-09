# Native CLI installation checks

## Claude Code project-local verification — 2026-11-09

**Checked package:** `4566892ad990131fb36f760e14c73e5f275600cc`.
**Host:** Claude Code 2.1.321, existing sign-in, CLI-default model
(`claude-opus-5-5`) with no model override. One approved synthetic run; no
automatic rerun.

The complete public repository was cloned from GitHub into a disposable Git
project at `.claude/skills/impact-to-funding`, then checked out at that exact SHA.
No personal or other ItF installation existed or was changed.

The run used `claude -p` with `--setting-sources project,local`, an empty
`--strict-mcp-config`, read-only tools (Read, Glob, Grep, Skill) and the explicit
`/impact-to-funding` invocation, without supplying a skill-file path. User
settings were omitted to avoid configured hooks and plugins; user-level
`CLAUDE.md` instructions still applied. This is not a pristine new-account
comparison.

Observed evidence:

- Session initialisation listed the project skill `impact-to-funding`; no MCP
  servers were loaded.
- The persisted session log shows the skill body injected into context: all 78
  checked `SKILL.md` lines were present verbatim.
- The model read bundled `references/contributions.md`; the captured tool output
  matched the frozen file exactly.
- The same fictional request as the Codex check (four weekly hours on an
  accessibility guide, uncertain benefit, no funding goal) produced a response
  that separated supplied facts from assumptions, proposed low-cost checks, kept
  stopping as a legitimate option and asked questions. No contribution, consent
  or outcome was created.
- All 106 tracked package files retained their source hashes; the clone and
  disposable project stayed clean. No permission denials, file-change, web or
  MCP action occurred.

This establishes a limited **project-local explicit CLI activation and bundled-
reference access check** for Claude Code at the named source. It does not
establish implicit trigger reliability, the interactive `/` menu, IDE/desktop
support, personal scope, update/removal behaviour, human usefulness or
fundraising benefit. Raw traces remain private.

## Codex project-local verification — 2026-11-09

**Checked package:** `4566892ad990131fb36f760e14c73e5f275600cc`.
**Host:** Codex CLI 0.166.0, existing ChatGPT sign-in, CLI-default model with no
model override. One approved synthetic run; no automatic rerun.

The complete public repository was cloned from GitHub into a disposable Git
project at `.agents/skills/impact-to-funding`, then checked out at that exact SHA.
No existing or personal/global ItF installation was changed.

The run used `codex exec --ignore-user-config --ephemeral --sandbox read-only`
and the explicit `$impact-to-funding` mention, without supplying a skill-file path
in the prompt. User configuration was omitted to avoid configured MCP/hook setup;
the native auth backend was retained and user-level agent instructions still
applied. This is not a pristine new-account or fully default-config comparison.

Observed evidence:

- The CLI selected the project skill and read its `SKILL.md` and bundled
  `references/contributions.md` in one successful local file-reading command.
  Captured tool output matched both frozen files exactly; it was not just a
  plausible path or a model's assertion of having read them.
- The fictional request described four weekly hours maintaining an accessibility
  guide, uncertain user benefit and no funding goal. The response separated supplied
  facts from a proposal, kept collaborator availability unknown and asked one
  question. No actual contribution, participant consent or outcome was created.
- All 106 tracked package files retained their source hashes; the clone stayed
  clean. The trace contained no file-change, web-search or MCP action. The owned
  process group exited with no remaining child processes.

This establishes a limited **project-local explicit CLI activation and bundled-
reference access check** at the named source. It does not establish implicit
trigger reliability, interactive `/skills` UI, IDE/desktop/plugin support,
personal scope, update/removal behaviour, human usefulness or fundraising benefit.
The response also reflected inherited host instructions; it is not a blind
behavioural evaluation. Complete raw traces remain private, not a distributed
transcript or a new public benchmark.

**Claude Code:** see the separate limited check above at the same source.
**OpenCode:** the historical checks below retain their
own source/version boundaries; `4566892` was not rechecked there. The
[installation guide](install.md) separates these statuses and scopes. No installer,
plugin marketplace, hosted service, new release or user recruitment was introduced.

## Systems/complexity guidance verification — 2026-11-09

**OpenCode checked skill source: `fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b`.**
The published change adds an optional systems/complexity reference, selective
core-skill routing, a fictional illustration and source/rights notes. It covers
causal hypotheses, feedback, emergence and adaptive learning without a required
framework, system map or maturity ladder. It does not implement a detailed Cynefin
workflow or establish model conformance with that method.

The existing global OpenCode v2.2.5 installation was updated to that exact source.
The readiness-aware registry returned the exact revised body, and the native skill
tool loaded it in the current session. All 14 bundled reference files matched the
source bytes. A host read tool accessed the installed systems/complexity reference.
No restart, global-settings change or additional source retrieval was needed.

Four package checks and independent read-only content review passed for the
five-file source change. Hard boundaries, claim guidance, financial fields,
templates and library records were unchanged. These checks establish instruction
loading and reference access, not reliable model selection or human usefulness.
No fresh behavioural trial, paid evaluation, new release or outreach occurred.
Earlier checks below retain their own revisions and limits.

## Reference-library integration verification — 2026-11-08

**Reference-library integration check source: `3ebefebf0ccdab12c6a2752aa4fce122c41129a0`.**
The published integration adds conditional instructions for reading the library
index and relevant case/pattern/lens notes, not a database or live retrieval
service. The existing global OpenCode installation was updated to that exact
revision without changing global settings or restarting the session.

The OpenCode v2.2.5 registry returned the exact revised body and the native skill
tool loaded it in the current session. All nine bundled library files matched the
source bytes. Host read tools accessed the installed index, P001 and C002; these
were deliberate reference-access checks, not a blind test of model selection or
reasoning. No underlying case source was fetched again.

Four package checks and independent static routing review passed. Original hard
boundaries, financial fields and case/pattern/lens record contents were unchanged;
the library index moved to revision 2 for the integration wording. No fresh model
trial, paid evaluation, new release, outreach or systems/complexity method change
occurred. Earlier checks below retain their own exact revisions and limits.

## Revised workflow verification — 2026-11-08

**Purpose-alignment check source: `666f8f8060276cebc3bc14f632676035cc831579`.**
After purpose alignment, the revised source was published and the existing global
OpenCode installation was updated to that exact revision. The native OpenCode
v2.2.5 registry selected the intended global skill and returned the exact revised
body; the native `skill` tool then loaded it successfully in the current session.
No host-code or global-settings change was needed.

The four package checks and independent static review passed. Hard boundaries
and assessment funding fields were unchanged. This verifies registration and
instruction loading, not user usefulness, reliable model behaviour, available
collaborators or funding. No new release, separate model trial, paid evaluation
or outreach occurred. The earlier `22d4c8d` check below remains its own dated
evidence; it is not presented as a test of the revised instructions.

## Successful follow-up — 2026-11-08

**Native discovery and activation passed in OpenCode v2.2.5 on macOS for source
`22d4c8d31aa32e98609341eb7fd4eadc85a8608a`.** This supersedes the current-readiness
interpretation of the earlier empty registries, not their recorded observations.
The original 2026-11-04 checks below were not rerun or retroactively passed.

The follow-up installed the complete 45-file pinned package at the documented
project-local `.opencode/skills/impact-to-funding` path in a disposable Git project.
It used the existing authenticated native CLI and normal host configuration, not
the original isolated profile. No skill-body, global configuration or host-code
change was needed.

### Why the empty registry was misleading

In the [v2.2.5 skill-list handler](https://github.com/anomalyco/opencode/blob/v2.2.5/packages/server/src/handlers/skill.ts),
`skill.list` returns the registry without awaiting plugin activation. The registry
starts empty; the configuration plugin subsequently registers filesystem skills.
The server log showed ItF and an existing global skill being registered after the
earlier 2026-11-08 empty response. Correct location and HTTP success alone did not
establish discovery readiness.

The existing [agent-list handler](https://github.com/anomalyco/opencode/blob/v2.2.5/packages/server/src/handlers/agent.ts)
awaits plugin activation. The follow-up used that supported readiness
boundary before reading the skill list; no polling, delay loop, new runner,
installer or package repair was added. The native
[session skill lookup](https://github.com/anomalyco/opencode/blob/v2.2.5/packages/core/src/session/skill.ts)
also awaits activation, so the premature inventory check was not a demonstration
that normal skill activation failed.

### Observed result and limits

- After readiness, the registry returned exactly one `impact-to-funding` entry
  from the intended installed path, with content matching the pinned skill body.
- A disposable session activated that skill through the native API using
  `resume: false`. Its context contained the exact skill body and no assistant
  response. All 14 supporting links resolved locally; the host read the claim
  reference and assessment template with matching bytes.
- Recorded session cost and all input/output/reasoning/cache token counters were
  zero. No model-generation endpoint, paid evaluation or fresh behavioural trial
  was invoked. This is not an interactive TUI test or evidence of user usefulness.
- The owned session and disposable installed package were removed. No global
  installation, outreach, release/tag change or Vercel Skills CLI execution occurred.
- Raw envelopes and diagnostics remain private; no credentials, feedback or
  personal evidence are distributed with this note. Other hosts remain untested.

For normal installation and invocation, use the [README instructions](../README.md#install-and-use-in-opencode),
not the diagnostic API sequence. This check used source `22d4c8d`; later checks
and their exact revisions are recorded above. The earlier prerelease is unchanged.

## Original result — 2026-11-04

**Native discovery and activation are not verified.** No install-tested compatibility claim or formal release follows from this check. Manual file-reading remains the documented use mode; it is not a substitute for passing a discovery/activation check.

The release-facing documentation was published at `cc953001df8ebb74afb6da2a7d1ed32ab4985b25`. The isolated installation used that exact source revision. This note records bounded unsuccessful probes, not a demonstrated defect in the skill or in OpenCode.

## Scope and isolation

- Installed OpenCode CLI: **v2.2.5**, on macOS.
- All 20 repository files were copied from the published Git revision into a disposable project's `.opencode/skills/impact-to-funding` directory and byte-compared with the source.
- A separate home/config/data/cache/state environment was used. Existing credentials and provider environment variables were not copied into it. Fixture settings requested provider-use denial and disabled warming; those settings are not a claim of independently audited sandbox enforcement.
- No model-generation prompt or endpoint was invoked. No test session was created and no activation was attempted, so there is no recorded session-usage result to report as zero.
- Raw diagnostics and fixture paths are retained privately, not bundled here. Credential-related startup output was redacted before further retention/sharing.

## Observed sequence

| Probe | Observation | What it establishes |
|---|---|---|
| Direct HTTP to an owned loopback server | `/api/info` returned HTTP 401, before skill discovery. The owned server was stopped and its port closed. | The probe did not supply the runtime's required authentication. This was an invocation problem, not evidence about the skill. Loopback/private hosting did not imply authentication-free access. |
| Native authenticated CLI, project-local discovery | `opencode api --standalone` identified v2.2.5. Its skill-list response identified the intended disposable project but returned an empty registry. | The supported client reached the intended location, but the target skill was not discovered in this probe. Registration/activation was not verified. |
| Explicit-source check | The disposable project declared the documented V2 `skills` source for the parent skill directory. The native skill-list response again identified the intended project and returned an empty registry. | The alternate documented source setting did not establish discovery in this fixture. No activation or further API attempts followed that result. |

Both unsuccessful probes are retained as historical observations. The later
readiness-aware checks above provide the successful discovery and activation
evidence; they do not retroactively turn these earlier results into passes.

## Interpretation and limits

The installed bytes matched the selected source, but file presence, a valid package check and source configuration do not establish working host discovery. The correct location in the native responses rules out merely assuming a different location from a missing ID; it does not explain the empty catalogue.

At the end of this original check, the cause was **unresolved**. These probes did not distinguish configuration/permission effects, discovery lifecycle behaviour, version-specific host behaviour or a packaging issue. The follow-up above establishes a successful readiness-aware check in the normal host environment; it does not prove every earlier isolated probe had the same cause.

Manual development trials documented in the [validation notes](validation-2026-11-04.md) exercised instruction-following, not installation. They remain useful bounded evidence but do not close this gate. There is no new semantic trial or paid-run evidence here.

## Diagnostic lesson

Use the host's supported authenticated client and verify the target context and
registry readiness before interpreting a capability result; see
[contribution guidance](../CONTRIBUTING.md).

The original checks established no native compatibility. The later successful
follow-up documents that compatibility for its exact host and source revision.
Neither result changes the earlier release tag or establishes user usefulness.

Technical references: the official V2 [skills guide](https://opencode.ai/v2/docs/skills), [API reference](https://opencode.ai/v2/docs/api), and [client/authentication guide](https://opencode.ai/v2/docs/build/client). Documentation describes intended behaviour; the observations above describe this fixture only.
