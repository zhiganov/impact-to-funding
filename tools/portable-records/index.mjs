import { createHash } from 'node:crypto';

export const CONTENT_MODEL = 'itf.packet/0.1-local';
export const MAX_JSON_BYTES = 1024 * 1024;
export const MAX_MARKDOWN_BYTES = 8 * MAX_JSON_BYTES;
const MAX_DEPTH = 64;
const REVIEW_KINDS = new Set(['review', 'peer-review']);
const ABSENT = new Set(['not_supplied', 'withheld', 'inaccessible', 'deleted', 'withdrawn', 'unavailable']);

export class PacketError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function fail(code, message) { throw new PacketError(code, message); }
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function identifier(value) { return typeof value === 'string' && value.trim().length > 0 && value.length <= 256 && !/[\u0000-\u001f\u007f]/.test(value); }
function key(value) { return JSON.stringify([value.id, value.revision]); }
export function sha256(text) { return `sha256:${createHash('sha256').update(text).digest('hex')}`; }

function jsonValues(value, depth = 0, ancestors = new Set()) {
  if (depth > MAX_DEPTH) fail('depth_limit', 'JSON nesting exceeds 64 levels.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || Object.is(value, -0)) {
      fail('number_requires_string', 'Use strings for decimals, negative zero and integers outside the safe range.');
    }
    return;
  }
  if (!object(value) && !Array.isArray(value)) fail('invalid_json_value', 'Expected JSON values.');
  if (Array.isArray(value) && Object.keys(value).length !== value.length) fail('invalid_json_value', 'Sparse or extended arrays are not JSON values.');
  if (Object.getOwnPropertySymbols(value).length) fail('invalid_json_value', 'Symbol properties cannot be exchanged as JSON.');
  if (ancestors.has(value)) fail('invalid_json_value', 'Cyclic objects cannot be exchanged as JSON.');
  if (object(value) && ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail('invalid_json_value', 'Expected plain JSON objects.');
  }
  ancestors.add(value);
  for (const child of Object.values(value)) jsonValues(child, depth + 1, ancestors);
  ancestors.delete(value);
}

// JSON.parse checks grammar first. This walk also rejects duplicate keys before
// its last-key-wins interpretation can discard supplied data.
function uniqueKeys(text) {
  const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}\[\],:]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g) ?? [];
  let position = 0;
  function visit(depth) {
    if (depth > MAX_DEPTH) fail('depth_limit', 'JSON nesting exceeds 64 levels.');
    const token = tokens[position++];
    if (token === '{') {
      const seen = new Set();
      while (tokens[position] !== '}') {
        const name = JSON.parse(tokens[position++]);
        if (seen.has(name)) fail('duplicate_key', 'Duplicate JSON property; no data was imported.');
        seen.add(name);
        position++; // colon
        visit(depth + 1);
        if (tokens[position] !== ',') break;
        position++;
      }
      position++;
    } else if (token === '[') {
      while (tokens[position] !== ']') {
        visit(depth + 1);
        if (tokens[position] !== ',') break;
        position++;
      }
      position++;
    } else if (/^-?\d/.test(token) && /[.eE]/.test(token)) {
      fail('number_requires_string', 'Use strings for decimal and exponent notation.');
    }
  }
  visit(0);
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map((name) => `${JSON.stringify(name)}:${canonical(value[name])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function recordDigest(record) {
  jsonValues(record);
  return sha256(canonical(record));
}

function references(value, result = []) {
  if (object(value) && value.type === 'local') result.push(value);
  if (object(value) || Array.isArray(value)) {
    for (const child of Object.values(value)) references(child, result);
  }
  return result;
}

export function inspectPacket(packet) {
  jsonValues(packet);
  if (!object(packet)) fail('invalid_packet', 'Expected a packet object.');
  if (packet.contentModel !== CONTENT_MODEL) fail('unsupported_model', 'Unsupported local content model; no conversion was performed.');
  if (!identifier(packet.packetId) || !identifier(packet.revision)) fail('invalid_identity', 'Supply a packet ID and explicit revision.');
  if (!object(packet.disclosure) || !['private', 'restricted', 'public'].includes(packet.disclosure.audience)) {
    fail('invalid_disclosure', 'Supply the packet audience: private, restricted or public.');
  }
  if (Object.hasOwn(packet, 'criticalExtensions') && (!Array.isArray(packet.criticalExtensions) || packet.criticalExtensions.length)) {
    fail('unsupported_extension', 'Critical extensions are unsupported; keep the source uninterpreted.');
  }
  if (!Array.isArray(packet.objects) || packet.objects.length > 1000) fail('invalid_objects', 'Expected at most 1000 inline objects.');
  if (Buffer.byteLength(canonical(packet)) + 1 > MAX_JSON_BYTES) fail('size_limit', 'Packet exceeds 1 MiB including its final newline.');
  const records = new Map();
  for (const record of packet.objects) {
    if (!object(record) || !identifier(record.id) || !identifier(record.revision) || !identifier(record.author)
      || typeof record.kind !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(record.kind)) {
      fail('invalid_record', 'Every object needs an ID, revision, kind and supplied author label.');
    }
    if (records.has(key(record))) fail('duplicate_version', 'An object ID/revision occurs more than once.');
    records.set(key(record), record);
  }
  const recordHashes = new Map([...records].map(([ref, record]) => [ref, recordDigest(record)]));
  const unavailable = new Map();
  if (packet.unavailableVersions !== undefined) {
    if (!Array.isArray(packet.unavailableVersions)) fail('invalid_availability', 'Expected an unavailable-version list.');
    for (const marker of packet.unavailableVersions) {
      if (!object(marker) || marker.type !== 'local' || !identifier(marker.id) || !identifier(marker.revision) || !ABSENT.has(marker.availability)) {
        fail('invalid_availability', 'Unavailable versions need an explicit local reference and availability state.');
      }
      if (unavailable.has(key(marker))) fail('conflicting_availability', 'A version has more than one availability marker.');
      unavailable.set(key(marker), marker.availability);
    }
  }
  const unavailableReferences = new Set();
  function checkReference(ref, requireDigest = false) {
    if (!object(ref) || ref.type !== 'local' || !identifier(ref.id) || !identifier(ref.revision)) {
      fail('invalid_reference', 'Use an explicit local reference with ID and revision.');
    }
    if (ref.availability !== undefined && !ABSENT.has(ref.availability)) fail('invalid_availability', 'Unsupported reference availability state.');
    if (requireDigest && !ref.digest) fail('review_digest_required', 'A performed review needs exact subject and evidence digests.');
    if (ref.digest !== undefined && (typeof ref.digest !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(ref.digest))) {
      fail('invalid_digest', 'Expected a local canonical SHA-256 digest.');
    }
    const target = records.get(key(ref));
    const declaredAvailability = unavailable.get(key(ref));
    if (ref.availability && declaredAvailability && ref.availability !== declaredAvailability) {
      fail('conflicting_availability', 'Reference and packet availability declarations disagree.');
    }
    if (!target) {
      if (!ABSENT.has(ref.availability ?? declaredAvailability)) fail('unresolved_reference', 'A referenced version must be included or explicitly unavailable.');
      return false;
    }
    if (ref.availability !== undefined || declaredAvailability) fail('conflicting_availability', 'An included payload cannot also be declared unavailable.');
    if (ref.digest && ref.digest !== recordHashes.get(key(ref))) fail('digest_mismatch', 'Referenced content changed; its existing review binding cannot be carried forward.');
    return true;
  }
  for (const ref of references(packet)) if (!checkReference(ref)) unavailableReferences.add(key(ref));
  const superseded = new Set();
  for (const record of packet.objects) {
    if (record.supersedes !== undefined) {
      checkReference(record.supersedes);
      if (key(record.supersedes) === key(record)) fail('invalid_supersession', 'An object cannot supersede itself.');
      superseded.add(key(record.supersedes));
    }
    const visited = new Set([key(record)]);
    let prior = record.supersedes;
    while (prior && records.has(key(prior))) {
      if (visited.has(key(prior))) fail('invalid_supersession', 'Supersession relationships contain a cycle.');
      visited.add(key(prior));
      prior = records.get(key(prior)).supersedes;
    }
  }
  const reviewBindings = [];
  for (const review of packet.objects.filter((record) => REVIEW_KINDS.has(record.kind))) {
    if (!['requested', 'pending', 'performed', 'withdrawn'].includes(review.status)) {
      fail('invalid_review_status', 'A review must state requested, pending, performed or withdrawn.');
    }
    const present = checkReference(review.subject, review.status === 'performed');
    const evidenceBindings = [];
    if (review.status === 'performed') {
      if (!Array.isArray(review.evidenceExamined) || typeof review.finding !== 'string' || !review.finding.trim()
        || typeof review.independence !== 'string' || !review.independence.trim()) {
        fail('incomplete_review', 'A performed review needs findings, an evidence list and its supplied independence basis or unknown state.');
      }
      for (const ref of review.evidenceExamined) {
        evidenceBindings.push({ id: ref?.id, revision: ref?.revision, includedContentMatches: checkReference(ref, true) });
      }
    }
    reviewBindings.push({
      id: review.id, revision: review.revision, status: review.status,
      subject: { id: review.subject.id, revision: review.subject.revision },
      contentBinding: review.status !== 'performed' ? 'not_checked'
        : present && evidenceBindings.every((ref) => ref.includedContentMatches) ? 'matches_included_content' : 'incomplete_unavailable_content',
      evidenceBindings,
      subjectSuperseded: superseded.has(key(review.subject)),
    });
  }
  return {
    contentModel: CONTENT_MODEL, packetId: packet.packetId, revision: packet.revision,
    audience: packet.disclosure.audience, packetDigest: recordDigest(packet),
    recordDigests: packet.objects.map((record) => ({ id: record.id, revision: record.revision, digest: recordHashes.get(key(record)) })),
    reviewBindings, unavailableReferences: unavailableReferences.size,
    interpretation: 'Local structure and declared content bindings only. Other fields are preserved as supplied data.',
  };
}

export function parsePacket(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_JSON_BYTES) fail('size_limit', 'JSON input exceeds 1 MiB.');
  let packet;
  try { packet = JSON.parse(text); } catch { fail('invalid_json', 'Expected strict JSON.'); }
  uniqueKeys(text);
  inspectPacket(packet);
  return packet;
}

export function encodePacket(packet) {
  inspectPacket(packet);
  return `${canonical(packet)}\n`;
}

function escapeMarkdown(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#!|~]/g, '\\$&').replace(/\r/g, '&#13;').replace(/\n/g, '\n> ');
}

function fence(text, language = 'json') {
  const longest = (text.match(/`+/g) ?? []).reduce((length, run) => Math.max(length, run.length), 2);
  const delimiter = '`'.repeat(longest + 1);
  return `${delimiter}${language}\n${text}\n${delimiter}\n`;
}

function displayFields(value) {
  return Object.entries(value).map(([name, data]) => {
    const label = `**${escapeMarkdown(name)}:**`;
    return typeof data === 'string' ? `${label} ${escapeMarkdown(data)}\n`
      : `${label}\n\n${fence(JSON.stringify(data, null, 2))}`;
  }).join('\n');
}

export function toMarkdown(packet) {
  inspectPacket(packet);
  const { objects, ...context } = JSON.parse(canonical(packet));
  const view = [
    '# Portable impact packet', '',
    'Local interchange copy. Keep the source audience and permissions. Author and review statements are supplied claims.', '',
    'Edit the JSON source and its versions to make changes; import checks this whole generated view.', '',
    '## Packet context', '', displayFields(context),
    ...objects.flatMap((record) => [`## ${escapeMarkdown(record.kind)}: ${escapeMarkdown(record.id)} / ${escapeMarkdown(record.revision)}`, '', displayFields(record)]),
    '## Exchange data', '', '<!-- itf-packet-data -->',
    fence(encodePacket(packet).trimEnd()),
  ].join('\n');
  if (Buffer.byteLength(view) > MAX_MARKDOWN_BYTES) fail('size_limit', 'Generated Markdown exceeds 8 MiB.');
  return view;
}

export function fromMarkdown(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > MAX_MARKDOWN_BYTES) fail('size_limit', 'Markdown input exceeds 8 MiB.');
  const match = text.match(/\n<!-- itf-packet-data -->\n(`{3,})json\n([\s\S]*)\n\1\n$/);
  if (!match) fail('unsupported_markdown', 'Import accepts this tool\u2019s generated Markdown. Keep ordinary prose as an explicit narrative in a JSON packet.');
  const packet = parsePacket(match[2]);
  if (toMarkdown(packet) !== text) fail('edited_markdown', 'Generated Markdown was edited. Update the JSON source and its versions, then export again.');
  return packet;
}

export function conversionReceipt(packet, source, sourceFormat, targetFormat) {
  return {
    converter: 'itf-portable-records/0.1.0', contentModel: CONTENT_MODEL,
    sourceFormat, targetFormat, sourceBytesDigest: sha256(source),
    packetDigest: recordDigest(packet), audience: packet.disclosure.audience,
    transformations: ['JSON formatting and object-key order may change; supplied JSON values are preserved.'],
    losses: [], publicProjection: false,
    limits: ['Output inherits source restrictions. Bindings check content, not reviewer identity or findings. Transport and authenticity statements remain unverified source data.'],
    inspection: inspectPacket(packet),
  };
}
