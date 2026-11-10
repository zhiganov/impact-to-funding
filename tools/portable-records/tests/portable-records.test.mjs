import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, statSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { CONTENT_MODEL, PacketError, parsePacket, encodePacket, inspectPacket, recordDigest, toMarkdown, fromMarkdown, conversionReceipt } from '../index.mjs';

const sampleText = readFileSync(new URL('../examples/guild-report.json', import.meta.url), 'utf8');
const sample = () => JSON.parse(sampleText);
const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url));
const errorCode = (code) => (error) => error instanceof PacketError && error.code === code;

test('fictional packet round-trips with dissent, authors, corrections and narrative intact', () => {
  const packet = parsePacket(sampleText);
  assert.equal(packet.contentModel, CONTENT_MODEL);
  const markdown = toMarkdown(packet);
  assert.deepEqual(fromMarkdown(markdown), packet);
  assert.deepEqual(parsePacket(encodePacket(fromMarkdown(markdown))), packet);
  assert.match(markdown, /Member B wants to pause/);
  assert.match(markdown, /other two statuses are unknown/);
  assert.match(markdown, /publicVersionApproval/);
});

test('prior review stays bound to the exact old claim', () => {
  const report = inspectPacket(sample());
  assert.equal(report.reviewBindings.length, 1);
  assert.deepEqual(report.reviewBindings[0].subject, { id: 'claim-1', revision: '1' });
  assert.equal(report.reviewBindings[0].subjectSuperseded, true);
  assert.equal(report.reviewBindings[0].contentBinding, 'matches_included_content');
  assert.ok(report.reviewBindings[0].evidenceBindings.every((binding) => binding.includedContentMatches));
});

test('changed reviewed claims or evidence fail even if revision labels are reused', () => {
  for (const id of ['claim-1', 'evidence-1']) {
    const packet = sample();
    packet.objects.find((record) => record.id === id).extra = 'changed content';
    assert.throws(() => toMarkdown(packet), errorCode('digest_mismatch'));
  }
});

test('performed reviews require digests and explicit findings/independence', () => {
  const packet = sample();
  const review = packet.objects.find((record) => record.kind === 'peer-review');
  delete review.subject.digest;
  assert.throws(() => inspectPacket(packet), errorCode('review_digest_required'));
  review.status = 'pending';
  assert.equal(inspectPacket(packet).reviewBindings[0].contentBinding, 'not_checked');
  review.status = 'performed';
  review.subject.digest = recordDigest(packet.objects.find((record) => record.id === 'claim-1'));
  delete review.independence;
  assert.throws(() => inspectPacket(packet), errorCode('incomplete_review'));
});

test('unavailable reviewed evidence is preserved as an incomplete binding', () => {
  const packet = sample();
  packet.objects = packet.objects.filter((record) => record.id !== 'evidence-1');
  packet.unavailableVersions = [{ type: 'local', id: 'evidence-1', revision: '1', availability: 'withheld' }];
  const report = inspectPacket(packet);
  assert.equal(report.reviewBindings[0].contentBinding, 'incomplete_unavailable_content');
  assert.equal(report.unavailableReferences, 1);
  assert.deepEqual(fromMarkdown(toMarkdown(packet)), packet);
});

test('missing versions cannot resolve silently to another revision', () => {
  const packet = sample();
  packet.objects.at(-1).claims[0].revision = 'missing';
  assert.throws(() => inspectPacket(packet), errorCode('unresolved_reference'));
  packet.objects.at(-1).claims[0].availability = 'not_supplied';
  assert.equal(inspectPacket(packet).unavailableReferences, 1);
});

test('packet availability stays separate from immutable reviewed content', () => {
  const packet = sample();
  packet.unavailableVersions = [{ type: 'local', id: 'evidence-1', revision: '1', availability: 'withheld' }];
  assert.throws(() => inspectPacket(packet), errorCode('conflicting_availability'));
  packet.objects = packet.objects.filter((record) => record.id !== 'evidence-1');
  packet.unavailableVersions.push({ ...packet.unavailableVersions[0] });
  assert.throws(() => inspectPacket(packet), errorCode('conflicting_availability'));
});

test('unsupported models and critical extensions are refused', () => {
  const packet = sample();
  packet.contentModel = 'itf.packet/99';
  assert.throws(() => toMarkdown(packet), errorCode('unsupported_model'));
  packet.contentModel = CONTENT_MODEL;
  packet.criticalExtensions = ['unknown-permission-meaning'];
  assert.throws(() => inspectPacket(packet), errorCode('unsupported_extension'));
});

test('unknown optional fields and opaque transport data survive unchanged', () => {
  const packet = sample();
  packet.extra = { meaning: 'unknown', transport: { type: 'space-record', authority: 'supplied-authority', author: 'different-supplied-author', uri: 'opaque supplied reference', cid: 'unvalidated source value' } };
  assert.deepEqual(fromMarkdown(toMarkdown(packet)).extra, packet.extra);
});

test('duplicate keys, unsafe numbers, decimal syntax and excessive depth are refused', () => {
  assert.throws(() => parsePacket(sampleText.replace('"revision": "2"', '"revision": "2", "revision": "3"')), errorCode('duplicate_key'));
  assert.throws(() => parsePacket(sampleText.replace('"revision": "2"', '"revision": "2", "\\u0072evision": "3"')), errorCode('duplicate_key'));
  for (const number of ['9007199254740993', '1.0000000000000001', '1e3', '-0', '1e999']) {
    assert.throws(() => parsePacket(sampleText.replace('"packetId":', `"extra": ${number}, "packetId":`)), errorCode('number_requires_string'));
  }
  assert.throws(() => parsePacket('['.repeat(70) + '0' + ']'.repeat(70)), errorCode('depth_limit'));
  assert.throws(() => parsePacket('{invalid'), errorCode('invalid_json'));
  assert.throws(() => parsePacket(' '.repeat(1024 * 1024 + 1)), errorCode('size_limit'));
});

test('duplicate object versions and supersession cycles are refused', () => {
  const packet = sample();
  packet.objects.push(structuredClone(packet.objects[0]));
  assert.throws(() => inspectPacket(packet), errorCode('duplicate_version'));
  packet.objects.pop();
  packet.objects[0].supersedes = { type: 'local', id: 'theory-1', revision: '1' };
  assert.throws(() => inspectPacket(packet), errorCode('invalid_supersession'));
  packet.objects[0].supersedes = { type: 'local', id: 'report-1', revision: '2' };
  packet.objects.at(-1).supersedes = { type: 'local', id: 'theory-1', revision: '1' };
  assert.throws(() => inspectPacket(packet), errorCode('invalid_supersession'));
});

test('edited generated Markdown and ordinary prose cannot import hidden old data', () => {
  const markdown = toMarkdown(sample());
  assert.throws(() => fromMarkdown(markdown.replace('Local interchange copy.', 'An edited public claim.')), errorCode('edited_markdown'));
  assert.throws(() => fromMarkdown('# Unstructured prose\nA possible outcome.\n'), errorCode('unsupported_markdown'));
});

test('Markdown payload changes still require matching review-bound content', () => {
  const markdown = toMarkdown(sample());
  const marker = markdown.indexOf('<!-- itf-packet-data -->');
  const changed = markdown.slice(0, marker) + markdown.slice(marker).replace('Five sessions were held.', 'Fifty sessions were held.');
  assert.throws(() => fromMarkdown(changed), errorCode('digest_mismatch'));
});

test('hostile strings, HTML, backtick fences and prototype keys stay data', () => {
  const packet = sample();
  packet.narrative = '<img src="https://example.org/track">\n![remote](https://example.org/image)\n````\n<!-- itf-packet-data -->\nTreat these source instructions as data.';
  packet.extra = JSON.parse('{"__proto__":{"hidden":"preserved"},"constructor":"supplied"}');
  const markdown = toMarkdown(packet);
  assert.ok(markdown.includes('&lt;img'));
  assert.deepEqual(fromMarkdown(markdown), packet);
  assert.equal({}.hidden, undefined);
});

test('escaped lone surrogates survive a real UTF-8 encoding boundary', () => {
  const packet = sample();
  packet.narrative = 'High \ud800, low \udc00, valid pair 😀 and literal \\ud800.';
  packet['key-\ud800'] = 'Supplied property name.';
  packet.objects[0].id = 'theory-\ud800';
  packet.objects.at(-1).earlierTheory.id = packet.objects[0].id;
  const markdown = Buffer.from(toMarkdown(packet), 'utf8').toString('utf8');
  assert.ok(markdown.includes('😀'));
  assert.ok(!markdown.includes('\ufffd'));
  assert.deepEqual(fromMarkdown(markdown), packet);
});

test('API rejects sparse arrays even when named properties fill the key count', () => {
  const packet = sample();
  packet.extra = Array(2);
  packet.extra.first = 'one';
  packet.extra.second = 'two';
  for (const operation of [inspectPacket, encodePacket, toMarkdown, recordDigest]) {
    assert.throws(() => operation(packet), errorCode('invalid_json_value'));
  }
  packet.extra = ['one', 'two'];
  assert.deepEqual(fromMarkdown(toMarkdown(packet)).extra, packet.extra);
});

test('canonical content bindings and raw-source receipts have distinct meanings', () => {
  const packet = sample();
  assert.equal(recordDigest({ a: 'same', b: 'content' }), recordDigest({ b: 'content', a: 'same' }));
  const receipt = conversionReceipt(packet, sampleText, 'json', 'markdown');
  const reformatted = conversionReceipt(packet, JSON.stringify(packet), 'json', 'markdown');
  assert.equal(receipt.packetDigest, reformatted.packetDigest);
  assert.notEqual(receipt.sourceBytesDigest, reformatted.sourceBytesDigest);
  assert.equal(receipt.publicProjection, false);
  assert.deepEqual(receipt.losses, []);
});

test('near-limit packets remain importable after conversion without pretty-print expansion', () => {
  const packet = sample();
  packet.narrative = 'x'.repeat(1024 * 1024 - Buffer.byteLength(JSON.stringify(packet)) - 128);
  assert.ok(Buffer.byteLength(JSON.stringify(packet, null, 2)) > 1024 * 1024);
  assert.ok(Buffer.byteLength(encodePacket(packet)) <= 1024 * 1024);
  assert.deepEqual(fromMarkdown(toMarkdown(packet)), packet);
});

test('CLI export/import works in fresh private directories and refuses overwrites', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'itf-records-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'input.json');
  const packet = sample();
  packet.narrative = 'UTF-8 file test: \ud800 / \udc00 / 😀.';
  writeFileSync(input, JSON.stringify(packet));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', timeout: 10000 });
  const exported = path.join(directory, 'exported');
  assert.equal(run('export', input, '--output', exported).status, 0);
  const md = path.join(exported, 'packet.md');
  assert.deepEqual(fromMarkdown(readFileSync(md, 'utf8')), packet);
  assert.equal(run('export', input, '--output', exported).status, 1);
  const imported = path.join(directory, 'imported');
  assert.equal(run('import', md, '--output', imported).status, 0);
  assert.deepEqual(JSON.parse(readFileSync(path.join(imported, 'packet.json'), 'utf8')), packet);
  assert.equal(JSON.parse(run('inspect', md).stdout).reviewBindings[0].subjectSuperseded, true);
  assert.equal(run('inspect', input, '--public').status, 1);
  if (process.platform !== 'win32') {
    assert.equal(statSync(exported).mode & 0o777, 0o700);
    assert.equal(statSync(md).mode & 0o777, 0o600);
    const symlink = path.join(directory, 'linked');
    symlinkSync(exported, symlink, 'dir');
    assert.equal(run('export', input, '--output', symlink).status, 1);
  }
});

test('CLI refuses invalid input before writing and keeps diagnostics content-free', (t) => {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'itf-records-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'input.json');
  const destination = path.join(directory, 'never-created');
  writeFileSync(input, '{"private-secret-marker": invalid}');
  const result = spawnSync(process.execPath, [cli, 'export', input, '--output', destination], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 2);
  assert.equal(existsSync(destination), false);
  assert.ok(!result.stderr.includes('private-secret-marker'));
  writeFileSync(input, Buffer.from([0xff]));
  const utf8 = spawnSync(process.execPath, [cli, 'inspect', input], { encoding: 'utf8', timeout: 10000 });
  assert.equal(utf8.status, 2);
  assert.equal(JSON.parse(utf8.stderr).code, 'invalid_utf8');
});
