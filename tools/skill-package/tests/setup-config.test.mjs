import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addOpenCodeEntry, entriesEqual, readOpenCodeEntry, removeOpenCodeEntry,
} from '../lib/setup-config.mjs';

const name = 'itf-library';
const entry = { type: 'local', command: ['node', '/a path/server.mjs'], enabled: true };
const quoted = JSON.stringify(name);
const serialized = JSON.stringify(entry);
const document = (contents) => `{"mcp":{"servers":{${contents}}}}`;

test('reads comments, trailing commas, escaped strings and URLs without modifying input', () => {
  const text = `// header\r\n{\r\n "url": "https://example.invalid/a//b/*c*/",\r\n "mcp": { /* keep */ "servers": {\r\n ${quoted}: {
    "command": ["node", "C:\\\\path\\\\file\\\".mjs",],
    "enabled": true, // this is a comment
  },},},\r\n}\r\n// footer`;
  assert.deepEqual(readOpenCodeEntry(text, name), { command: ['node', 'C:\\path\\file".mjs'], enabled: true });
  assert.equal(readOpenCodeEntry(text, 'absent'), null);
});

test('semantic equality ignores object key order but preserves array order and primitive types', () => {
  assert.equal(entriesEqual({ b: 2, a: { y: [1, 2], x: true } }, { a: { x: true, y: [1, 2] }, b: 2 }), true);
  assert.equal(entriesEqual([1, 2], [2, 1]), false);
  assert.equal(entriesEqual({ enabled: true }, { enabled: 'true' }), false);
  const text = document(`/* before */${quoted}: {"enabled":true,"command":["node","/a path/server.mjs"],"type":"local",} // after\n`);
  assert.equal(addOpenCodeEntry(text, name, entry), text);
  assert.throws(() => addOpenCodeEntry(text, name, { ...entry, enabled: false }), /Conflicting/);
  assert.throws(() => removeOpenCodeEntry(text, name, { ...entry, enabled: false }), /changed/);
});

test('inserts missing nesting and retains every existing byte', () => {
  const cases = [
    '{}',
    '{\n  // keep comment\n  "theme": "dark"\n}\n',
    '{"mcp":{}}',
    '{"mcp":{"another":true}}',
    '{"mcp":{"servers":{}}}',
    '{"mcp":{"servers":{"other":{"url":"https://example.invalid"}}}}',
    '{"mcp":{"servers":{"other":{}, /* after */}}}',
    '/* start */ {\r\n\t"theme": "dark", // tail\r\n}\r\n/* end */',
    '\ufeff{/* empty comment */}',
  ];
  for (const original of cases) {
    const updated = addOpenCodeEntry(original, name, entry);
    assert.deepEqual(readOpenCodeEntry(updated, name), entry);
    assert.equal(addOpenCodeEntry(updated, name, entry), updated);
    // Insertion only: all original characters occur in order, with no deletion.
    let cursor = 0;
    for (const char of original) {
      cursor = updated.indexOf(char, cursor);
      assert.notEqual(cursor, -1);
      cursor += char.length;
    }
    assert.equal(readOpenCodeEntry(removeOpenCodeEntry(updated, name, entry), name), null);
    if (original.includes('\r\n')) assert.equal(updated.replaceAll('\r\n', '').includes('\n'), false);
  }
});

test('appending uses legal commas and preserves exact surrounding comments/settings', () => {
  const text = '{\n  "theme": "dark" /* root comment */,\n  "mcp": {\n    "servers": {\n      "other": {} // keep this\n    }\n  }\n}\n';
  const updated = addOpenCodeEntry(text, name, entry);
  const expected = text.replace('"other": {}', '"other": {},')
    .replace('    }\n', `      ${quoted}: ${JSON.stringify({ command: entry.command, enabled: true, type: 'local' })}\n    }\n`);
  assert.equal(updated, expected);
  assert.deepEqual(readOpenCodeEntry(updated, 'other'), {});
});

test('preserves CRLF comments and existing trailing commas exactly while appending', () => {
  const text = '{\r\n\t"mcp": {\r\n\t\t"servers": {\r\n\t\t\t"other": {}, /* inline */ // tail\r\n\t\t}\r\n\t}\r\n}\r\n';
  const updated = addOpenCodeEntry(text, name, entry);
  const expected = text.replace('\t\t}\r\n', `\t\t\t${quoted}: ${JSON.stringify({ command: entry.command, enabled: true, type: 'local' })}\r\n\t\t}\r\n`);
  assert.equal(updated, expected);
  const removed = removeOpenCodeEntry(updated, name, entry);
  assert.equal(removed, expected.replace(`${quoted}: ${JSON.stringify({ command: entry.command, enabled: true, type: 'local' })}`, ''));
  assert.deepEqual(readOpenCodeEntry(removed, 'other'), {});
});

test('selective removal preserves all trivia outside the selected key/value and keeps parents', () => {
  const cases = [
    [`${quoted}:${serialized}`, ''],
    [`/* before */${quoted}:${serialized} /* after */, // tail\n`, '/* before */ /* after */ // tail\n'],
    [`${quoted}:${serialized},/* next */"other":{}`, '/* next */"other":{}'],
    [`"other":{},/* selected */${quoted}:${serialized}`, '"other":{},/* selected */'],
    [`"other":{},/* selected */${quoted}:${serialized},`, '"other":{},/* selected */'],
    [`"first":{},${quoted}:${serialized}/* selected tail */,/* next */"last":{}`, '"first":{},/* selected tail *//* next */"last":{}'],
    [`${quoted} /* key */ : /* value */ ${serialized} /* outside */`, ' /* outside */'],
  ];
  for (const [contents, remaining] of cases) {
    assert.equal(removeOpenCodeEntry(document(contents), name, entry), document(remaining));
  }
  assert.equal(removeOpenCodeEntry('{}', name, entry), '{}');
  assert.equal(removeOpenCodeEntry('{"mcp":{}}', name, entry), '{"mcp":{}}');
  assert.equal(removeOpenCodeEntry(document('"other":{}'), name, entry), document('"other":{}'));
});

test('special keys are ordinary own properties and cannot mutate object prototypes', () => {
  const specialEntry = JSON.parse('{"__proto__":{"polluted":true},"constructor":"safe","prototype":{},"":1}');
  for (const key of ['__proto__', 'constructor', 'prototype', '', 'x"\n\\/*//', '\u0000', '☃']) {
    const updated = addOpenCodeEntry('{"mcp":{"servers":{"other":{}}}}', key, specialEntry);
    const actual = readOpenCodeEntry(updated, key);
    assert.deepEqual(actual, specialEntry);
    assert.equal(Object.getPrototypeOf(actual), Object.prototype);
    assert.equal(Object.hasOwn(actual, '__proto__'), true);
    assert.equal(entriesEqual(actual, specialEntry), true);
    assert.equal(readOpenCodeEntry(removeOpenCodeEntry(updated, key, specialEntry), key), null);
  }
  assert.equal({}.polluted, undefined);
  const escapedName = '{"mcp":{"servers":{"itf-\\u006cibrary":{}}}}';
  assert.deepEqual(readOpenCodeEntry(escapedName, name), {});
});

test('accepts null-prototype objects, shared values, long arrays and normal JSON primitives', () => {
  const shared = { null: null, false: false, number: -12.5e20, text: 'quote" slash\\' };
  const input = Object.assign(Object.create(null), { shared, again: shared, array: Array.from({ length: 15 }, (_, i) => i) });
  const updated = addOpenCodeEntry('{}', name, input);
  assert.equal(entriesEqual(readOpenCodeEntry(updated, name), input), true);
  const text = document(`${quoted}:{"n":1e1,"s":"\\u0061","minusZero":-0}`);
  assert.equal(addOpenCodeEntry(text, name, { s: 'a', n: 10, minusZero: 0 }), text);
});

test('rejects duplicate keys throughout the complete document, including escaped equivalents', () => {
  for (const text of [
    '{"theme":1,"theme":2}', '{"mcp":{},"mcp":{}}',
    '{"unrelated":[{"a":1,"\\u0061":2}]}',
    document('"other":{},"other":{}'),
    document(`${quoted}:{"a":{"x":1,"x":2}}`),
    '{"__proto__":{},"__proto__":{}}',
  ]) {
    for (const run of [
      () => readOpenCodeEntry(text, name),
      () => addOpenCodeEntry(text, name, entry),
      () => removeOpenCodeEntry(text, name, entry),
    ]) assert.throws(run, /Duplicate/);
  }
});

test('requires object containers and object entries', () => {
  for (const text of ['null', '[]', 'true', '"x"', '{"mcp":null}', '{"mcp":[]}',
    '{"mcp":1}', '{"mcp":{"servers":[]}}', '{"mcp":{"servers":false}}']) {
    for (const run of [
      () => readOpenCodeEntry(text, name),
      () => addOpenCodeEntry(text, name, entry),
      () => removeOpenCodeEntry(text, name, entry),
    ]) assert.throws(run, /object/);
  }
  for (const value of [null, [], true, 'x', 1]) {
    assert.throws(() => readOpenCodeEntry(document(`${quoted}:${JSON.stringify(value)}`), name), /object/);
    assert.throws(() => addOpenCodeEntry('{}', name, value), /object/);
    assert.throws(() => removeOpenCodeEntry('{}', name, value), /object/);
  }
});

test('rejects malformed JSONC rather than repairing or rewriting it', () => {
  for (const text of [
    '', ' ', '// only comment', '{} {}', '{', '}', '{"a":}', '{"a" 1}', '{"a":1 "b":2}',
    '{a:1}', "{'a':1}", '{"a":undefined}', '{"a":NaN}', '{"a":01}', '{"a":1e}', '{"a":1e999}',
    '{"a":+1}', '{"a":.5}', '{"a":truefalse}', '{"a":[,]}', '{"a":[1,,2]}', '{"a":1,,}',
    '{"a":"bad\\q"}', '{"a":"raw\nline"}', '{"a":"unterminated}', '{"a":"ends\\\\}',
    '{} /* open', '{"a":1 // swallowed brace}', '{"a":1} trailing', '{"a":1}\u00a0',
  ]) {
    assert.throws(() => readOpenCodeEntry(text, name), /Malformed/);
    assert.throws(() => addOpenCodeEntry(text, name, entry), /Malformed/);
    assert.throws(() => removeOpenCodeEntry(text, name, entry), /Malformed/);
  }
  assert.throws(() => readOpenCodeEntry(null, name), /text/);
  assert.throws(() => addOpenCodeEntry('{}', null, entry), /name/);
});

test('bounds document bytes, nesting, nodes, and edits that exceed the document limit', () => {
  assert.throws(() => readOpenCodeEntry(`{"x":"${'x'.repeat(2 * 1024 * 1024)}"}`, name), /size limit/);
  assert.throws(() => readOpenCodeEntry(`{"x":"${'☃'.repeat(750000)}"}`, name), /size limit/);
  assert.throws(() => readOpenCodeEntry(`{"x":${'['.repeat(65)}0${']'.repeat(65)}}`, name), /depth/);
  assert.throws(() => readOpenCodeEntry(`{"x":[${'0,'.repeat(100000)}]}`, name), /node/);
  const nearlyFull = `{"x":"${'x'.repeat(2 * 1024 * 1024 - 20)}"}`;
  assert.equal(readOpenCodeEntry(nearlyFull, name), null);
  assert.throws(() => addOpenCodeEntry(nearlyFull, name, entry), /size limit/);
});

test('rejects non-JSON entry values without invoking getters or toJSON', () => {
  let calls = 0;
  const accessor = { get secret() { calls += 1; return 'unsafe'; } };
  const cycle = {};
  cycle.self = cycle;
  const sparse = Array(3);
  const extra = [];
  extra.extra = 1;
  const hidden = Object.defineProperty({}, 'secret', { value: 1 });
  for (const value of [
    { x: undefined }, { x: NaN }, { x: Infinity }, { x: 1n }, { x: () => 1 },
    { x: Symbol('x') }, { [Symbol('key')]: 1 }, accessor, hidden, cycle,
    { x: new Date() }, { x: sparse }, { x: extra }, { toJSON() { calls += 1; return {}; } },
  ]) assert.throws(() => addOpenCodeEntry('{}', name, value));
  assert.equal(calls, 0);
  assert.throws(() => addOpenCodeEntry('{}', name, { x: 'x'.repeat(2 * 1024 * 1024) }), /size/);
  let deep = {};
  for (let i = 0; i < 65; i += 1) deep = { x: deep };
  assert.throws(() => addOpenCodeEntry('{}', name, deep), /depth/);
});
