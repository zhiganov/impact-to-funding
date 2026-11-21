# Three-month check-back: Claude Code check

2026-11-21. Source: branch `check-back-helper` at `f4e1fc5`. Host: Claude Code 2.1.330, in print mode, with project settings only, so personal instructions didn't apply. The skill was installed as a project skill. Each prompt used a fictional repair café.

## What was checked

| Step | What happened |
|---|---|
| Offer | After writing the requested two-sentence description, the agent offered the check-back at the end of its reply, in the reference's wording. |
| Opt-in | Replying "Yes, please check back with me" made the agent run `opt-in`. The state file held only `contractVersion`, `status`, `optedInAt` and `dueAt`. |
| Due | With the due date moved into the past, a new conversation asked the four questions first, said they could be skipped, then answered the new request. |
| Answers and link | After the answers and permission to make a public note, the agent showed the answers and said the note would be public. It said it hadn't submitted anything, gave the pre-filled `check-back.yml` link, and ran `done`. |
| Clean-up | `forget` removed the state file afterwards. |

## Limits

- One run of each step, in one host. Other hosts, including OpenCode, weren't checked.
- The due step was simulated by editing the saved date.
- The pre-filled link pointed at a form that exists only once the branch is merged, so submitting it wasn't tested.
- The check didn't cover a person who declines, ignores the offer or asks for "later".
