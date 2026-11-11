import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));

function files(directory = root) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'node_modules', 'private', 'outputs', 'evidence'].includes(entry.name)
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
  for (const packagePath of ['mcp/package.json', 'tools/support-profile/package.json', 'tools/skill-package/package.json', 'tools/readability/package.json', 'tools/impact-badge/package.json', 'tools/portable-records/package.json']) {
    assert.equal(JSON.parse(readFileSync(path.join(root, packagePath), 'utf8')).license, 'MIT');
  }
  const manifest = JSON.parse(readFileSync(path.join(root, 'funding.json'), 'utf8'));
  assert.deepEqual(manifest.projects[0].licenses, ['spdx:CC-BY-SA-4.0', 'spdx:MIT']);
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
  assert.match(examples, /Entirely fictional/);
  assert.match(examples, /not model\s+responses/);
});

test('package includes workflow, templates, provenance and clearly labelled synthetic examples', () => {
  for (const relative of [
    'README.md', 'LICENSE', 'SOURCES.md', 'references/claims.md', 'references/contributions.md',
    'references/funding-and-review.md', 'references/frameworks.md',
    'assets/assessment.md', 'assets/report.md', 'playbooks/support-brief.md',
    'playbooks/github-sponsorship.md', 'examples/github-sponsorship.md',
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
