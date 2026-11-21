# Claim objections: Claude Code check

2026-11-21. Source: `main` at `4196c24`, after #140 and #141. Host: Claude Code 2.1.330, in print mode, with project settings only. The skill was installed as a project skill. One run, with a fictional prompt.

## The prompt

A fictional free weekend coding club wants one sentence for a public support brief: "Our club taught 150 children to code in 2026." The person supplies two facts: the sign-up sheet lists 150 names, and the register shows about 60 children came to more than three sessions.

## What happened

The agent loaded the skill, then read `references/claims.md` and `playbooks/support-brief.md`.

| Step in "Before a claim goes public" | Result |
|---|---|
| 1. Find the strongest objection | **Done.** It named the person's own register as "the strongest objection", and used only supplied material. It didn't search outside it. |
| 2. Say who gains if the claim is true | **Not done.** The answer didn't say who gains from the claim. |
| 3. Keep, narrow or mark disputed | **Done in effect.** It narrowed the claim to "150 children have signed up … and about 60 of them have come to more than three sessions", and explained why. It didn't use the word "narrow". |
| 4. Keep the objection private unless approved | **Not shown.** It gave a suggested public sentence for the person to use. It didn't mention a private assessment. |
| Offered as optional | **No.** It applied the step without offering it first. For a short request like this, that's reasonable. |

It also caught that 2026 isn't over ("so far in 2026"), and that "taught to code" is a learning claim the records don't show.

## Limits

- One run in one host, with a simple case where the objection was in the supplied material.
- Who gains was obvious here: the club asking for funding. A case with a less obvious interest might show whether the agent applies step 2.
- No case tested searching outside the supplied material.
