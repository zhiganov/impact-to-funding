# Task-focus repair and source checks

Source work for [#101](https://github.com/zhiganov/impact-to-funding/issues/101),
15 November 2026. Baseline:
`60d50af8abbd605ba796784f1d585a4213c4cc91`.

## Goal

Keep requested project work central when the person supplies relationship
context, while preserving relationship work as a valid task in its own right.

## What the source already covered

- [SKILL.md](../../SKILL.md) tells the agent to use known context, infer an approach,
  ask useful questions and avoid imposing an assessment or funding workflow.
- [Contribution guidance](../../references/contributions.md) distinguishes an
  existing relationship, an unverified possibility and an agreed commitment.
  It supports private conversation preparation when that is the requested help.
- [Learning guidance](../../references/learning.md) supports provisional theories
  with explicit assumptions, dependencies and local judgement.
- The current host guidance inspected in this development session explicitly
  says to return to the selected project task before asking another supporting
  question. It permits a focus change when the user chooses it or a material
  dependency requires it.

The reported failure was successive introduction and timing questions during
a theory-of-change task. Its historical package revision was not established.
Current source and host coverage cannot isolate whether skill wording, host
instructions or model behaviour caused that episode.

The [supplied-material assessment](../supplied-material-routing-assessment.md)
retains the existing routes for #111. This repair addresses a narrower gap:
the entry point lacked an explicit continuation rule for supporting context
arriving during an existing task. It adds that rule without another router,
playbook or mandatory question sequence.

## Change

One paragraph in the skill entry says to incorporate supporting context and
continue the requested work. A selected relationship task or a specific
blocking fact can justify following that thread. Other useful work can proceed
while the fact stays unresolved.

The [three fictional cases](../../examples/task-focus.md) cover:

1. An unanswered introduction informs a provisional theory without becoming
   a scheduling interview.
2. An explicit request to pause the theory and draft a follow-up selects
   relationship help.
3. Unknown quotation permission affects one part of a public draft; the rest
   can proceed privately.

The cases preserve possible versus accepted roles, local authority, uncertainty
and separate permission for contact and publication.

## Checks and limits

The package test checks that the rule and contrasting cases remain in the
source. Existing package checks also cover metadata, links and text integrity.
Run from the repository root:

```sh
node --test tests/package.test.mjs
git diff --check
```

These are source checks. The expected responses are authored, not fresh model
observations. No behavioural run, installation change or release is included.
The original private project records and introduction messages are not used
as examples.

The first package run passed the new task-focus check but failed the existing
text check on an ignored macOS Finder metadata file. The package walk now skips
that metadata, matching the repository's ignore rule; the local file is preserved.
The next run exposed one existing trailing space in the My Community issue
draft. Removing that space leaves its content unchanged. A full text-rule
inspection found no other failures.

A later behavioural check would need the exact source revision, host/model
versions, input, observed output and review basis. It is separate from this
source repair and is not required to describe its limits honestly.
