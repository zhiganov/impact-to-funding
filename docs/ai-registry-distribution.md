# Optional skill distribution: AI Registry and Vercel's CLI

**Date:** 2026-11-06
**Status:** reference comparison. Neither AI Registry nor Vercel's Skills CLI is
integrated or tested as an ItF distribution route.

## Where it could help

[Atlan's AI Registry](https://github.com/atlanai/ai-registry) defines a file-based format for distributing versioned AI artifacts such as skills and agents. Its possible role for ItF is **delivering the skill package**, not storing impact claims or evaluating them.

If several users or agent tools need coordinated installations, a registry could wrap an exact ItF release with its `SKILL.md`, references, assets and supporting files, preserving native bytes and relative links. The specification describes immutable artifact versions, file sizes/digests, a content digest and lifecycle metadata. The aireg CLI documents lockfiles and installation targets.

A registry can live in a directory or Git repository; the file format does not require a hosted registry service. That makes it a possible future distribution option rather than a reason to provision infrastructure now.

## Value beyond Git and a distribution CLI

| Existing ItF approach | What a registry could add | Current decision |
|---|---|---|
| Published Git source, tagged manual-use prerelease and explicit revision pins | A machine-readable artifact catalog and lock describing exact bundled files/versions across consumers | Keep the existing route; compare a direct Git distribution CLI before assuming a separate registry is needed. No current coordination requirement justifies adoption. |
| People deliberately select the source revision they use | Consistent package installation and inventory across several supported agent targets | Vercel's Skills CLI already documents multi-target distribution. Identify the incremental registry/catalog/lifecycle need rather than treating target installation alone as justification. Neither tool's target list proves ItF activation. |
| Release notes and source history explain changes | Mutable catalog status for draft, active, deprecated or blocked versions, alongside immutable artifact bytes | Package lifecycle only; not an evaluation, impact-review status or automatic recall of deployed copies. |

This is secondary to learning whether the skill is useful. Use the
[current installation instructions](../README.md#install-and-use-in-opencode) for
the verified native route. The historical feedback source `87e515a` and the
`v0.1.0` archive remain distinct from later sources and a registry's `latest` pointer.

## Vercel Skills CLI: a lighter documented alternative

The [Vercel Skills CLI](https://github.com/vercel-labs/skills) can be considered separately from the skills.sh directory and from AI Registry. This is a documentation comparison, not tool adoption or native-installation recovery.

| Concern | Possible role | Boundary |
|---|---|---|
| skills.sh | Public discovery and directory presentation | A listing, install count or security-audit label is not host activation, user usefulness or impact verification. See [#30](https://github.com/zhiganov/impact-to-funding/issues/30). |
| Vercel Skills CLI | Obtain a skill from a Git repository and place/link it for selected agents | Direct Git sources do not require a skills.sh listing. The installer's documented support is not a tested ItF package/host result. |
| AI Registry | Additional versioned artifact catalog, inventory and lifecycle semantics | Assess the value beyond existing Git pins and the direct-CLI option, only against a real coordination need. See [#31](https://github.com/zhiganov/impact-to-funding/issues/31). |

The current upstream documentation describes:

- GitHub repository sources, direct skill paths, local sources, and selecting a release tag or full commit. This could use the existing ItF repository without first submitting a directory listing or creating a second registry.
- Discovery of a repository-root `SKILL.md`, which matches ItF's current layout at that broad structural level. This is not an executed parser/discovery check, and preservation of all templates, references, supporting files and relative links remains unverified.
- Named targets including OpenCode, Claude Code and Codex, with project scope by default, optional global scope, and copy/symlink methods. No target paths, global configuration or installed copies were changed here; a named target does not prove the current host will activate the package.
- Update/check commands and lock-based restoration features. The README labels the restoration/sync commands experimental. Source selection, a lockfile and successful installation are different things; do not assume equivalence with AI Registry's immutable artifact/status contract or adopt automatic updates.
- A `skills use` mode that writes selected skill files to a temporary directory and prints a prompt, or launches a supported agent when requested. “Without installing” is not “without side effects”; account for its file writes and any launched process before using it.
- Usage telemetry and security-audit requests, with README settings that disable both. Any future execution must account for those requests and actual scope/side effects rather than infer an anonymous/read-only operation from a command name. The README also specifies Node.js 22.20 or later; no CLI/runtime prerequisite check was performed here.

For one public skill, direct Git distribution may be simpler than adding a registry
catalog. The comparison is not evidence that either CLI works for ItF. Directory
submission/promotion is separate from installation. No CLI command, including list,
check, dry-run or use modes, was run for this comparison.

## Integrity, trust and retention limits

- **Matching bytes are not trustworthy behaviour.** The file spec requires digest/size checks, but format 1 does not authenticate the registry root itself. A digest establishes consistency with what that root lists, not the publisher's identity, safe instructions, model adherence, sound assessment or verified impact.
- **Package approval is not claim review.** Registry ownership and lifecycle labels describe whether an artifact is offered for use. They do not establish reviewer competence/independence or validate a report produced with the skill. A record's `active` status is not certification.
- **Blocking is not recall.** The spec refuses new installation of blocked versions even when pinned, but says clients must not remove an installed copy merely because its status changes. Do not assume a status change removes, disables or updates every consumer.
- **Retention is intentionally durable.** Yanking/archiving retains resolvable bytes; physical removal is an operator action outside the spec. The file root offers no access control finer than the root. This is unsuitable as the store for private evidence, personal theories, participant records or material requiring withdrawal/deletion. Only redistribution-cleared skill material belongs in a public bundle; follow [PRIVACY.md](../PRIVACY.md).
- **Installation and execution differ.** The spec treats registry content as untrusted and forbids running it as part of installation. Installed skills, scripts, hooks or tools may still influence or execute later actions. Those requirements are not an independent audit of the CLI or an expansion of the user's task permissions.
- **Automation has additional effects.** Global target links, background synchronisation, credentials and installer side effects need explicit configuration and review. Reproducibility does not require accepting future versions automatically.

## Implemented, planned and unverified

At the inspected source revision, the project describes a draft v0.1 file specification and a pre-1.0 CLI. The CLI reads directory/Git registries; the specification also describes HTTPS file roots, which must not be mistaken for implemented CLI transport support. The catalog API and registry-reading MCP server are planned, not existing delivery capabilities.

AI Registry's CLI README lists Claude Code, Codex, Cursor and a generic `.agents` target. That is documentation of intended targets, not a test of native OpenCode discovery or activation. It does not establish that the current ItF package works in any particular host, and no absence-of-support claim about other targets is inferred.

The [native installation record](installation-check-2026-11-04.md) now includes
later successful OpenCode v2.2.5 checks. Those checks used the documented direct
installation route, not AI Registry or Vercel's CLI, and do not establish
compatibility with either distribution tool.

## Separate concerns

- The [optional framework starter](../references/frameworks.md) remains a manual-use reference. A package registry is not a maintained semantic framework commons or a working framework MCP service.
- [Standard.site](standard-site-publishing.md) concerns optional publication/discovery of approved public reports. AI Registry concerns distributing the skill that helps prepare them; neither verifies their claims.
- `funding.json` v1.1.0 remains financial metadata, unchanged. No funding fields, review schema, payment route, report index or allocation mechanism is introduced.

## Scope and source basis

Read on 2026-11-06: the project overview and the [README](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/README.md), [file specification](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/spec/file-spec.md), [CLI README](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/cli/README.md) and [examples overview](https://github.com/atlanai/ai-registry/blob/cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4/examples/README.md), pinned to `cf145a9d576cf8cc0f65c09f91fb39584f9ce1d4`. These are source/documentation observations, not executed examples, conformance checks, package round trips, security testing or evidence that a registry serves ItF.

Vercel sources read 2026-11-06: [README](https://github.com/vercel-labs/skills/blob/main/README.md), [CLI reference](https://github.com/vercel-labs/skills/blob/main/docs/commands.md), and [creating/discovering skills](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md). Those reads used `main`; no exact upstream commit or CLI release was recorded. Treat them as dated documentation observations, not a pinned implementation contract or evidence of ItF compatibility. No fresh package, installation, listing or activation check was performed.

No third-party schemas, code or assets were imported or relicensed by this assessment.
ItF's current [licence scope](../LICENSE) separates CC BY-SA written content from
MIT software and preserves earlier MIT grants. AI Registry is separately
Apache-2.0-licensed and Vercel's Skills CLI is separately MIT-licensed. Linking to
them does not merge the projects, confer endorsement or grant rights over private inputs.

This comparison is based on documentation, not CLI execution. It provides no
registry, adapter, synchronisation service, package round trip or new release.
