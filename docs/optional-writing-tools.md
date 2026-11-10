# Optional writing tools

Two tools can help you polish a brief, report or profile before you share it. Neither is needed to use ItF.

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

## Limits

We haven't tested the Pangram MCP server with ItF. The costs and policy above are Pangram's own statements on the date shown. Pangram's claimed accuracy is its own figure, and every detector sometimes flags human writing.
