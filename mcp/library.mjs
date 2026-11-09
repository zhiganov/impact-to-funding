import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const CONTRACT_VERSION = 'itf.library/0.1-draft';
export const SOURCE_REPOSITORY = 'https://github.com/zhiganov/impact-to-funding';
export const SEARCH_MODE = 'literal_all_tokens_id_order';
export const BOUNDS = Object.freeze({
  queryCodePoints: 240, queryTokens: 8, defaultPageSize: 10, maxPageSize: 25,
  maxDocumentBytes: 131072, snapshotIdCharacters: 256, cursorCharacters: 1024,
  recordIdCharacters: 64,
});

const FORMAT = 'itf.library.snapshot/1';
const ID = /^[CPL][0-9]{3,63}$(?![\s\S])/;
const KINDS = { C: 'case', P: 'pattern', L: 'lens' };
const MESSAGE = {
  invalid_arguments: 'Use the documented object arguments, types and bounds.',
  unsupported_version: `Only ${CONTRACT_VERSION} is supported.`,
  snapshot_unavailable: 'The requested snapshot is not available. Prepare or select an available view.',
  not_found: 'This ID is not declared in the selected snapshot.',
  record_unavailable: 'This declared record cannot be served from the selected snapshot.',
  revision_unavailable: 'This record revision is not available in the selected snapshot.',
  record_too_large: 'The full backing document exceeds 131072 UTF-8 bytes. It has not been truncated.',
  invalid_cursor: 'Use an issued cursor with the same snapshot, normalised query, kind and limit.',
};
const SEED_LIMIT = 'Complete catalogue coverage is not comprehensive domain coverage, current source facts or verified outcomes. Read full notes and their evidence and rights limits.';
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const positive = (value) => Number.isSafeInteger(value) && value > 0;
const points = (value) => [...value].length;
const text = (value, max = Infinity) => typeof value === 'string' && value.trim().length > 0 && points(value) <= max;
const normalise = (value) => value.normalize('NFKC').trim().toLowerCase();
const ascii = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value)) return `{${Object.keys(value).sort(ascii).map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export function permittedPath(value) {
  return typeof value === 'string' && /^references\/library\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.md$(?![\s\S])/.test(value)
    && value !== 'references/library/README.md';
}

const validId = (value) => typeof value === 'string' && ID.test(value);
const validAnchor = (value) => value === null || (typeof value === 'string' && /^[a-z0-9]+(?:-+[a-z0-9]+)*$/.test(value));

function validMetadata(record) {
  if (!isObject(record) || !validId(record.id) || record.kind !== KINDS[record.id[0]]) return false;
  if (!text(record.title, 240) || !positive(record.recordRevision) || !permittedPath(record.documentPath)) return false;
  if (!['record_document', 'shared_document'].includes(record.contentScope) || !validAnchor(record.anchor)) return false;
  if (record.contentScope === 'shared_document' && record.anchor === null) return false;
  if (!text(record.discoveryText, 1200) || typeof record.discoverySource !== 'string') return false;
  const [source, anchor, ...extra] = record.discoverySource.split('#');
  return extra.length === 0 && (source === 'references/library/README.md' || permittedPath(source))
    && (anchor === undefined || (anchor !== '' && validAnchor(anchor)));
}

const url = (revision, path, anchor = null) => `${SOURCE_REPOSITORY}/blob/${revision}/${path}${anchor ? `#${anchor}` : ''}`;
const SUMMARY_FIELDS = ['id', 'kind', 'title', 'recordRevision', 'documentPath', 'contentScope', 'anchor', 'documentUrl', 'discoveryText', 'discoverySource'];
const summary = (record) => Object.fromEntries(SUMMARY_FIELDS.map((key) => [key, record[key]]));
const identity = (snapshot) => `sha256:${sha256(canonical(snapshot))}`;

// A separate producer operation. The query engine never receives a file reader.
export function createSnapshot({ sourceRevision, mapping, documents, indexMarkdown }) {
  if (!/^[0-9a-f]{40}$/.test(sourceRevision) || !isObject(mapping)
    || !text(mapping.mappingRevision) || mapping.indexPath !== 'references/library/README.md'
    || !(mapping.indexRevision === null || positive(mapping.indexRevision))
    || !Array.isArray(mapping.records) || !isObject(documents) || typeof indexMarkdown !== 'string'
    || !Array.isArray(mapping.limitations) || !mapping.limitations.every((item) => text(item))) {
    throw new Error('Invalid producer snapshot inputs.');
  }
  const declared = mapping.records;
  const records = declared.map((record) => {
    const id = validId(record?.id) ? record.id : null;
    const unavailable = (reason = 'record_unavailable') => ({ id, available: false, reason });
    if (!validMetadata(record) || declared.filter((entry) => entry?.id === id).length !== 1) return unavailable();
    const peers = declared.filter((entry) => entry?.documentPath === record.documentPath);
    if (peers.some((entry) => !validMetadata(entry))
      || (record.contentScope === 'record_document' && peers.length !== 1)
      || (record.contentScope === 'shared_document' && (peers.length < 2
        || peers.some((entry) => entry.contentScope !== 'shared_document')
        || new Set(peers.map((entry) => entry.anchor)).size !== peers.length))) return unavailable();
    const raw = Object.hasOwn(documents, record.documentPath) ? documents[record.documentPath] : undefined;
    if (typeof raw !== 'string' && !Buffer.isBuffer(raw)) return unavailable();
    const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
    if (bytes.length > BOUNDS.maxDocumentBytes) return unavailable('record_too_large');
    let contentMarkdown;
    try {
      // ignoreBOM preserves a leading BOM in both the returned text and its hash.
      contentMarkdown = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch { return unavailable(); }
    if ((typeof raw === 'string' && raw !== contentMarkdown) || !contentMarkdown.trim()) return unavailable();
    return {
      ...Object.fromEntries(SUMMARY_FIELDS.filter((key) => key !== 'documentUrl').map((key) => [key, record[key]])),
      documentUrl: url(sourceRevision, record.documentPath, record.anchor),
      contentMarkdown, contentSha256: sha256(bytes),
      coLocatedIds: peers.map((entry) => entry.id).sort(ascii), available: true,
    };
  });
  const limitations = [...new Set([SEED_LIMIT, ...mapping.limitations])];
  if (records.some((record) => !record.available)) limitations.push('Some declared records are missing, unsupported, malformed or outside the document bound and cannot be served.');
  const snapshot = {
    format: FORMAT, sourceRepository: SOURCE_REPOSITORY, sourceRevision,
    mappingRevision: mapping.mappingRevision, indexPath: mapping.indexPath,
    indexRevision: mapping.indexRevision, indexSha256: sha256(indexMarkdown),
    searchMode: SEARCH_MODE, bounds: BOUNDS, limitations, records,
  };
  return freeze({ ...snapshot, snapshotId: identity(snapshot) });
}

function validateSnapshot(input) {
  const copy = structuredClone(input);
  const { snapshotId, ...snapshot } = copy;
  const fail = () => { throw new Error('Invalid prepared snapshot.'); };
  if (snapshot.format !== FORMAT || snapshot.sourceRepository !== SOURCE_REPOSITORY
    || !/^[0-9a-f]{40}$/.test(snapshot.sourceRevision) || !text(snapshot.mappingRevision)
    || snapshot.indexPath !== 'references/library/README.md'
    || !(snapshot.indexRevision === null || positive(snapshot.indexRevision))
    || !/^[0-9a-f]{64}$/.test(snapshot.indexSha256)
    || snapshot.searchMode !== SEARCH_MODE || canonical(snapshot.bounds) !== canonical(BOUNDS)
    || !Array.isArray(snapshot.limitations) || !snapshot.limitations.length || !snapshot.limitations.every((item) => text(item))
    || !Array.isArray(snapshot.records) || snapshotId !== identity(snapshot)) fail();
  for (const record of snapshot.records) {
    if (!isObject(record) || !(record.id === null || validId(record.id))) fail();
    if (record.available === false) {
      if (!['record_unavailable', 'record_too_large'].includes(record.reason)
        || Object.keys(record).sort().join(',') !== 'available,id,reason') fail();
      continue;
    }
    if (record.available !== true || !validMetadata(record)
      || typeof record.contentMarkdown !== 'string' || !record.contentMarkdown.trim()
      || Buffer.byteLength(record.contentMarkdown, 'utf8') > BOUNDS.maxDocumentBytes
      || record.contentSha256 !== sha256(record.contentMarkdown)
      || record.documentUrl !== url(snapshot.sourceRevision, record.documentPath, record.anchor)
      || snapshot.records.filter((entry) => entry.id === record.id).length !== 1
      || !Array.isArray(record.coLocatedIds) || !record.coLocatedIds.includes(record.id)
      || record.coLocatedIds.some((id) => !validId(id) || !snapshot.records.some((entry) => entry.id === id))) fail();
    const peers = snapshot.records.filter((entry) => entry.available && entry.documentPath === record.documentPath);
    if (record.contentScope === 'record_document' && (record.coLocatedIds.length !== 1 || peers.length !== 1)) fail();
    if (record.contentScope === 'shared_document' && record.coLocatedIds.length < 2) fail();
    for (const peer of peers) {
      if (peer.contentSha256 !== record.contentSha256 || peer.contentScope !== record.contentScope
        || canonical(peer.coLocatedIds) !== canonical(record.coLocatedIds)) fail();
    }
  }
  return freeze(copy);
}

function validateArguments(name, args) {
  const fields = {
    search_references: ['query', 'kind', 'limit', 'cursor', 'snapshotId'],
    get_reference: ['id', 'revision', 'snapshotId'],
    library_info: ['snapshotId'],
  }[name];
  if (!fields) throw new Error('Unknown application tool.');
  if (!isObject(args) || Object.keys(args).some((key) => ![...fields, 'contractVersion'].includes(key))) return 'invalid_arguments';
  if (Object.values(args).some((value) => value === null || value === undefined)) return 'invalid_arguments';
  if (Object.hasOwn(args, 'contractVersion')) {
    if (typeof args.contractVersion !== 'string') return 'invalid_arguments';
    if (args.contractVersion !== CONTRACT_VERSION) return 'unsupported_version';
  }
  if (Object.hasOwn(args, 'snapshotId') && !text(args.snapshotId, BOUNDS.snapshotIdCharacters)) return 'invalid_arguments';
  if (name === 'search_references') {
    if (Object.hasOwn(args, 'kind') && !Object.values(KINDS).includes(args.kind)) return 'invalid_arguments';
    if (Object.hasOwn(args, 'limit') && (!positive(args.limit) || args.limit > BOUNDS.maxPageSize)) return 'invalid_arguments';
    if (Object.hasOwn(args, 'query')) {
      if (typeof args.query !== 'string') return 'invalid_arguments';
      const query = normalise(args.query);
      if (!text(query, BOUNDS.queryCodePoints) || query.split(/\s+/u).length > BOUNDS.queryTokens) return 'invalid_arguments';
    }
    if (Object.hasOwn(args, 'cursor') && (!text(args.cursor, BOUNDS.cursorCharacters) || !Object.hasOwn(args, 'snapshotId'))) return 'invalid_arguments';
  }
  if (name === 'get_reference' && (!validId(args.id)
    || (Object.hasOwn(args, 'revision') && !positive(args.revision)))) return 'invalid_arguments';
  return null;
}

export class Library {
  #snapshot;
  #key = randomBytes(32);

  constructor(snapshot = null) {
    this.#snapshot = snapshot === null ? null : validateSnapshot(snapshot);
  }

  call(name, args = {}) {
    const asOf = new Date().toISOString();
    let selected;
    const error = (code) => ({
      contractVersion: CONTRACT_VERSION, status: 'error', asOf,
      ...(selected ? { snapshotId: selected.snapshotId } : {}),
      error: { code, message: MESSAGE[code] },
    });
    const invalid = validateArguments(name, args);
    if (invalid) return error(invalid);
    if (!this.#snapshot || (Object.hasOwn(args, 'snapshotId') && args.snapshotId !== this.#snapshot.snapshotId)) return error('snapshot_unavailable');
    selected = this.#snapshot;
    const available = selected.records.filter((record) => record.available);
    const coverage = {
      status: selected.records.length === available.length ? 'complete' : 'partial',
      declaredRecords: selected.records.length, availableRecords: available.length,
      unavailableRecords: selected.records.length - available.length, limitations: [...selected.limitations],
    };
    const success = (data) => ({
      contractVersion: CONTRACT_VERSION, status: 'ok', snapshotId: selected.snapshotId,
      sourceRepository: selected.sourceRepository, sourceRevision: selected.sourceRevision,
      mappingRevision: selected.mappingRevision, asOf, coverage, data,
    });
    if (name === 'library_info') return success({
      indexPath: selected.indexPath, indexUrl: url(selected.sourceRevision, selected.indexPath),
      indexRevision: selected.indexRevision,
      availableByKind: Object.fromEntries(Object.values(KINDS).map((kind) => [kind, available.filter((record) => record.kind === kind).length])),
      searchMode: SEARCH_MODE, bounds: { ...BOUNDS }, history: 'not_guaranteed',
    });
    if (name === 'get_reference') {
      const record = selected.records.find((item) => item.id === args.id);
      if (!record) return error('not_found');
      if (!record.available) return error(record.reason);
      if (Object.hasOwn(args, 'revision') && args.revision !== record.recordRevision) return error('revision_unavailable');
      return success({ record: {
        ...summary(record), contentMarkdown: record.contentMarkdown,
        contentSha256: record.contentSha256, coLocatedIds: [...record.coLocatedIds],
      } });
    }
    const query = Object.hasOwn(args, 'query') ? normalise(args.query) : null;
    const tokens = query === null ? [] : query.split(/\s+/u);
    const limit = args.limit ?? BOUNDS.defaultPageSize;
    const key = sha256(canonical({ snapshotId: selected.snapshotId, query, kind: args.kind ?? null, limit, order: SEARCH_MODE }));
    const matches = available.filter((record) => (!args.kind || record.kind === args.kind)
      && tokens.every((token) => normalise(`${record.title}\n${record.discoveryText}\n${record.contentMarkdown}`).includes(token)))
      .sort((a, b) => ascii(a.id, b.id));
    let offset = 0;
    if (Object.hasOwn(args, 'cursor')) {
      try {
        const [body, signature, extra] = args.cursor.split('.');
        if (!body || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(body)
          || !/^[A-Za-z0-9_-]+$/.test(signature)) return error('invalid_cursor');
        const expected = createHmac('sha256', this.#key).update(body).digest();
        const actual = Buffer.from(signature, 'base64url');
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return error('invalid_cursor');
        const cursor = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
        if (cursor.key !== key || !positive(cursor.offset) || cursor.offset >= matches.length || cursor.offset % limit !== 0) return error('invalid_cursor');
        offset = cursor.offset;
      } catch { return error('invalid_cursor'); }
    }
    const page = matches.slice(offset, offset + limit);
    let nextCursor = null;
    if (offset + limit < matches.length) {
      const body = Buffer.from(JSON.stringify({ key, offset: offset + limit })).toString('base64url');
      nextCursor = `${body}.${createHmac('sha256', this.#key).update(body).digest('base64url')}`;
    }
    return success({ items: page.map(summary), nextCursor });
  }
}
