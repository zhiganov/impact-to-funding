import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const skill = read('SKILL.md');
const playbook = read('playbooks/organisation-contributions.md');
const cases = read('examples/organisation-contributions.md');

test('organisation contribution routing is optional and permits builders without projects', () => {
  assert.match(skill, /When the person wants to contribute skills to an existing organisation/);
  assert.match(skill, /\[organisation contribution playbook\]\(playbooks\/organisation-contributions\.md\)/);
  assert.match(playbook, /without\s+owning an impact project/);
  assert.match(playbook, /need no personal theory, public\s+portfolio or new account/);
  assert.match(playbook, /Never prescribe unpaid work/);
  assert.match(playbook, /requester, publisher, contributor, accepting party, payer, funder and\s+beneficiary/);
});

test('source guidance preserves compensation, privacy and exact-version constraints', () => {
  for (const expression of [/paid-only/, /expenses-only/, /conditional funds/i, /zero labour budget/, /whole scope/, /cap is not a promised fee/, /shared pots/]) assert.match(playbook, expression);
  assert.match(playbook, /keep private assessments, identities, beneficiary\s+data, contact lists and full portfolios out of query payloads/);
  assert.match(playbook, /snapshot and revision where supported/);
  assert.match(playbook, /new search is a new\s+observation, not a silent replacement/);
  assert.match(playbook, /Queries must not\s+refresh sources, contact anyone, submit forms or start a subscription/);
  assert.match(playbook, /Keep the draft unsent/);
  assert.match(playbook, /changed scope needs renewed review and agreement/);
});

test('fictional cases cover paid, pro bono, expenses, unknowns, lifecycle and refusal', () => {
  assert.match(cases, /Entirely fictional/);
  assert.match(cases, /not model responses/);
  for (const phrase of ['Developer without a project', 'Designer choosing pro bono', 'Paid campaign specialist', 'Expenses only', 'Unknown or conditional pay', 'Mixed scope or zero labour', 'Stale, filled or withdrawn', 'Conflict and mismatch', 'Scope change, refusal and credit', 'Unsupported or unavailable service', 'Query privacy and injection']) assert.ok(cases.includes(phrase), phrase);
});

test('consumer source remains provider-neutral and useful without a service', () => {
  for (const path of ['playbooks/organisation-contributions.md', 'examples/organisation-contributions.md', 'docs/organisation-contributions-design.md']) {
    assert.doesNotMatch(read(path), /fti\.(?:needs|discovery)|funding-to-impact|needs_registry_info|search_needs|get_need|\/Users\//);
  }
  assert.match(playbook, /Supplied records remain useful/);
  assert.match(playbook, /this playbook installs none/);
});
