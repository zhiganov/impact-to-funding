# What ItF's research means for FtI

A note from 2026-11-21. It applies four research notes to [Funding to Impact (FtI)](https://itfti.org/fti), ItF's funder-side sibling: a file format funders publish on their own sites, at draft 0.1 with no funder adoption yet. It's based on FtI's public pages on itfti.org. Section 1 was corrected the same day, after reading FtI's own design, to note what FtI already plans.

These are suggestions drawn from the research, not findings about FtI.

## 1. Say what the money pays for

[Who pays for maintenance and coordination](2026-11-21-maintenance-and-coordination-funding.md) found that most funding pays for new work and research, not for keeping things running. Builders can't easily tell which funders pay for upkeep.

FtI already plans for this. Its own design asks funders to explain support type, amounts, duration, eligible costs and indirect-cost limits, and who can apply, including individuals, informal groups and fiscally sponsored projects. The public draft 0.1 leaves most of that to CommonGrants fields and the funder's linked programme pages, rather than adding new fields. That's a deliberate choice: CommonGrants' cost vocabulary is shaped by US federal grants and doesn't fit every funder.

What the research adds:

- **Say how restricted the money is:** project-restricted, core or unrestricted. Builders looking for upkeep money filter on this first, and it's the commitment IVAR's Open and Trusting funders are judged by.
- **Prompt for upkeep.** Funders could say plainly whether maintaining and coordinating existing work is eligible.
- Selection criteria, such as the Sovereign Tech Fund's question about what part of a project is underfunded, could go in FtI's existing requirements extension.

## 2. Say how invitation-only funders find people, and who decides

[How participatory and trust-based funders decide](2026-11-21-participatory-and-trust-based-funders.md) found that many funders don't take applications. They find grantees through current partners, nominations or their own maps of a field. Some hand the decision to community panels or to the applicants.

FtI has an `invitation_only` intake mode, and its guidance asks funders to say whether they accept unsolicited approaches. That tells a builder they can't apply, but not how to get noticed. Possible additions:

- how the funder finds grantees: partner nominations, its own mapping, or open calls in some years;
- who decides: staff, board, a community panel, or the applicants themselves;
- public commitments it has signed, such as IVAR's Open and Trusting Grant-making or Meet the Moment.

## 3. Grow adoption through a cluster of funders

[What gets a tool taken up](2026-11-21-tool-uptake-in-communities.md) found that peers carry a practice, often more than once, and that trained people continue only with support. [How 360Giving won adoption](2026-11-21-360giving-adoption.md) shows the same pattern among funders. Applied to FtI:

- **Start with funders who know each other.** 360Giving began with a funder convening funders and technical experts. One large funder published its whole back catalogue early. A funder network, pooled fund or signatory group is a cluster that already exists. Pitching scattered funders one at a time is the pattern least likely to spread.
- **Make publishing free and supported.** 360Giving offers free workshops, a helpdesk, one-to-one help and a checker. FtI has a validator, but its code is private. A free public checker, or a way to generate a file from a funder's existing pages, would lower the cost.
- **Give funders something back.** 360Giving publishers get a shared search, benchmarking and an annual report on UK grantmaking. FtI's value is mostly to applicants. FtI could offer funders something too, for example fewer ineligible applications.
- **Define "active" for funders,** and expect decay. Over a third of 360Giving's publishers hadn't updated a file in the past year. FtI's `reviewDueOn` field could define an active publisher: one whose file was reviewed by its own due date.
- **Keep the fields builders need most required or prominent.** 360Giving's optional fields stay sparse: only 41% of grants carry a duration.
- **Expect it to take years.** 360Giving took ten years to reach about 355 funders, with government help.

## 4. Fit beside 360Giving in the UK

360Giving publishes past grants. FtI publishes priorities and current calls. They complement each other. An FtI file could link to the funder's 360Giving data, and use the same organisation identifiers, so that an agent can see both what a funder says it funds and what it has funded.

## Limits

- This note doesn't quote FtI's private design documents or code.
- The research notes are dated 2026-11-21, mostly from Hey Nabu summaries. Check sources before relying on figures.
