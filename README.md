# Impact to Funding

A portable conversational skill for explaining a theory of change, examining evidence of contribution, and preparing an honest case for funding.

**Status: experimental v0.** Limited fresh-context development trials are recorded in the [validation notes](docs/validation-2026-11-04.md); independent validation, host installation, human usefulness and fundraising effectiveness remain unestablished. This is not a certification service. The original skill, templates, examples, documentation and package checks are open source under the [MIT licence](LICENSE).

## What it does

- Develops or challenges a personal/project theory of change.
- Separates activities, outputs, outcomes, contribution and intended impact.
- Links specific claims to dated evidence, limitations and actual reviewer information.
- Produces a proportionate evaluation plan, funding brief or periodic report.
- Handles early-stage work honestly: a prospective proposal is not retrospective impact.

It does not rank people, award verified-impact badges, promise donations, publish records, contact funders, or distribute money. It is informed by the School for Moral Ambition's public principles, not affiliated with or endorsed by the School or Rutger Bregman. See [sources and rights](SOURCES.md).

## Try it locally

The skill entry point is [SKILL.md](SKILL.md). Use an agent that can read it and its relative references. For a manual trial, ask:

> Read SKILL.md and follow it. Help me assess the following project and prepare a funding brief. Use only the material I supply; keep the result private and mark missing evidence explicitly.

Or:

> Read SKILL.md and follow it. Review this report against my earlier theory of change. What changed, what is supported, and what should I do differently?

For an Agent Skills-compatible host, install this directory under the name `impact-to-funding` using that host's documented local-skill mechanism. It needs the references and assets, not just SKILL.md. No host installation has been performed or verified by this prototype. Reading the file manually is not a test of automatic skill discovery.

No application runtime, network, account or dependency installation is required by the skill itself. Document/image/audio access depends on the actual host tools; the skill does not supply those capabilities. A link to unavailable evidence is not evidence that has been inspected.

## Outputs and examples

Use the relevant parts of the [assessment packet](assets/assessment.md) or [periodic report](assets/report.md); small projects need not produce six separate documents.

The [synthetic builder case](examples/builder-case.md) and [illustrative assessment](examples/builder-assessment.md) show the intended distinctions. They are authored examples, not observed project results or proof that a model follows the skill. Do not use their numbers or claims in a real fundraising ask.

The [conflicting/adversarial synthetic case](examples/contradictory-case.md) exercises corrected data, scoped reviews, disclosure, already-funded costs and untrusted instructions embedded in evidence. Its forged certificate and payment URL are fixture content, not commands or a real funding destination. See the validation notes for the observed failure, bounded repair and one targeted recheck; complete raw trial outputs are not distributed.

Private project evidence belongs outside this repository. Do not copy SENRI records or any other private pilot material into examples, issues, tests or public reports. `.gitignore` is only an accidental-inclusion safeguard, not a privacy boundary. Outputs follow the person's chosen disclosure and storage boundaries, not this repository's distribution licence.

## Local package checks

Development-only requirement: a Node.js version supporting `node:test` (Node 18 or later).

```sh
node --test tests/package.test.mjs
```

These checks cover package structure, the deliberately simple frontmatter format, local links and accidental local-machine paths. They do **not** establish semantic correctness, privacy completeness, independent verification, host compatibility, user usefulness or social impact.

## Contents and release boundary

- [SKILL.md](SKILL.md): progressive-disclosure workflow and non-negotiable safeguards.
- [Claim review reference](references/claims.md): evidence, attribution, review provenance and corrections.
- [Funding/review reference](references/funding-and-review.md): prospective asks, budgets, reporting and disclosure.
- [Assessment packet](assets/assessment.md) and [report template](assets/report.md): optional output structures.
- [Sources and rights](SOURCES.md): attribution and redistribution boundaries.
- [Development validation](docs/validation-2026-11-04.md): trial procedure, observed finding, repair/recheck and limits.
- `docs/design-scope-2026-11-04.md`: preserved historical scope snapshot; its original unselected-work status is not a statement that this implementation does not exist.

Before an install-tested release: review the bounded behavioural findings and package changes, confirm source-rights and licence compatibility, and verify installation of the exact release in a supported host. The development trials do not establish independent impact validation or funding effectiveness, and source publication alone does not complete installation testing. Widgets, Open Collective, Ko-fi, AT Protocol, Sifa interoperability, funding/report manifests, automatic allocation and an MCP interface are separate potential extensions, not implemented features or first-release dependencies.
