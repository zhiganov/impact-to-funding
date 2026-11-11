# Impact badge: content contract (draft)

A badge or card points to one approved public report and says what kind of evidence it rests on. It doesn't show that the work had impact.

This is a draft for [#4](https://github.com/zhiganov/impact-to-funding/issues/4). The [impact badge tool](../tools/impact-badge/README.md) implements it.

## Inputs

**From `itf-manifest.json`** (read only, unchanged): `subject.name`, and one entry from `reports`: `id`, `url`, `period`, `published` and `revision`. Also `statusUrl`, if present. These fields are defined in the [support-profile contract](support-profile-contract.md).

**From `itf-badge-input.json`** (new and small, written by the person from their approved public report):

| Field | Required | Meaning |
|---|---|---|
| `reportId` | Yes | Which `reports` entry the badge points to. |
| `provenance` | Yes | The strongest review basis that applies to every shown claim, so never stronger than the weakest claim's: `self-report`, `ai-assisted`, `peer-review` or `independent-evaluation`, as defined in the [claim reference](../references/claims.md). |
| `state` | Yes | `current`, `corrected`, `out-of-date` or `withdrawn`. |
| `stateNote` | No | A short note for the out-of-date or withdrawn banner (80 characters at most), such as "on 2026-11-02". Without it, the banner points to `statusUrl`. |
| `claims` | No | Up to three items for the card: `text` (60 characters at most), `support` (`supported`, `partly-supported`, `insufficient`, `conflicting` or `not-assessed`) and `provenance`. A `not-assessed` claim has no `provenance`. Each claim must appear in the linked report. |

## Outputs

- **`itf-badge.json`**, in the shields.io [endpoint badge](https://shields.io/badges/endpoint-badge) format. The label is "impact report". The message is the period plus the provenance, for example "2026 Q3 · self-reported". It becomes "withdrawn" or "out of date" in those states.
- **`itf-card-light.svg`** and **`itf-card-dark.svg`**: the subject name, period, each claim with its support and provenance labels, the published date and the report URL as text. Each has a `<title>` and an `aria-label` with the same content. The dark card uses colours that read well on GitHub's dark theme.

- **`itf-card.html`** and **`itf-card.css`**: the same content as semantic HTML text (a section with a heading, a list of claims and a link to the report), plus optional styles with light and dark colours. Use these on websites.

## Display labels

Input values stay short. Both outputs show them the same way:

| Value | Shown as |
|---|---|
| `self-report` | self-reported |
| `ai-assisted` | AI-assisted |
| `peer-review` | peer-reviewed |
| `independent-evaluation` | independently evaluated |
| `partly-supported`, `not-assessed` and other support values | the same words with spaces: "partly supported", "not assessed" |

## Wording and display rules

- Use only the labels above. Never "proven", "verified", "certified", "impact score" or a number out of anything.
- Colours: blue for current and corrected, grey for out of date and withdrawn. No green or red, which would read as pass or fail.
- The person sets `out-of-date` themselves. The tool may suggest it when `published` is a parseable date more than 12 months old.
- A withdrawn badge keeps the period, so readers can see what was withdrawn.
- In a README, wrap the badge in a link to the report, with alt text such as "Impact report 2026 Q3, self-reported".
- Show the card that matches the reader's theme with `<picture>`:

  ```html
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="itf-card-dark.svg">
    <img src="itf-card-light.svg" alt="Impact report 2026 Q3, self-reported">
  </picture>
  ```

- The compact badge needs no dark version: its colours sit on their own background.
- On websites, use the HTML card by default. Visitors' browsers fetch a shields.io badge directly, without GitHub's image proxy.
- The report URL must start with `http://` or `https://`.
- Offer a badge only after the person has an approved public report.

## Open questions

- A separate input file keeps the accepted support-profile contract unchanged. Optional `badge` fields in the manifest would be tidier for users but would reopen that contract.
- `ai-assisted` is a real review label, but it may confuse readers on a badge.

## Limits

The tool would trust the input file. It can't check that the claims match the report or that the labels are accurate. A badge is the publisher's own declaration, like a self-certified badge.
