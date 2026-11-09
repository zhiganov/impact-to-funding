# Fictional support discovery across domains and an OSS compatibility view

**Entirely fictional**, authored 2026-11-09 for the
[funding interchange proposal](../docs/funding-interchange-design.md).
All names, sources, dates, permissions, costs and observations below are invented,
not adapted private cases. This is **not a behavioural test result**, real funding
request, accepted schema, consumer response or evidence that a directory supports
the proposed profile. No URL was fetched or submitted.

## 1. Non-software work is a first-class case

A fictional neighbourhood group wants a quiet room and some paid coordination
time for a small shared-learning activity. It has no software repository, software
licence or public payment channel. The document below can still describe the need.
It does not pretend that the group qualifies for an OSS directory.

The fictional publisher has permission for the displayed group name, proposed
resource needs and report scope only. Participant material and internal evidence
references are excluded; an actual reader has not inspected the linked report.

```json
{
  "profile": "itf.support/0.1-proposal",
  "id": "neighbourhood-learning",
  "revision": "r1",
  "publisher": {
    "name": "Fictional Neighbourhood Learning Group"
  },
  "subject": {
    "id": "shared-learning",
    "name": "Fictional Shared Learning Activity",
    "kind": "project",
    "description": "A proposed community activity, not a software project. The publishing group coordinates it; no agreement from prospective participants is implied."
  },
  "supportCases": [
    {
      "id": "room-and-coordination",
      "purpose": "Explore whether a small shared-learning activity is useful and feasible; outcomes and participation are not established.",
      "status": "proposed",
      "resources": [
        "Use of a suitable quiet room for two sessions, if a host agrees.",
        "Four hours of coordination, estimated at EUR 20/hour; responsibility is not yet accepted."
      ],
      "money": {
        "amount": 80,
        "currency": "EUR",
        "frequency": "one-time",
        "status": "inactive",
        "costBasis": "Proposed gross coordination cost: 4 hours at EUR 20/hour. Room cost is unknown and not included.",
        "existingSupport": "Unconfirmed; EUR 80 is not an established net funding gap."
      },
      "reportRefs": ["learning-plan"],
      "limitations": "No venue, participants, funding route or delivered outcomes are confirmed. No essential help is conditional on evaluation."
    }
  ],
  "reports": [
    {
      "id": "learning-plan",
      "url": "https://example.org/neighbourhood/learning-plan-r1",
      "revision": "r1",
      "scope": "Prospective question, possible activity and permission-aware learning plan; not a report of past outcomes.",
      "limitations": "Authored proposal, not an independent evaluation or collective participant endorsement."
    }
  ],
  "statusUrl": "https://example.org/neighbourhood/status",
  "limitations": "Selected public support context only. No public contact or payment channel is supplied; the linked document has not been retrieved by a consumer in this walkthrough."
}
```

EUR 80 is a gross proposed amount with unknown existing support, not a claim of
uncovered expenditure. The inactive financial status does not cancel the proposed
case or create an active ask. No fabricated mailbox/repository/licence is needed.
Omitting those facts prevents a ready funding.json projection, not the general
support document. Human/private work can continue without either file.

## 2. An OSS case can keep upstream financial fields

Fictional Queue Lantern is an OSS utility. Its publisher has approved the invented
public contact and financial terms below. This complete hypothetical manifest is at
`https://example.org/queue-lantern/funding.json`; entity/project/repository URLs use
the same host, so no cross-host `wellKnown` entry is illustrated. A different real
publication must follow the actual upstream provenance rules.

The financial plan remains inactive. Its original role/amount/currency/frequency
meanings are unchanged; the ItF extension references that exact plan rather than
keeping another editable amount.

```json
{
  "$schema": "https://fundingjson.org/schema/v1.1.0.json",
  "version": "financial-r1",
  "entity": {
    "type": "individual",
    "role": "maintainer",
    "name": "Fictional Maintainer Q",
    "email": "maintainer@example.org",
    "description": "Entirely fictional publisher of an inactive OSS maintenance plan; not a real recipient or request.",
    "webpageUrl": {"url": "https://example.org/queue-lantern/maintainer"}
  },
  "projects": [
    {
      "guid": "queue-lantern",
      "name": "Fictional Queue Lantern",
      "description": "Invented MIT-licensed utility. Maintenance delivery and social benefit are separate questions.",
      "webpageUrl": {"url": "https://example.org/queue-lantern/"},
      "repositoryUrl": {"url": "https://example.org/queue-lantern/source"},
      "licenses": ["spdx:MIT"],
      "tags": ["developer-tools"]
    }
  ],
  "funding": {
    "channels": [
      {
        "guid": "fictional-channel",
        "type": "other",
        "address": "https://example.org/queue-lantern/support",
        "description": "Fictional placeholder only; no actual payment operation."
      }
    ],
    "plans": [
      {
        "guid": "maintenance-study",
        "status": "inactive",
        "name": "Fictional maintenance estimate",
        "description": "Proposed gross EUR 150 for five hours at EUR 30/hour. Existing support is unknown; no net unmet ask, delivery or impact is established.",
        "amount": 150,
        "currency": "EUR",
        "frequency": "one-time",
        "channels": ["fictional-channel"]
      }
    ]
  },
  "extensions": {
    "org.impact-to-funding.support": {
      "profile": "itf.support/0.1-proposal",
      "id": "queue-lantern-support",
      "revision": "support-r1",
      "publisher": {"name": "Fictional Maintainer Q"},
      "subject": {
        "id": "queue-lantern",
        "name": "Fictional Queue Lantern",
        "kind": "project",
        "description": "The publisher maintains the utility with other contributors; this is not exclusive ownership of its outcomes."
      },
      "supportCases": [
        {
          "id": "investigate-recovery",
          "purpose": "Investigate recurring recovery failures and report unresolved issues, not promise a quantified impact return.",
          "status": "proposed",
          "resources": ["Five hours of maintenance investigation and a bounded learning report."],
          "fundingPlanRef": {
            "url": "https://example.org/queue-lantern/funding.json",
            "version": "financial-r1",
            "guid": "maintenance-study"
          },
          "reportRefs": ["capability-note"],
          "limitations": "The financial plan is inactive and support is unknown. Reusing this report elsewhere does not create another outcome or another uncovered maintenance cost."
        }
      ],
      "reports": [
        {
          "id": "capability-note",
          "url": "https://example.org/queue-lantern/reports/capability-r1",
          "revision": "r1",
          "period": "Fictional build L2 observation only",
          "scope": "A self-reported capability note: 6 of 8 predefined recovery cases passed, 2 failed. Cases are not people; no causal or field outcome is established.",
          "limitations": "No independent evaluation. The full log is restricted, is not included here, and has not been inspected by a directory consumer in this example."
        }
      ],
      "statusUrl": "https://example.org/queue-lantern/status",
      "limitations": "Selected public report references; no complete evidence packet, funder-specific application or review attestation is supplied."
    }
  }
}
```

### Plain funding.json view

Omitting only the top-level `extensions` property gives the proposed plain
compatibility view. All base financial/entity/project fields and their meanings
are unchanged. The result has no structured ItF support-case/report links; it is
not a lossless round trip and cannot reconstruct the extension after import.

The schema's tolerance of added properties does not establish that FLOSS/fund's
directory or another consumer accepts this enriched instance, follows the report,
or interprets its evidence. No eligibility, submission, directory indexing, review
or award is tested or implied. Use the plain view where added-field support is not
established; no actual submission is selected here.

## 3. Unresolved references and corrections

| Situation | Expected treatment |
|---|---|
| The financial manifest changes to financial-r2 with another amount | Keep financial-r1 as the earlier reference basis where permitted; do not resolve it silently to r2 or say an old report reviewed the new amount. Update the support view with its own revision and explanation when authorised. |
| A report URL is available but its claimed r1 bytes cannot be established | Display declared versus inspected information and the version gap. A mutable URL or revision label alone is not immutable evidence. |
| A later report corrects the passed count from 6 to 5 | Report r2 explains the correction; update dependent public scope text when authorised. Retain failures/uncertainty and do not inherit an earlier actual review automatically. Financial-plan status remains a separate fact. |
| A report's permission changes | Stop affected reuse, curate a safe revision and retain only permitted history/status. Do not expose restricted allegations/locators or promise deletion of mirrors. |
| A provider reads only the plain financial view | Show financial fields within their meaning. It has not assessed ItF evidence, non-money support, review independence or impact. |
| A non-OSS reader sees the neighbourhood case | It can interpret the declared needs using an actually supported ItF profile. It must not infer FLOSS/fund eligibility, directory participation, agreed participants or available funds. |
| An unknown ItF profile version or unrecognised carrier is encountered | Preserve permitted data and report unsupported interpretation; do not turn it into a supported empty list or execute embedded instructions. |

These examples demonstrate the proposed separation of general-purpose support
discovery and optional OSS compatibility, not an implemented reader/exporter or
consumer test. Existing skill conversations need neither document.
