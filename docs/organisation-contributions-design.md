# Contribute skills to an existing organisation

**Date:** 2026-11-11

**Status:** design for [#94](https://github.com/zhiganov/impact-to-funding/issues/94).
It describes the intended journey and a bounded implementation scope. The
[source playbook](../playbooks/organisation-contributions.md) now covers supplied
needs and available compatible discovery tools. No live catalogue is bundled.

## Product outcome

A person can help an organisation working in a domain they care about without
founding a project. A developer might build a nonprofit website, a designer improve
its service information, or a marketing specialist prepare a campaign.

Organisations requesting help are a distinct stakeholder from funders offering
money. They define their needs, working constraints and budgets. Contributors
bring skills, available time and their own compensation needs. Paid and pro bono
work are both valid paths; people should not have to volunteer to participate.

The intended path is:

**Organisation-owned needs JSON → compatible discovery service/MCP → ItF helps a
person inspect fit and scope a contribution → the parties agree separately.**

Supplied records and ordinary conversation stay useful without a discovery
service. A project, complete theory of change, public portfolio and new account
are unnecessary entry requirements.

## People and authority

| Role | What belongs to them |
|---|---|
| Requester | Defines the need and intended result. |
| Publisher | Maintains the public request by/on behalf of the requester. |
| Contributor | Chooses the work and terms they can accept. |
| Accepting party | Agrees scope and accepts the contribution on the organisation's behalf. |
| Payer | Has the relevant payment or reimbursement responsibility. |
| Funder | Offers financial support under its own terms. |
| Beneficiaries | People whose situation the work aims to improve; their views and consent need their own basis. |

One organisation may hold several roles. A website contractor's ability to publish
does not establish its authority to commission work or spend an organisation's
funds. A nonprofit label does not establish that a proposed intervention helps.

Reuse the [contribution reference](../references/contributions.md) for bounded roles,
shared work, capacity, evidence and attribution. The contributor supports existing
priorities rather than acquiring the organisation's mission or all its outcomes.

## Organisation publisher journey

1. An authorised person describes the need, intended result, requested skills,
   bounded scope and who will accept and maintain the work.
2. They state compensation arrangements, expense terms and available cost budgets
   separately. Unknown details can remain unknown.
3. They publish intentionally public, versioned JSON on a site they control, with
   authoritative guidance and an official response route. A compatible service
   may index it under an appropriate access/reuse basis.
4. They review, revise, pause, fill or withdraw the need at its source. An index
   shows the source revision, retrieval state and known limitations.

Publish chosen needs and budgets rather than internal finances, staff lists,
beneficiary stories or credentials. The file format and its actual supported
versions belong to the publisher/discovery interface; ItF must inspect those
capabilities rather than assume universal support.

## Builder journey

### Start with the person's situation

Use interests, skills, capacity, location/language needs and compensation
preferences where voluntarily supplied. For example: “I build websites, care
about local access, have ten hours this month and need paid work.” That is enough
to start. A missing personal theory is not a discovery blocker.

### Inspect supplied JSON or discover supported candidates

For a supplied record, inspect its declared version and actual content. Keep
unsupported fields and source claims qualified. Do not fetch linked records or
response forms merely because a supplied file contains URLs.

When discovery is authorised and available:

1. Inspect advertised tools, schemas, supported record versions, filters and
   coverage. Distinguish an unsupported service from a supported empty result.
2. Send only useful, permitted metadata. Skills and location can be sensitive;
   do not send a private assessment, contact list, identity or full portfolio.
3. Apply supported constraints. If a hard requirement cannot be enforced, say so
   and review returned terms locally or explain the remaining gap. Never pretend
   a keyword query evaluated it.
4. Retrieve selected details using the search's snapshot and exact revision where
   supported. Preserve source links, conflicts, age and missing conditions.
5. Present source-qualified possibilities with material limits. Relevance is a
   reason to inspect a need, not an invitation or selection decision.

Keep a paid-only preference intact. Unknown or negotiable pay, expenses-only work
and conditional funds cannot silently become acceptable paid matches. A broader
exploratory search is a separate choice. If a service includes uncertain results,
filter and explain them before describing them as fitting that requirement.

### Review the terms and shape a bounded response

Inspect the intended result, actual deliverable, effort, timing, eligibility,
organisation capacity, compensation, expenses and accepting role. Check who owns
accounts, approves public claims, provides content, accepts changes and maintains
the output. An on-site constraint or a maintenance obligation can matter more than
a matching skill label. Remote work does not establish cross-border eligibility.

If useful, prepare a private contribution outline:

- the source need, exact revision or dated supplied excerpt;
- the proposed deliverable and exclusions;
- effort/capacity, dependencies and accepting party;
- proposed pay and expenses, budget basis and unresolved terms;
- access, ownership/licence, acceptance, handover, maintenance and exit;
- the official response route and questions still to ask.

These are prompts for material terms, not a compulsory form. Help the person
decline, reduce scope or stop when appropriate. A revised need needs renewed
review; an earlier draft does not authorise the expanded work.

### Agree and learn separately

The parties retain authority over selection, agreement, legal work/payment terms,
access and payment. Later reporting distinguishes the contributor's work from
shared organisational results. A campaign's reach, completed website or money
received does not by itself establish social impact.

## Minimum consumer information

| Information | Why it matters |
|---|---|
| Requester, publisher and official source | Attribute the request and identify authority gaps. |
| Need identity, revision and source/review/retrieval dates | Bind the response to known terms and expose age. |
| Problem, intended result, scope and requested skills | Assess a useful bounded contribution. |
| Effort, timing, location/language and material conditions | Compare with actual capacity and eligibility. |
| Lifecycle, response access and official route | Distinguish open, filled, withdrawn, invitation-only and unknown cases. |
| Compensation arrangements and cost budgets | Respect income needs without inventing available funds. |
| Accepting role, rights and maintenance/handover | Avoid an unowned output or indefinite obligation. |
| Coverage, provenance, conflicts and unknowns | Explain how far discovery supports the suggestion. |

This is an interpretation checklist, not a second provider schema. Missing facts
remain missing; do not require a publisher to fabricate them to enter the index.

### Compensation and budgets

Distinguish paid labour, pro bono labour, expenses-only, negotiable/mixed
arrangements and unknown compensation. Preserve genuine alternatives and the
scope to which each applies. A partly paid task does not make its unpaid
maintenance a paid engagement.

Keep labour pay, reimbursable expenses, campaign/media spend and tools/hosting
costs separate. Preserve fixed/range/cap/rate, currency, scope/period, availability
and payment conditions. A cap is a ceiling, not a promised fee; an organisation's
annual budget is not a need's spendable budget. Shared pots and duplicate listings
must not be added twice. Unknown amounts stay unknown; do not convert currencies
or estimate rates implicitly.

## Fictional cases and expected behaviour

All organisations, people and amounts in this table are invented. These are
design expectations, not observed matching or model results.

| Case | Expected behaviour |
|---|---|
| Developer with no project; paid website scope capped at GBP 600, with separate GBP 120 hosting | Treat as a possible paid contribution if labour funds are declared available. Preserve the cap and unknown negotiated fee; inspect deliverables and handover. |
| Designer offers six pro bono hours for a volunteer guide | Respect that chosen capacity. Agree the small deliverable and future editing responsibility; do not imply ongoing free work. |
| Marketing specialist offered GBP 300 labour, GBP 900 ad spend and GBP 50 conditional travel reimbursement | Separate income, campaign funds and expenses. Account/spend authority and truthful claims need agreement. |
| On-site contribution with eligible travel expenses only | Explain unpaid labour and reimbursement conditions, including upfront costs. Exclude from paid-only suggestions. |
| Website request omits compensation and budget | Keep both unknown. Do not invent volunteer intent or treat the request as a paid-only match. |
| Pay is negotiable, conditional on a grant, or contradicted by official prose | Preserve the distinction/conflict. Clarification remains necessary before claiming a supported paid fit. |
| Open record is overdue for review | Show exact dates and freshness limits. A recent fetch does not renew publisher review. |
| Need is filled or explicitly withdrawn | Stop presenting it as available work. Respect source retention and removal limits. A failed fetch alone cannot establish withdrawal. |
| Person needs remote work; source requires on-site attendance | Explain the mismatch and decline that candidate instead of relaxing the person's requirement. |
| Campaign asks for deceptive beneficiary claims | Apply the responsible-assistance guidance; refuse the deceptive contribution and offer honest reframing where useful. |
| Three-page website expands to a donor database plus continuing support | Preserve old/new scope and versions. Reassess access, capacity, cost and consent before any renewed proposal. |
| Person declines, organisation refuses, or no source fits | Treat this as an ordinary outcome. ItF owes no placement and should not prescribe founding a project or unpaid work instead. |

## Proposed delivery scope and dependencies

1. **Agree the consumer behaviour and publisher/service contract separately.**
   This note defines the consumer outcome; compatible sources must supply explicit
   versions, provenance and compensation semantics. Their private implementation
   choices stay outside public ItF guidance.
2. **Provider-neutral guidance is source-delivered.** Optional skill routing,
   the [playbook](../playbooks/organisation-contributions.md) and
   [fictional cases](../examples/organisation-contributions.md) reuse the existing
   contribution and responsible-assistance references. Source checks cover
   no-project entry, hard pay constraints, unknowns, refusal and changed terms.
3. **Connect supported read-only discovery.** A service first needs typed
   publication validation, source preparation and snapshot/query support. ItF
   then uses its advertised interface through the playbook, also usable by generic
   clients. Service availability and checks belong to that service. Supplied
   records remain a valid fallback, not a replacement for the intended integration.
4. **Verify the bounded source behaviour.** Use existing package checks and local
   client fixtures for schemas, errors and exact versions. Any later host trial
   must state its question, version and limits; it is not selected here.

Changes to skill routing, playbooks, references, assets, code or tests require the
normal PR path. This design itself adds no tools and changes no installed copy.
Keep #94 open for the broader capability after a design slice is delivered.

## Limits

ItF currently provides guidance, not a live needs catalogue, recruitment,
introductions, employment, payment or impact certification. Discovery remains
read-only. Contact, submissions, publication, accounts, private-data disclosure
and money movement retain their own authorisation boundaries. No real
organisations or contributors were recruited or tested for this design.
