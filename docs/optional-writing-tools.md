# Optional writing tools

Two tools can help you polish a brief, report or profile before you share it. A third, Hey Nabu, can help with funder research. None is needed to use ItF.

## Readability check (local)

The [readability check](../tools/readability/README.md) runs on your machine. It flags long sentences, passive voice and adverbs, and gives a reading grade. It sends nothing anywhere and needs no account.

```sh
node tools/readability/cli.mjs brief.md
```

## Pangram (online)

[Pangram](https://www.pangram.com/) estimates whether text reads as AI-written. Some people use it to check a public profile or report before posting it. A score says nothing about whether the writing is accurate or good.

**Use it from your agent.** Pangram runs an MCP server at `https://www.pangram.com/mcp`. Add that URL to your host's MCP settings, then sign in to Pangram in your browser when asked. Your agent gets three tools: `check_for_ai`, `check_for_similarity` and `list_models`.

In Claude Code, for example (see its [MCP docs](https://code.claude.com/docs/en/mcp)):

```sh
claude mcp add --transport http pangram https://www.pangram.com/mcp
```

Run `/mcp` in Claude Code to sign in to Pangram. Then ask: "Use Pangram to check this draft for AI-assisted writing and explain the sections with the strongest signal."

There's also a [REST API and Python SDK](https://docs.pangram.com/) that use an API key.

**Cost** (as of 2026-11-10, from the [pricing page](https://www.pangram.com/pricing)): MCP and API use are billed to API credits, at $0.05 per 100 words. The Individual plan is $20 a month after a 7-day free trial and includes $10 of API credits a month.

**Privacy:** checking text sends it to Pangram. Its [privacy policy](https://www.pangram.com/privacy-policy) (last updated 2025-08-14) says submissions aren't used to train its models. It also says content is deleted within 30 days of closing an account, and you can delete individual queries from your history. Send only text you're allowed to share with Pangram. Don't send private evidence or other people's details.

## Hey Nabu (online, invitation only)

[Hey Nabu](https://heynabu.ai/) serves researched experts on making change, including how funders decide and move money. Your agent can ask it which funders pay for a kind of work, and how. It's an early alpha, open by invitation, with a waitlist. Our [assessment](hey-nabu-assessment.md) covers what it held for one funding question, and what it lacked.

**Use it from your agent.** Hey Nabu runs an MCP server at `https://heynabu.ai/api/mcp`. Add that URL to your host's MCP settings, then sign in with the emailed link when asked. In Claude Code:

```sh
claude mcp add -s user --transport http hey-nabu https://heynabu.ai/api/mcp
```

Without `-s user`, it's added only for the folder you're in. Then ask, for example: "Use Hey Nabu to find funders that pay for maintaining open tools, and say which leads come from it."

**Treat its leads like an aggregator's.** Label each lead as from Hey Nabu, with the date you asked. Check the funder's own page before relying on terms or round status. Search the web for what it lacks.

**Privacy:** its guidance says it doesn't store what you're deciding or your question. Two of its tools send notes to its editors: coverage requests and suggestions. Don't put private evidence or other people's details in a question.

## Limits

We haven't tested the Pangram MCP server with ItF. Hey Nabu was tested once, from Claude Code, on 2026-11-21. The costs and policy above are Pangram's own statements on the date shown. Pangram's claimed accuracy is its own figure, and every detector sometimes flags human writing.
