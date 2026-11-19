# Handing off between ItF and a community platform

How a community platform, such as a member dashboard, a knowledge base or a funding page, could work with ItF without becoming part of it. This collects the proposed answers to the design questions in [#29](https://github.com/zhiganov/impact-to-funding/issues/29), posted on 2026-11-15 and 2026-11-19. Each section links the full comment. All examples are fictional.

ItF stays a skill people use on its own. A platform manages participation and access. Nothing here is built, and the last question still needs a real community.

## 1. The smallest handoff

[Full answer](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6892168166).

- **Into ItF:** the person brings only what they choose and may share: links, exported files (such as a Harmonica session in Markdown) and a short note on where each item came from, its date and who may see it. ItF never gets platform logins.
- **Out of ItF:** three outputs a platform can link to or read.

| Output | Status | How a platform uses it |
|---|---|---|
| An approved public report at a stable URL, with a revision and period | Exists | Links to it |
| A support profile (`itf-manifest.json`), plus `funding.json` for financial facts | Exists | Links to funding destinations |
| Profile, contribution and need records in the person's own ATProto account | [Sketched](itf-records-sketch.md) | A dashboard reads them directly ([#102](https://github.com/zhiganov/impact-to-funding/issues/102)) |

The first two work today. The records are the only new part, and they're optional.

## 2. What survives the handoff

[Full answer](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6892201609).

**The handoff carries a pointer, not a copy.** A platform gets a link to an exact report revision. Claims, scope and limits stay in the report.

| What must survive | How |
|---|---|
| Source dates | The link carries `period`, `published` and `revision`. Retrieval dates stay separate from observation dates. |
| Claim scope | Only in the report. The [impact badge](impact-badge-contract.md) shows at most three claims, each from the report. |
| Evidence access | Private evidence never crosses. The report names what's missing with the portable records' states: `not_supplied`, `withheld`, `inaccessible`, `deleted`, `withdrawn`, `unavailable`. |
| Review status | `provenance` gives the weakest review basis among the claims shown. A review is bound to one revision by content digest; a new revision doesn't inherit it. |
| Corrections | A new revision records what it `supersedes`. The old link's `state` becomes `corrected` or `withdrawn`, and `statusUrl` points to the current status. |

## 3. Keeping roles separate

[Full answer](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6892447686).

Each comes from a different place, and none implies another:

| | What grants it | What it doesn't give |
|---|---|---|
| Identity | The person's own account | Membership, authority or trust |
| Membership | The community's member list and roles | Project authority, review competence, evidence access or endorsement |
| Project authority | The project's own decision rule | Authority over other projects. A community admin isn't a project approver. |
| Evidence access | Permission per item and purpose, from whoever holds it | Permission to process, publish or keep it |
| Review | A named reviewer accepting one exact claim version | Review of later versions |
| Publication | Approval of one exact public version | Permission to publish anything else |

Any app action passes two gates: the community allows the person to do it, and the person has granted the app permission. A module that only reads needs no write permission.

## 4. When things change

[Full answer](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6998222947).

**Public links point at a report, never at evidence.** A private change shows publicly only as a change to the report.

| What changes | Publicly |
|---|---|
| Someone withdraws permission for their evidence | If a public claim depended on it, a new, narrower revision. The report doesn't say whose evidence changed or why. |
| Evidence becomes unavailable | Nothing, unless a claim loses its support. |
| The report is corrected | A new revision; the old link becomes `corrected`, or `withdrawn` if nothing replaces it. |
| A reviewer withdraws | `provenance` drops to what still applies. The withdrawal is noted without a private reason. |
| A member leaves | Their records stop showing in that community's dashboard. Their public report stays unless they withdraw it. |

A dashboard never shows evidence, reviewer notes or the reason for a withdrawal. It never shows an old revision as `current`, and it never treats a missing record as proof of deletion. A claim that depends on withdrawn evidence changes straight away; other small fixes can wait for the next scheduled revision, so changes don't line up with one person's decision.

## 5. Activity isn't outcome

[Full example](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6998281863).

RSVPs, check-ins, discussions, consent decisions, contribution records and met needs all show activity. None of them, alone or added up, shows an outcome. A report keeps them as activity, states outputs with their source, and marks outcomes it can't support as aims. A dashboard links to the report and never turns activity into a score or ranks members.

## 6. funding.json stays financial

[Full answer](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6998355048).

funding.json v1.1.0 says where money can go. The [support profile](support-profile-contract.md) says what it's for and links the reports, as a standalone `itf-manifest.json` or under `extensions["org.impact-to-funding.support"]`. A support case points to a funding plan with `fundingPlanRef` and to reports with `reportRefs`. A report correction changes only the support profile; a plan change changes only funding.json.

## 7. Still open: which action would an integration improve?

[Groundwork](https://github.com/zhiganov/impact-to-funding/issues/29#issuecomment-6998436274).

This needs a real community. The candidate actions are:

- noticing new or corrected reports;
- seeing who needs help;
- seeing each other's work;
- linking reports in funding updates.

Before building, ask a community five questions and run a manual test. For a few weeks, a steward posts reports, corrections and needs where the community already reads, and notes what gets used. The same questions are on [my-community#140](https://github.com/Citizen-Infra/my-community/issues/140).

## Limits

These are design proposals. Nothing enforces them in a platform, and nothing here was tested end to end or with a live funding platform. The community-admin details come from my-community's public code; community-admin itself is private.
