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

It writes five files into the output folder:

- **`itf-badge.json`:** a [shields.io endpoint badge](https://shields.io/badges/endpoint-badge), for example "impact report | 2026 Q3 · self-reported".
- **`itf-card-light.svg`** and **`itf-card-dark.svg`:** a card with the period, each claim with its support and review labels, and the report link.
- **`itf-card.html`** and **`itf-card.css`:** the same card as plain HTML text for websites, with optional styles that follow the reader's light or dark theme.

It won't overwrite existing files unless you add `--force`. If the inputs break the contract, it lists every problem and writes nothing.

Try it with the fictional [manifest](examples/itf-manifest.json) and [badge input](examples/itf-badge-input.json):

```bash
node tools/impact-badge/cli.mjs tools/impact-badge/examples/itf-manifest.json tools/impact-badge/examples/itf-badge-input.json --output badge
```

## Add it to a README

Commit the files, then add the badge, linked to your report:

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

## Add it to a website

On a website, use the HTML card. It's real text, so screen readers, search engines and translation tools can read it, and it uses your site's fonts. It also needs no outside service. A shields.io badge on a website is fetched by each visitor's browser directly, so leave it out unless you want it.

**Plain HTML:** paste the contents of `itf-card.html` into your page. Add the styles from `itf-card.css` to your stylesheet, or write your own for the `itf-card` classes. The card uses an `<h2>` heading; change it to fit your page's headings.

**Astro:** put the two files in your project, for example in `src/components/`, and include them in a page:

```astro
---
import card from '../components/itf-card.html?raw';
import '../components/itf-card.css';
---
<Fragment set:html={card} />
```

`?raw` imports the file as text, and `set:html` inserts it as HTML. The card's text is already escaped by the tool. To use the SVG cards instead, put them in `public/` and use the `<picture>` snippet above with paths like `/itf-card-light.svg`.

**Other frameworks:** any framework that can include an HTML file or a stylesheet works the same way.

When the report changes, run the tool again and replace the files.

## What it checks

- The report ID exists in the manifest, and its URL starts with `http://` or `https://`.
- The review basis, state and support values are ones the contract allows.
- At most three claims, each at most 60 characters.
- A claim marked "not assessed" has no review basis.
- The badge's review basis is no stronger than its weakest shown claim.
- It warns when a report marked current was published more than 12 months ago.

## Limits

The tool trusts your input. It can't check that the claims match the report or that the labels are accurate. A badge is your own declaration, like a self-certified badge. The badge itself is drawn by shields.io, which fetches `itf-badge.json` from your repository. The cards need no outside service. The Astro example follows Astro's documented `?raw` imports and `set:html`; it hasn't been tried in an Astro build.
