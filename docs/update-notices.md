# Optional in-skill update notices

An ItF skill can ask its agent to check for a newer source release during normal
use. This is **off by default**, optional, and never installs an update. Ordinary
conversation remains possible without Node, Git, networking or this feature.

## Enable for one managed copy

First install or explicitly update a managed copy that actually includes
`tools/skill-package/notice-entry.mjs` and this instruction. Older installed
versions, including `v0.2.0`, cannot initiate this notice merely because the CLI
was updated. The experimental `v0.3.0` source prerelease includes the helper,
but is not a new host-activation or notice-delivery check. The managed CLI can
also explicitly select a reviewed full source SHA using `--commit`.

From the project where you use ItF, preview the preference:

```sh
npx --yes --package=github:zhiganov/impact-to-funding#main itf notice enable --harness codex --scope project
```

Replace `codex` with `claude` or `opencode`, and choose project/personal scope
deliberately. `--project <directory>` chooses a project context. The command
reports the selected copy and whether it includes the helper. Re-run with
`--apply` to enable; the CLI prints the disclosure before writing the preference.
No notice is enabled for another copy or harness. The GitHub CLI bootstrap's
`#main` is mutable: use a reviewed full CLI commit for reproducibility.

To inspect or disable the same preference, use the same prefix and target with
`notice status` or `notice disable ... --apply`. Setting `ITF_UPDATE_NOTICES=off`
in the agent's environment also disables checks for that process without changing
the preference. An opted-out or unmanaged copy does not contact GitHub.

## What the agent does

The skill instructs the agent to run the bundled helper **only when it has the
actual loaded skill's base path and its host permits local execution**. The
agent adds `--allow-network` only when the host also permits public GitHub
metadata access; without that flag the helper makes no network request. The
helper derives the selected directory from its own
location and matches that directory to its #55 managed receipt; it does not scan
for a similarly named skill or choose another copy. Linked, dirty, unmanaged,
legacy or ambiguous installations remain unknown. A receipt and path do not
prove what bytes a host already loaded into an existing conversation.
Consent is bound to the manager's installation identity, not merely a reusable
path; a different managed installation with a new receipt identity does not
inherit it. Manager updates retain the installation identity. Local receipt
state is not proof against a manually replaced copy with a stale receipt.

Before consent is configured, the helper can return a short optional offer without
contacting GitHub or creating state. The agent is instructed to mention it without
interrupting the requested help, and not to repeat it within the same conversation.
After a clear user request, the agent can enable the loaded copy with
`notice enable --root <loaded-skill-directory> --apply`, subject to normal
permissions. A user can instead disable its offer/check with
`notice disable --root <loaded-skill-directory> --apply`.

When enabled, the helper asks the existing manager's read-only check to compare
the installed release with the newest eligible release in the saved channel,
without changing its pin. A tag whose saved commit has moved is not silently
accepted. It emits a brief `UPDATE_AVAILABLE` message only when a newer eligible
release and the installed release are both established. The skill instructs the
agent to include that message alongside the requested help—not to block the task
or update now. A later update is a separate user request, using the selected
scope/path and the [managed update guide](managed-skill-updates.md).

An explicitly pinned development commit may have no matching published release.
In that case the helper can mention an eligible release as `RELEASE_AVAILABLE`,
while stating that the installed source's freshness is **unknown**. It must not
call that release newer than the installed development source. A moved locked tag
remains unknown and is not substituted with a different release.

### Host boundaries

This is a **skill-instruction/tool-call integration**, not a guaranteed host UI
notification or a hidden hook. Claude Code can expose `${CLAUDE_SKILL_DIR}`;
Codex exposes selected skill paths; OpenCode's native skill tool returns a base
directory. If an activation does not expose the actual selected path, skip it.
The host may deny execution or networking, omit the helper, or the model may not
follow the instruction. A helper message reaching the model is not proof that a
person saw it. No new Claude, Codex or OpenCode notice-delivery/model check has
been performed; these are documented integration paths, not observed delivery.
See the official [Claude skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/build-skills) and
[OpenCode V2 skills](https://opencode.ai/v2/docs/skills) references for each
host's native loading and permission behaviour.

An agent must not bypass host network or execution restrictions. The helper is
not dynamically injected as a mandatory shell command: a missing runtime or a
denied command must not abort the skill. If the host cannot run it, the existing
manual `itf check` or GitHub release subscription remains available; neither is
presented as an automatic in-harness notice.

## Privacy, timing and reliability

- On an enabled check, only public GitHub release/tag metadata is requested. No
  prompt, project file, evidence, local path or credential is sent. GitHub still
  receives ordinary network metadata, including your IP address. The host can
  see the locally executed helper path under its normal tool/history rules.
- The local helper uses a private per-installation preference/cache under
  `.local/state/impact-to-funding-notices/` in the user's home. It is separate
  from manager receipts/backups. Do not publish its contents.
- A successful or failed release lookup is attempted at most once per 24 hours
  per selected copy. A helper message for the same release is suppressed for
  24 hours after emission; that records an **attempted notice**, not proof of
  user-visible delivery. An undelivered notice can be attempted again after that
  interval. Concurrent checks and preference changes use a local lock.
- The entry point bounds the optional operation to about 3.5 seconds, including
  local Git inspection. Denied execution, a timeout, incomplete metadata,
  unwritable state or an unknown copy yields no notice and does not establish
  that the installed copy is current. Without network permission, a still-fresh
  cache can suppress a repeat, but no new request, cache write or unthrottled
  notice occurs. Cached results are not used after their 24-hour freshness window.
- On Windows the helper attempts to terminate its own process tree on timeout;
  that platform-specific cleanup has not been verified here. If its native
  process-tree command fails, a child may outlive the bounded parent check.
- Disabling notices prevents later network checks; removing this preference does
  not erase host chat history or provider retention. Release availability is not
  proof of safe behaviour, compatibility, human usefulness or impact.

The [local tests](../tools/skill-package/tests/notice.test.mjs) exercise the
selected-copy helper, consent, channels, caching, suppression and failure paths
using disposable projects and mock metadata. They are not host/user-delivery or
model-behaviour tests.
