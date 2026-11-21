# Hey Nabu as a funder-research source

An assessment from 2026-11-21. It asks whether ItF's funder research should use [Hey Nabu](https://heynabu.ai/), and how.

**Recommendation:** treat it as an optional secondary source, like an aggregator listing. Don't change the skill yet. Hey Nabu is invitation-only, so most builders can't use it.

## What it is

Hey Nabu is an MCP connector that serves researched "experts" on making change. Each expert reads chosen sources every day and keeps the stories that fit its focus. Research behind each expert records organisations, funders, funding and initiatives, with sources and the date each was read. AI agents tried to disprove its claims, and it keeps what they found.

It's an early alpha from a small team, "by invitation", with a waitlist. Sign-in is by emailed link. On the date of this assessment it served ten experts, all built for Mycelial and open to every invited reader.

Three experts touch ItF's work:

- **Systemic Philanthropy:** how funders decide and move money, including paying for coordination and for the upkeep of shared tools.
- **System Change:** how systemic change gets made and funded, told from inside the work.
- **Reaching People:** how ideas and tools get taken up and passed on.

## The test

One question, asked through the connector on 2026-11-21 (server version 0.17.0): which funders pay for open-source maintenance and community coordination, rather than new projects?

**What it held:**

- **Funders and programmes with terms:** the [Sovereign Tech Fund](https://www.sovereign.tech/programs/fund), with its €50,000 minimum, licence rules and four criteria; GitHub's Secure Open Source Fund, at $10,000 per project; the [Marguerite Casey Foundation](https://caseygrants.org/)'s multi-year general operating support, by invitation; and the [Participatory Grantmaking Community](https://www.participatorygrantmaking.org/), including its own thin budget.
- **Field figures:**
  - Invest in Open Infrastructure counted $663 million across 94 open infrastructures from 2001 to 2026. Only $64 million paid to keep them running.
  - About 20% of direct grants to open infrastructure pay for operations.
  - Bridgespan found that field catalysts had a median annual funding gap of $2.5 million.
- **Gaps it named itself:** for example, whether funding for a collaboration's backbone lasts after its first three to five years.

**What it lacked:**

- **Smaller open-source grant programmes:** NLnet's funds, NumFOCUS small grants and Alpha-Omega were missing. A web search found them, so a builder would still need one. I filed this gap with Hey Nabu.
- **Some summaries:** many story results had no summary, only a title and link.
- **Reliability:** two of five searches failed with a server error. Simpler wording worked.

The full findings are in [Who pays for maintenance and coordination](research/2026-11-21-maintenance-and-coordination-funding.md).

## How it fits ItF's funder-research rules

The [support-brief playbook](../playbooks/support-brief.md) asks the agent to:

- prefer each funder's own page to aggregator listings, and label which is which;
- record open, rolling or closed status with the date checked;
- list the checks still needed.

Hey Nabu fits that if the agent treats it as an aggregator:

- **Label leads** from it as "from Hey Nabu", with the date asked.
- **Follow each lead to the funder's own page** before stating terms or round status. Hey Nabu gives its own sources' dates. A round can close after its research was done.
- **Say what it lacked,** then search the web for the rest, as Hey Nabu's own guidance also asks.

Its strength is context a funder page doesn't give. It shows who funds coordination, and how thin upkeep funding is. A builder can use that to frame a request, for example by asking for operations money in its own right.

## Privacy

Hey Nabu's guidance says it doesn't store what a person is deciding or their question. Two of its tools file notes for its editors: coverage requests and suggestions. An agent should file only the missing subject, never the builder's situation. Don't send private evidence or other people's details in a question.

## Limits

- **Access:** it's invitation-only, so it can't be a default step in the skill.
- **One test:** this assessment rests on a single funding question on one day. It doesn't measure coverage across ItF's other tasks.
- **Editorial judgement:** each expert's focus is set by the organisation it was built for. A lead's absence from Hey Nabu says nothing about whether a funder exists.

## Next steps, if adopted

- Add a short Hey Nabu section to the [optional writing tools](optional-writing-tools.md) guide, with connection steps and the privacy note above.
- Once it's open to more builders, consider one line in the support-brief playbook: treat Hey Nabu leads like aggregator leads.
