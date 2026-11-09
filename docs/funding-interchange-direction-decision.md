# Decision: cross-domain support discovery, optional OSS compatibility

**Date:** 2026-11-09. **Status:** accepted architectural direction for #49.
Concrete fields, identifiers, carrier names and schemas remain candidates, not an
adopted field contract, implemented exporter or tested consumer integration.

## Accepted direction

Adopt the architectural direction assessed in the
[funding-interchange design](funding-interchange-design.md), published with its
[fictional examples](../examples/funding-interchange.md) at
`04539da64562730b58e730f3471b3e0ac55ee1a5`:

- A **domain-neutral ItF support document** is the first-class machine-readable
  path for connecting support needs, proposed contributions and permitted reports.
  ItF is not restricted to OSS, software, public fundraising or past outcomes.
- **Optional funding.json compatibility** serves appropriate OSS cases and their
  consumers. Preserve upstream financial meanings in a plain financial view;
  support an optional qualified same-file ItF extension for readers that actually
  understand it. Do not force other work into FOSS repository/licence/contact or
  payment requirements, or substitute a webpage-only bridge for the broader goal.
- funding.json, introduced by FLOSS/fund, is a valuable reference and inspiration,
  not the universal ItF model. FLOSS/fund describes itself as a Zerodha initiative;
  no separate legal-entity status, affiliation or endorsement is asserted here.
  Neither upstream's mission nor its standard is changed by this decision.
- Private collection plans, evidence registers and per-funder application drafts
  remain separate from any curated public support document. Reuse existing claim,
  contribution, review, version, shared-cost and disclosure rules, not a new
  assessment engine, universal score or verified-impact badge.

The trade-off is explicit: richer cross-domain relationships require an ItF-aware
reader. An existing funding.json consumer is only a target for its actual financial
contract; added-field handling, report discovery, eligibility and directory support
are not inferred from permissive schema validation.

## What remains open

The proposed `itf.support/0.1-proposal` identifier, JSON field shapes, illustrative
filename and `extensions`/`org.impact-to-funding.support` carrier spelling remain
**candidates**. This decision adopts their intended architectural jobs, not those
exact names, all proposed monetary rules or a published namespace. The existing
JSON examples remain authored design illustrations, not normative fixtures.

The real inactive ItF `funding.json`, its financial status/destination and existing
disclosure limits are unchanged. No schema, codec, exporter, reader, installation,
live evidence processing, directory submission, outreach or funding operation was
delivered. #48's independent manual evidence workflow is not selected by this
decision, and ordinary skill use requires no manifest or service.

## Next bounded scope: define the contract, not the runtime

The next design slice in [#49](https://github.com/zhiganov/impact-to-funding/issues/49)
should produce **one minimal contract draft and a reconciled fictional walkthrough**
for review. Use the existing assessment, source mapping, #14 content concepts and
#47 disclosure rules; do not restart broad format research. Its finish condition is
that an implementer can determine what each supported representation means and
which inputs cannot be safely represented, without inventing facts.

Resolve within that slice:

1. **Exact document meaning:** minimum/optional fields, types, allowed values,
   identifier scope, content versus report/review versions, unknowns and partial
   coverage. Keep non-software, non-monetary and prospective cases first-class;
   a public contact, payment route or full claim schema is not an entry requirement.
2. **Carrier and source rules:** settle profile/version and carrier conventions,
   identify one canonical editable source, and explain derived views and unresolved
   references. Preserve the accepted standalone and optional same-file OSS paths
   without treating candidate key names as already agreed upstream.
3. **Financial mapping and loss:** define money versus upstream plan references,
   amount/unknown/zero semantics, required real facts for an OSS projection,
   duplicate-cost safeguards and what the plain view loses. Preserve upstream
   financial meaning; do not infer a net gap, allocation, payment authority or
   eligibility from data shape.
4. **Safe lifecycle and unsupported input:** specify curated public output,
   permission changes, corrections/supersession, unavailable versions and unknown
   profiles/fields. No hidden fetch, upload, automatic publication or promise of
   complete history/recall follows from a reference.
5. **Reviewable examples:** reconcile the fictional non-software and OSS cases,
   changed references, missing financial facts and information-loss cases with
   the draft. Check local references and package/text integrity, stating exactly
   what was inspected. These are design checks, not consumer or model trials.

Deliver the draft for an explicit **field-contract adoption or revision** decision.
Do not implement exporters/readers, install dependencies, publish a schema endpoint,
change the live manifest or run a directory test during this design slice. An
actual consumer's unavailable capability may limit a later compatibility claim,
but does not block drafting the general contract or require participant recruitment.

After a field contract is accepted, define/select the smallest authoring/projection
implementation against it and verify its actual behaviour. Consumer-specific tests,
upstream contact and public fundraising retain their own real scope boundaries.
This dependency path records the next work; it does not start that work.
