# Assessment: does multi-session work need a finding ledger?

**Decision:** keep the existing records. Add no ledger, worksheet section,
template, schema or tool for [#110](https://github.com/zhiganov/impact-to-funding/issues/110).
This documentation-only assessment was completed on 2026-11-15 against source
baseline `559f53924e9c623d0a4e4683e43800bcbc8b183c`.

## User outcome

A person returning to a report or support brief should be able to recover the
questions, findings, exact sources, search limits and remaining uncertainty.
Changing the audience should change permitted presentation, not strengthen the
underlying claim or create a second editable evidence base.

REA's [small evidence trial](lessons-from-rea.md#bounded-synthetic-evidence-trial)
showed source/view identity and a lossless saved-record round trip. It did not
establish that ItF needs the same registry or that a later agent will use a
worksheet correctly.

## Existing coverage

| Need | Existing source | Finding |
|---|---|---|
| Recover questions across sessions | [Worksheet §1](../assets/evidence-crosswalk.md#1-purpose-and-existing-records-only-where-useful); [report's closing section](../assets/report.md#what-changed-and-what-comes-next) | The worksheet records the current question and gap. The report asks which earlier questions are answered, partly answered or open. Several questions can be written under the existing purpose prompt; no separate format is required. |
| Preserve inspected versus supplied evidence | [Claim record](../references/claims.md#minimum-useful-claim-record); worksheet §1 | Source versions, observation and inspection dates, inspected extent, provenance and unavailable material are explicit. |
| Keep search bounds | [Learning reference](../references/learning.md#examine-and-communicate-claims); [support-brief playbook](../playbooks/support-brief.md#shape-the-brief); worksheet §§1 and 3 | Existing guidance asks where and when a search took place. The worksheet can retain those dates, selected sources, inspected extent and gaps. Reuse does not make an old search current. |
| Keep views tied to sources | Worksheet §§4–5; [evidence design](../references/evidence-reporting-design.md#1-keep-facts-claims-requirements-and-presentations-separate) | A crosswalk links requirement, claim, evidence and draft versions. Audience permission and presentation checks stay separate from evidence fit. |
| Retain disagreement and corrections | [Claim updates](../references/claims.md#updates-reviews-and-disputes); worksheet §5 | Changed claims keep their earlier versions and actual review targets. Contrary evidence, disputed truth, permission changes and review withdrawal have distinct treatment. |
| Avoid repeated or inflated credit | Worksheet §1; evidence design §1 | One editable source record is preferred. Mirrors, reused findings and audience views are not independent evidence or additional outcomes. |
| Carry records between sessions | Worksheet's private-storage rule; [portable-record tool](../tools/portable-records/README.md) | Permitted private notes can be supplied to a later session. The optional converter preserves supplied values, exact local references, unavailable states and review bindings. Its JSON payload can retain narrative questions and search notes; it does not interpret them. |
| Preserve unresolved work | Report's closing section; [support-brief completion check](../playbooks/support-brief.md#present-the-result) | The agent is instructed to revisit the person's questions and retain what remains open. Closing a document or abandoning a question does not establish an outcome. |

The worksheet does not have a dedicated multi-question table or search-history
section. That is a difference in organisation, not a missing place to retain
the information. The tool's structural checks also do not ensure that an agent
reads the right record or reasons from it faithfully.

## Fictional multi-session continuation

This is an authored example, not an observed model run. Every person, date,
account, permission and result below is invented. It extends the fictional
[Lantern packet](../tools/portable-records/examples/guild-report.json) in prose;
the checked-in packet is unchanged.

### Session 1: save the question and its basis

On fictional 1 November, two guild members prepare a private progress note.
Member A arranged a room; member B supplied tools.

- `evidence-1/r1` records three of five scheduled repair sessions as held. The
  other two statuses are unknown. Corrected `claim-1/r2` says exactly that.
  The packet's prior peer review remains attached to `claim-1/r1`.
- New `account-2/r1` is a supplied participant account saying a lamp worked
  for a week after a session. Nobody has inspected the lamp or independently
  checked the account. `claim-2/r1` records the attributed account, not an
  established durable repair or a result caused solely by either member.
- In this invented situation, the register's aggregate counts may appear in
  public reports. The account may be processed privately and paraphrased in
  one restricted support draft, without identity or raw notes. Public use,
  including disclosure that the account exists, is prohibited.

Under the worksheet's existing purpose and gap prompts they record:

| Question | Status and basis |
|---|---|
| How many sessions were held? | Partly answered: three recorded as held; two statuses unknown, using `evidence-1/r1`. |
| Was the session's lamp still working a week later? | Partly answered by supplied `account-2/r1`; the lamp's condition is uncorroborated. |
| Did the sessions reduce household costs? | Open: no cost measure was found in the selected register and account reviewed on 1 November. This was not a search of all possible evidence. |

They choose an authorised private location outside the skill package and permit
these records to be saved for later work with the same host/provider. The note
points to the existing claim and evidence versions rather than making copies.
The restricted support draft can contain the qualified account; a public
progress report can use only the permitted aggregate session statement.

### Session 2: a contrary account and narrower permission

On fictional 8 November, the person supplies the saved note and records to a new
conversation. They also supply `account-3/r1`: the participant now says the
earlier account concerned a different lamp and the session's lamp never worked.
This account is also uncorroborated and internal-only.

The existing claim and update rules lead to:

- Retain the two attributed accounts and their conflict privately. Replace
  `claim-2/r1` with `claim-2/r2`, saying that the earlier lasting-repair account
  is disputed and cannot establish that outcome. Neither account alone resolves
  what happened. No earlier review transfers to the revised claim.
- Reopen the second question as unresolved, with both conflicting accounts in
  its basis. The earlier positive account no longer supplies an uncontested
  answer. Leave the household-cost question open.
- Record the new inspection date and source. The 1 November search note remains
  a description of that earlier source set, not a fresh or exhaustive search.
  Preparing another view does not itself call for repeating the search.

The participant also ends permission for all external use of `account-2`,
while allowing the two accounts to remain in private analysis. The restricted
support draft is revised to omit the affected passage and any reference to
the protected accounts. This changes permitted use, not the historical truth
of either account. No automatic contact or recall of earlier copies follows.

### Session 3: a new audience without a new truth

On fictional 15 November, the person asks for a public progress report.
The report uses `claim-1/r2` with the observation period, both members' actual
roles and the two unknown session statuses. It claims neither repaired lamps
nor reduced household costs. It includes no private account identifiers,
locators, quotations or explanation exposing the accounts' existence.

The private worksheet keeps the revised question list, exact source/claim
versions and affected-draft references. The earlier review still concerns only
`claim-1/r1`. A report's wording and disclosure review do not create a new
observation or an independent review.

This continuation uses ordinary private notes under existing prompts. If file
interchange is useful, the existing portable-record tool can carry permitted
narrative fields alongside its exact versioned objects. It is optional; an
opaque ID without the permitted underlying records would not supply context.

## Options and recommendation

| Option | What it adds | Trade-off |
|---|---|---|
| Keep existing records | Questions and search notes stay beside their evidence and current task. | A later session still needs the permitted records and clear context. This is guidance, not automatic memory. |
| Add a short worksheet section | More prominent prompts for several questions and dated search bounds. | It adds prompts for information the worksheet and linked guidance already request. The comparison provides no evidence that this improves later-session use. |
| Add a separate ledger | A dedicated list of findings and open questions. | Another editable record can drift from claims, crosswalks and reports. It adds storage and maintenance without a distinct capability shown here. |

**Recommendation: keep the existing records.** Their current fields can express
the continuation without changing the skill or tools. The missing evidence is
reliability and usefulness in actual use, not a demonstrated missing record
type. That uncertainty does not make another test programme a prerequisite for
this decision.

The assessment answers #110's comparison and recommendation questions. Its
conditional PR and behavioural-check requirement does not apply because no
skill, worksheet, report template, schema or tool behaviour is changed.

## Limits

The comparison checks documented coverage, supported local record semantics and
an authored continuation. It does not show that a host loads these records,
that a later model follows the guidance, or that users find it easier.
Private history remains subject to actual retention and disclosure permission.
No collection, outreach, publication of user evidence or service is introduced.
