// Original ItF tooling. MIT licensed; see the repository LICENSE.
import jsonc from 'jsonc-parser';

export const MAX_INPUT_BYTES = 1048576;
const MAX_DEPTH = 64;
const failure = (status, code, path = '') => ({ok: false, status, issues: [{code, path, level: status}]});

// This is only a resource guard, not a second JSON parser. Grammar is checked by
// jsonc-parser below. Avoid entering its recursive AST parser for very deep input.
function exceedsDepth(text) {
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
      if (++depth > MAX_DEPTH) return true;
    } else if (char === '}' || char === ']') depth--;
  }
  return false;
}

// Compare decimal values exactly, without allocating an exponent-sized string.
// Leading/trailing insignificant zeroes are allowed; binary rounding is not.
function decimal(token) {
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(token);
  if (!match) return null;
  let coefficient = (match[2] + (match[3] ?? '')).replace(/^0+/, '');
  if (!coefficient) return '0';
  const exponentText = (match[4] ?? '0').replace(/^([+-]?)0+/, '$1');
  // A nonzero finite JS number cannot have an exponent this large, given the
  // input-byte bound. Refuse rather than parse an enormous integer exponent.
  if (exponentText.replace(/^[+-]/, '').length > 7) return null;
  let exponent = Number(match[4] ?? '0') - (match[3]?.length ?? 0);
  const trailing = /0+$/.exec(coefficient)?.[0].length ?? 0;
  exponent += trailing;
  if (trailing) coefficient = coefficient.slice(0, -trailing);
  return `${match[1]}${coefficient}e${exponent}`;
}

export function parseStrict(text) {
  if (typeof text !== 'string') return failure('invalid', 'input_not_text');
  if (Buffer.byteLength(text, 'utf8') > MAX_INPUT_BYTES) return failure('limited', 'input_too_large');
  if (exceedsDepth(text)) return failure('limited', 'input_depth_limit');
  try {
    const errors = [];
    const root = jsonc.parseTree(text, errors, {disallowComments: true, allowTrailingComma: false});
    if (errors.length || !root) return failure('invalid', 'invalid_json');
    const stack = [{node: root, path: ''}];
    let numericFailure = null;
    while (stack.length) {
      const {node, path} = stack.pop();
      if (node.type === 'object') {
        const seen = new Set();
        for (const property of node.children ?? []) {
          const [key, value] = property.children ?? [];
          // All parser-level property segments are masked: no schema has yet
          // established a context in which a source-controlled key is known.
          const childPath = `${path}/[unknown]`;
          if (seen.has(key.value)) return failure('invalid', 'duplicate_key', childPath);
          seen.add(key.value);
          stack.push({node: value, path: childPath});
        }
      } else if (node.type === 'array') {
        for (const [index, child] of (node.children ?? []).entries()) stack.push({node: child, path: `${path}/${index}`});
      } else if (node.type === 'number') {
        const raw = text.slice(node.offset, node.offset + node.length);
        const value = Number(raw);
        if (!Number.isFinite(value) || Object.is(value, -0) || decimal(raw) !== decimal(JSON.stringify(value))) {
          numericFailure ??= failure('limited', 'number_not_roundtrippable', path);
        }
      }
    }
    if (numericFailure) return numericFailure;
    // Only now is it safe to materialize the document. In particular, AST values
    // are never used as a substitute for checking the original numeric tokens.
    return {ok: true, value: JSON.parse(text)};
  } catch (error) {
    return failure(error instanceof RangeError ? 'limited' : 'invalid', error instanceof RangeError ? 'parser_limit' : 'invalid_json');
  }
}

export function isPublicUrlSyntax(value, {allowFragment = true} = {}) {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    // Reject even empty userinfo and empty fragments, which URL normalizes away.
    const authority = value.slice(value.indexOf('//') + 2).split(/[/?#]/, 1)[0];
    if (url.protocol !== 'https:' || !url.hostname || authority.includes('@') || (!allowFragment && value.includes('#'))) return false;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host.includes('.') && !host.includes(':')) return false;
    if (host === 'localhost' || /\.(localhost|local|internal|lan|home|test|invalid|onion)$/.test(host)) return false;
    if (host.startsWith('[')) {
      // URL canonicalizes dotted IPv4 tails to hexadecimal before this check.
      const [left, right] = host.slice(1, -1).split('::');
      const start = left ? left.split(':') : [];
      const end = right ? right.split(':') : [];
      const groups = right !== undefined ? [...start, ...Array(8 - start.length - end.length).fill('0'), ...end] : start;
      const words = groups.map(group => Number.parseInt(group, 16));
      if ((words[0] & 0xfe00) === 0xfc00 || (words[0] & 0xffc0) === 0xfe80 || (words[0] & 0xff00) === 0xff00) return false;
      if (words.slice(0, 6).every(word => word === 0) || (words.slice(0, 5).every(word => word === 0) && words[5] === 0xffff)) {
        return !privateIpv4(words[6] >>> 8, words[6] & 255) && words[6] !== 0;
      }
    }
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      const [a, b] = host.split('.').map(Number);
      if (privateIpv4(a, b)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function privateIpv4(a, b) {
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19));
}
