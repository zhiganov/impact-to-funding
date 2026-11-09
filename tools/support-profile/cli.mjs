import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import { inspect, bind, financialView } from './index.mjs';
import { MAX_INPUT_BYTES } from './lib/parse.mjs';

const HELP = `Optional local ItF support-profile tools (Node 22+).
  inspect INPUT [--source-url URL]
  bind INPUT --funding BASE --map MAP --destination-url URL --revision REV --mapping-revision REV --output NEWDIR [--source-url URL]
  financial-view INPUT --output NEWDIR [--source-url URL]

NEWDIR must not exist. Exports create private local funding.json and
projection-notes.json candidates, never publish, fetch URLs or replace inputs.
Inputs are strict UTF-8 JSON files, at most 1 MiB; no stdin or URL retrieval.
Validation is not privacy clearance, authority, impact or consumer acceptance.
Inspect exits: 0 valid, 2 limited, 3 invalid, 4 unsupported; 1 usage/I/O.
`;

function usage() {
  const error = new Error('usage');
  error.safeCode = 'invalid_arguments';
  return error;
}

function argumentsFor(args) {
  const command = args.shift();
  if (!['inspect', 'bind', 'financial-view'].includes(command)) throw usage();
  const input = args.shift();
  if (!input || input.startsWith('--')) throw usage();
  const options = {};
  const permitted = command === 'inspect' ? ['source-url'] : command === 'financial-view'
    ? ['source-url', 'output']
    : ['source-url', 'funding', 'map', 'destination-url', 'revision', 'mapping-revision', 'output'];
  while (args.length) {
    const flag = args.shift();
    const key = flag.startsWith('--') ? flag.slice(2) : '';
    const value = args.shift();
    if (!permitted.includes(key) || Object.hasOwn(options, key) || !value || value.startsWith('--')) throw usage();
    options[key] = value;
  }
  const required = command === 'inspect' ? [] : command === 'financial-view' ? ['output']
    : ['funding', 'map', 'destination-url', 'revision', 'mapping-revision', 'output'];
  if (required.some((key) => !Object.hasOwn(options, key))) throw usage();
  return { command, input, options };
}

async function readInput(filename) {
  let handle;
  try {
    // A FIFO must not block at open before the regular-file check can reject it.
    handle = await fs.open(filename, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0));
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > MAX_INPUT_BYTES) {
      const error = new Error('input_limit');
      error.safeCode = 'input_file_limit';
      throw error;
    }
    const buffer = Buffer.alloc(MAX_INPUT_BYTES + 1);
    let length = 0;
    while (length < buffer.length) {
      const read = await handle.read(buffer, length, buffer.length - length, null);
      if (!read.bytesRead) break;
      length += read.bytesRead;
    }
    if (length > MAX_INPUT_BYTES) {
      const error = new Error('input_limit');
      error.safeCode = 'input_file_limit';
      throw error;
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length));
  } catch (error) {
    if (!error.safeCode) error.safeCode = 'input_read_failed';
    throw error;
  } finally {
    await handle?.close();
  }
}

async function writeBundle(directory, result) {
  const target = path.resolve(directory);
  const files = [
    ['funding.json', JSON.stringify(result.document, null, 2) + '\n'],
    ['projection-notes.json', JSON.stringify(result.notes, null, 2) + '\n'],
  ];
  const owned = [];
  let created = false;
  let directoryInode;
  try {
    await fs.mkdir(target, { mode: 0o700 });
    created = true;
    directoryInode = (await fs.lstat(target)).ino;
    for (const [name, content] of files) {
      const filename = path.join(target, name);
      const handle = await fs.open(filename, 'wx', 0o600);
      try {
        owned.push({ filename, inode: (await handle.stat()).ino });
        await handle.writeFile(content, 'utf8');
      } finally {
        await handle.close();
      }
    }
  } catch {
    let incompleteCleanup = false;
    for (const file of owned.reverse()) {
      try {
        const stat = await fs.lstat(file.filename);
        if (stat.isFile() && stat.ino === file.inode) await fs.unlink(file.filename);
        else incompleteCleanup = true;
      } catch { incompleteCleanup = true; }
    }
    if (created) {
      try {
        const stat = await fs.lstat(target);
        if (stat.isDirectory() && stat.ino === directoryInode) await fs.rmdir(target);
        else incompleteCleanup = true;
      } catch { incompleteCleanup = true; }
    }
    const error = new Error('output_failed');
    error.safeCode = incompleteCleanup ? 'output_write_failed_cleanup_incomplete' : 'output_not_created';
    throw error;
  }
}

function exitFor(report) {
  return { valid: 0, limited: 2, invalid: 3, unsupported: 4 }[report?.status] ?? 3;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) {
    process.stdout.write(HELP);
    return;
  }
  const { command, input, options } = argumentsFor(argv);
  const content = await readInput(input);
  const context = { sourceUrl: options['source-url'] };
  if (command === 'inspect') {
    const report = inspect(content, context);
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    process.exitCode = exitFor(report);
    return;
  }
  const result = command === 'financial-view' ? financialView(content, context)
    : bind(content, await readInput(options.funding), await readInput(options.map), {
      ...context,
      destinationUrl: options['destination-url'],
      revision: options.revision,
      mappingRevision: options['mapping-revision'],
    });
  if (result.status !== 'ok') {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
    process.exitCode = result.inspection?.status === 'valid' ? 3 : exitFor(result.inspection);
    return;
  }
  await writeBundle(options.output, result);
  process.stdout.write(JSON.stringify({ status: 'ok', inspection: result.inspection, artifacts: ['funding.json', 'projection-notes.json'], publication: 'not_performed' }, null, 2) + '\n');
}

main().catch((error) => {
  const allowed = new Set(['invalid_arguments', 'input_file_limit', 'input_read_failed', 'output_write_failed_cleanup_incomplete', 'output_not_created']);
  const code = allowed.has(error.safeCode) ? error.safeCode : 'operation_failed';
  if (code === 'input_file_limit') {
    process.stdout.write(JSON.stringify({ status: 'limited', code }) + '\n');
    process.exitCode = 2;
    return;
  }
  process.stderr.write(JSON.stringify({ status: 'error', code }) + '\n');
  process.exitCode = 1;
});
