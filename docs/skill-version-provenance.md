# Skill versions and installation provenance

**Contract:** `itf.release/0.1` and `itf.installation/0.1`.
**Status:** metadata/inspection foundation delivered in
[#54](https://github.com/zhiganov/impact-to-funding/issues/54). The separate
[managed CLI](managed-skill-updates.md) now builds on it for explicit installation
and updates. The later [opt-in notice path](update-notices.md) does not establish
automatic host delivery or new host verification.

The existing GitHub repository and release API are the publication source; no
registry, new service or version endpoint is introduced. The optional
[local helper](../tools/skill-package/README.md) implements validation, comparison,
selection and explicit-path installation inspection. Those #54 interfaces never
contact a service or change an installed copy; the managed commands are separate.

## Three versions must not be confused

1. **Declared skill version:** standard Agent Skills `metadata.version`, a
   JSON-quoted SemVer string inside `SKILL.md`. This source declares `0.3.0`;
   that string alone is not proof of a release, a particular commit or a host
   check. No source SHA is embedded in its own Git tree.
2. **Released source:** a published GitHub release with a fixed version tag and its
   resolved full commit SHA. Exact source is determined after checkout or tag
   resolution, not inferred from a version string.
3. **Helper version:** the optional metadata tool is independently versioned
   `0.3.0` after the notice addition (`0.1.0` for the original #54
   inspector and `0.2.0` for the managed CLI).
   Its version is not the installed skill's version.

The [Agent Skills specification](https://agentskills.io/specification#metadata-field)
defines `metadata` as a string-to-string map. This package uses a deliberately
small, two-space-indented, double-quoted version entry. The helper is not a general
YAML parser: absent, invalid or differently encoded metadata stays unknown rather
than being guessed. Older released packages need not be rewritten to add it.

Host checks remain external, source-specific evidence: the limited Codex and
Claude CLI checks used `4566892ad990131fb36f760e14c73e5f275600cc`, while OpenCode's
historical check used `fbb8993060254ef63f5157d3b9ddcbb8bb4cf19b`.
This metadata change and any later helper/package release inherit none of those
exact-package checks. See the [installation record](installation-check-2026-11-04.md).

## Release record

An example machine-readable representation of the earlier v0.2.0 source prerelease is:

```json
{
  "contractVersion": "itf.release/0.1",
  "repository": "zhiganov/impact-to-funding",
  "version": "0.2.0",
  "tag": "v0.2.0",
  "sourceCommit": "ecf8ee4f81cf2d7b7890779b04d66eabc6d36104",
  "channel": "prerelease",
  "draft": false
}
```

`validateRelease` accepts only the intended contract/repository, a SemVer version,
its matching `v` tag, full lowercase 40-character commit SHA, explicit channel
and draft flag. It returns these fields only; extra local-path or purported
host-verification fields are not carried into release records. Validation checks
structure, not the publisher's identity or the truth of a supplied commit.

A GitHub adapter must enumerate **all** release pages, not just the stable-only
latest-release endpoint. It must retrieve the actual tag ref and peel annotated
tags to the commit. `releaseFromGitHub(release, { tag, commit })` normalises the
release after that resolution; it deliberately ignores `target_commitish`, which
  can be a moving branch. The separate managed CLI's public GitHub adapter performs
  that retrieval; the normalisation function itself remains local.

If an existing tag resolves to a different commit than a stored installation pin,
stop rather than silently accepting a moved tag. Matching archive checksums from
the same release establish byte consistency, not independent authentication.

## Channel and pin selection

`selectRelease(records, { channel, complete, pin })` requires an explicit channel
and a completeness declaration from its caller:

- `stable` excludes GitHub prereleases and drafts.
- `prerelease` includes both published stable releases and published prereleases;
  drafts are excluded. A prerelease need not have a SemVer suffix: GitHub marks
  ItF's `v0.2.0` as a prerelease despite its plain numeric tag.
- `complete: false` returns `catalogue-incomplete`, with no selected release. A
  truncated response, missing page, authentication error or absent network is not
  proof that there is no update. A complete empty eligible set is `no-release`.
- Versions sort by SemVer precedence, not lexical order or publication date;
  build metadata does not increase precedence. Conflicting records for one tag
  are rejected rather than selecting whichever was received last. Equal-precedence
  records prefer the stable channel, then use tag order as a deterministic tie
  break, not as a claim that one build is newer.
- An initial tag selector or a full commit may be supplied as `pin`. Persist a
  **full commit**, or a locked `{ tag, sourceCommit }` pair, not a mutable tag name
  alone. A matching eligible record returns `pinned`. Missing records, channel
  conflicts or a moved locked tag return `pin-unresolved`; the pin is retained
  and no newer version is substituted. An untagged full-commit pin remains a
  legitimate manual choice even though this release catalogue cannot resolve it.

```js
import { selectRelease } from '../tools/skill-package/index.mjs';

// records is a complete, already-retrieved and validated-source snapshot.
const result = selectRelease(records, {
  channel: 'prerelease',
  complete: true,
  pin: { tag: 'v0.2.0', sourceCommit: 'ecf8ee4f81cf2d7b7890779b04d66eabc6d36104' },
});
```

Selection is a local computation, not permission to fetch, update or execute the
selected package. Source trust and user consent remain separate.

## Installation record: private local observation

`inspectInstallation(selectedPath)` requires an explicit ItF directory. It returns:

| Field | Meaning |
|---|---|
| `contractVersion` | `itf.installation/0.1`. |
| `helperVersion` | Metadata helper version, not skill version. |
| `skill.name`, `skill.declaredVersion`, `skill.metadataState` | ItF identity and recognised declared version, or explicit legacy/invalid/unrecognised state. No release or compatibility claim. |
| `local.selectedPath`, `local.realPath` | Private absolute selection and resolved root; root links can be inspected without silently selecting another discovered copy. Never include these fields in public/network version metadata. |
| `source.kind`, `source.repository`, `source.commit`, `source.authenticated` | An observed exact-root local Git commit and recognised origin identity, where available. Authentication is always `false`: local Git/configuration is not independent publisher proof. |
| `files.tracked`, `files.checkedFiles` | `clean`, `modified` or `unknown` for HEAD's tracked tree, with the number of files whose bytes were compared. |
| `files.statusChangedEntries` | Git-reported changed entries; hidden assume-unchanged edits may instead be detected by the byte comparison. |
| `files.untrackedEntries`, `files.ignoredEntries` | Git-reported entry counts, not file inventories; an ignored directory can be one entry. `null` means inspection was unavailable. |

The helper accepts an enclosing Git repository as provenance only if the selected
installation itself is its root. A manual copy inside another project must not
inherit that project's SHA. It does not infer which duplicate skill the host
loaded, scan other projects or consult credential stores. Raw origin URLs, extra
filenames and file contents are omitted from reports.

For Git copies it checks both status and actual HEAD file bytes, including file
mode on non-Windows systems. Inherited Git environment overrides are removed,
replacement objects are disabled, and the compared tree uses the captured full
commit, not a later resolution of `HEAD`. A changed HEAD or entry file during the
observation clears the source/version to unknown. This is still a bounded local
observation, not an atomic filesystem snapshot or promise against later changes.
It does not follow tracked symlinks to their targets;
redirected ancestor directories, Git links/submodules, unreadable entries, more
than 10,000 entries, files over 8 MiB or a total over 32 MiB leave the comparison
incomplete (`unknown`, unless a definite modification was also observed). Missing
files are modifications. No file is repaired, removed or checked out. Unknown
origin, absent Git and legacy/manual copies remain honestly distinguishable from
verified release contents.

A tracked-clean result does **not** authorise overwriting extra/ignored files or
establish safe behaviour. A future managed installer must compare the published
source, verify the complete candidate and preserve local/private material before
recording provenance. This observer is not an installer receipt or a trust seal.

## Complete-package integrity and future handoff

Keep `SKILL.md`, references, assets, examples, documentation and licences together;
do not distribute only a versioned entry file. Existing Git tree/blob identities
already describe the complete tracked source; no extra archive is needed here.
If a future installer uses an archive/generated bundle, verify its expected
digest and inventory against the selected full source before accepting it. Reject
incomplete packages, unsafe archive paths and unexpected links; source/digest
trust is a separate check from matching bytes. Never include local dependencies,
private reports, evidence or untracked files in a release bundle.

The [managed CLI](managed-skill-updates.md), tracked in
[#55](https://github.com/zhiganov/impact-to-funding/issues/55), uses this contract
for installation, receipts, explicit updates and rollback.
[#56](https://github.com/zhiganov/impact-to-funding/issues/56) uses its
version-only release records for consent-aware notices in current source;
see the [host-delivery limits](update-notices.md). Neither capability is implemented
by #54 itself, and no conversation is made dependent on this helper.
