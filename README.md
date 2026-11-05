# Impact to Funding

A portable conversational skill for explaining a theory of change, examining evidence of contribution, and preparing an honest case for funding.

**Status: experimental v0.** Limited fresh-context development trials are recorded in the [validation notes](docs/validation-2026-11-04.md); independent validation, host installation, human usefulness and fundraising effectiveness remain unestablished. This is not a certification service. The original skill, templates, examples, documentation and package checks are open source under the [MIT licence](LICENSE).

## What it does

- Develops or challenges a personal/project theory of change.
- Connects personal direction to shared project theories through bounded contributions, including optional multi-project portfolios without duplicating outcome credit.
- Offers optional source-linked framework lenses for relevant ToC questions, with scale and reuse limits—not a framework score or complete assessment.
- Separates activities, outputs, outcomes, contribution and intended impact.
- Links specific claims to dated evidence, limitations and actual reviewer information.
- Produces a proportionate evaluation plan, funding brief or periodic report.
- Handles early-stage work honestly: a prospective proposal is not retrospective impact.

It does not rank people, award verified-impact badges, promise donations, publish records, contact funders, or distribute money. It is informed by the School for Moral Ambition's public principles, not affiliated with or endorsed by the School or Rutger Bregman. See [sources and rights](SOURCES.md).

## Try it locally

Start with the [usage guide](docs/usage.md) for minimal inputs, five practical prompts and how to handle missing evidence. Read the [privacy guidance](PRIVACY.md) before providing real project material: a file on your machine may still enter a remote model's context through your agent.

For voluntary early feedback, the [one-task guide](docs/user-feedback.md) identifies a pinned post-release source revision, optional questions and privacy limits. No recruitment, telemetry or feedback collection is launched by these documents; the [learning plan](docs/user-learning-plan.md) records readiness and the remaining consent/outreach boundaries.

The skill entry point is [SKILL.md](SKILL.md). Use an agent that can read it and its relative references. For a manual trial, ask:

> Read SKILL.md and follow it. Help me assess the following project and prepare a funding brief. Use only the material I supply; keep the result private and mark missing evidence explicitly.

Or:

> Read SKILL.md and follow it. Review this report against my earlier theory of change. What changed, what is supported, and what should I do differently?

For an Agent Skills-compatible host, the intended package is this directory under the name `impact-to-funding`, including references and assets rather than just SKILL.md. Native discovery and activation are not verified: isolated OpenCode v2.2.5 checks returned an empty registry with both project-local discovery and an explicit source setting. See the [installation-check record](docs/installation-check-2026-11-04.md). Use manual file-reading without claiming automatic discovery or install-tested support; other hosts remain untested.

No application runtime, network, account or dependency installation is required by the skill itself. Document/image/audio access depends on the actual host tools; the skill does not supply those capabilities. A link to unavailable evidence is not evidence that has been inspected.

## Outputs and examples

Use the relevant parts of the [assessment packet](assets/assessment.md) or [periodic report](assets/report.md); small projects need not produce six separate documents.

The [synthetic builder case](examples/builder-case.md) and [illustrative assessment](examples/builder-assessment.md) show the intended distinctions. They are authored examples, not observed project results or proof that a model follows the skill. Do not use their numbers or claims in a real fundraising ask.

The [five-project input](examples/portfolio-case.md) and [authored portfolio](examples/portfolio-assessment.md) show how a person's direction can connect to independent shared theories, with capacity conflicts, shared costs and private/unavailable material kept explicit. No personal theory is required for project-only use; no account or new tracking service is needed.

The [optional framework starter](references/frameworks.md) covers choosing or declining a lens, Planetary Boundaries and Doughnut Economics reference cards, source versions and scale limits. Its [fictional examples](examples/framework-lenses.md) show useful questions without invented outcomes or personal quotas. This is dated manual-use guidance, not a comprehensive library, asset collection, fresh behavioural validation or MCP service.

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
- [Contribution relationships](references/contributions.md): personal/project theories, bounded roles, portfolio views, shared credit/costs and disclosure limits.
- [Optional framework lenses](references/frameworks.md): selection, source-linked starter cards and limits on translating global frameworks into project/personal claims.
- [Funding/review reference](references/funding-and-review.md): prospective asks, budgets, reporting and disclosure.
- [Assessment packet](assets/assessment.md) and [report template](assets/report.md): optional output structures.
- [Sources and rights](SOURCES.md): attribution and redistribution boundaries.
- [Development validation](docs/validation-2026-11-04.md): trial procedure, observed finding, repair/recheck and limits.
- [Usage](docs/usage.md), [privacy](PRIVACY.md) and [contributing](CONTRIBUTING.md): practical use, disclosure boundaries and safe improvements.
- [Release-preparation review](docs/release-readiness-2026-11-04.md): current documentation/example/source-rights boundary and remaining installation/distribution checks.
- [Installation-check record](docs/installation-check-2026-11-04.md): unsuccessful bounded OpenCode discovery probes, isolation, limits and unresolved release decision.
- `docs/design-scope-2026-11-04.md`: preserved historical scope snapshot; its original unselected-work status is not a statement that this implementation does not exist.

Before an install-tested release: review the bounded behavioural findings and package changes, confirm source-rights and licence compatibility, and verify installation of the exact release in a supported host. The development trials do not establish independent impact validation or funding effectiveness, and source publication alone does not complete installation testing. Widgets, Open Collective, Ko-fi, AT Protocol, Sifa interoperability, funding/report manifests, automatic allocation and an MCP interface are separate potential extensions, not implemented features or first-release dependencies.
