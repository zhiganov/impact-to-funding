#!/usr/bin/env node
import { open, mkdir, unlink, rmdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MAX_MARKDOWN_BYTES, PacketError, parsePacket, inspectPacket, encodePacket, toMarkdown, fromMarkdown, conversionReceipt } from './index.mjs';

const HELP = `Local portable records (Node.js 22+; no dependencies).
  node tools/portable-records/cli.mjs inspect INPUT
  node tools/portable-records/cli.mjs export INPUT.json --output NEWDIR
  node tools/portable-records/cli.mjs import INPUT.md --output NEWDIR

INPUT may also be JSON for inspect/import. NEWDIR must not exist. Keep private
inputs and outputs outside the distributable checkout. No network or publishing.
Exits: 0 success, 1 usage/I/O error, 2 refused input.
`;

async function readInput(file) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_MARKDOWN_BYTES) throw new PacketError('size_limit', 'Expected a regular input file of at most 8 MiB.');
    const buffer = Buffer.alloc(MAX_MARKDOWN_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > MAX_MARKDOWN_BYTES) throw new PacketError('size_limit', 'Input exceeds 8 MiB.');
    try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, length)); }
    catch { throw new PacketError('invalid_utf8', 'Expected UTF-8 input.'); }
  } finally { await handle.close(); }
}

async function writeOutput(directory, filename, content, receipt) {
  await mkdir(directory, { mode: 0o700 });
  const owned = [];
  try {
    for (const [name, text] of [[filename, content], ['conversion-receipt.json', `${JSON.stringify(receipt, null, 2)}\n`]]) {
      const target = path.join(directory, name);
      const handle = await open(target, 'wx', 0o600);
      owned.push(target);
      try { await handle.writeFile(text, 'utf8'); } finally { await handle.close(); }
    }
  } catch (error) {
    for (const target of owned) await unlink(target).catch(() => {});
    await rmdir(directory).catch(() => {});
    throw error;
  }
}

export async function main(args, output = process.stdout) {
  const [command, input, ...options] = args;
  if (!['inspect', 'export', 'import'].includes(command) || !input || input.startsWith('-')
    || (command === 'inspect' ? options.length !== 0 : options.length !== 2 || options[0] !== '--output' || !options[1] || options[1].startsWith('-'))) {
    output.write(HELP);
    return 1;
  }
  const source = await readInput(input);
  const markdown = source.startsWith('# Portable impact packet\n');
  const packet = markdown ? fromMarkdown(source) : parsePacket(source);
  if (command === 'inspect') { output.write(`${JSON.stringify(inspectPacket(packet), null, 2)}\n`); return 0; }
  if (command === 'export' && markdown) throw new PacketError('invalid_format', 'Export expects a JSON packet.');
  const targetFormat = command === 'export' ? 'markdown' : 'json';
  const content = command === 'export' ? toMarkdown(packet) : encodePacket(packet);
  const receipt = conversionReceipt(packet, source, markdown ? 'markdown' : 'json', targetFormat);
  await writeOutput(options[1], command === 'export' ? 'packet.md' : 'packet.json', content, receipt);
  output.write(`${JSON.stringify({ operation: command, format: targetFormat, objects: packet.objects.length, losses: receipt.losses.length })}\n`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (error) => {
    process.stderr.write(`${JSON.stringify({ code: error instanceof PacketError ? error.code : 'io_error', message: error instanceof PacketError ? error.message : 'Could not read input or create a new output directory.' })}\n`);
    process.exitCode = error instanceof PacketError ? 2 : 1;
  });
}
