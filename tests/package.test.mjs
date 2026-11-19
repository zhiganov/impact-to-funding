import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

function files(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', '.DS_Store', 'node_modules', 'private', 'outputs', 'evidence'].includes(entry.name)
      || /^\.env(?:\.|$)/.test(entry.name)) return [];
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${entry.name}`);
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? files(absolute) : [absolute];
  });
}

test('entry point has valid metadata in the supported simple format', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const match = skill.match(/^---\nname: ([a-z0-9-]+)\ndescription: ("[^\n]+")\nlicense: CC-BY-SA-4\.0\nmetadata:\n  version: ("[^\n]+")\n---\n/);
  assert.ok(match, 'Expected name, description, licence and standard metadata.version');
  const name = match[1];
  assert.ok(name.length <= 64 && !/(^\-|\-$|--)/.test(name));
  assert.equal(name, path.basename(root));
  const description = JSON.parse(match[2]);
  assert.ok(description.length > 0 && description.length <= 1024);
  const version = JSON.parse(match[3]);
  assert.match(version, /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/);
  assert.ok(skill.split('\n').length < 500);
});

test('reciprocal content and MIT software have separate explicit licence scopes', () => {
  const scope = readFileSync(path.join(root, 'LICENSE'), 'utf8');
  assert.match(scope, /Original written content: CC-BY-SA-4\.0/);
  assert.match(scope, /Original software: MIT/);
  assert.match(scope, /does not revoke MIT permissions/);
  assert.match(readFileSync(path.join(root, 'LICENSE-CODE'), 'utf8'), /^MIT License\n/);
  assert.match(readFileSync(path.join(root, 'LICENSE-CONTENT.md'), 'utf8'), /creativecommons\.org\/licenses\/by-sa\/4\.0\/legalcode\.en/);
  for (const packagePath of ['mcp/package.json', 'tools/support-profile/package.json', 'tools/skill-package/package.json', 'tools/readability/package.json', 'tools/impact-badge/package.json', 'tools/portable-records/package.json', 'tools/github-sponsorship/package.json']) {
    assert.equal(JSON.parse(readFileSync(path.join(root, packagePath), 'utf8')).license, 'MIT');
  }
  const manifest = JSON.parse(readFileSync(path.join(root, 'funding.json'), 'utf8'));
  assert.deepEqual(manifest.projects[0].licenses, ['spdx:CC-BY-SA-4.0', 'spdx:MIT']);
});

test('optional notice routing reads the reference, runs the check and preserves the moved rules', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const section = skill.split('## Optional update notice\n\n')[1]?.split('## Start:')[0];
  assert.ok(section, 'The core retains the optional notice route');
  assert.ok(section.length < 450, 'Host-specific detail stays outside the core');
  assert.match(section, /actual base directory and permits local execution, read \[update-notice instructions\]\(references\/update-notice\.md\) and run the check it describes, once per activation/);
  assert.match(section, /Skip an unavailable or denied check silently unless the person asks about updates/);
  assert.match(section, /Never block the conversation, enable notices without consent, retry a denied check, or update during this turn/);
  assert.doesNotMatch(section, /NOTICE_OFFER|UPDATE_AVAILABLE|RELEASE_AVAILABLE|CLAUDE_SKILL_DIR/);
  const reference = readFileSync(path.join(root, 'references/update-notice.md'), 'utf8');
  const moved = reference.split('# Optional update-notice instructions\n\n')[1]
    .replace('(../docs/update-notices.md)', '(docs/update-notices.md)').trim();
  // The two paragraphs from the pre-refactor core at 2776604 are unchanged,
  // apart from the relative link necessitated by their new directory.
  assert.equal(createHash('sha256').update(moved).digest('hex'),
    'e97ce8801d947a3ac97660c21026ac37e6f2ac65b17b98c0b06f39f0d22d25ab');
});

test('all Markdown local links resolve inside the distributable package', () => {
  for (const file of files().filter((item) => item.endsWith('.md'))) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      assert.ok(!path.isAbsolute(target), `Absolute link in ${file}: ${target}`);
      const resolved = path.resolve(path.dirname(file), target.split('#')[0]);
      assert.ok(resolved.startsWith(root), `Outside-package link: ${target}`);
      assert.ok(statSync(resolved).isFile(), `Missing file: ${target}`);
    }
  }
});

test('text files have final newlines and no trailing whitespace or local-machine paths', () => {
  for (const file of files()) {
    const text = readFileSync(file, 'utf8');
    assert.ok(text.endsWith('\n'), `Missing final newline: ${file}`);
    assert.ok(!/[^\S\n]+$/m.test(text), `Trailing whitespace: ${file}`);
    assert.ok(!/(?:\/Users\/|\/home\/|file:\/\/|[A-Z]:\\Users\\)/.test(text),
      `Local-machine reference: ${file}`);
  }
});

test('support-brief routing is optional and the shared funding reference leaves theory optional', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const funding = readFileSync(path.join(root, 'references/funding-and-review.md'), 'utf8');
  const playbook = readFileSync(path.join(root, 'playbooks/support-brief.md'), 'utf8');
  assert.match(skill, /When preparing or revising a support or funding brief/);
  assert.match(skill, /\[support-brief playbook\]\(playbooks\/support-brief\.md\)/);
  assert.match(skill, /If the skill is invoked without a task[^\n]*ask one open question/);
  assert.match(funding, /a named or completed theory is optional/i);
  assert.match(playbook, /A named or completed\s+theory of change is optional/i);
});

test('GitHub sponsorship source routing is optional and preserves drafting boundaries', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const playbook = readFileSync(path.join(root, 'playbooks/github-sponsorship.md'), 'utf8');
  const examples = readFileSync(path.join(root, 'examples/github-sponsorship.md'), 'utf8');
  assert.match(skill, /Only when the person asks for GitHub Sponsors material or a repository's `FUNDING\.yml`/);
  assert.match(skill, /\[GitHub sponsorship playbook\]\(playbooks\/github-sponsorship\.md\)/);
  assert.match(playbook, /\[support-brief playbook\]\(support-brief\.md\)/);
  assert.match(playbook, /Preserve existing entries/);
  assert.match(playbook, /inherited links as unknown/);
  assert.match(playbook, /A funding link does not activate an inactive plan/);
  assert.match(playbook, /Private sponsorship data stays private/);
  assert.match(playbook, /authoring guidance, not a YAML adapter or payment service/);
  assert.match(playbook, /\[account overview\]\(\.\.\/docs\/github-sponsors-account-overview\.md\)/);
  assert.match(readFileSync(path.join(root, 'docs/github-sponsors-account-overview.md'), 'utf8'), /leaves the account unchanged/);
  assert.match(playbook, /\[offline transaction review\]\(\.\.\/docs\/github-sponsors-export-reporting\.md\)/);
  assert.match(readFileSync(path.join(root, 'docs/github-sponsors-export-reporting.md'), 'utf8'), /supplied context/);
  assert.match(examples, /Entirely fictional/);
  assert.match(examples, /not model\s+responses/);
});

test('task focus keeps supporting context separate from a selected relationship task', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const examples = readFileSync(path.join(root, 'examples/task-focus.md'), 'utf8');
  const checks = readFileSync(path.join(root, 'docs/checks/task-focus-checks.md'), 'utf8');
  assert.match(skill, /Keep the person's requested work central when they add supporting context/);
  assert.match(skill, /then continue it before asking another supporting-detail question/);
  assert.match(skill, /Follow a relationship or scheduling thread when the person asks/);
  assert.match(skill, /a specific missing fact blocks the next useful part/);
  assert.match(skill, /continue any part that can proceed/);
  assert.match(examples, /Entirely fictional/);
  assert.match(examples, /authored examples, not model responses or behavioural test results/);
  assert.match(examples, /The centre\s+hasn't agreed to participate/);
  assert.match(examples, /Pause the theory/);
  assert.match(examples, /Keep it unsent/);
  assert.match(examples, /approved the specific words for\s+public quotation/);
  assert.match(checks, /These are source checks/);
  assert.match(checks, /not fresh model\s+observations/);
});

test('theory reconstruction has an optional task route and reuses shared guidance', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  const playbook = readFileSync(path.join(root, 'playbooks/reconstruct-theory-of-change.md'), 'utf8');
  assert.match(skill, /When asked to reconstruct a theory of change from existing work/);
  assert.match(skill, /\[reconstruction playbook\]\(playbooks\/reconstruct-theory-of-change\.md\)/);
  assert.match(skill, /ordinary theory development stays with the learning reference/);
  assert.match(playbook, /\[learning\]\(\.\.\/references\/learning\.md\)/);
  assert.match(playbook, /\[claim\]\(\.\.\/references\/claims\.md\)/);
  assert.match(playbook, /A short conversational account can be enough/);
  assert.match(playbook, /ways to continue, not commands, stages everyone must complete or new tool APIs/);
  assert.match(playbook, /Keep one source of claims rather\s+than another ledger/);
});

test('reconstruction source separates views, causal support, roles and permissions', () => {
  const playbook = readFileSync(path.join(root, 'playbooks/reconstruct-theory-of-change.md'), 'utf8');
  for (const view of ['Stated theory', 'Inferred working theory', 'Attributed experience', 'Supported observations and gaps']) {
    assert.ok(playbook.includes(view), view);
  }
  assert.match(playbook, /Keep individual contributions separate from shared results/);
  assert.match(playbook, /unmeasured counterfactual unknown/);
  assert.match(playbook, /stop at unsupported connections/);
  assert.match(playbook, /exact source versions and\s+corrections/);
  assert.match(playbook, /outside\s+this distributable package/);
  assert.match(playbook, /Further collection, contact\s+and publication need their own authority/);
});

test('fictional reconstruction preserves the source correction and missing outcomes', () => {
  const example = readFileSync(path.join(root, 'examples/theory-reconstruction.md'), 'utf8');
  assert.match(example, /Entirely fictional/);
  assert.match(example, /not model responses or a behavioural test result/);
  for (const source of ['A1:', 'A2:', 'A3:', 'A4:', 'A5:', 'A6:']) assert.ok(example.includes(source), source);
  assert.match(example, /Version 1 counted five submissions; v2 corrects one to a saved draft/);
  assert.match(example, /Twelve attendance events are not twelve people/);
  assert.match(example, /Mentor compensation stays unknown/);
  assert.match(example, /Possible further benefit — analyst hypothesis/);
  assert.match(example, /More workshop counts would not resolve it/);
  assert.match(example, /private real-world working records belong outside/i);
});

test('package includes workflow, templates, provenance and clearly labelled synthetic examples', () => {
  for (const relative of [
    'README.md', 'LICENSE', 'SOURCES.md', 'references/claims.md', 'references/contributions.md',
    'references/update-notice.md',
    'references/funding-and-review.md', 'references/frameworks.md',
    'assets/assessment.md', 'assets/report.md', 'playbooks/support-brief.md',
    'playbooks/github-sponsorship.md', 'examples/github-sponsorship.md',
    'playbooks/reconstruct-theory-of-change.md', 'examples/theory-reconstruction.md',
    'examples/builder-case.md', 'examples/builder-assessment.md',
    'examples/portfolio-case.md', 'examples/portfolio-assessment.md',
    'examples/framework-lenses.md',
    'docs/design-scope-2026-11-04.md',
  ]) assert.ok(statSync(path.join(root, relative)).isFile(), relative);
  assert.match(readFileSync(path.join(root, 'examples/builder-case.md'), 'utf8'), /Entirely fictional/);
  assert.match(readFileSync(path.join(root, 'examples/builder-assessment.md'), 'utf8'), /not a behavioural test result/);
  assert.match(readFileSync(path.join(root, 'examples/portfolio-case.md'), 'utf8'), /Entirely fictional/);
  assert.match(readFileSync(path.join(root, 'examples/portfolio-assessment.md'), 'utf8'), /not a behavioural test result/);
  assert.match(readFileSync(path.join(root, 'examples/framework-lenses.md'), 'utf8'), /Entirely fictional/);
  assert.match(readFileSync(path.join(root, 'examples/framework-lenses.md'), 'utf8'), /not a behavioural test result/);
});

test('maintainer skills stay outside the ItF skill', () => {
  const skill = readFileSync(path.join(root, 'SKILL.md'), 'utf8');
  assert.ok(!skill.includes('.agents/'), 'SKILL.md must not route to maintainer skills');
  const maintainer = readFileSync(path.join(root, '.agents/skills/itf-release-notes/SKILL.md'), 'utf8');
  const name = maintainer.match(/^---\nname: ([a-z0-9-]+)\n/)?.[1];
  assert.equal(name, 'itf-release-notes');
  assert.notEqual(name, path.basename(root));
  assert.match(maintainer, /It doesn't tag, publish or announce anything/);
  for (const file of files(path.join(root, 'playbooks')).concat(files(path.join(root, 'references')))) {
    assert.ok(!readFileSync(file, 'utf8').includes('.agents/skills'), `Skill content routes to maintainer skills: ${file}`);
  }
});
