# Impact badge: content contract (draft)

A badge or card points to one approved public report and says what kind of evidence it rests on. It doesn't show that the work had impact.

This is a draft for [#4](https://github.com/zhiganov/impact-to-funding/issues/4). No generator exists yet.

## Inputs

**From `itf-manifest.json`** (read only, unchanged): `subject.name`, and one entry from `reports`: `id`, `url`, `period`, `published` and `revision`. Also `statusUrl`, if present. These fields are defined in the [support-profile contract](support-profile-contract.md).

**From `itf-badge-input.json`** (new and small, written by the person from their approved public report):

| Field | Required | Meaning |
|---|---|---|
| `reportId` | Yes | Which `reports` entry the badge points to. |
| `provenance` | Yes | The strongest review basis that applies to every shown claim: `self-report`, `ai-assisted`, `peer-review` or `independent-evaluation`, as defined in the [claim reference](../references/claims.md). |
| `state` | Yes | `current`, `corrected`, `out-of-date` or `withdrawn`. |
| `claims` | No | Up to three items for the card: `text` (60 characters at most), `support` (`supported`, `partly-supported`, `insufficient`, `conflicting` or `not-assessed`) and `provenance`. Each claim must appear in the linked report. |

## Outputs

- **`itf-badge.json`**, in the shields.io [endpoint badge](https://shields.io/badges/endpoint-badge) format. The label is "impact report". The message is the period plus the provenance, for example "2026 Q3 · self-reported". It becomes "withdrawn" or "out of date" in those states.
- **`itf-card.svg`**: the subject name, period, each claim with its support and provenance labels, the published date and the report URL as text. It has a `<title>` and an `aria-label` with the same content.

## Wording and display rules

- Use only the labels above. Never "proven", "verified", "certified", "impact score" or a number out of anything.
- Colours: blue for current and corrected, grey for out of date and withdrawn. No green or red, which would read as pass or fail.
- The person sets `out-of-date` themselves. The tool may suggest it when `published` is a parseable date more than 12 months old.
- A withdrawn badge keeps the period, so readers can see what was withdrawn.
- In a README, wrap the badge in a link to the report, with alt text such as "Impact report 2026 Q3, self-reported".
- Offer a badge only after the person has an approved public report.

## Open questions

- A separate input file keeps the accepted support-profile contract unchanged. Optional `badge` fields in the manifest would be tidier for users but would reopen that contract.
- `ai-assisted` is a real review label, but it may confuse readers on a badge.

## Limits

The tool would trust the input file. It can't check that the claims match the report or that the labels are accurate. A badge is the publisher's own declaration, like a self-certified badge.
