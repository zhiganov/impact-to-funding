# OpenCode installation check — 2026-11-04

## Result

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

The cause is **unresolved**. This check does not distinguish configuration/permission effects, discovery lifecycle behaviour, version-specific host behaviour or a packaging issue. Do not present any of those as a verified root cause, or claim the skill is incompatible with every OpenCode installation.

Manual development trials documented in the [validation notes](validation-2026-11-04.md) exercised instruction-following, not installation. They remain useful bounded evidence but do not close this gate. There is no new semantic trial or paid-run evidence here.

## Operational lesson and next decision

Use the host's supported authenticated client and verify the target context before interpreting a capability result; see [contribution guidance](../CONTRIBUTING.md). Do not add a custom credential mechanism or build more installation infrastructure merely to keep an exhausted route running.

The current options are an explicitly manual-use-only experimental distribution, without an install-tested claim, or a separately scoped host-discovery diagnosis. Changing the release acceptance boundary requires an explicit decision; another wrapper, config variant or turn does not silently reopen the stopped checks. No tag/release, global skill installation, outreach or integration was performed by this task.

Technical references: the official V2 [skills guide](https://opencode.ai/v2/docs/skills), [API reference](https://opencode.ai/v2/docs/api), and [client/authentication guide](https://opencode.ai/v2/docs/build/client). Documentation describes intended behaviour; the observations above describe this fixture only.
