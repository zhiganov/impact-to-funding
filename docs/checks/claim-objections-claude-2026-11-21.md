# Claim objections: Claude Code check

2026-11-21. Source: `main` at `4196c24`, after #140 and #141. Host: Claude Code 2.1.330, in print mode, with project settings only. The skill was installed as a project skill. Two runs, each with a fictional prompt.

## Run 1: an obvious interest

### The prompt

A fictional free weekend coding club wants one sentence for a public support brief: "Our club taught 150 children to code in 2026." The person supplies two facts: the sign-up sheet lists 150 names, and the register shows about 60 children came to more than three sessions.

### What happened

The agent loaded the skill, then read `references/claims.md` and `playbooks/support-brief.md`.

| Step in "Before a claim goes public" | Result |
|---|---|
| 1. Find the strongest objection | **Done.** It named the person's own register as "the strongest objection", and used only supplied material. It didn't search outside it. |
| 2. Say who gains if the claim is true | **Not done.** The answer didn't say who gains from the claim. |
| 3. Keep, narrow or mark disputed | **Done in effect.** It narrowed the claim to "150 children have signed up … and about 60 of them have come to more than three sessions", and explained why. It didn't use the word "narrow". |
| 4. Keep the objection private unless approved | **Not shown.** It gave a suggested public sentence for the person to use. It didn't mention a private assessment. |
| Offered as optional | **No.** It applied the step without offering it first. For a short request like this, that's reasonable. |

It also caught that 2026 isn't over ("so far in 2026"), and that "taught to code" is a learning claim the records don't show.

## Run 2: a partner's figure, from a co-applicant

### The prompt

A fictional free app lets tenants report repairs. The person wants: "Harbourside Housing Association says our app cut repair delays by half." They supply an email from the association's operations manager: average time from report to repair fell from 20 days to 10 after the association adopted the app in March. The association co-designed the app, is a joint applicant for the same grant, and hasn't shared its data.

### What happened

The agent loaded the skill and read `references/claims.md` and `playbooks/support-brief.md`.

| Step in "Before a claim goes public" | Result |
|---|---|
| 1. Find the strongest objection | **Done in substance.** It said a before-and-after change doesn't show the app caused it, and named other possible causes: more contractors, a cleared backlog, seasonal demand, a policy change. It didn't search, and said it would suggest a search for a real brief, starting with what else changed in March. |
| 2. Say who gains if the claim is true | **Done.** It said the association "co-designed the app with us and stand to gain from this grant, so their statement is a partner's account, not an independent finding. That doesn't make it untrue." It put the relationship into the suggested sentence. |
| 3. Keep, narrow or mark disputed | **Done in effect.** It narrowed "cut … by half" to "reports that average time … fell from 20 days to 10 after it adopted the app", and added that the data hasn't been shared or independently reviewed. |
| 4. Keep the objection private unless approved | **Partly.** It asked the person to get the association's approval of the exact sentence before quoting it publicly, and said what to do if they don't approve. It didn't mention a private assessment. |
| Offered as optional | **No.** It applied the step directly. |

## Across both runs

- **Step 2 was applied when the interest was a third party's** (run 2), and skipped when the interest was only the person's own (run 1). Tightening step 2 to say it applies to the person's own interest too may close that gap.
- **Step 4's private record wasn't mentioned in either run.** Both answers kept the person in control of public wording, which is the step's purpose.
- **Neither run searched outside the supplied material,** which matches the guidance when no permission is given.

## Limits

- Two runs in one host. Each case had its objection in the supplied material or in common sense.
- No case tested searching outside the supplied material.
