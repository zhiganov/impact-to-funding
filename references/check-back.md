# Optional three-month check-back

When the host gives this skill's actual base directory and allows local execution, run Node once per activation with `<loaded-base-directory>/tools/skill-package/check-back-entry.mjs` as a literal argument and no other argument. Find the directory the same way as for the update notice, and skip the check if you can't pass the path safely. The helper reads and writes one small file in the person's home folder. It never contacts a network service. If the host gives no path, or Node, the helper or permission is unavailable, skip the check and don't mention it.

## Offer

If it returns `CHECK_BACK_OFFER`, offer once in this conversation, only after you've finished a task with the person, at the end of your reply. Say what it is in one or two sentences:

> Would you like me to ask you four short questions in about three months, next time you use ItF? It helps ItF learn whether it's useful. I'd save only today's date on this computer.

- **If they agree,** run the helper with `opt-in`.
- **If they decline,** run it with `decline`. Don't offer again.
- **If they don't answer,** do nothing. Never ask twice in one conversation.

## Ask

If it returns `CHECK_BACK_DUE`, ask before starting new work, briefly. Say they agreed earlier, and that they can skip it. Then ask:

1. Did you use it again, for a second task or not at all?
2. What for? The kind of task is enough.
3. Did you show it to anyone, for example help someone else set it up?
4. What stopped you, if you stopped?

- **If they answer,** offer to turn the answers into a public check-back note. If they want that, pass their answers as JSON on standard input to the helper with `link`. Use the keys `version`, `usedAgain`, `whatFor`, `shown` and `stopped`. Show them the answers, say the note will be public, and give the `CHECK_BACK_LINK` URL. They review and submit it on GitHub themselves. Then run the helper with `done`.
- **If they want it later,** run it with `later`, which asks again in two weeks.
- **If they don't want to answer,** run it with `done`.

Never submit anything yourself. Leave out project names, other people and private evidence from the answers you pass, unless they ask to include them and are happy for them to be public. If they want to stop all check-backs, run the helper with `decline`. To start over, use `forget`.

The [feedback guide](https://github.com/zhiganov/impact-to-funding/blob/main/docs/user-feedback.md#three-months-later-a-short-check-back-only-if-you-agreed-to-be-asked) explains the check-back to people.
