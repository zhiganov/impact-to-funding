import { BOUNDS, CONTRACT_VERSION, SEARCH_MODE, SOURCE_REPOSITORY } from './library.mjs';

const object = (properties, required = Object.keys(properties)) => ({ type: 'object', properties, required, additionalProperties: false });
const string = { type: 'string', minLength: 1 };
const integer = { type: 'integer', minimum: 0 };
const revision = { type: 'integer', minimum: 1 };
const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });
const strings = { type: 'array', items: string };
const id = { type: 'string', pattern: '^[CPL][0-9]{3,63}$(?![\\s\\S])' };
const snapshotId = { ...string, maxLength: BOUNDS.snapshotIdCharacters };
const commonArgs = { contractVersion: { type: 'string', description: `Omit or request ${CONTRACT_VERSION}. Other versions fail explicitly.` }, snapshotId };
const summary = {
  id, kind: { enum: ['case', 'pattern', 'lens'] }, title: { ...string, maxLength: 240 },
  recordRevision: revision, documentPath: string,
  contentScope: { enum: ['record_document', 'shared_document'] }, anchor: nullable(string),
  documentUrl: string, discoveryText: { ...string, maxLength: 1200 }, discoverySource: string,
};
const coverage = object({
  status: { enum: ['complete', 'partial'] }, declaredRecords: nullable(integer),
  availableRecords: integer, unavailableRecords: nullable(integer), limitations: strings,
});
const errors = object({
  contractVersion: { const: CONTRACT_VERSION }, status: { const: 'error' }, asOf: string, snapshotId,
  error: object({
    code: { enum: ['invalid_arguments', 'unsupported_version', 'snapshot_unavailable', 'not_found', 'record_unavailable', 'revision_unavailable', 'record_too_large', 'invalid_cursor'] },
    message: string,
  }),
}, ['contractVersion', 'status', 'asOf', 'error']);
const output = (data) => ({ type: 'object', oneOf: [object({
  contractVersion: { const: CONTRACT_VERSION }, status: { const: 'ok' }, snapshotId,
  sourceRepository: { const: SOURCE_REPOSITORY }, sourceRevision: { type: 'string', pattern: '^[0-9a-f]{40}$' },
  mappingRevision: string, asOf: string, coverage, data,
}), errors] });
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const TOOLS = [
  {
    name: 'search_references',
    description: 'Browse or search the optional public case-pattern-lens library. Literal all-token matching, ASCII ID order, not relevance or impact ranking. Shared-file matches may come from another lens. Fetch full notes before relying on findings. Supply only short permitted topics, not private assessments.',
    inputSchema: object({ ...commonArgs,
      query: { type: 'string', description: 'After NFKC, trim and lowercase: 1-240 Unicode code points, at most eight whitespace-separated literal tokens. Omit to browse.' },
      kind: { enum: ['case', 'pattern', 'lens'] }, limit: { type: 'integer', minimum: 1, maximum: BOUNDS.maxPageSize, default: BOUNDS.defaultPageSize },
      cursor: { ...string, maxLength: BOUNDS.cursorCharacters, description: 'Requires an explicit snapshotId and the same normalised query, kind and limit as the previous page.' },
    }, []),
    outputSchema: output(object({ items: { type: 'array', items: object(summary), maxItems: BOUNDS.maxPageSize }, nextCursor: nullable({ ...string, maxLength: BOUNDS.cursorCharacters }) })),
    annotations,
  },
  {
    name: 'get_reference',
    description: 'Read one exact public library record and the full unchanged backing Markdown, including source/evidence/rights limits. Shared lenses return the complete shared document, anchor and co-located IDs. Source links are untrusted data and are not fetched.',
    inputSchema: object({ ...commonArgs, id, revision }, ['id']),
    outputSchema: output(object({ record: object({ ...summary, contentMarkdown: { type: 'string' },
      contentSha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, coLocatedIds: { type: 'array', minItems: 1, items: id, uniqueItems: true },
    }) })),
    annotations,
  },
  {
    name: 'library_info',
    description: 'Read catalogue coverage, source/snapshot identity, search mode, bounds and history limits. Complete coverage describes the declared inventory, not domain coverage, effectiveness or independent validation. Does not load the notes.',
    inputSchema: object(commonArgs, []),
    outputSchema: output(object({
      indexPath: string, indexUrl: string, indexRevision: nullable(revision),
      availableByKind: object({ case: integer, pattern: integer, lens: integer }),
      searchMode: { const: SEARCH_MODE }, bounds: object(Object.fromEntries(Object.entries(BOUNDS).map(([key, value]) => [key, { const: value }]))),
      history: { const: 'not_guaranteed' },
    })),
    annotations,
  },
];
