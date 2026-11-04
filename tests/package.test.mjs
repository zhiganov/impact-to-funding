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
  const match = skill.match(/^---\nname: ([a-z0-9-]+)\ndescription: ("[^\n]+")\nlicense: MIT\n---\n/);
  assert.ok(match, 'Expected name, JSON-quoted YAML description and MIT licence');
  const name = match[1];
  assert.ok(name.length <= 64 && !/(^\-|\-$|--)/.test(name));
  assert.equal(name, path.basename(root));
  const description = JSON.parse(match[2]);
  assert.ok(description.length > 0 && description.length <= 1024);
  assert.ok(skill.split('\n').length < 500);
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

test('package includes workflow, templates, provenance and a clearly labelled synthetic pair', () => {
  for (const relative of [
    'README.md', 'LICENSE', 'SOURCES.md', 'references/claims.md',
    'references/funding-and-review.md', 'assets/assessment.md', 'assets/report.md',
    'examples/builder-case.md', 'examples/builder-assessment.md',
    'docs/design-scope-2026-11-04.md',
  ]) assert.ok(statSync(path.join(root, relative)).isFile(), relative);
  assert.match(readFileSync(path.join(root, 'examples/builder-case.md'), 'utf8'), /Entirely fictional/);
  assert.match(readFileSync(path.join(root, 'examples/builder-assessment.md'), 'utf8'), /not a behavioural test result/);
});
