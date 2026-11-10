import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  analyseJson, analyseMarkdown, findAdverbs, findPassive, gradeLevel, markdownBlocks, splitSentences,
} from '../index.mjs';
import { main } from '../cli.mjs';

test('splits sentences and keeps common abbreviations together', () => {
  assert.deepEqual(splitSentences('We fixed the roof. It cost $40, e.g. for nails. Done!'), [
    'We fixed the roof.', 'It cost $40, e.g. for nails.', 'Done!',
  ]);
});

test('grades short plain text lower than long dense text', () => {
  const plain = analyseMarkdown('We fix bikes. Kids ride them to school. It works.');
  const dense = analyseMarkdown('Notwithstanding considerable organisational uncertainty, the intervention demonstrated substantively meaningful improvements across multidimensional wellbeing indicators throughout the extended implementation period.');
  assert.ok(plain.grade < dense.grade);
  assert.equal(gradeLevel(0, 0, 0), 0);
});

test('flags long and very long sentences with line numbers', () => {
  const long = Array.from({ length: 22 }, () => 'word').join(' ');
  const veryLong = Array.from({ length: 31 }, () => 'word').join(' ');
  const report = analyseMarkdown(`Short one.\n\n${long}.\n\n${veryLong}.`);
  assert.equal(report.long, 1);
  assert.equal(report.veryLong, 1);
  assert.deepEqual(report.flagged.map((sentence) => sentence.location), ['line 3', 'line 5']);
});

test('finds common passive voice and skips adjectives', () => {
  assert.deepEqual(findPassive('The report was written by the team.'), ['was written']);
  assert.deepEqual(findPassive('The grant was quickly approved.'), ['was quickly approved']);
  assert.deepEqual(findPassive('We are interested in this. It is based on data.'), []);
});

test('finds -ly adverbs and skips common non-adverbs', () => {
  assert.deepEqual(findAdverbs('We really need a daily, friendly reply quickly.'), ['really', 'quickly']);
});

test('ignores code, headings, tables and front matter in Markdown', () => {
  const blocks = markdownBlocks('---\ntitle: x\n---\n# Heading here\n\n```\nconst slowly = 1;\n```\n| a | b |\n\nPlain text [link](https://example.org) here.');
  assert.deepEqual(blocks, [{ line: 11, text: 'Plain text link here.' }]);
});

test('treats each list item as its own block', () => {
  const blocks = markdownBlocks('- first item\n- second item');
  assert.deepEqual(blocks.map((block) => block.line), [1, 2]);
});

test('checks only prose strings in JSON manifests', () => {
  const report = analyseJson(JSON.stringify({
    version: 'v1.1.0',
    entity: { name: 'Lantern', webpageUrl: 'https://example.org', description: 'The project was started by neighbours who really wanted safer streets.' },
  }));
  assert.equal(report.sentences, 1);
  assert.equal(report.flagged[0].location, '$.entity.description');
  assert.deepEqual(report.flagged[0].passive, ['was started']);
  assert.deepEqual(report.flagged[0].adverbs, ['really']);
});

test('CLI prints a readable report and JSON on request', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'itf-readability-'));
  const file = path.join(directory, 'brief.md');
  await writeFile(file, 'The roof was fixed. We ride bikes.');
  let text = '';
  assert.equal(await main([file], { write: (chunk) => { text += chunk; } }), 0);
  assert.match(text, /Grade [\d.]+ · 2 sentences/);
  assert.match(text, /line 1: passive: was fixed/);
  let json = '';
  assert.equal(await main([file, '--json'], { write: (chunk) => { json += chunk; } }), 0);
  assert.equal(JSON.parse(json).passive, 1);
  let help = '';
  assert.equal(await main([], { write: (chunk) => { help += chunk; } }), 1);
  assert.match(help, /sends nothing anywhere/);
});
