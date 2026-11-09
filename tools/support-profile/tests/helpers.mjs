import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The two main examples are entirely fictional, authored inputs, not real data
// or observed consumer behaviour. Read their JSON directly so tests track them.
const walkthrough = readFileSync(new URL('../../../examples/funding-interchange.md', import.meta.url), 'utf8');
const blocks = [...walkthrough.matchAll(/^```json\n([\s\S]*?)\n```/gm)];
assert.equal(blocks.length, 2, 'Expected the two main fictional JSON examples');
const examples = blocks.map((match) => JSON.parse(match[1]));

export const PROFILE = 'itf.support/0.1-proposal';
export const CARRIER = 'org.impact-to-funding.support';
export const SOURCE_URL = 'https://example.org/queue-lantern/support-source.json';
export const DESTINATION_URL = 'https://example.org/queue-lantern/funding.json';

export function clone(value) {
  return structuredClone(value);
}

export function json(value) {
  return JSON.stringify(value);
}

export function standalone() {
  return clone(examples[0]);
}

export function enriched() {
  return clone(examples[1]);
}

export function financialBase() {
  const document = enriched();
  delete document.extensions;
  return document;
}

export function bindingFixture() {
  const target = financialBase();
  const source = clone(enriched().extensions[CARRIER]);
  const plan = target.funding.plans[0];
  source.revision = 'source-r1';
  source.canonicalUrl = SOURCE_URL;
  delete source.supportCases[0].fundingPlanRef;
  source.supportCases[0].money = {
    amount: plan.amount,
    currency: plan.currency,
    frequency: plan.frequency,
    status: plan.status,
    costBasis: plan.description,
    existingSupport: 'Unknown; no net funding gap is established in this fictional fixture.',
  };
  return {
    source,
    target,
    mapping: { [source.supportCases[0].id]: plan.guid },
    options: {
      destinationUrl: DESTINATION_URL,
      revision: 'support-projection-r1',
      mappingRevision: 'mapping-r1',
    },
  };
}

export function assertIssues(report) {
  assert.ok(Array.isArray(report.issues), 'Issues must be structured, not raw source text');
  for (const issue of report.issues) {
    for (const field of ['code', 'path', 'level']) {
      assert.equal(typeof issue[field], 'string', `Issue ${field} must be a string`);
    }
    assert.ok(issue.code.trim());
    assert.ok(issue.level.trim());
  }
}

export function assertBoundaries(report, fundingSchema) {
  assertIssues(report);
  assert.equal(report.checks.privacy, 'not_assessed');
  assert.equal(report.checks.authority, 'not_assessed');
  assert.equal(report.checks.impact, 'not_assessed');
  assert.equal(report.checks.network, 'disabled');
  if (fundingSchema !== undefined) assert.equal(report.checks.fundingSchema, fundingSchema);
}

export function assertBlocked(result) {
  assert.equal(result.status, 'blocked');
  assert.equal(result.document, undefined, 'A blocked transformation must not return an export');
}
