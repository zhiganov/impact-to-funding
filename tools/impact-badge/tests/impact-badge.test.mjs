import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { badgeJson, build, cardCss, cardHtml, cardSvg, validate } from '../index.mjs';
import { main } from '../cli.mjs';

const examples = fileURLToPath(new URL('../examples/', import.meta.url));
const manifest = JSON.parse(await readFile(path.join(examples, 'itf-manifest.json'), 'utf8'));
const input = JSON.parse(await readFile(path.join(examples, 'itf-badge-input.json'), 'utf8'));
const now = new Date('2026-11-10');
const sink = () => {
  const chunks = [];
  return { write: (chunk) => chunks.push(chunk), text: () => chunks.join('') };
};
const data = (changes = {}) => validate(manifest, { ...input, ...changes }, { now }).data;

test('the fictional example builds all three files without warnings', () => {
  const result = build(manifest, input, { now });
  assert.deepEqual(Object.keys(result.files), ['itf-badge.json', 'itf-card-light.svg', 'itf-card-dark.svg', 'itf-card.html', 'itf-card.css']);
  assert.deepEqual(result.warnings, []);
});

test('badge message shows the period and evidence basis for each state', () => {
  assert.equal(badgeJson(data()).message, '2026 Q3 · self-reported');
  assert.equal(badgeJson(data({ state: 'corrected' })).message, '2026 Q3 · corrected · self-reported');
  assert.equal(badgeJson(data({ state: 'out-of-date' })).message, '2026 Q3 · out of date');
  assert.equal(badgeJson(data({ state: 'withdrawn' })).message, '2026 Q3 · withdrawn');
  assert.equal(badgeJson(data()).color, '#2f5f8f');
  assert.equal(badgeJson(data({ state: 'withdrawn' })).color, '#6b7280');
});

test('outputs never use certifying words', () => {
  for (const state of ['current', 'corrected', 'out-of-date', 'withdrawn']) {
    const { files } = build(manifest, { ...input, state }, { now });
    for (const content of Object.values(files)) assert.doesNotMatch(content, /\b(proven|verified|certified|score)\b/i);
  }
});

test('cards carry accessible text and the report link', () => {
  const svg = cardSvg(data(), 'light');
  assert.match(svg, /role="img"/);
  assert.match(svg, /<title>Lantern repair guide \(fictional\)\. Impact report · 2026 Q3, published 2026-10-05\./);
  assert.match(svg, /Households repaired appliances: not assessed\./);
  assert.match(svg, /example\.org\/lantern\/report-2026-q3/);
  assert.notEqual(cardSvg(data(), 'dark'), svg);
});

test('withdrawn cards show a banner with the status link or note', () => {
  assert.match(cardSvg(data({ state: 'withdrawn' })), /Withdrawn: see example\.org\/lantern\/status/);
  assert.match(cardSvg(data({ state: 'withdrawn', stateNote: 'on 2026-11-02' })), /Withdrawn: on 2026-11-02/);
  assert.match(cardSvg(data({ state: 'out-of-date' })), /May be out of date/);
  assert.match(cardSvg(data({ state: 'withdrawn' })), /<svg [^>]*font-family="Verdana/);
});

test('text is escaped in the SVG', () => {
  const svg = cardSvg(data({ claims: [{ text: 'Fixes <script> & "quotes"', support: 'supported', provenance: 'self-report' }] }));
  assert.match(svg, /Fixes &lt;script&gt; &amp; &quot;quotes&quot;/);
  assert.doesNotMatch(svg, /<script>/);
});

test('rejects inputs that break the contract', () => {
  const errors = (changes) => validate(manifest, { ...input, ...changes }, { now }).errors;
  assert.match(errors({ reportId: 'missing' })[0], /No report with id "missing"/);
  assert.match(errors({ provenance: 'proven' })[0], /provenance must be one of/);
  assert.match(errors({ state: 'verified' })[0], /state must be one of/);
  assert.match(errors({ claims: [1, 2, 3, 4].map(() => input.claims[0]) })[0], /At most 3 claims/);
  assert.match(errors({ claims: [{ text: 'x'.repeat(61), support: 'supported', provenance: 'self-report' }] })[0], /over 60 characters/);
  assert.match(errors({ claims: [{ text: 'A claim', support: 'not-assessed', provenance: 'self-report' }] })[0], /not assessed/);
});

test('the badge cannot claim stronger review than its weakest shown claim', () => {
  const { errors } = validate(manifest, { ...input, provenance: 'independent-evaluation' }, { now });
  assert.match(errors[0], /weaker than the badge's independent-evaluation/);
});

test('suggests out-of-date for a current report over 12 months old', () => {
  const old = { ...manifest, reports: [{ ...manifest.reports[0], published: '2025-01-15' }] };
  assert.match(validate(old, input, { now }).warnings[0], /22 months ago/);
  assert.deepEqual(validate(old, { ...input, state: 'out-of-date' }, { now }).warnings, []);
});

test('CLI writes the files, refuses to overwrite and reports contract errors', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'itf-badge-'));
  const args = [path.join(examples, 'itf-manifest.json'), path.join(examples, 'itf-badge-input.json'), '--output', directory];
  assert.equal(await main(args, sink(), sink()), 0);
  assert.equal(JSON.parse(await readFile(path.join(directory, 'itf-badge.json'), 'utf8')).label, 'impact report');
  await assert.rejects(main(args, sink(), sink()), /Already exists/);
  assert.equal(await main([...args, '--force'], sink(), sink()), 0);

  const bad = path.join(directory, 'bad-input.json');
  await writeFile(bad, JSON.stringify({ ...input, state: 'verified' }));
  const errors = sink();
  assert.equal(await main([args[0], bad, '--output', directory], sink(), errors), 2);
  assert.match(errors.text(), /state must be one of/);

  const help = sink();
  assert.equal(await main([], help, sink()), 1);
  assert.match(help.text(), /sends nothing anywhere/);
});

test('HTML card is semantic text with a heading, claim list and report link', () => {
  const html = cardHtml(data());
  assert.match(html, /^<section class="itf-card" data-state="current" aria-labelledby="itf-card-report-2026-q3">/);
  assert.match(html, /<h2 class="itf-card__title" id="itf-card-report-2026-q3">Lantern repair guide \(fictional\)<\/h2>/);
  assert.equal((html.match(/<li>/g) ?? []).length, 3);
  assert.match(html, /<span class="itf-card__label">not assessed<\/span>/);
  assert.match(html, /<a href="https:\/\/example\.org\/lantern\/report-2026-q3">Read the full report<\/a>/);
  assert.match(cardHtml(data({ state: 'withdrawn', stateNote: 'on 2026-11-02' })), /<p class="itf-card__banner">Withdrawn: on 2026-11-02<\/p>/);
});

test('HTML card escapes text and only links to http or https', () => {
  const html = cardHtml(data({ claims: [{ text: '<img src=x onerror=alert(1)>', support: 'supported', provenance: 'self-report' }] }));
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  const unsafe = { ...manifest, reports: [{ ...manifest.reports[0], url: 'javascript:alert(1)' }] };
  assert.match(validate(unsafe, input, { now }).errors[0], /must start with http:\/\/ or https:\/\//);
});

test('CSS styles the card in light and dark themes', () => {
  const css = cardCss();
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /\.itf-card\[data-state="withdrawn"\]/);
});
