# Decision: cross-domain support discovery, optional OSS compatibility

**Date:** 2026-11-09. **Status:** accepted architectural direction for #49.
This architecture decision did not adopt exact fields, identifiers or carrier
names. Their later [field-contract adoption](support-profile-baseline-decision.md)
is separate; neither decision implements an exporter or establishes compatibility.

The bounded design slice below has produced a
[field/carrier/projection contract](support-profile-contract.md) and reconciled
fictional examples, now accepted in the separate field-contract decision.

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

## What this architecture decision left open

At architecture adoption, the `itf.support/0.1-proposal` identifier, JSON field
shapes and carrier spelling were candidates. This decision accepted their jobs,
not those exact names or monetary rules. The later field-contract decision accepts
those concrete conventions without claiming a registered namespace or executable
schema. The JSON examples remain authored illustrations, not consumer trials.

The real inactive ItF `funding.json`, its financial status/destination and existing
disclosure limits are unchanged. No schema, codec, exporter, reader, installation,
live evidence processing, directory submission, outreach or funding operation was
delivered. #48's independent manual evidence workflow is not selected by this
decision, and ordinary skill use requires no manifest or service.

## Completed bounded scope: define the contract, not the runtime

The subsequent design slice in [#49](https://github.com/zhiganov/impact-to-funding/issues/49)
produced **one minimal contract draft and a reconciled fictional walkthrough**
for review. It reused the existing assessment, source mapping, #14 content concepts
and #47 disclosure rules. Its finish condition was
that an implementer can determine what each supported representation means and
which inputs cannot be safely represented, without inventing facts.

The slice addressed:

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

The draft received an explicit **field-contract adoption** decision, recorded
separately. This design slice implemented no exporter/reader, dependency, schema
endpoint, live manifest change or directory test. An
actual consumer's unavailable capability may limit a later compatibility claim,
but does not block drafting the general contract or require participant recruitment.

With the field contract accepted, define/select the smallest authoring/projection
implementation against it and verify its actual behaviour. Consumer-specific tests,
upstream contact and public fundraising retain their own real scope boundaries.
This dependency path records the next work; it does not start that work.
