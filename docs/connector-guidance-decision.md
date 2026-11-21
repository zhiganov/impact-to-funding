# Decision: serve the skill's guidance from the library server

**Date:** 2026-11-21. **Status:** decided for [#96](https://github.com/zhiganov/impact-to-funding/issues/96); not implemented.

## Decision

The hosted ItF connector (#96) adds a second, read-only tool family to the existing reference-library MCP server. It serves the skill's guidance on request, so an agent in a chat app can follow ItF's way of working without skill support. The guidance family gets its own contract version. The three library tools in [`itf.library/0.1-draft`](reference-library-mcp-contract.md) don't change.

Likely tools, to be fixed in the contract:
- **`read_guide`:** returns `SKILL.md`.
- **`get_guidance`:** returns one named file from `references/` or `playbooks/`.

Both serve files from the same source revision as the library snapshot.

## Why

- **One connector.** People in chat apps add one URL, not two. That matters most for people who don't use a terminal (#143).
- **One version.** Guidance and library come from the same snapshot, so they can't drift apart.
- **A precedent.** FtI added a second tool family to its own server for organisation needs, and kept its funding tools unchanged.
- **Tools work widest.** Chat apps support MCP tools more widely than prompts or resources. Hey Nabu serves its guidance the same way, with a `read_guide` tool ([assessment](hey-nabu-assessment.md)).

## Options not chosen

- **A separate guidance server.** It would keep the library contract untouched, but people would add two connectors. One MCP URL is one server, so combining them behind one URL would need a gateway that merges the tool lists.
- **MCP prompts or resources.** These fit guidance well, but chat-app support is narrower than for tools.

## What stays the same

- **The library stays usable on its own.** The three library tools behave exactly as before. A client can use them without the guidance tools, the skill or any account. This keeps the [independent-interface decision](reference-library-mcp-decision.md).
- **Ordinary skill use** needs neither the server nor the connector.
- **The connector never receives a person's material:** no briefs, evidence or assessments.

## Still to check

Whether a chat-app agent actually calls `read_guide` and follows the guidance. #96 lists that test, with a fictional task, in at least one of the Claude apps and ChatGPT.
