import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { inflateRawSync } from 'node:zlib';
import { zipFolder } from '../zip.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'itf-zip-'));
  const plugin = path.join(root, 'itf');
  mkdirSync(path.join(plugin, '.claude-plugin'), { recursive: true });
  mkdirSync(path.join(plugin, 'references'));
  writeFileSync(path.join(plugin, 'SKILL.md'), 'Fictional skill\n');
  writeFileSync(path.join(plugin, '.claude-plugin', 'plugin.json'), '{"name":"itf"}\n');
  writeFileSync(path.join(plugin, 'references', 'b.md'), 'B — non-ASCII text\n');
  return plugin;
}

// Read entries back from the central directory, without a zip library.
function readZip(bytes) {
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = bytes.readUInt16LE(end + 10);
  let at = bytes.readUInt32LE(end + 16);
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    assert.equal(bytes.readUInt32LE(at), 0x02014b50);
    const size = bytes.readUInt32LE(at + 20);
    const nameLength = bytes.readUInt16LE(at + 28);
    const offset = bytes.readUInt32LE(at + 42);
    const name = bytes.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    const localName = bytes.readUInt16LE(offset + 26);
    const start = offset + 30 + localName;
    entries.push({ name, mode: bytes.readUInt32LE(at + 38) >>> 16, data: inflateRawSync(bytes.subarray(start, start + size)).toString('utf8') });
    at += 46 + nameLength;
  }
  return entries;
}

test('the same folder and date give the same bytes', (t) => {
  const plugin = fixture(t);
  assert.deepEqual(zipFolder(plugin, '2026-11-24'), zipFolder(plugin, '2026-11-24'));
  assert.notDeepEqual(zipFolder(plugin, '2026-11-24'), zipFolder(plugin, '2026-11-25'));
});

test('entries sit under the folder name, sorted, with their content', (t) => {
  const entries = readZip(zipFolder(fixture(t), '2026-11-24'));
  assert.deepEqual(entries.map((e) => e.name), ['itf/.claude-plugin/plugin.json', 'itf/SKILL.md', 'itf/references/b.md']);
  assert.equal(entries[2].data, 'B — non-ASCII text\n');
  assert.ok(entries.every((e) => e.mode === 0o100644));
});

test('a bad date is refused', (t) => {
  assert.throws(() => zipFolder(fixture(t), 'yesterday'), /Bad date/);
});
