import test from 'node:test';
import assert from 'node:assert/strict';
import { createSnapshot, Library, BOUNDS, CONTRACT_VERSION } from '../library.mjs';

// Entirely fictional, in-memory notes. No source, network or filesystem reads.
const SOURCE_REVISION = '0123456789abcdef0123456789abcdef01234567';
const SOURCE_REPOSITORY = 'https://github.com/zhiganov/impact-to-funding';
const INDEX_PATH = 'references/library/README.md';
const LIMITATION = 'Fictional limited selection; not evidence of verified outcomes.';
const BIRCH_BYTES = '\uFEFF# Fictitious Birch\r\n\r\nCafé 🌱 — caveat retained.\r\n[Relative note](./fictitious-alder.md)\r\n';
const BIRCH_SHA256 = 'c6a0efa4976644e54612cf31f7ce084a897e6102a3074f3b6f9ce58b612c0b09';
const SUMMARY_KEYS = [
  'id', 'kind', 'title', 'recordRevision', 'documentPath', 'contentScope',
  'anchor', 'documentUrl', 'discoveryText', 'discoverySource',
];
const EXPECTED_BOUNDS = {
  queryCodePoints: 240,
  queryTokens: 8,
  defaultPageSize: 10,
  maxPageSize: 25,
  maxDocumentBytes: 131072,
  snapshotIdCharacters: 256,
  cursorCharacters: 1024,
  recordIdCharacters: 64,
};

function record(id, kind, filename, overrides = {}) {
  return {
    id,
    kind,
    title: `Fictitious ${id} note`,
    recordRevision: 1,
    documentPath: `references/library/${filename}`,
    contentScope: 'record_document',
    anchor: null,
    discoveryText: 'Fictional discovery aid, not an evaluation.',
    discoverySource: `${INDEX_PATH}#fictional-notes`,
    ...overrides,
  };
}

function fixture() {
  return {
    sourceRevision: SOURCE_REVISION,
    mapping: {
      mappingRevision: 'fictional-mapping-1',
      indexPath: INDEX_PATH,
      indexRevision: 7,
      limitations: [LIMITATION],
      // Deliberately not ASCII sorted.
      records: [
        record('P002', 'pattern', 'fictitious-dune.md'),
        record('L002', 'lens', 'fictitious-lenses.md', {
          contentScope: 'shared_document', anchor: 'fictitious-tidal-lens',
        }),
        record('C002', 'case', 'fictitious-birch.md', { recordRevision: 3 }),
        record('C001', 'case', 'fictitious-alder.md', {
          title: 'Fictitious Alder case',
          discoveryText: 'Fictional discoveryseed; no established causal claim.',
        }),
        record('P001', 'pattern', 'fictitious-cloud.md'),
        record('L001', 'lens', 'fictitious-lenses.md', {
          contentScope: 'shared_document', anchor: 'fictitious-hill-lens',
        }),
      ],
    },
    documents: {
      'references/library/fictitious-alder.md': '# Fictitious Alder\n\nCaveatonly. Literal a+b [seed] .* markers.\n',
      'references/library/fictitious-birch.md': Buffer.from(BIRCH_BYTES, 'utf8'),
      'references/library/fictitious-cloud.md': '# Fictitious Cloud\n\nA candidate pattern, not a recipe.\n',
      'references/library/fictitious-dune.md': '# Fictitious Dune\n\nContrary findings remain unresolved.\n',
      'references/library/fictitious-lenses.md': '# Fictitious lenses\n\nCommon rights and evidence limits.\n\n## Fictitious hill lens\n\nHill question.\n\n## Fictitious tidal lens\n\nTidalmarker occurs only in this second section.\n\nClosing caveats apply to both.\n',
    },
    indexMarkdown: '# Fictional library\n\nRevision: 7\n\n## Fictional notes\n\nLimited selection, not verified outcomes.\n',
  };
}

function prepared(input = fixture()) {
  const snapshot = createSnapshot(input);
  return { snapshot, library: new Library(snapshot) };
}

function keys(value, expected) {
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
}

function timestamp(value) {
  assert.equal(typeof value, 'string');
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
  assert.ok(Number.isFinite(Date.parse(value)));
}

function ok(library, name, args = {}) {
  const result = library.call(name, args);
  assert.equal(result.status, 'ok');
  keys(result, ['contractVersion', 'status', 'snapshotId', 'sourceRepository',
    'sourceRevision', 'mappingRevision', 'asOf', 'coverage', 'data']);
  assert.equal(result.contractVersion, CONTRACT_VERSION);
  assert.equal(result.sourceRepository, SOURCE_REPOSITORY);
  assert.equal(result.sourceRevision, SOURCE_REVISION);
  assert.equal(result.mappingRevision, 'fictional-mapping-1');
  assert.equal(typeof result.snapshotId, 'string');
  assert.ok(result.snapshotId.length > 0 && result.snapshotId.length <= 256);
  timestamp(result.asOf);
  keys(result.coverage, ['status', 'declaredRecords', 'availableRecords', 'unavailableRecords', 'limitations']);
  return result;
}

function error(library, name, args, code) {
  const result = library.call(name, args);
  assert.equal(result.status, 'error');
  assert.equal(result.contractVersion, CONTRACT_VERSION);
  keys(result, ['contractVersion', 'status', 'asOf', 'error',
    ...('snapshotId' in result ? ['snapshotId'] : [])]);
  timestamp(result.asOf);
  keys(result.error, ['code', 'message']);
  assert.equal(result.error.code, code);
  assert.equal(typeof result.error.message, 'string');
  assert.ok(result.error.message.trim().length > 0);
  return result;
}

function ids(result) {
  keys(result.data, ['items', 'nextCursor']);
  for (const summary of result.data.items) keys(summary, SUMMARY_KEYS);
  assert.ok(result.data.nextCursor === null ||
    (typeof result.data.nextCursor === 'string' && result.data.nextCursor.length > 0 &&
      result.data.nextCursor.length <= 1024));
  return result.data.items.map((item) => item.id);
}

function coverage(result, declared, available) {
  assert.deepEqual(result.coverage, {
    status: declared === available ? 'complete' : 'partial',
    declaredRecords: declared,
    availableRecords: available,
    unavailableRecords: declared - available,
    limitations: result.coverage.limitations,
  });
  assert.ok(result.coverage.limitations.includes(LIMITATION));
  for (const limitation of result.coverage.limitations) {
    assert.equal(typeof limitation, 'string');
    assert.ok(limitation.trim().length > 0);
  }
}

test('library_info exposes exactly the contract metadata and bounds', () => {
  const { library } = prepared();
  assert.equal(CONTRACT_VERSION, 'itf.library/0.1-draft');
  assert.deepEqual(BOUNDS, EXPECTED_BOUNDS);
  const result = ok(library, 'library_info');
  keys(result.data, ['indexPath', 'indexUrl', 'indexRevision', 'availableByKind', 'searchMode', 'bounds', 'history']);
  assert.deepEqual(result.data, {
    indexPath: INDEX_PATH,
    indexUrl: `${SOURCE_REPOSITORY}/blob/${SOURCE_REVISION}/${INDEX_PATH}`,
    indexRevision: 7,
    availableByKind: { case: 2, pattern: 2, lens: 2 },
    searchMode: 'literal_all_tokens_id_order',
    bounds: EXPECTED_BOUNDS,
    history: 'not_guaranteed',
  });
  coverage(result, 6, 6);
});

test('successes return the actual selected snapshot and a real query timestamp', () => {
  const { library } = prepared();
  const start = Date.now();
  const info = ok(library, 'library_info');
  const search = ok(library, 'search_references', { snapshotId: info.snapshotId });
  const detail = ok(library, 'get_reference', { id: 'C001', snapshotId: search.snapshotId });
  const end = Date.now();
  assert.equal(search.snapshotId, info.snapshotId);
  assert.equal(detail.snapshotId, search.snapshotId);
  for (const result of [info, search, detail]) {
    // RFC 3339 permits second precision as well as fractional seconds.
    assert.ok(Date.parse(result.asOf) >= start - 1000 && Date.parse(result.asOf) <= end);
    coverage(result, 6, 6);
  }
});

test('browse uses ASCII ID order, filters exact kinds and applies limits after sorting', () => {
  const input = fixture();
  for (const id of ['C999', 'C1000', 'C010']) {
    const note = record(id, 'case', `fictitious-${id}.md`);
    input.mapping.records.unshift(note);
    input.documents[note.documentPath] = `# Fictional ${id}\n`;
  }
  const { library } = prepared(input);
  assert.deepEqual(ids(ok(library, 'search_references')), [
    'C001', 'C002', 'C010', 'C1000', 'C999', 'L001', 'L002', 'P001', 'P002',
  ]);
  assert.deepEqual(ids(ok(library, 'search_references', { kind: 'case', limit: 3 })), ['C001', 'C002', 'C010']);
  assert.deepEqual(ids(ok(library, 'search_references', { kind: 'pattern', limit: 25 })), ['P001', 'P002']);
  assert.deepEqual(ids(ok(library, 'search_references', { kind: 'lens' })), ['L001', 'L002']);
});

test('search normalises NFKC, Unicode whitespace, case and composed accents', () => {
  const { library } = prepared();
  // Full-document literal search also matches C002's ./fictitious-alder.md link.
  assert.deepEqual(ids(ok(library, 'search_references', { query: '\u3000ＡＬＤＥＲ\u00a0' })), ['C001', 'C002']);
  assert.deepEqual(ids(ok(library, 'search_references', { query: '  CAFE\u0301\t🌱\n' })), ['C002']);
  assert.deepEqual(ids(ok(library, 'search_references', { query: 'alder DISCOVERYSEED caveatonly' })), ['C001']);
});

test('search tokens are literal all-token substrings, not regexes or inferred synonyms', () => {
  const { library } = prepared();
  assert.deepEqual(ids(ok(library, 'search_references', { query: 'a+b [seed] .*' })), ['C001']);
  assert.deepEqual(ids(ok(library, 'search_references', { query: 'alder nonexistent-token' })), []);
  const empty = ok(library, 'search_references', { query: 'arboreal' });
  assert.deepEqual(ids(empty), []);
  assert.equal(empty.data.nextCursor, null);
  coverage(empty, 6, 6);
});

test('query bounds count normalised Unicode code points and at most eight tokens', () => {
  const input = fixture();
  input.documents['references/library/fictitious-alder.md'] += `${'🌱'.repeat(240)}\nq01 q02 q03 q04 q05 q06 q07 q08\n`;
  const { library } = prepared(input);
  assert.deepEqual(ids(ok(library, 'search_references', { query: '🌱'.repeat(240) })), ['C001']);
  assert.deepEqual(ids(ok(library, 'search_references', { query: 'q01 q02 q03 q04 q05 q06 q07 q08' })), ['C001']);
  assert.deepEqual(ids(ok(library, 'search_references', { query: `  ${'Ａ'.repeat(240)}  ` })), []);
  for (const query of ['', ' \t\n\u3000', '🌱'.repeat(241), 'a b c d e f g h i', 1, [], {}]) {
    error(library, 'search_references', { query }, 'invalid_arguments');
  }
});

test('all tools reject non-object arguments, unknown keys and explicit nulls', () => {
  const { library } = prepared();
  const tools = [
    ['search_references', {}, ['query', 'kind', 'limit', 'cursor', 'snapshotId', 'contractVersion']],
    ['get_reference', { id: 'C001' }, ['id', 'revision', 'snapshotId', 'contractVersion']],
    ['library_info', {}, ['snapshotId', 'contractVersion']],
  ];
  for (const [name, valid, optional] of tools) {
    for (const args of [null, [], 'fictional', 4, true]) error(library, name, args, 'invalid_arguments');
    error(library, name, { ...valid, unexpected: true }, 'invalid_arguments');
    for (const key of optional) error(library, name, { ...valid, [key]: null }, 'invalid_arguments');
    for (const snapshotId of ['', 4, 's'.repeat(257)]) {
      error(library, name, { ...valid, snapshotId }, 'invalid_arguments');
    }
  }
  for (const kind of ['Case', 'cases', '', 1]) error(library, 'search_references', { kind }, 'invalid_arguments');
  for (const limit of [0, -1, 26, 1.5, '2', true]) error(library, 'search_references', { limit }, 'invalid_arguments');
});

test('detail validates required ID syntax, total length and positive integer revisions', () => {
  const { library } = prepared();
  error(library, 'get_reference', {}, 'invalid_arguments');
  for (const id of ['', 'C01', 'c001', 'X001', 'C001\n', '../C001', 'C１２３', `C${'1'.repeat(64)}`, 1]) {
    error(library, 'get_reference', { id }, 'invalid_arguments');
  }
  error(library, 'get_reference', { id: `C${'1'.repeat(63)}` }, 'not_found');
  for (const revision of [0, -1, 1.5, '1', true]) {
    error(library, 'get_reference', { id: 'C001', revision }, 'invalid_arguments');
  }
});

test('pagination accepts repeated effective normalised query, kind and limit', () => {
  const { library } = prepared();
  const first = ok(library, 'search_references', { query: ' ＦＩＣＴＩＴＩＯＵＳ ', limit: 2 });
  assert.deepEqual(ids(first), ['C001', 'C002']);
  assert.equal(typeof first.data.nextCursor, 'string');
  const nextArgs = { query: 'fictitious', limit: 2, snapshotId: first.snapshotId, cursor: first.data.nextCursor };
  const second = ok(library, 'search_references', nextArgs);
  assert.deepEqual(ids(second), ['L001', 'L002']);
  assert.deepEqual(ids(ok(library, 'search_references', nextArgs)), ['L001', 'L002']);
  const third = ok(library, 'search_references', { ...nextArgs, cursor: second.data.nextCursor });
  assert.deepEqual(ids(third), ['P001', 'P002']);
  assert.equal(third.data.nextCursor, null);

  const filtered = ok(library, 'search_references', { kind: 'pattern', limit: 1 });
  assert.deepEqual(ids(ok(library, 'search_references', {
    kind: 'pattern', limit: 1, snapshotId: filtered.snapshotId, cursor: filtered.data.nextCursor,
  })), ['P002']);
});

test('default page size and explicit default have the same cursor meaning', () => {
  const input = fixture();
  for (let n = 3; n <= 9; n++) {
    const note = record(`C${String(n).padStart(3, '0')}`, 'case', `fictitious-extra-${n}.md`);
    input.mapping.records.push(note);
    input.documents[note.documentPath] = '# Fictitious extra note\n';
  }
  const { library } = prepared(input);
  const first = ok(library, 'search_references');
  assert.equal(ids(first).length, 10);
  const second = ok(library, 'search_references', {
    limit: 10, snapshotId: first.snapshotId, cursor: first.data.nextCursor,
  });
  assert.deepEqual(ids(second), ['L002', 'P001', 'P002']);
  assert.equal(second.data.nextCursor, null);
  const explicit = ok(library, 'search_references', { limit: 10 });
  assert.deepEqual(ids(ok(library, 'search_references', {
    snapshotId: explicit.snapshotId, cursor: explicit.data.nextCursor,
  })), ['L002', 'P001', 'P002']);
});

test('cursor validation rejects changed search state and missing explicit snapshot', () => {
  const { library } = prepared();
  const first = ok(library, 'search_references', { limit: 2 });
  const args = { limit: 2, snapshotId: first.snapshotId, cursor: first.data.nextCursor };
  for (const changed of [{ limit: 3 }, { kind: 'case' }, { query: 'fictitious' }, { cursor: 'fictional-unknown-cursor' }]) {
    error(library, 'search_references', { ...args, ...changed }, 'invalid_cursor');
  }
  error(library, 'search_references', { limit: 2, cursor: first.data.nextCursor }, 'invalid_arguments');
  for (const cursor of ['', 'x'.repeat(1025), 1]) {
    error(library, 'search_references', { ...args, cursor }, 'invalid_arguments');
  }
});

test('pagination never mixes snapshots or silently restarts when a snapshot is absent', () => {
  const firstLibrary = prepared().library;
  const first = ok(firstLibrary, 'search_references', { limit: 2 });
  const changed = fixture();
  changed.documents['references/library/fictitious-alder.md'] += '\nA changed fictional caveat.\n';
  const secondLibrary = prepared(changed).library;
  const current = ok(secondLibrary, 'library_info');
  assert.notEqual(current.snapshotId, first.snapshotId);
  error(secondLibrary, 'search_references', {
    limit: 2, cursor: first.data.nextCursor, snapshotId: first.snapshotId,
  }, 'snapshot_unavailable');
  error(secondLibrary, 'search_references', {
    limit: 2, cursor: first.data.nextCursor, snapshotId: current.snapshotId,
  }, 'invalid_cursor');
  for (const [name, args] of [['library_info', {}], ['get_reference', { id: 'C001' }], ['search_references', {}]]) {
    error(firstLibrary, name, { ...args, snapshotId: 'fictional-unavailable-snapshot' }, 'snapshot_unavailable');
  }
});

test('dedicated details add only full content, its hash and the single co-located ID', () => {
  const input = fixture();
  const { library } = prepared(input);
  const summary = ok(library, 'search_references', { query: 'alder' }).data.items[0];
  const detail = ok(library, 'get_reference', { id: 'C001' });
  keys(detail.data, ['record']);
  keys(detail.data.record, [...SUMMARY_KEYS, 'contentMarkdown', 'contentSha256', 'coLocatedIds']);
  const { contentMarkdown, contentSha256, coLocatedIds, ...detailSummary } = detail.data.record;
  assert.deepEqual(detailSummary, summary);
  assert.equal(contentMarkdown, input.documents[summary.documentPath]);
  assert.match(contentSha256, /^[a-f0-9]{64}$/);
  assert.deepEqual(coLocatedIds, ['C001']);
  assert.equal(summary.contentScope, 'record_document');
  assert.equal(summary.anchor, null);
  assert.equal(summary.documentUrl, `${SOURCE_REPOSITORY}/blob/${SOURCE_REVISION}/${summary.documentPath}`);
});

test('shared lenses retain the whole document, both IDs and section-specific pinned anchors', () => {
  const input = fixture();
  const { library } = prepared(input);
  const matches = ok(library, 'search_references', { query: 'tidalmarker', kind: 'lens' });
  assert.deepEqual(ids(matches), ['L001', 'L002']);
  const details = ['L001', 'L002'].map((id) => ok(library, 'get_reference', { id }).data.record);
  for (const detail of details) {
    assert.equal(detail.contentScope, 'shared_document');
    assert.deepEqual(detail.coLocatedIds, ['L001', 'L002']);
    assert.equal(detail.contentMarkdown, input.documents['references/library/fictitious-lenses.md']);
    assert.match(detail.contentMarkdown, /Common rights and evidence limits/);
    assert.match(detail.contentMarkdown, /Closing caveats apply to both/);
    assert.equal(detail.documentUrl, `${SOURCE_REPOSITORY}/blob/${SOURCE_REVISION}/${detail.documentPath}#${detail.anchor}`);
  }
  assert.equal(details[0].anchor, 'fictitious-hill-lens');
  assert.equal(details[1].anchor, 'fictitious-tidal-lens');
  assert.equal(details[0].contentSha256, details[1].contentSha256);
});

test('UTF-8 bytes, BOM, CRLF, non-ASCII text and relative links survive unchanged', () => {
  const { library } = prepared();
  const detail = ok(library, 'get_reference', { id: 'C002' }).data.record;
  assert.equal(detail.contentMarkdown, BIRCH_BYTES);
  assert.equal(Buffer.byteLength(detail.contentMarkdown, 'utf8'), 98);
  assert.equal(detail.contentSha256, BIRCH_SHA256);
  assert.equal(detail.recordRevision, 3);
  assert.ok(detail.contentMarkdown.includes('[Relative note](./fictitious-alder.md)'));
  const input = fixture();
  input.documents['references/library/fictitious-birch.md'] = BIRCH_BYTES;
  assert.equal(ok(prepared(input).library, 'get_reference', { id: 'C002' }).data.record.contentSha256, BIRCH_SHA256);
});

test('detail distinguishes unavailable revision, unknown ID and known unavailable record', () => {
  const input = fixture();
  delete input.documents['references/library/fictitious-cloud.md'];
  const { library } = prepared(input);
  assert.equal(ok(library, 'get_reference', { id: 'C002', revision: 3 }).data.record.recordRevision, 3);
  const revision = error(library, 'get_reference', { id: 'C002', revision: 1 }, 'revision_unavailable');
  error(library, 'get_reference', { id: 'C002', revision: 7 }, 'revision_unavailable');
  error(library, 'get_reference', { id: 'C999' }, 'not_found');
  const missing = error(library, 'get_reference', { id: 'P001' }, 'record_unavailable');
  assert.equal(revision.snapshotId, ok(library, 'library_info').snapshotId);
  assert.equal(missing.snapshotId, revision.snapshotId);
  coverage(ok(library, 'library_info'), 6, 5);
});

test('unsupported, missing and malformed declared metadata stays counted as unavailable', () => {
  const malformed = [
    null,
    { id: 'not-an-id' },
    record('C003', 'unsupported', 'fictitious-invalid.md'),
    record('C003', 'case', 'fictitious-invalid.md', { title: '' }),
    record('C003', 'case', 'fictitious-invalid.md', { recordRevision: 0 }),
    record('C003', 'case', 'fictitious-invalid.md', { discoveryText: '' }),
    record('C003', 'case', 'fictitious-invalid.md', { discoverySource: null }),
    record('C003', 'case', 'fictitious-invalid.md', { contentScope: 'excerpt' }),
    record('C003', 'case', 'fictitious-invalid.md', { documentPath: 'references/library/../outside.md' }),
    record('C003', 'case', 'fictitious-invalid.md', { documentPath: 'https://example.invalid/note.md' }),
    record('C003', 'case', 'fictitious-invalid.md', { title: '🌱'.repeat(241) }),
    record('C003', 'case', 'fictitious-invalid.md', { discoveryText: '🌱'.repeat(1201) }),
  ];
  const missingTitle = record('C003', 'case', 'fictitious-invalid.md');
  delete missingTitle.title;
  malformed.push(missingTitle);
  for (const entry of malformed) {
    const input = fixture();
    input.mapping.records.push(entry);
    input.documents['references/library/fictitious-invalid.md'] = '# Fictional invalid entry\n';
    const { library } = prepared(input);
    coverage(ok(library, 'library_info'), 7, 6);
    assert.deepEqual(ids(ok(library, 'search_references')), ['C001', 'C002', 'L001', 'L002', 'P001', 'P002']);
    if (entry?.id === 'C003') error(library, 'get_reference', { id: 'C003' }, 'record_unavailable');
    if (entry?.id === 'not-an-id') error(library, 'get_reference', { id: entry.id }, 'invalid_arguments');
  }
  const input = fixture();
  input.mapping.records[3].title = '🌱'.repeat(240);
  input.mapping.records[3].discoveryText = '🌱'.repeat(1200);
  const { library } = prepared(input);
  coverage(ok(library, 'library_info'), 6, 6);
  const detail = ok(library, 'get_reference', { id: 'C001' }).data.record;
  assert.equal([...detail.title].length, 240);
  assert.equal([...detail.discoveryText].length, 1200);
});

test('missing, malformed and invalid UTF-8 documents fail closed without losing membership', () => {
  for (const document of [undefined, null, 4, {}, Buffer.from([0xc3, 0x28]), Buffer.from([0xe2, 0x82])]) {
    const input = fixture();
    if (document === undefined) delete input.documents['references/library/fictitious-alder.md'];
    else input.documents['references/library/fictitious-alder.md'] = document;
    const { library } = prepared(input);
    coverage(ok(library, 'library_info'), 6, 5);
    error(library, 'get_reference', { id: 'C001' }, 'record_unavailable');
    // C002's literal link still matches; unavailable C001 must be omitted.
    assert.deepEqual(ids(ok(library, 'search_references', { query: 'alder' })), ['C002']);
  }
});

test('document byte bound accepts the exact limit and rejects excess without truncation', () => {
  const input = fixture();
  const exact = '🌱'.repeat(32768);
  assert.equal(Buffer.byteLength(exact), EXPECTED_BOUNDS.maxDocumentBytes);
  input.documents['references/library/fictitious-alder.md'] = exact;
  const accepted = prepared(input).library;
  assert.equal(ok(accepted, 'get_reference', { id: 'C001' }).data.record.contentMarkdown, exact);
  coverage(ok(accepted, 'library_info'), 6, 6);
  for (const oversized of [exact + 'x', Buffer.from(exact + 'x')]) {
    const tooLargeInput = fixture();
    tooLargeInput.documents['references/library/fictitious-alder.md'] = oversized;
    const { library } = prepared(tooLargeInput);
    error(library, 'get_reference', { id: 'C001' }, 'record_too_large');
    coverage(ok(library, 'library_info'), 6, 5);
    // C002's literal link still matches; oversized C001 must be omitted.
    assert.deepEqual(ids(ok(library, 'search_references', { query: 'alder' })), ['C002']);
  }
});

test('known zero inventory is complete and retains limitations and undeclared index revision', () => {
  const input = fixture();
  input.mapping.records = [];
  input.mapping.indexRevision = null;
  const { library } = prepared(input);
  const info = ok(library, 'library_info');
  coverage(info, 0, 0);
  assert.equal(info.data.indexRevision, null);
  assert.deepEqual(info.data.availableByKind, { case: 0, pattern: 0, lens: 0 });
  const search = ok(library, 'search_references');
  assert.deepEqual(ids(search), []);
  assert.equal(search.data.nextCursor, null);
  error(library, 'get_reference', { id: 'C001' }, 'not_found');
});

test('snapshot identity is deterministic and binds source, mapping, membership and content', () => {
  const first = prepared();
  const firstId = first.library.call('library_info').snapshotId;
  assert.equal(prepared().library.call('library_info').snapshotId, firstId);
  const roundTrip = JSON.parse(JSON.stringify(first.snapshot));
  assert.equal(new Library(roundTrip).call('library_info').snapshotId, firstId);
  const mutations = [
    (input) => { input.sourceRevision = 'a'.repeat(40); },
    (input) => { input.mapping.mappingRevision = 'fictional-mapping-2'; },
    (input) => { input.mapping.records.pop(); },
    (input) => { input.mapping.records[0].discoveryText += ' Different discovery aid.'; },
    (input) => { input.documents['references/library/fictitious-alder.md'] += '\nDifferent bytes.\n'; },
    (input) => { input.mapping.records.push(record('C003', 'case', 'fictitious-missing.md')); },
  ];
  for (const mutate of mutations) {
    const input = fixture();
    mutate(input);
    assert.notEqual(prepared(input).library.call('library_info').snapshotId, firstId);
  }
});

test('Library rejects corrupted JSON artifacts instead of trusting their stored identity', () => {
  const { snapshot } = prepared();
  const serialized = JSON.stringify(snapshot);
  for (const [original, replacement] of [
    [SOURCE_REVISION, 'f'.repeat(40)],
    ['fictional-mapping-1', 'fictional-mapping-tampered'],
    ['Fictitious Alder case', 'Tampered fictional title'],
    ['Caveatonly.', 'Changed fictional caveat.'],
  ]) {
    assert.ok(serialized.includes(original), `artifact must retain ${original}`);
    const tampered = JSON.parse(serialized.replace(original, replacement));
    assert.throws(() => new Library(tampered));
  }
  for (const artifact of [{}, [], 'not-a-snapshot', 4]) assert.throws(() => new Library(artifact));
});

test('preparation, Library construction and queries do not share mutable caller state', () => {
  const input = fixture();
  const { snapshot, library } = prepared(input);
  const baselineLimitations = [...ok(library, 'library_info').coverage.limitations];
  const serialized = JSON.stringify(snapshot);
  input.documents['references/library/fictitious-birch.md'].fill(0x78);
  input.mapping.records[3].title = 'Changed after preparation';
  input.mapping.limitations.push('Changed after preparation');
  input.documents['references/library/fictitious-alder.md'] = 'Changed after preparation';
  assert.equal(ok(library, 'get_reference', { id: 'C002' }).data.record.contentMarkdown, BIRCH_BYTES);
  assert.equal(ok(new Library(snapshot), 'get_reference', { id: 'C001' }).data.record.title, 'Fictitious Alder case');

  const copy = JSON.parse(serialized);
  const isolated = new Library(copy);
  // Discard every caller-owned artifact member after construction.
  for (const key of Object.keys(copy)) delete copy[key];
  assert.equal(ok(isolated, 'get_reference', { id: 'C002' }).data.record.contentMarkdown, BIRCH_BYTES);
  const args = { query: ' ＡＬＤＥＲ ', limit: 1 };
  const beforeArgs = JSON.stringify(args);
  const result = ok(library, 'search_references', args);
  error(library, 'search_references', { query: '' }, 'invalid_arguments');
  assert.equal(JSON.stringify(args), beforeArgs);
  assert.equal(JSON.stringify(snapshot), serialized);
  // Results may be frozen or disposable copies; neither may modify future calls.
  try { result.data.items[0].title = 'Changed returned summary'; } catch (cause) { assert.ok(cause instanceof TypeError); }
  try { result.coverage.limitations.push('Changed returned limitations'); } catch (cause) { assert.ok(cause instanceof TypeError); }
  assert.equal(ok(library, 'get_reference', { id: 'C001' }).data.record.title, 'Fictitious Alder case');
  assert.deepEqual(ok(library, 'library_info').coverage.limitations, baselineLimitations);
});

test('absent snapshots fail all three tools rather than returning empty successes', () => {
  const library = new Library(null);
  for (const [name, args] of [['library_info', {}], ['search_references', {}], ['get_reference', { id: 'C001' }]]) {
    const result = error(library, name, args, 'snapshot_unavailable');
    assert.equal('snapshotId' in result, false);
    assert.equal('data' in result, false);
    assert.equal('coverage' in result, false);
  }
});

test('contract versions are exact and errors do not expose rejected query or path text', () => {
  const { library } = prepared();
  for (const [name, args] of [['library_info', {}], ['search_references', {}], ['get_reference', { id: 'C001' }]]) {
    ok(library, name, { ...args, contractVersion: CONTRACT_VERSION });
    for (const contractVersion of ['itf.library/0.2', 'itf.library/0.1-draft ', '']) {
      error(library, name, { ...args, contractVersion }, 'unsupported_version');
    }
  }
  const query = 'fictional-sensitive-query-marker-'.repeat(12);
  const rejected = error(library, 'search_references', { query }, 'invalid_arguments');
  assert.equal(JSON.stringify(rejected).includes('fictional-sensitive-query-marker'), false);
  const path = '/fictional-local-root/do-not-echo/note.md';
  const detail = error(library, 'get_reference', { id: path }, 'invalid_arguments');
  assert.equal(JSON.stringify(detail).includes(path), false);
});
