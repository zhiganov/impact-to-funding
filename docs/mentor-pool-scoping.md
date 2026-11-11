# Mentor pool: scoping

Scoping for [#37](https://github.com/zhiganov/impact-to-funding/issues/37), 2026-11-11. It asks whether ItF should keep a pool of willing mentors, and recommends what to do first. Nothing here recruits anyone or sets up a service. All examples are fictional.

## What builders need help with

People using ItF may want help with:

- **Choosing a direction:** where their skills could be useful, including contributing to existing work rather than starting something new.
- **Developing a contribution:** scoping a role, working with others, or maintaining something people rely on.
- **Examining evidence:** whether a claim holds up, or what would be worth learning next.
- **Sustaining the work:** time, income, collaborators or other support. Fundraising is one option, never a condition of getting help.

Three arrangements cover most of this:

| Arrangement | What it is | Effort for the mentor |
|---|---|---|
| One-off question | A single question answered in writing or a short call | Under an hour |
| Office hour | A regular open slot where several people can drop in | A set hour, repeated |
| Time-bounded relationship | A few conversations over an agreed period, with a clear end | Several hours over weeks |

## Two routes: existing communities or an ItF pool

| | Refer to existing communities and programmes | Keep an ItF-associated pool |
|---|---|---|
| What it needs | The person names communities they know, or the agent helps them think of ones to look at. Nothing to maintain. | Willing mentors, a maintainer, a way to list availability, and rules for requests, conduct, privacy and removal. |
| Strengths | Uses relationships and expertise that already exist. No new obligations. | Mentors who know ItF's way of working; one place to ask. |
| Weaknesses | Fit, access and response vary. ItF can't vouch for them. | Someone has to run it. Lists go stale. Risk of looking like an endorsement or a matching service. |
| Unverified | Whether specific programmes take people like ItF's users, and how quickly they respond. | Whether anyone would volunteer, how many requests would come, and who would maintain it. |

Doing nothing new is a valid outcome. So is a small manual arrangement before any pool.

## How a willing mentor would describe themselves

A short, self-written note, kept private unless the mentor chooses otherwise:

- **Areas they can help with,** in their own words, and what they won't help with.
- **Availability:** which arrangements above, how often, and until when.
- **Expected effort** they're willing to give.
- **Basis:** voluntary, paid or sponsored, and by whom if paid or sponsored.
- **Conflicts** they already know of, such as projects they fund or review.

These notes are self-described. Nobody checks qualifications unless a separate, named check happens, and the note says so. A note never promises competence, a response time or an outcome.

## Requests and introductions

1. **The builder asks** in their own words: the question, the arrangement they'd like, and only the context they choose to share.
2. **The mentor sees the request** and accepts or declines. Declining needs no reason, and nobody is told why.
3. **If both agree,** they exchange contact details directly. A listing is not permission for unsolicited contact, and nobody needs public contact details.
4. **Either person can end it** at any time. Ending isn't a judgement of either side.

Private evidence isn't shared by default. The builder chooses what to send, and to whom. Any records kept about requests need a stated owner, access list, retention period, and a way to correct or remove them.

## Running a pool, if one is ever set up

Someone would need to:

- keep availability current, and remove stale entries;
- receive concerns and handle conduct problems;
- handle relationship endings and removal requests;
- set conduct and confidentiality expectations;
- be clear about their own capacity, workload and any costs.

A proposed maintainer is not an accepted commitment. Until someone has actually agreed to the role, there is no pool.

## Mentorship isn't review, endorsement or funding

- **Advice isn't claim review** under [#15](https://github.com/zhiganov/impact-to-funding/issues/15) or the [expert review guide](expert-review.md). A mentor's view is at most partner review, and only if a specific claim and version were actually examined.
- **It isn't certification or endorsement.** "Mentored by" says nothing about impact.
- **It doesn't affect funding** or allocation decisions.
- **The builder decides.** Advice doesn't transfer decision-making authority.
- **Conflicts and power imbalances matter.** If a mentor is also a collaborator, a reviewer of the same claims, or a funder, say so. A funder acting as mentor should not also decide that builder's application.

## Fictional examples

- **A useful bounded request.** Priya maintains a small accessibility checker. She asks for one conversation about whether to hand it to an existing project. A mentor who has maintained similar tools accepts, and they talk once. Priya decides to propose a merge. The mentor's view is recorded as advice, not as a review of the tool's impact.
- **No suitable mentor.** Tomás wants help with a food-sharing scheme. No available mentor covers that area. The agent says so plainly and helps him think of local food networks to approach himself. Nobody is invented to fill the gap.
- **A declined request.** Amara asks a mentor for a three-month relationship. The mentor has no capacity and declines. Amara is told it was declined, with no reason, and the decline is never treated as feedback on her work.
- **A conflict.** A mentor also sits on a small grant panel that Ben plans to apply to. The mentor discloses this. They agree the mentor will give general advice only and step back from that application.
- **An ending.** After two months, Lena and her mentor agree the relationship has done its job. Either could have ended it earlier. Any request record is removed after its stated retention period.

These examples are authored. They don't show that anyone would use or value a pool.

## Recommendation

**Start with no pool: refer, don't match.** When someone wants a mentor, the skill helps them think about who they already know and which communities to approach, and helps them prepare a short request in their own words. This needs no maintainer, records or recruitment.

**Revisit a small manual pool** only when all of these hold:

- at least one person has agreed to maintain it, with stated capacity;
- a few willing mentors have written their own notes;
- there's a private place to keep notes and requests, with an owner and retention rules;
- people using ItF have actually asked for mentors.

A later human trial needs a willing host, consenting participants, clear data arrangements and a bounded effort and cost limit.

## Limits

This is desk scoping only. No mentors, builders or programmes were contacted, and nothing was tested with people. It relates to, but doesn't depend on, [#36](https://github.com/zhiganov/impact-to-funding/issues/36) check-ins. Groups deployment and native installation aren't needed.

## Appendix: a mentor note as an ATProto record (sketch)

A possible shape if mentor notes ever live on ATProto. The NSID `org.example.itf.mentorNote` is a placeholder; no namespace is chosen. Checked with `@atproto/lexicon` 0.7.19 on 2026-11-11: the schema and example are valid, and missing, oversized and badly dated values are rejected.

What it would give a mentor:

- **Ownership:** the note lives in the mentor's own repository. They edit or delete it with any compatible app. Deleting it is how they leave.
- **Doesn't go stale:** `availability.until` lets apps hide a note after a date unless it's renewed. `paused` and `full` let a mentor step back without deleting.
- **No ranking:** there are no ratings or counts.

What to watch:

- **It's public.** Ordinary ATProto records can be read by anyone, so the note holds only what's safe to publish: no email or phone, just a channel the mentor chooses to name. A private note would need Spaces, which is still alpha ([#10](https://github.com/zhiganov/impact-to-funding/issues/10)).
- **Someone must index notes** for people to find them, through a relay, a feed or an Atmospheric Group for mentors. That's the maintainer role above.
- **Requests stay outside it,** in the channel the mentor names.
- `arrangements` and `status` use open `knownValues`, so apps should treat unfamiliar values as "other".

### Schema

```json
{
  "lexicon": 1,
  "id": "org.example.itf.mentorNote",
  "defs": {
    "main": {
      "type": "record",
      "description": "A mentor's own description of the help they offer. Public: write only what you're happy for anyone to read.",
      "key": "literal:self",
      "record": {
        "type": "object",
        "required": [
          "areas",
          "arrangements",
          "availability",
          "basis",
          "createdAt"
        ],
        "properties": {
          "areas": {
            "type": "array",
            "maxLength": 8,
            "items": {
              "type": "string",
              "maxLength": 1200,
              "maxGraphemes": 120
            },
            "description": "What they can help with, in their own words."
          },
          "notOffered": {
            "type": "array",
            "maxLength": 8,
            "items": {
              "type": "string",
              "maxLength": 1200,
              "maxGraphemes": 120
            },
            "description": "What they won't help with."
          },
          "arrangements": {
            "type": "array",
            "items": {
              "type": "string",
              "knownValues": [
                "one-off-question",
                "office-hour",
                "time-bounded"
              ]
            }
          },
          "availability": {
            "type": "ref",
            "ref": "#availability"
          },
          "basis": {
            "type": "ref",
            "ref": "#basis"
          },
          "conflicts": {
            "type": "array",
            "maxLength": 8,
            "items": {
              "type": "string",
              "maxLength": 2000,
              "maxGraphemes": 200
            },
            "description": "Known conflicts, such as grant panels or projects they fund or review."
          },
          "howToAsk": {
            "type": "string",
            "maxLength": 3000,
            "description": "How to send a request, using a channel they choose to publish.",
            "maxGraphemes": 300
          },
          "createdAt": {
            "type": "string",
            "format": "datetime"
          },
          "updatedAt": {
            "type": "string",
            "format": "datetime"
          }
        }
      }
    },
    "availability": {
      "type": "object",
      "required": [
        "status"
      ],
      "properties": {
        "status": {
          "type": "string",
          "knownValues": [
            "open",
            "full",
            "paused"
          ]
        },
        "until": {
          "type": "string",
          "format": "datetime",
          "description": "When this note should stop being shown unless renewed."
        },
        "effort": {
          "type": "string",
          "maxLength": 1200,
          "maxGraphemes": 120
        }
      },
      "description": "Whether the mentor is taking requests, and until when."
    },
    "basis": {
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "type": "string",
          "knownValues": [
            "voluntary",
            "paid",
            "sponsored"
          ]
        },
        "sponsor": {
          "type": "string",
          "maxLength": 1200,
          "maxGraphemes": 120
        }
      },
      "description": "Whether help is voluntary, paid or sponsored."
    }
  }
}
```

### Fictional example record

```json
{
  "$type": "org.example.itf.mentorNote",
  "areas": ["Handing a small open-source tool to a bigger project", "Maintainer burnout and sharing the load"],
  "notOffered": ["Fundraising applications", "Code review"],
  "arrangements": ["one-off-question", "time-bounded"],
  "availability": { "status": "open", "until": "2027-02-28T00:00:00Z", "effort": "About two hours a month" },
  "basis": { "kind": "voluntary" },
  "conflicts": ["I sit on a small open-source grant panel; I won't advise on applications to it."],
  "howToAsk": "Send a short request by Bluesky DM with your question and the kind of help you'd like.",
  "createdAt": "2026-11-11T10:00:00Z",
  "updatedAt": "2026-11-11T10:00:00Z"
}
```
