# Agent instructions

## Writing

- Write short, plain sentences. Say what something is or does first.
- State a limit once, where it matters to the reader. Collect other limits in one "Limits" section instead of repeating them in every paragraph.
- Never chain negations ("not X, not Y, does not establish Z"). Write the positive statement, then the one limit that matters as its own sentence.
  - Instead of: "A passing package check is not an install-tested release, a host check or evidence of usefulness."
  - Write: "The package check confirms the files are complete. It doesn't test installation."
- Before finishing, reread and cut any qualifier that wouldn't change what the reader does next.

This applies to the skill, the docs and issues. Accuracy still matters: keep every limit that changes what a reader would do, and state it once.

## Product strategy

- Keep strategic backlog capture separate from implementation readiness. Record
  agreed product directions in strategy or scoping issues, with delivered coverage,
  remaining outcomes and open choices. Evidence needed to choose an implementation
  is not a prerequisite for recording the direction. A delivered first slice does
  not establish that the broader capability is complete.

## Pull requests

- Push docs-only changes straight to `main`. Don't open a pull request for them.
- Open a pull request for any change that touches code, tests, the skill (`SKILL.md`, `playbooks/`, `references/`, `assets/`) or package files.
