// Dependency-free JSONC edits. All offsets refer to the original UTF-16 text.
// The filesystem caller owns path, symlink, backup and concurrent-write checks.
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_DEPTH = 64;
const MAX_NODES = 100000;
const numberToken = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;

function checkText(text) {
  if (typeof text !== 'string') throw new Error('Configuration must be text');
  if (text.length > MAX_BYTES || Buffer.byteLength(text, 'utf8') > MAX_BYTES) {
    throw new Error('Configuration exceeds size limit');
  }
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function define(target, key, value) {
  Object.defineProperty(target, key, { value, enumerable: true, configurable: true, writable: true });
}

function parse(text) {
  checkText(text);
  let offset = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  let nodes = 0;
  const fail = () => { throw new Error(`Malformed JSONC configuration at offset ${offset}`); };
  function trivia() {
    while (offset < text.length) {
      if (/[ \t\r\n]/.test(text[offset])) { offset += 1; continue; }
      if (text.startsWith('//', offset)) {
        offset += 2;
        while (offset < text.length && !/[\r\n]/.test(text[offset])) offset += 1;
        continue;
      }
      if (text.startsWith('/*', offset)) {
        const end = text.indexOf('*/', offset + 2);
        if (end < 0) fail();
        offset = end + 2;
        continue;
      }
      break;
    }
  }
  function string() {
    const start = offset++;
    while (offset < text.length) {
      const char = text[offset++];
      if (char === '\\') { offset += 1; continue; }
      if (char === '"') {
        try { return JSON.parse(text.slice(start, offset)); }
        catch { fail(); }
      }
    }
    fail();
  }
  function value(depth) {
    if (depth > MAX_DEPTH || ++nodes > MAX_NODES) throw new Error('Configuration exceeds depth/node limit');
    trivia();
    const start = offset;
    const char = text[offset];
    if (char === '{' || char === '[') {
      const isObject = char === '{';
      const close = isObject ? '}' : ']';
      const result = isObject ? {} : [];
      const properties = [];
      const keys = new Set();
      offset += 1;
      trivia();
      while (text[offset] !== close) {
        if (offset >= text.length) fail();
        let key;
        const propertyStart = offset;
        if (isObject) {
          if (text[offset] !== '"') fail();
          key = string();
          if (keys.has(key)) throw new Error('Duplicate object key in configuration');
          keys.add(key);
          trivia();
          if (text[offset++] !== ':') fail();
        }
        const child = value(depth + 1);
        if (isObject) define(result, key, child.value);
        else result.push(child.value);
        trivia();
        let comma = null;
        if (text[offset] === ',') { comma = offset++; trivia(); }
        else if (text[offset] !== close) fail();
        if (isObject) properties.push({ key, start: propertyStart, node: child, comma });
        if (comma === null) break;
      }
      if (text[offset++] !== close) fail();
      return { start, end: offset, value: result, properties };
    }
    let result;
    if (char === '"') result = string();
    else if (text.startsWith('true', offset)) { offset += 4; result = true; }
    else if (text.startsWith('false', offset)) { offset += 5; result = false; }
    else if (text.startsWith('null', offset)) { offset += 4; result = null; }
    else {
      numberToken.lastIndex = offset;
      const match = numberToken.exec(text);
      if (!match) fail();
      offset = numberToken.lastIndex;
      result = Number(match[0]);
      if (!Number.isFinite(result)) fail();
    }
    return { start, end: offset, value: result };
  }
  const root = value(0);
  trivia();
  if (offset !== text.length) fail();
  if (!object(root.value)) throw new Error('Configuration root must be an object');
  return root;
}

function property(node, key) {
  return node?.properties.find((item) => item.key === key) ?? null;
}

function containers(text) {
  const root = parse(text);
  const mcp = property(root, 'mcp')?.node ?? null;
  if (mcp && !object(mcp.value)) throw new Error('Configuration mcp must be an object');
  const servers = property(mcp, 'servers')?.node ?? null;
  if (servers && !object(servers.value)) throw new Error('Configuration mcp.servers must be an object');
  return { root, mcp, servers };
}

function checkName(name) {
  if (typeof name !== 'string' || name.length > MAX_BYTES || Buffer.byteLength(name) > MAX_BYTES) {
    throw new Error('Invalid configuration entry name');
  }
}

// Snapshot only JSON data. Reject coercions, accessors and lossy serialization.
function canonical(value) {
  let nodes = 0;
  let bytes = 0;
  const ancestors = new Set();
  function visit(item, depth) {
    if (depth > MAX_DEPTH || ++nodes > MAX_NODES) throw new Error('Entry exceeds depth/node limit');
    if (item === null || typeof item === 'boolean') return item;
    if (typeof item === 'string') {
      bytes += Buffer.byteLength(item);
      if (bytes > MAX_BYTES) throw new Error('Entry exceeds size limit');
      return item;
    }
    if (typeof item === 'number' && Number.isFinite(item)) return item;
    if (!object(item) && !Array.isArray(item)) throw new Error('Entry must contain only JSON data');
    const array = Array.isArray(item);
    if ((!array && ![Object.prototype, null].includes(Object.getPrototypeOf(item))) || ancestors.has(item)) {
      throw new Error('Entry must contain plain, acyclic JSON data');
    }
    ancestors.add(item);
    const descriptors = Object.getOwnPropertyDescriptors(item);
    const keys = Reflect.ownKeys(descriptors);
    if (keys.length > MAX_NODES) throw new Error('Entry exceeds node limit');
    if (keys.some((key) => typeof key !== 'string')) throw new Error('Entry must contain only JSON string keys');
    const result = array ? [] : {};
    if (array && keys.length !== item.length + 1) throw new Error('Entry array must be dense JSON data');
    for (const key of keys.sort()) {
      if (array && key === 'length') continue;
      const descriptor = descriptors[key];
      if (typeof key !== 'string' || !descriptor.enumerable || !Object.hasOwn(descriptor, 'value')
        || (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= item.length))) {
        throw new Error('Entry must contain only enumerable JSON data properties');
      }
      bytes += Buffer.byteLength(key);
      if (bytes > MAX_BYTES) throw new Error('Entry exceeds size limit');
      define(result, key, visit(descriptor.value, depth + 1));
    }
    ancestors.delete(item);
    return result;
  }
  const result = JSON.stringify(visit(value, 0));
  checkText(result);
  return result;
}

export function entriesEqual(a, b) {
  return canonical(a) === canonical(b);
}

function checkEntry(entry) {
  if (!object(entry)) throw new Error('Configuration entry must be an object');
  return canonical(entry);
}

export function readOpenCodeEntry(text, name) {
  checkName(name);
  const found = property(containers(text).servers, name);
  if (!found) return null;
  if (!object(found.node.value)) throw new Error('Configuration entry must be an object');
  return found.node.value;
}

function edit(text, edits) {
  for (const { start, end = start, replacement } of edits.sort((a, b) => b.start - a.start)) {
    text = text.slice(0, start) + replacement + text.slice(end);
  }
  // Validate the edited document too: additions must still fit parser bounds.
  containers(text);
  return text;
}

function insert(text, node, name, serialized) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lineStart = text.lastIndexOf('\n', node.start - 1) + 1;
  const close = node.end - 1;
  const closeLineStart = text.lastIndexOf('\n', close - 1) + 1;
  const closingPrefix = text.slice(closeLineStart, close);
  const ownLine = /^[ \t]*$/.test(closingPrefix);
  const base = ownLine ? closingPrefix : text.slice(lineStart, node.start).match(/^[ \t]*/)[0];
  const last = node.properties.at(-1);
  let indent = `${base}  `;
  if (last) {
    const prefix = text.slice(text.lastIndexOf('\n', last.start - 1) + 1, last.start);
    if (/^[ \t]+$/.test(prefix)) indent = prefix;
  }
  const added = `${JSON.stringify(name)}: ${serialized}`;
  const edits = [{
    start: ownLine ? closeLineStart : close,
    replacement: `${ownLine ? '' : eol}${indent}${added}${eol}${ownLine ? '' : base}`,
  }];
  // Put the separator before any existing trailing comment, and the new member
  // after it. This keeps a user's inline comment beside its original member.
  if (last && last.comma === null) edits.push({ start: last.node.end, replacement: ',' });
  return edit(text, edits);
}

export function addOpenCodeEntry(text, name, entry) {
  checkName(name);
  const serialized = checkEntry(entry);
  const { root, mcp, servers } = containers(text);
  const found = property(servers, name);
  if (found) {
    if (!entriesEqual(found.node.value, entry)) throw new Error('Conflicting configuration entry');
    return text;
  }
  if (servers) return insert(text, servers, name, serialized);
  const server = `{${JSON.stringify(name)}:${serialized}}`;
  if (mcp) return insert(text, mcp, 'servers', server);
  return insert(text, root, 'mcp', `{"servers":${server}}`);
}

export function removeOpenCodeEntry(text, name, expected) {
  checkName(name);
  checkEntry(expected);
  const { servers } = containers(text);
  const found = property(servers, name);
  if (!found) return text;
  if (!entriesEqual(found.node.value, expected)) throw new Error('Configuration entry changed; refusing removal');
  const edits = [{ start: found.start, end: found.node.end, replacement: '' }];
  // A preceding separator can remain as a legal trailing comma. It belongs to
  // the previous member and may have existed before this entry was installed.
  if (found.comma !== null) edits.push({ start: found.comma, end: found.comma + 1, replacement: '' });
  return edit(text, edits);
}
