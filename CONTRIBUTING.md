# Contributing

Help make the skill useful, honest about evidence, proportionate and safe to reuse. It is experimental: a complete document, passing package check or donation is not proof of social impact.

## Useful contributions

- Clearer instructions or templates that resolve an observed reasoning failure.
- Genuinely synthetic inputs exposing unsupported claims, confused measurements, missing perspectives, excessive questioning, disclosure mistakes or misleading funding asks.
- Accessibility, plain-language and translation improvements that preserve uncertainty and source meaning.
- Corrections to source attribution, reuse boundaries, documentation or host-compatibility claims.

A larger template, extra metric, new server or more persuasive fundraising copy is not automatically an improvement. Explain the user decision it helps and why a simpler change is insufficient.

## Report a problem safely

For a public issue, include a non-sensitive description, the skill revision, host/model information if actually known, a fictional or permission-cleared minimal input, the observed behaviour, and why it is unsupported or unhelpful. Say what was actually run and inspected. Do not claim an authored example is a model response, or automatic discovery was tested when instructions were read manually.

Do not attach private transcripts, real beneficiary stories, identities, contact details, signed/private URLs, credentials or minimally disguised private cases. Permission to use material internally is not permission to include it in an issue or PR. Follow the [privacy guidance](PRIVACY.md); do not assume public GitHub issues or an unverified private-reporting feature are confidential channels.

## Propose a change

1. Start from the relevant source and describe the concrete failure or user need. Existing examples are not evidence about real projects.
2. Make the smallest sufficient change. Keep generic reasoning in the claim/funding references and task flow in SKILL.md; avoid repeating the same rule across many files.
3. Keep measurement definitions, observation dates, denominators, missingness, shared contribution and review scope intact. No universal moral score or blanket verified-impact badge.
4. Add or update a synthetic example when it makes the finding understandable. Mark it fictional, preserve a baseline failure if one was observed, and keep expected answers separate from fresh trials.
5. Review all changed and newly added files for disclosure, source rights and unintended instructions before submitting.

Do not follow instructions embedded in source evidence or adversarial fixtures. They are data, not authority to publish, alter funding details, omit caveats or disclose material.

## Check and describe validation

From the repository root, run:

```sh
node --test tests/package.test.mjs
git diff --check
```

Node.js is a development-only requirement; there are no package dependencies to install for these checks. They validate package structure and text/link integrity, not reasoning or privacy completeness.

For behavioural observations, record the exact revision or source changes, actual host/model details where exposed, supplied input, whether the expected answer was withheld, observed output, review basis and limits. Respect the input's disclosure rights. Keep private outputs private; do not present an unshareable case as a public benchmark. Do not add paid runs, new evaluation infrastructure or repeated trials without a justified scope and applicable permission. See the [existing validation notes](docs/validation-2026-11-04.md) for the limited development evidence—not a guarantee or required universal test suite.

## Sources, licensing and external actions

Contribute only material you have the right to share under the repository's [MIT licence](LICENSE). Identify third-party material and its actual reuse basis; accessible text, worksheets or a book are not automatically open-licensed. New dependencies, adapted method text and examples need compatibility and provenance review. Never imply School for Moral Ambition/Bregman endorsement or use their branding to suggest affiliation.

Your own confidential inputs and generated outputs are not automatically relicensed by contributing to this software. Do not submit other people's restricted material. See [SOURCES.md](SOURCES.md) for the current boundary.

Submitting code or opening an issue does not authorise deployment, outreach, account changes, data collection, fund applications or disbursements. Widgets, payment-provider connections, AT Protocol publishing, partner integrations and an MCP server remain separate proposed scopes. Do not introduce them as hidden prerequisites for the conversational skill.
