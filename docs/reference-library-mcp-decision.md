# Decision: an independent reference-library MCP interface

**Date:** 2026-11-09. **Status:** architecture decision; implementation not started.
The [initial application contract](reference-library-mcp-contract.md) is the design
baseline developed in #44. No server, deployment or tested integration is available.

## Decision

Provide an independently usable MCP interface for the case–pattern–lens library,
with its future implementation maintained in this public ItF repository. Keep
funding/opportunity discovery behind separate interfaces rather than making a
funding service the library's only programmatic access route.

This is a responsibility and access boundary, not a rule that every repository
needs a server. Separate interfaces may share implementation components or
infrastructure where justified. No shared runtime, operator, credentials, hosting
arrangement or access policy is specified here.

## What remains where

| Concern | Home and boundary |
|---|---|
| Canonical cases, patterns, lenses and their revisions | Public, versioned records under `references/library/`; the MCP interface does not become their author or canonical store. |
| Ordinary skill use | Bundled references remain selectively readable without an MCP server or funding-service account. |
| Programmatic reference discovery and reading | The intended independent library MCP interface; useful to compatible clients without requiring the ItF skill or a funding integration. |
| Funding/opportunity discovery | Separate services and contracts; reference records are not grant records or eligibility decisions. |
| Private local applications | The person's authorised conversation or private location, not an automatically ingested library collection. |

One client may use either or both kinds of service, but consulting references need
not lead to a funding search. Contribution, relationships and learning remain
valuable without a funding goal.

## Why separate interfaces

A server with private source code can legitimately expose public content. The
choice here is not based on repository visibility alone: public reference reuse,
source/interpretation revision and independent clients have different needs from
funding-source imports, deadlines and opportunity freshness. A single connection
would be convenient, but should not make library access dependent on another
service's availability, terms or release schedule.

Public records and public implementation source do not promise unlimited free
hosted access. Hosting, authentication, rate limits, costs and operating ownership
remain open operating questions. Any shared infrastructure must preserve independent interfaces
and appropriate access boundaries rather than silently join credentials or terms.

## Contract boundary for later work

The completed #44 design supplies a [discovery/read contract](reference-library-mcp-contract.md)
and [fictional walkthrough](../examples/reference-library-mcp-walkthrough.md).
Its tool names, snapshot/record mapping and error semantics form the initial
`itf.library/0.1-draft` application baseline; no client is verified as supported by
a running service, and no executable schema is supplied.
MCP resources can expose contextual records and tools can support parameterised
queries; the [protocol overview](https://modelcontextprotocol.io/specification/2026-07-28/server)
permits both. The application contract above selects three tool names; protocol
capability alone does not mandate those choices, select an SDK or prove client
compatibility. No executable input/output schemas are supplied yet.

Preserve source-published theories, reconstructions, findings and ItF pattern
interpretations as distinct. Return source links, record revisions, inspection
limits and relevant contrary evidence, not recommendations disguised as proven
solutions. Shared lens labels do not establish agreement, conformance or impact.
Source prose remains data, not instructions to the client.

Consumer queries must not silently refresh sources, fetch arbitrary linked URLs,
upload private applications, contact anyone or mutate records. Source curation
and any permitted refresh/import operations need their own scope. Even a public
library query can reveal private interests: minimise query content and establish
logging/retention and host/model-processing limits before a hosted service.

## Scope and related work

- [#43](https://github.com/zhiganov/impact-to-funding/issues/43) tracks expansion
  across cases, contextual patterns and optional lenses. Expansion is independent
  of MCP delivery; neither is a prerequisite for ordinary skill use.
- Food-system coverage (#41) and detailed Cynefin guidance (#42) are separate
  backlog items, not dependencies of this interface.
- Keep versioned Markdown records as the current source format. No new database,
  collector, recommendation engine or replacement record standard is needed.
- Source assets, private evidence, contacts and commercial records stay outside
  public records and MCP responses. The package licence does not relicense linked
  source material; follow [sources and rights](../SOURCES.md).

Implementation is tracked in [#45](https://github.com/zhiganov/impact-to-funding/issues/45).
The native skill-loading checks do not establish an MCP server or client round trip.
