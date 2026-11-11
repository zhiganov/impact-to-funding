import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseDocument, isMap, isSeq } from 'yaml';

export class InputError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export async function readInput(file, maximum = 65536) {
  const handle = await open(file, constants.O_RDONLY | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > maximum) throw new InputError('input_limit', 'Expected a bounded regular input file.');
    const buffer = Buffer.alloc(maximum + 1);
    let length = 0;
    while (length < buffer.length) {
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > maximum) throw new InputError('input_limit', 'Input exceeds its byte limit.');
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, length)); }
    catch { throw new InputError('invalid_utf8', 'Input must be UTF-8.'); }
    return { text, digest: `sha256:${createHash('sha256').update(buffer.subarray(0, length)).digest('hex')}` };
  } finally { await handle.close(); }
}

export function strictJson(text) {
  if (Buffer.byteLength(text) > 1048576) throw new InputError('json_limit', 'JSON exceeds 1 MiB.');
  let depth = 0;
  let quoted = false;
  let escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') {
      if (++depth > 64) throw new InputError('json_depth', 'JSON nesting exceeds 64 levels.');
    } else if (char === '}' || char === ']') depth--;
  }
  let value;
  try { value = JSON.parse(text); }
  catch { throw new InputError('invalid_json', 'Expected strict JSON.'); }
  // JSON.parse establishes grammar. The document walk detects duplicate keys
  // before a last-key-wins result can be used. No YAML interpretation is accepted.
  const doc = parseDocument(text, { uniqueKeys: true, prettyErrors: false });
  if (doc.errors.length || doc.warnings.length) throw new InputError('ambiguous_json', 'JSON has duplicate or ambiguous properties.');
  function visit(node, depth = 0) {
    if (depth > 64) throw new InputError('json_depth', 'JSON nesting exceeds 64 levels.');
    if (isMap(node)) for (const item of node.items) { visit(item.key, depth + 1); visit(item.value, depth + 1); }
    else if (isSeq(node)) for (const item of node.items) visit(item, depth + 1);
  }
  visit(doc.contents);
  function numbers(item, depth = 0) {
    if (depth > 64) throw new InputError('json_depth', 'JSON nesting exceeds 64 levels.');
    if (typeof item === 'number' && (!Number.isFinite(item) || (Number.isInteger(item) && !Number.isSafeInteger(item)))) {
      throw new InputError('unsafe_number', 'JSON contains an unsafe numeric value.');
    }
    if (item && typeof item === 'object') for (const child of Object.values(item)) numbers(child, depth + 1);
  }
  numbers(value);
  return value;
}

export async function writePrivate(directory, name, content) {
  const handle = await open(path.join(directory, name), 'wx', 0o600);
  try { await handle.writeFile(content, 'utf8'); } finally { await handle.close(); }
}
