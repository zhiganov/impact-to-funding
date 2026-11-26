# Profile editing: local MCP assessment

Assessment for [#168](https://github.com/zhiganov/impact-to-funding/issues/168), 2026-11-26. It compares profile-editing routes for OpenCode, Codex CLI and Claude Code. It also defines a bounded MCP prototype for later selection. This assessment selects no implementation or account writes.

## Outcome and current friction

The person should be able to ask their agent for a profile change and review the exact public result. Approval should require no field-by-field copying into a web form.

The current app already provides sign-in, validation, a publication preview, CID conflict checks and read-back. The missing link is a structured handoff from the agent to that flow.

A manual edit can involve a summary, eight areas, two support links and ten reports. Each report has five required fields and five optional fields. Copying a report-rich profile would be tedious and error-prone.

Only two public accounts held a profile at the last inventory. Neither linked a report, support profile or impact card. No builder has reported copy/paste friction or repeated editing. The structural problem is real, but its frequency and cost to users are unknown.

## Route comparison

| Route | What it adds | What it preserves | Main cost |
|---|---|---|---|
| **Browser JSON handoff** | The agent writes a candidate profile file. The app imports, validates and shows it in the existing review flow. | Current OAuth, preview, publish and unpublish behaviour. No new credential store. | A small app import flow and a versioned file contract. The person still chooses the file. |
| **Local MCP** | Structured profile reads, validated diffs and interactive publishing in the agent. | Local processing and direct PDS access. One existing MCP registration can gain an opt-in module. | OAuth/session management, shared validation, host registration and a human-confirmation path. |
| **Local CLI** | The same core read/write operations through shell commands. | The same local boundaries as MCP. | Nearly the same OAuth and confirmation work, without MCP's schemas and tool discovery. |
| **Hosted Streamable HTTP MCP** | A remote connector usable without a local server. | The static public site could remain separate. | Hosted authentication, token/session handling, logging, retention, abuse controls, rate limits and operating cost. |

A CLI does not remove the difficult work: authenticated publication is harder than the protocol wrapper. Build a CLI first only if people also need a standalone command.

## Recommendation

**Add the browser JSON handoff first. Do not start MCP implementation yet.**

This removes copy/paste work and reuses the app's tested publication boundary. It also gives us a useful comparison. Any remaining file-handoff friction would give a local MCP prototype a concrete problem to solve.

If MCP proceeds later, use the agreed **one MCP installation with opt-in capabilities**. Keep the existing library tools and behaviour unchanged. Keep profile tools hidden until the person enables them. Two servers remain a fallback for process isolation or if profile tools cannot be hidden cleanly.

A hosted MCP endpoint is not justified for these coding harnesses. Reassess it only for clients that cannot run a local server and have a demonstrated need.

## Candidate MCP contract if selected later

Use a separate application contract, `itf.profile/0.1-draft`. The existing `itf.library/0.1-draft` tools, payload schemas and snapshot behaviour stay unchanged. The MCP wire version remains separate from both application contracts.

Keep the current `itf_library` registration name for compatibility. Documentation can call the installation **ItF MCP** without migrating existing configurations.

### Smallest tool surface

| Tool | Purpose | Account write |
|---|---|---|
| `profile_get` | Resolve a handle or DID and return the public record, CID, source and identity limitations. | No |
| `profile_prepare_update` | Read the current record, apply supplied changes, preserve compatible unknown fields and return a validated candidate and exact diff. | No |
| `profile_authenticate` | Start the collection-scoped loopback OAuth flow or report the current signed-in account. | No record write |
| `profile_publish` | Open the human-confirmation flow for the prepared candidate and expected CID, then publish and read back. | Yes, after confirmation |
| `profile_unpublish` | Open the human-confirmation flow for the loaded record and expected CID, then delete and verify absence. | Yes, after confirmation |
| `profile_sign_out` | End the local OAuth session and remove its local credentials. | Local credential change |

Public reads need no OAuth session. Preparation returns a candidate without writing. A model-supplied `approved` flag has no effect. Mark publish and unpublish as non-read-only. Host annotations remain advisory rather than the safety boundary.

### Human confirmation

Use a short-lived local confirmation page for the exact action. It shows the account, destination PDS, current CID, complete public candidate and field-level diff. A single-use, cryptographically random identifier binds the page to that action and expires quickly.

The local server writes only after the person confirms on that page. It accepts no approval token or boolean from the MCP client. The agent receives the final read-back result, not the OAuth credentials.

A remote session or non-interactive host may not be able to show this page. That case needs an explicit supported handoff, not a fallback to automatic publication.

### OAuth and local state

- Use the official Node OAuth client and ATProto's loopback flow. Verify the selected account provider supports the required flow.
- Request `atproto repo:org.itfti.profile`. This permits writes to that collection and does not grant Bluesky posts, messages, follows or profile edits.
- Store OAuth state and sessions in a user-private ItF state directory. Keep them away from the public library snapshot and project files. POSIX directories use `0700` and files `0600`.
- Keep tokens, signing keys, authorization URLs and callback parameters out of tool results and logs.
- Support session restoration, refresh, explicit sign-out and revocation instructions. Configuration undo leaves account grants intact. A separate forget action removes local credentials.
- Never copy browser IndexedDB credentials from app.itfti.org into the MCP server. Each client gets its own explicit grant.

### Validation and concurrency

Share the app's Lexicon and record rules through a runtime-neutral module or another single-versioned source. This includes field limits, URL checks and record construction. Do not maintain independent MCP field rules.

Preparation and publication read the current source. They preserve `createdAt` and compatible unknown fields. Updates set `updatedAt`. Writes use `swapRecord`, with `null` for creation and the loaded CID for update or deletion. A CID mismatch requires a fresh diff. An uncertain write requires reload before any retry. Success includes public read-back and a signed-out viewing check.

## Setup and host verification

Reuse the existing preview, apply, check and selective-undo patterns.

- **OpenCode:** retain the current V2 project-scope registration.
- **Claude Code:** retain local scope and the plugin route. Profile support stays disabled unless explicitly enabled.
- **Codex:** add project-scope registration for the trusted project's `.codex/config.toml`. Use the supported Codex configuration or CLI route and preserve unrelated settings. Read back the exact `[mcp_servers.<name>]` command, arguments and working directory. Add selective undo and a native connection check.

Changing tool visibility or the server contract requires updated docs and tests. Existing library-only installs keep their current tools and network behaviour. They require no OAuth.

## Bounded prototype plan, if later selected

1. **Fictional contract checks:** show that library-only mode is unchanged and profile tools are hidden by default. Check that candidate validation matches the app, unsafe URLs fail and results contain no credentials.
2. **Interactive publication checks:** use a temporary local OAuth fixture. Cover confirmation, cancellation, expiry, single use, CID conflict, uncertain writes, sign-out and read-back.
3. **Host checks:** establish one stdio connection each in OpenCode, Claude Code and Codex without a model run. Verify tool visibility in library-only and profile-enabled modes.
4. **Live account cycle:** obtain separate approval for a dedicated test account. Publish fictional content, read it signed out, edit it, handle a concurrent-change fixture and unpublish it. Use one bounded cycle. Revoke the grant and remove temporary records, listeners and local credentials afterwards.
5. **Usefulness comparison:** compare the same fictional edit through JSON import and MCP. Record the steps, failure points and any real obstacle that MCP removes.

Stop if the app and MCP cannot share validation or enforce the human gate. Stop also if the JSON handoff meets the need. Do not turn a failed local route into a hosted service.

## Limits

This assessment inspected current source and documentation. It did not test live behaviour or observe a person editing a profile. Actual editing frequency and user preference remain unknown.
