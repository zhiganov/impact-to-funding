# Plan: stop the skill depending on `docs/`

**Issue:** #124 (first step only). **Written:** 2026-11-19 against `main` at `a30f627`.
**For:** an implementing agent. Open one pull request, per `AGENTS.md`.

## Goal

After this change, the skill's runtime files (`SKILL.md`, `playbooks/`, `references/`,
`assets/`) link to nothing in `docs/`. Guidance the agent reads during a task lives in
`references/`. `docs/` becomes material for maintainers and human readers only.

This is the cheap first step of #124. It doesn't change the installer, the provenance
checks or what an install contains: `docs/` still ships until a later step changes
packaging. It does tell that later step, and plugin packaging (#106), exactly what the
skill needs.

## Current state (measured at `a30f627`)

Runtime files link to 17 of the 81 files in `docs/`.

**A. Runtime guidance: move into `references/`** (keep each file name):

| File | Linked from |
|---|---|
| `responsible-assistance.md` | `SKILL.md`, `playbooks/organisation-contributions.md` |
| `evidence-reporting-design.md` | `SKILL.md`, `playbooks/support-brief.md`, `references/learning.md`, `assets/evidence-crosswalk.md` |
| `signal-discovery.md` | `SKILL.md` |
| `signal-enrichment.md` | `SKILL.md` |
| `bluesky-publishing.md` | `SKILL.md` |
| `support-profile-tools.md` | `SKILL.md`, `playbooks/support-brief.md`, `assets/support-profile.md` |
| `support-profile-contract.md` | `playbooks/github-sponsorship.md`, `assets/support-profile.md` |

**B. Tool guides: point the runtime link at the tool's own README instead.** Merge any
agent-relevant text from the docs file into that README first; keep the docs file for
human readers.

| File | Linked from | New target |
|---|---|---|
| `github-funding-readiness.md` | `playbooks/github-sponsorship.md` | `tools/github-sponsorship/README.md` |
| `github-sponsors-account-overview.md` | same | same |
| `github-sponsors-export-reporting.md` | same | same |
| `optional-writing-tools.md` | `playbooks/support-brief.md` | `tools/readability/README.md` and `tools/impact-badge/README.md` |

**C. Design notes and assessments: remove the runtime link.** Keep any rule the
agent needs as one sentence in the linking file, then drop the link.

| File | Linked from | Note |
|---|---|---|
| `github-sponsorship-design.md#destination-mapping` | `playbooks/github-sponsorship.md` | The playbook relies on this section. Move the destination-mapping rules into the playbook or a new `references/` file. |
| `pattern-language-design.md` | `references/library/README.md` | Explains the case/pattern/lens distinction; keep a short summary in the library README. |
| `reference-library-mcp-decision.md` | `references/library/README.md` | Decision record; drop the link. |
| `mentor-pool-scoping.md` | `references/contributions.md` | Assessment; drop the link. |
| `builder-check-in-assessment.md` | `references/learning.md` | Assessment; drop the link. |

**D. `update-notices.md`** is a human guide to consent and opt-out, linked from
`references/update-notice.md`. Move the consent and opt-out steps the agent needs into
`references/update-notice.md` and link the human guide by absolute GitHub URL, or move
the whole file under A. Pick one and say which in the PR.

## Steps

1. `git mv` each group A file into `references/`. Fix its own relative links.
2. Update every inbound link across the repo: runtime files, `docs/`, `README.md`,
   `tools/`, `mcp/`, `examples/`, tests. Group A files are referenced from 4 to 20
   files each.
3. Leave a stub at each old `docs/` path: a title and one line linking the new location.
   Unpinned links in issues and on itfti.org keep working. Links in release notes are
   pinned to a commit and stay valid either way.
4. Apply groups B, C and D.
5. `tests/package.test.mjs`:
   - add a test that fails if any runtime file links into `docs/`;
   - update the paths at lines 114 and 116 if group B moves that text;
   - the update-notice test (line 59) pins the moved paragraphs by hash after
     normalising one link. If D changes that link, update the normalisation and say so
     in the PR; the paragraph text itself must not change.
6. Check whether `itfti-website` links to any moved file, and update it in its own repo.

## Checks before the PR

- `node --test tests/*.test.mjs` from a folder named `impact-to-funding`, on a clean
  checkout (an untracked file can fail the whitespace test).
- The link test confirms no runtime file links into `docs/`.
- Diff the moved files: only link paths change.

## Limits

No change to the installer, provenance checks, install guides or what ships. No
behaviour change is intended, so no model run is required; say so in the PR.
