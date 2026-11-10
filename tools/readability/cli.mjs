#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { analyseJson, analyseMarkdown } from './index.mjs';

const MAX_INPUT_BYTES = 1024 * 1024;

const HELP = `Local readability check for ItF drafts (Node 22+).
  node tools/readability/cli.mjs FILE [--json]

FILE is Markdown or plain text. A .json file is read as a manifest: only its
prose strings are checked. Reports the reading grade, sentence length,
passive voice and adverbs. Runs locally and sends nothing anywhere.
Exits: 0 checked, 1 usage or read error.
`;

function shorten(text, limit = 90) {
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

export function formatReport(file, report) {
  const lines = [
    `${file}`,
    `  Grade ${report.grade} · ${report.sentences} sentences · ${report.words} words · ${report.averageSentenceWords} words per sentence`,
    `  Long: ${report.long} · Very long: ${report.veryLong} · Passive: ${report.passive} · Adverbs: ${report.adverbs}`,
  ];
  for (const sentence of report.flagged) {
    const notes = [];
    if (sentence.length !== 'ok') notes.push(`${sentence.length} (${sentence.words} words)`);
    if (sentence.passive.length) notes.push(`passive: ${sentence.passive.join(', ')}`);
    if (sentence.adverbs.length) notes.push(`adverbs: ${sentence.adverbs.join(', ')}`);
    lines.push(`  ${sentence.location}: ${notes.join('; ')}`, `    ${shorten(sentence.text)}`);
  }
  return `${lines.join('\n')}\n`;
}

export async function main(args, output = process.stdout) {
  const json = args.includes('--json');
  const files = args.filter((arg) => arg !== '--json');
  if (files.length !== 1 || files[0].startsWith('-')) {
    output.write(HELP);
    return 1;
  }
  const [file] = files;
  const info = await stat(file);
  if (!info.isFile() || info.size > MAX_INPUT_BYTES) throw new Error(`Expected a file of at most 1 MiB: ${file}`);
  const text = await readFile(file, 'utf8');
  const report = file.toLowerCase().endsWith('.json') ? analyseJson(text) : analyseMarkdown(text);
  output.write(json ? `${JSON.stringify(report, null, 2)}\n` : formatReport(file, report));
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
