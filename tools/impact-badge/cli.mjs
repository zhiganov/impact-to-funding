#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './index.mjs';

const HELP = `Build an ItF impact report badge and cards (Node 22+).
  node tools/impact-badge/cli.mjs MANIFEST INPUT --output DIR [--force]

MANIFEST is your public itf-manifest.json. INPUT is itf-badge-input.json.
Writes itf-badge.json, itf-card-light.svg, itf-card-dark.svg, itf-card.html
and itf-card.css into DIR.
Refuses to overwrite existing files unless you add --force.
Runs locally and sends nothing anywhere.
Exits: 0 built, 1 usage or read error, 2 inputs don't fit the contract.
`;

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function main(args, output = process.stdout, errorOutput = process.stderr) {
  const force = args.includes('--force');
  const rest = args.filter((arg) => arg !== '--force');
  const outputIndex = rest.indexOf('--output');
  const directory = outputIndex >= 0 ? rest[outputIndex + 1] : undefined;
  const files = rest.filter((_, index) => index !== outputIndex && index !== outputIndex + 1);
  if (files.length !== 2 || !directory || files.some((file) => file.startsWith('-'))) {
    output.write(HELP);
    return 1;
  }
  const [manifest, input] = await Promise.all(files.map(readJson));
  let result;
  try {
    result = build(manifest, input);
  } catch (error) {
    if (!error.errors) throw error;
    errorOutput.write(`Inputs don't fit the badge contract:\n- ${error.errors.join('\n- ')}\n`);
    return 2;
  }
  await mkdir(directory, { recursive: true });
  const targets = Object.keys(result.files).map((name) => path.join(directory, name));
  if (!force) {
    const existing = [];
    for (const target of targets) if (await exists(target)) existing.push(target);
    if (existing.length) throw new Error(`Already exists (add --force to replace): ${existing.join(', ')}`);
  }
  for (const [name, content] of Object.entries(result.files)) await writeFile(path.join(directory, name), content);
  for (const warning of result.warnings) errorOutput.write(`Warning: ${warning}\n`);
  output.write(`Wrote ${targets.join(', ')}\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
