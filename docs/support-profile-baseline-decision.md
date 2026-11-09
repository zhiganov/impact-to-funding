# Decision: accept the initial ItF support-profile field contract

**Date:** 2026-11-09. **Status:** accepted ItF design baseline for #49; not a
released standard, registered namespace, executable schema or tested integration.

## Accepted contract

Accept the reviewed [support-profile contract](support-profile-contract.md) and
its [fictional walkthrough](../examples/funding-interchange.md) under the previously
accepted [cross-domain architecture](funding-interchange-direction-decision.md).
This advances from architecture-only acceptance to a concrete field, carrier and
projection target; it does not implement that target.

- Retain the exact identifier **`itf.support/0.1-proposal`**. Its suffix is part of
  the literal version identifier, not a statement that adoption remains pending.
  It is not a claim of an upstream standard or public v0.1 software release.
- Accept the standalone support-document shape and the optional funding.json
  v1.1.0 OSS carrier at `extensions["org.impact-to-funding.support"]` as ItF
  conventions. These are not upstream-defined fields or registered names.
- Accept the contract's required/optional fields, local identity/version rules,
  public references, canonical/derived representations and explicit unknown,
  unsupported, invalid, limited and conflicting interpretation behaviour.
- Preserve cross-domain, non-financial and prospective support without mandatory
  public contacts, repositories, licences, payment channels or past outcomes.
- Accept the monetary rules, including **0 = any amount**, omitted unknown
  amounts, amount/currency pairing and separate case/monetary-plan statuses.
  Preserve the distinction between a gross proposed amount, actual costs,
  existing support and a net uncovered need.
- Keep one monetary authority: embedded monetary cases reference the enclosing
  base plan rather than duplicate money. Matching plan identity/version does not
  establish valid financial terms. Preserve otherwise valid support declarations
  with a financial limitation instead of applying or silently repairing bad terms.
- Accept the ItF-free financial projection: remove only the ItF carrier, preserve
  unrelated data/base values, identify its financial source basis and disclose
  lost support/report context. It is not a byte-identical or lossless round trip.

The maintained contract is the field-definition source. The architecture assessment
remains its rationale/overview, not a second editable specification. Future changes
to these meanings require an explicit contract/version decision; a permissive
upstream schema does not authorise silently reinterpreting unknown fields.

## Evidence and limits

Two documentation reviews examined the working contract and examples. One material
ambiguity about invalid referenced financial terms was repaired and resolved in a
targeted recheck. Four package checks, text/link integrity, fictional JSON and
targeted field/reference/arithmetic/projection checks passed. These are design and
structural checks, not a complete schema engine, reader/exporter, consumer import,
round trip, model trial, eligibility result or impact evaluation.

No upstream extension agreement, directory support, FLOSS/fund/Zerodha affiliation
or endorsement is established. The current inactive ItF `funding.json`, destinations,
financial status, installed skill and MCP configuration are unchanged. No private
evidence, participant collection, application, outreach, payment or public-report
operation is delivered by adopting this contract.

## Remaining work

#49 remains open for implementation against this baseline and actual verification
of supported behaviour. The next stage is the smallest authoring/projection slice
that can represent the two fictional domains, preserve financial meaning and
report unsupported/lost information honestly. No implementation is selected by
this decision. Consumer-specific compatibility still requires actual selected
consumer/version evidence; directory submission and upstream outreach are separate.

#48's manual/private evidence-collection and funder-view support remains independent.
Neither workstream requires a public manifest, fundraising account, hosted store,
Groups deployment or a new test platform for ordinary ItF use.
