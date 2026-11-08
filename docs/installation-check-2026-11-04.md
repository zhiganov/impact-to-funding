# OpenCode installation check — 2026-11-04

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
awaits plugin activation. The bounded correction used that supported readiness
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
not the diagnostic API sequence. The source pin remains `22d4c8d`; this follow-up
does not change the earlier prerelease or resume recruitment.

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
| Separately approved explicit-source check | The disposable project declared the documented V2 `skills` source for the parent skill directory. The native skill-list response again identified the intended project and returned an empty registry. | The alternate documented source setting did not establish discovery in this fixture. The check stopped at its first failure; no activation or further API attempts followed. |

The original route permitted one evidence-backed correction. After it stopped, the owner explicitly selected one bounded explicit-source check, with no automatic retries. Both stopped outcomes remain recorded; unused downstream API-call allowance is not permission to resume them.

## Interpretation and limits

The installed bytes matched the selected source, but file presence, a valid package check and source configuration do not establish working host discovery. The correct location in the native responses rules out merely assuming a different location from a missing ID; it does not explain the empty catalogue.

At the end of this original check, the cause was **unresolved**. These probes did not distinguish configuration/permission effects, discovery lifecycle behaviour, version-specific host behaviour or a packaging issue. The follow-up above establishes a successful readiness-aware check in the normal host environment; it does not prove every earlier isolated probe had the same cause.

Manual development trials documented in the [validation notes](validation-2026-11-04.md) exercised instruction-following, not installation. They remain useful bounded evidence but do not close this gate. There is no new semantic trial or paid-run evidence here.

## Operational lesson and next decision

Use the host's supported authenticated client and verify the target context before interpreting a capability result; see [contribution guidance](../CONTRIBUTING.md). Do not add a custom credential mechanism or build more installation infrastructure merely to keep an exhausted route running.

At the original stopping point, the options were an explicitly manual-use-only experimental distribution, without an install-tested claim, or a separately scoped host-discovery diagnosis. The later successful follow-up was explicitly authorised; it did not silently reopen these checks or change the release acceptance boundary. No tag/release, global skill installation, outreach or integration was performed by the original task.

Technical references: the official V2 [skills guide](https://opencode.ai/v2/docs/skills), [API reference](https://opencode.ai/v2/docs/api), and [client/authentication guide](https://opencode.ai/v2/docs/build/client). Documentation describes intended behaviour; the observations above describe this fixture only.
