# AI Registry as an optional distribution reference

**Date:** 2026-11-06
**Status:** reference capture only; adoption is not selected. No installation, registry creation, artifact publication, sync job or native-discovery recovery is authorised by this note.

## Where it could help

[Atlan's AI Registry](https://github.com/atlanai/ai-registry) defines a file-based format for distributing versioned AI artifacts such as skills and agents. Its possible role for ItF is **delivering the skill package**, not storing impact claims or evaluating them.

If several users or agent tools need coordinated installations, a registry could wrap an exact ItF release with its `SKILL.md`, references, assets and supporting files, preserving native bytes and relative links. The specification describes immutable artifact versions, file sizes/digests, a content digest and lifecycle metadata. The CLI documents lockfiles and installation targets.

A registry can live in a directory or Git repository; the file format does not require a hosted registry service. That makes it a possible future distribution option rather than a reason to provision infrastructure now.

## Value beyond the existing release route

| Existing ItF approach | What a registry could add | Current decision |
|---|---|---|
| Published Git source, tagged manual-use prerelease and explicit revision pins | A machine-readable artifact catalog and lock describing exact bundled files/versions across consumers | Keep the existing route; no current multi-user deployment requirement justifies adopting another tool. |
| People deliberately select the source revision they use | Consistent package installation and inventory across several supported agent targets | Potential value when that coordination problem is real, not proof that any target discovers or activates the skill. |
| Release notes and source history explain changes | Mutable catalog status for draft, active, deprecated or blocked versions, alongside immutable artifact bytes | Package lifecycle only; not an evaluation, impact-review status or automatic recall of deployed copies. |

This is secondary to learning whether the skill is useful. Manual file reading remains the documented use mode. The pinned feedback source `87e515a` and the existing `v0.1.0` archive are distinct; neither is replaced by a registry's `latest` pointer, an automatic update or this documentation commit.

## Integrity, trust and retention limits

- **Matching bytes are not trustworthy behaviour.** The file spec requires digest/size checks, but format 1 does not authenticate the registry root itself. A digest establishes consistency with what that root lists, not the publisher's identity, safe instructions, model adherence, sound assessment or verified impact.
- **Package approval is not claim review.** Registry ownership and lifecycle labels describe whether an artifact is offered for use. They do not establish reviewer competence/independence or validate a report produced with the skill. A record's `active` status is not certification.
- **Blocking is not recall.** The spec refuses new installation of blocked versions even when pinned, but says clients must not remove an installed copy merely because its status changes. Do not assume a status change removes, disables or updates every consumer.
- **Retention is intentionally durable.** Yanking/archiving retains resolvable bytes; physical removal is an operator action outside the spec. The file root offers no access control finer than the root. This is unsuitable as the store for private evidence, personal theories, participant records or material requiring withdrawal/deletion. Only redistribution-cleared skill material belongs in a public bundle; follow [PRIVACY.md](../PRIVACY.md).
- **Installation and execution differ.** The spec treats registry content as untrusted and forbids running it as part of installation. Installed skills, scripts, hooks or tools may still influence or execute later actions. Those requirements are not an independent audit of the CLI or an expansion of the user's task permissions.
- **Additional automation needs its own decision.** Global target links, background synchronisation, updates, credentials and installer side effects are not selected here. Reproducibility does not require accepting future versions automatically.

## Implemented, planned and unverified

At the inspected source revision, the project describes a draft v0.1 file specification and a pre-1.0 CLI. The CLI reads directory/Git registries; the specification also describes HTTPS file roots, which must not be mistaken for implemented CLI transport support. The catalog API and registry-reading MCP server are planned, not existing delivery capabilities.

The CLI README lists Claude Code, Codex, Cursor and a generic `.agents` target. That is documentation of intended targets, not a test of native OpenCode discovery or activation. It does not establish that the current ItF package works in any particular host, and no absence-of-support claim about other targets is inferred.

The [native installation record](installation-check-2026-11-04.md) remains unchanged: discovery/activation are unverified and the executed routes are stopped. This note is not a recovery plan, a substitute invoker or bespoke preparation for another attempt. Resuming any installation route requires a newly selected bounded recovery scope; this capture provides no such selection.

## Separate concerns

- The [optional framework starter](../references/frameworks.md) remains a manual-use reference. A package registry is not a maintained semantic framework commons or a working framework MCP service.
- [Standard.site](standard-site-publishing.md) concerns optional publication/discovery of approved public reports. AI Registry concerns distributing the skill that helps prepare them; neither verifies their claims.
- `funding.json` v1.1.0 remains financial metadata, unchanged. No funding fields, review schema, payment route, report index or allocation mechanism is introduced.

## Scope and source basis

Read on 2026-11-06: the project overview and the [README](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/README.md), [file specification](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/spec/file-spec.md), [CLI README](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/cli/README.md) and [examples overview](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/examples/README.md), pinned to `cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4`. These are source/documentation observations, not executed examples, conformance checks, package round trips, security testing or evidence that a registry serves ItF.

No third-party schemas, code or assets were imported or relicensed. ItF remains MIT-licensed; AI Registry is separately Apache-2.0-licensed. Linking to it does not merge the projects, confer endorsement or grant rights over private inputs.

The completed scope is this reference note and its documentation-index link only. No CLI, skill or service was installed; no registry, adapter, artifact, account, credential, background job or MCP server was created; no issue was reopened; no installation test, model run, release, feedback-version change or report publication was selected or performed.
