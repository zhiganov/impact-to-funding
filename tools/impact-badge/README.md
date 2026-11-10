# Impact badge

A local tool that builds a README badge and a small card for one approved public impact report. The badge links to the report and says what kind of evidence it rests on. It doesn't show that the work had impact.

It follows the [impact badge contract](../../docs/impact-badge-contract.md). It runs on your machine, sends nothing anywhere and needs Node 22 or later.

## Use

```bash
node tools/impact-badge/cli.mjs itf-manifest.json itf-badge-input.json --output badge
```

It reads two files:

- **`itf-manifest.json`:** your public [support profile](../../docs/support-profile-contract.md). The tool reads `subject.name`, one entry in `reports` and `statusUrl`.
- **`itf-badge-input.json`:** a small file you write from your approved public report. It names the report, the review basis, the state and up to three claims.

It writes three files into the output folder:

- **`itf-badge.json`:** a [shields.io endpoint badge](https://shields.io/badges/endpoint-badge), for example "impact report | 2026 Q3 · self-reported".
- **`itf-card-light.svg`** and **`itf-card-dark.svg`:** a card with the period, each claim with its support and review labels, and the report link.

It won't overwrite existing files unless you add `--force`. If the inputs break the contract, it lists every problem and writes nothing.

Try it with the fictional [manifest](examples/itf-manifest.json) and [badge input](examples/itf-badge-input.json):

```bash
node tools/impact-badge/cli.mjs tools/impact-badge/examples/itf-manifest.json tools/impact-badge/examples/itf-badge-input.json --output badge
```

## Add it to a README

Commit the three files, then add the badge, linked to your report:

```markdown
[![Impact report 2026 Q3, self-reported](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FOWNER%2FREPO%2Fmain%2Fbadge%2Fitf-badge.json)](https://example.org/your-report)
```

And the card, matching the reader's theme:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="badge/itf-card-dark.svg">
  <img src="badge/itf-card-light.svg" alt="Impact report 2026 Q3, self-reported">
</picture>
```

## What it checks

- The report ID exists in the manifest and has a URL.
- The review basis, state and support values are ones the contract allows.
- At most three claims, each at most 60 characters.
- A claim marked "not assessed" has no review basis.
- The badge's review basis is no stronger than its weakest shown claim.
- It warns when a report marked current was published more than 12 months ago.

## Limits

The tool trusts your input. It can't check that the claims match the report or that the labels are accurate. A badge is your own declaration, like a self-certified badge. The badge itself is drawn by shields.io, which fetches `itf-badge.json` from your repository. The cards need no outside service.
