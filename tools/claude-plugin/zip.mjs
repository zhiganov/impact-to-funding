#!/usr/bin/env node
// Zip a built plugin folder into a reproducible archive for a GitHub release.
// Every entry sits under the folder's own name (for example "itf/SKILL.md"),
// in sorted order, with one fixed date and mode 0644, so the same folder and
// date always give the same bytes. Uses only Node's built-in zlib.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

function listFiles(root) {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) found.push(full);
      else throw new Error(`Not a regular file or folder: ${full}`);
    }
  };
  walk(root);
  return found;
}

function dosDateTime(date) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day || year < 1980) throw new Error(`Bad date: ${date}; use YYYY-MM-DD`);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

export function zipFolder(folder, date) {
  const base = path.dirname(path.resolve(folder));
  const files = listFiles(path.resolve(folder))
    .map((full) => ({ full, name: path.relative(base, full).split(path.sep).join('/') }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  const stamp = dosDateTime(date);
  const local = [];
  const central = [];
  let offset = 0;
  for (const { full, name } of files) {
    const data = readFileSync(full);
    const packed = deflateRawSync(data, { level: 9 });
    const nameBytes = Buffer.from(name, 'utf8');
    const crc = crc32(data) >>> 0;
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6); // UTF-8 names
    header.writeUInt16LE(8, 8); // deflate
    header.writeUInt16LE(stamp.time, 10);
    header.writeUInt16LE(stamp.date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(packed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28);
    local.push(header, nameBytes, packed);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE((3 << 8) | 20, 4); // made by Unix
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(stamp.time, 12);
    entry.writeUInt16LE(stamp.date, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt32LE(((0o100644) << 16) >>> 0, 38); // regular file, 0644
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += header.length + nameBytes.length + packed.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  if (files.length > 0xffff || offset > 0xffffffff) throw new Error('Too large for a plain zip');
  return Buffer.concat([...local, centralBytes, end]);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const [folder, output, ...rest] = process.argv.slice(2);
  const dateIndex = rest.indexOf('--date');
  const date = dateIndex >= 0 ? rest[dateIndex + 1] : undefined;
  if (!folder || !output || !date) {
    console.error('Usage: node tools/claude-plugin/zip.mjs PLUGIN_FOLDER OUTPUT.zip --date YYYY-MM-DD');
    process.exit(2);
  }
  if (!statSync(folder).isDirectory()) throw new Error(`Not a folder: ${folder}`);
  const bytes = zipFolder(folder, date);
  writeFileSync(output, bytes);
  console.log(JSON.stringify({ output, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }));
}
