import { isIP } from 'node:net';
import { Lexer, isAlias, isMap, isScalar, isSeq, parseAllDocuments, parseDocument } from 'yaml';

const MAX_BYTES = 64 * 1024;
const MAX_ENTRIES = 64;
const EDITABLE = new Set(['github', 'open_collective', 'custom']);
const EXTERNAL = new Set([
  'patreon', 'open_collective', 'ko_fi', 'tidelift', 'community_bridge',
  'liberapay', 'issuehunt', 'lfx_crowdfunding', 'polar', 'buy_me_a_coffee', 'thanks_dev',
]);
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype', '<<']);
const CONTROL = /[\p{Cc}\p{Cf}]/u;
const issue = (code, message) => ({ code, message });

export class FundingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FundingError';
    this.code = code;
  }
}

function fail(code, message) {
  throw new FundingError(code, message);
}

function plain(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail('invalid_input', `${label} must be a plain object.`);
  }
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor)) {
      fail('invalid_input', `${label} must contain ordinary data properties.`);
    }
  }
  return value;
}

function keyName(value) {
  if (typeof value !== 'string' || UNSAFE.has(value.toLowerCase())
      || !value.trim() || value.length > 64 || CONTROL.test(value)) {
    fail('unsafe_key', 'Funding keys must be bounded nonempty strings; reserved keys and control characters are refused.');
  }
  const lower = value.toLowerCase();
  if ((EDITABLE.has(lower) || EXTERNAL.has(lower)) && value !== lower) {
    fail('noncanonical_key', 'Known funding platform keys must use canonical lowercase spelling.');
  }
  return value;
}

function stringValue(value) {
  if (typeof value !== 'string' || !value.length || value.length > 2048 || CONTROL.test(value)) {
    fail('invalid_value', 'Funding values must be nonempty, bounded strings without control characters.');
  }
  return value;
}

function arrayData(value, label, limit = MAX_ENTRIES) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > limit) {
    fail('invalid_input', `${label} must be a bounded ordinary array.`);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) fail('invalid_input', `${label} must contain only array elements.`);
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      fail('invalid_input', `${label} must contain ordinary data elements.`);
    }
  }
  return value;
}

function values(value) {
  if (!Array.isArray(value)) return [stringValue(value)];
  if (!value.length || value.length > MAX_ENTRIES) {
    fail('invalid_value', 'Funding lists must contain between one and 64 strings.');
  }
  arrayData(value, 'Funding list');
  return Array.from(value, stringValue);
}

function customURL(value) {
  let url;
  let decoded;
  try {
    decoded = decodeURIComponent(value);
    url = new URL(value);
  } catch {
    fail('unsafe_url', 'Custom links must be valid public HTTPS URLs.');
  }
  if (/[\s\\]/u.test(value) || /[\s\\]/u.test(decoded) || CONTROL.test(decoded)
      || !/^https:\/\/[^/]/i.test(value) || url.protocol !== 'https:' || url.username || url.password
      || /^https:\/\/[^/]*@/i.test(value)) {
    fail('unsafe_url', 'Custom links must use HTTPS without credentials, whitespace or backslashes.');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  // DNS is deliberately not resolved. Refuse literal IPs and local/reserved names.
  if (isIP(host.replace(/^\[|\]$/g, '')) || !host.includes('.')
      || /(?:^|\.)(?:localhost|local|internal|home|lan|invalid|test)$/.test(host)) {
    fail('unsafe_url', 'Custom links require a public DNS hostname; literal IPs and local names are refused.');
  }
  if (value.includes('?') || value.includes('#')) {
    fail('unsafe_url', 'This tool supports custom HTTPS pages without query strings or fragments.');
  }
  return url.href;
}

function validateValue(key, value) {
  const list = values(value);
  if (key === 'github') {
    if (list.length > 5 || list.some(item => !/^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(item))) {
      fail('invalid_github', 'GitHub entries allow at most five syntactically valid account identifiers.');
    }
    if (new Set(list.map(item => item.toLowerCase())).size !== list.length) {
      fail('duplicate_destination', 'GitHub account identifiers must be unique, ignoring case.');
    }
  } else if (key === 'custom') {
    if (list.length > 4) fail('custom_limit', 'At most four custom funding URLs are allowed.');
    if (new Set(list.map(customURL)).size !== list.length) {
      fail('duplicate_destination', 'Custom funding URLs must be unique.');
    }
  } else if (EXTERNAL.has(key)) {
    const pattern = key === 'open_collective'
      ? /^[a-z0-9](?:[a-z0-9_-]{0,98}[a-z0-9])?$/i
      : /^[a-z0-9][a-z0-9_./-]{0,199}$/i;
    if (Array.isArray(value) || !pattern.test(value)) {
      fail('invalid_platform', 'External platform entries require one platform identifier string.');
    }
  }
}

function warningsFor(entries) {
  const warnings = [];
  if (Object.hasOwn(entries, 'github') && entries.github !== null) {
    warnings.push(issue('github_roles_unverified',
      'GitHub permits one organisation and up to four developers. Identifiers alone cannot verify account roles or eligibility.'));
  }
  const unhandled = Object.keys(entries).filter(key => !EDITABLE.has(key));
  if (Object.values(entries).some(value => value === null)) warnings.push(issue('empty_source_slots', 'Empty source platform slots declare no destination and are preserved. Proposed destinations must be supplied explicitly.'));
  if (unhandled.length) warnings.push(issue('unhandled_platforms', 'Existing unhandled platform entries are preserved for review.'));
  return { warnings, unhandled };
}

function parseFunding(text) {
  if (typeof text !== 'string') fail('invalid_input', 'Funding YAML must be supplied as text.');
  if (Buffer.byteLength(text, 'utf8') > MAX_BYTES) fail('size_limit', 'Funding YAML exceeds 64 KiB.');
  if (/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(text)) {
    fail('unsafe_yaml', 'Funding YAML contains control characters.');
  }
  if (/\p{Cf}/u.test(text.replace(/^\uFEFF/, ''))) fail('unsafe_yaml', 'Funding YAML contains hidden format controls.');
  if (/^\uFEFF?%/m.test(text)) fail('unsafe_yaml', 'YAML directives are refused.');
  let document;
  try {
    let depth = 0;
    for (const token of new Lexer().lex(text)) {
      if (token === '[' || token === '{') depth += 1;
      if (depth > 4) fail('depth_limit', 'Funding YAML nesting exceeds the supported flat shape.');
      if (token === ']' || token === '}') depth -= 1;
    }
    if (/^ {33}/m.test(text)) fail('depth_limit', 'Funding YAML indentation exceeds the supported flat shape.');
    const options = {
      version: '1.2', schema: 'core', strict: true, uniqueKeys: true,
      resolveKnownTags: false, prettyErrors: false, logLevel: 'silent',
    };
    const documents = parseAllDocuments(text, options);
    if (documents.length > 1) fail('multiple_documents', 'Supply a single funding YAML document.');
    document = documents[0] ?? parseDocument(text, options);
    if (document.errors.length || document.warnings.length) fail('invalid_yaml', 'Funding YAML is malformed or ambiguous.');
  } catch (error) {
    if (error instanceof FundingError) throw error;
    fail('invalid_yaml', 'Funding YAML could not be safely parsed.');
  }
  const entries = {};
  const pairs = new Map();
  function safeNode(node) {
    if (!node || isAlias(node) || node.anchor || node.tag) {
      fail('unsafe_yaml', 'Aliases, anchors, explicit tags and missing values are refused.');
    }
  }
  if (isScalar(document.contents) && document.contents.value === null && document.contents.source === '') {
    safeNode(document.contents);
    const empty = document.createNode({});
    for (const key of ['comment', 'commentBefore', 'spaceBefore']) empty[key] = document.contents[key];
    document.contents = empty;
  }
  if (document.contents !== null) {
    safeNode(document.contents);
    if (!isMap(document.contents)) fail('invalid_shape', 'Funding YAML must be a mapping.');
    if (document.contents.items.length > MAX_ENTRIES) fail('entry_limit', 'At most 64 funding entries are allowed.');
    for (const pair of document.contents.items) {
      safeNode(pair.key);
      if (!isScalar(pair.key) || typeof pair.key.value !== 'string') fail('invalid_key', 'Complex and non-string funding keys are refused.');
      const key = keyName(pair.key.value);
      if (Object.hasOwn(entries, key)) fail('duplicate_key', 'Funding platform keys must be unique.');
      safeNode(pair.value);
      let value;
      if (isScalar(pair.value)) value = pair.value.value;
      else if (isSeq(pair.value)) {
        if (pair.value.items.length > MAX_ENTRIES) fail('entry_limit', 'Funding lists exceed the supported limit.');
        value = pair.value.items.map(item => {
          safeNode(item);
          if (!isScalar(item)) fail('invalid_shape', 'Funding arrays must contain only strings.');
          return item.value;
        });
      } else fail('invalid_shape', 'Nested funding mappings are refused.');
      // GitHub's generated funding template leaves unused platform slots blank.
      // Preserve those null scalars as source data; mapping values remain strict.
      if (value !== null) validateValue(key, value);
      entries[key] = value;
      pairs.set(key, pair);
    }
  }
  return { document, entries, pairs, ...warningsFor(entries) };
}

export function inspectFunding(text) {
  const { entries, unhandled, warnings } = parseFunding(text);
  return { entries, unhandled, warnings };
}

function mappingOperations(mapping) {
  plain(mapping, 'Mapping');
  if (Object.keys(mapping).length > 3) fail('invalid_mapping', 'Mapping supports only add, replace and remove.');
  const operations = [];
  const seen = new Set();
  for (const [section, entries] of Object.entries(mapping)) {
    if (!['add', 'replace', 'remove'].includes(section)) fail('invalid_mapping', 'Mapping supports only add, replace and remove.');
    if (section === 'remove') {
      if (!Array.isArray(entries) || entries.length > 3) fail('invalid_mapping', 'Mapping remove must be a bounded list of platform keys.');
      arrayData(entries, 'Mapping remove', 3);
    } else {
      plain(entries, `Mapping ${section}`);
      if (Object.keys(entries).length > 3) fail('invalid_mapping', 'Only three funding platform keys can be edited.');
    }
    const items = section === 'remove' ? Array.from(entries, key => [key]) : Object.entries(entries);
    for (const [rawKey, value] of items) {
      const key = keyName(rawKey);
      if (!EDITABLE.has(key)) fail('unsupported_mapping', 'Only github, open_collective and custom can be edited.');
      if (seen.has(key)) fail('mapping_overlap', 'A funding key may occur in only one mapping operation.');
      seen.add(key);
      if (section !== 'remove') validateValue(key, value);
      operations.push({ operation: section, key, ...(section !== 'remove' ? { after: Array.isArray(value) ? [...value] : value } : {}) });
    }
  }
  if (!operations.length) fail('empty_mapping', 'Supply at least one explicit mapping operation.');
  return operations;
}

function comments(node) {
  if (!node) return [];
  const result = [node.commentBefore, node.comment].filter(value => value !== undefined && value !== null);
  if (isSeq(node)) for (const child of node.items) result.push(...comments(child));
  return result;
}

function equalValue(key, before, after) {
  if (before === null) return false;
  if (key === 'github') {
    return JSON.stringify(values(before).map(item => item.toLowerCase()))
      === JSON.stringify(values(after).map(item => item.toLowerCase()));
  }
  return JSON.stringify(before) === JSON.stringify(after);
}

function unifiedDiff(before, after) {
  if (before === after) return '';
  const lines = value => value === '' ? [] : value.replace(/\n$/, '').split('\n');
  const oldLines = lines(before);
  const newLines = lines(after);
  const chunk = (items, prefix, original) => items.map((line, index) =>
    `${prefix}${line}\n${index === items.length - 1 && !original.endsWith('\n') ? '\\ No newline at end of file\n' : ''}`).join('');
  return `--- a/.github/FUNDING.yml\n+++ b/.github/FUNDING.yml\n@@ -${oldLines.length ? 1 : 0},${oldLines.length} +${newLines.length ? 1 : 0},${newLines.length} @@\n`
    + chunk(oldLines, '-', before) + chunk(newLines, '+', after);
}

export function draftFunding(text, mapping = undefined) {
  const parsed = parseFunding(text);
  if (mapping === undefined) return { candidate: null, changes: [], diff: null, warnings: parsed.warnings };
  const operations = mappingOperations(mapping);
  const { document, entries, pairs } = parsed;
  const changes = [];
  for (const operation of operations) {
    const { key } = operation;
    const exists = Object.hasOwn(entries, key);
    if (operation.operation === 'add' && exists) fail('mapping_conflict', 'Cannot add an existing platform; use replace explicitly.');
    if (operation.operation !== 'add' && !exists) fail('mapping_conflict', 'Cannot replace or remove a missing platform.');
    if (operation.operation === 'replace' && equalValue(key, entries[key], operation.after)) continue;
    const change = { ...operation, ...(exists ? { before: entries[key] } : {}) };
    const pair = pairs.get(key);
    if (operation.operation === 'remove') {
      const retained = [...comments(pair.key), ...comments(pair.value)];
      if (retained.length) document.comment = [document.comment, ...retained].filter(value => value != null).join('\n');
      document.delete(pair.key.value);
    } else {
      const node = document.createNode(operation.after);
      if (pair) {
        const retained = comments(pair.value);
        if (retained.length) node.commentBefore = retained.join('\n');
        pair.value = node;
      } else document.set(key, node);
    }
    changes.push(change);
  }
  let candidate = text;
  if (changes.length) {
    try { candidate = document.toString({ lineWidth: 0 }); }
    catch { fail('invalid_yaml', 'The candidate could not be safely serialized.'); }
  }
  const inspected = inspectFunding(candidate);
  return { candidate, changes, diff: unifiedDiff(text, candidate), warnings: inspected.warnings };
}

function fileObservation(input, label) {
  plain(input, label);
  if (!['present', 'absent', 'unavailable', 'uninspected'].includes(input.state)) {
    fail('invalid_snapshot', `${label} has an invalid source state.`);
  }
  const output = { state: input.state };
  for (const key of ['revision', 'path']) {
    if (input[key] !== undefined && input[key] !== null) output[key] = stringValue(input[key]);
  }
  let parsed;
  if (input.state === 'present') {
    if (typeof input.text !== 'string') fail('invalid_snapshot', `${label} is present but its text is missing.`);
    try {
      parsed = inspectFunding(input.text);
      Object.assign(output, parsed);
    } catch (error) {
      if (!(error instanceof FundingError)) throw error;
      output.error = issue(error.code, error.message);
    }
  } else if (input.text !== undefined) fail('invalid_snapshot', `${label} supplies text without a present state.`);
  return { output, parsed, text: input.state === 'present' ? input.text : undefined };
}

function apiObservation(input) {
  plain(input, 'API funding links');
  if (!['observed', 'unavailable', 'uninspected'].includes(input.state)) fail('invalid_snapshot', 'API funding links have an invalid state.');
  const output = { state: input.state };
  if (input.state === 'observed') {
    if (!Array.isArray(input.links) || input.links.length > MAX_ENTRIES) fail('invalid_snapshot', 'Observed API funding links require a bounded links array.');
    arrayData(input.links, 'API funding links');
    output.links = input.links.map(link => {
      plain(link, 'API funding link');
      return { platform: stringValue(link.platform), url: stringValue(link.url) };
    });
  } else if (input.links !== undefined) fail('invalid_snapshot', 'Unobserved API funding links cannot contain links.');
  return output;
}

function expectedLinks(entries) {
  const links = [];
  if (entries.github) links.push(...values(entries.github).map(account => ({ platform: 'github', url: `https://github.com/sponsors/${account}` })));
  if (entries.open_collective) links.push({ platform: 'open_collective', url: `https://opencollective.com/${entries.open_collective}` });
  if (entries.custom) links.push(...values(entries.custom).map(url => ({ platform: 'custom', url })));
  return links;
}

function linkIdentities(links) {
  return links.flatMap(link => {
    const label = link.platform.toLowerCase();
    const platform = label === 'opencollective' ? 'open_collective' : label;
    if (!EDITABLE.has(platform)) return [];
    // Only GitHub account identifiers have an established case-insensitive rule.
    // In particular, custom URLs retain every path character and final slash.
    const destination = platform === 'github'
      ? link.url.replace(/^(https:\/\/github\.com\/sponsors\/)([A-Za-z0-9-]+)$/, (_, prefix, account) => prefix + account.toLowerCase())
      : link.url;
    return [JSON.stringify([platform, destination])];
  }).sort(); // A sorted list retains repeated declarations, unlike a Set.
}

export function reviewSources(snapshot, mapping = undefined) {
  plain(snapshot, 'Snapshot');
  if (mapping !== undefined) mappingOperations(mapping);
  const scope = {};
  for (const key of ['repository', 'mode', 'observedAt', 'repositoryRevision']) {
    if (snapshot[key] !== undefined && snapshot[key] !== null) scope[key] = stringValue(snapshot[key]);
  }
  const repo = fileObservation(snapshot.repositoryFunding, 'Repository funding');
  const defaults = fileObservation(snapshot.accountDefaults, 'Account defaults');
  const api = apiObservation(snapshot.apiFundingLinks);
  const sources = { repositoryFunding: repo.output, accountDefaults: defaults.output, apiFundingLinks: api };
  const observations = snapshot.observations === undefined ? []
    : arrayData(snapshot.observations, 'Source observations').map(item => {
      plain(item, 'Source observation');
      return { code: stringValue(item.code), message: stringValue(item.message) };
    });
  const warnings = [...observations];
  const limitations = [
    'Ready means an inspected local comparison, not approval to publish.',
    'Public API links do not prove button visibility, recipient control, payout setup or eligibility.',
    'Funding links contain no verified budget, income, allocation, financial-plan status or impact evidence.',
    'Custom links use a supported subset: HTTPS pages on public DNS hostnames without queries or fragments. Syntax checks are not privacy clearance; DNS and destinations have not been fetched.',
    'A missing content revision remains unknown; observation time is not a content revision.',
    'API comparison retains platform, destination and declaration counts. Custom URLs are compared exactly; redirects are uninspected.',
  ];
  let selected;
  let source = null;
  if (repo.output.state === 'present') { selected = repo; source = 'repository'; }
  else if (repo.output.state === 'absent') {
    if (defaults.output.state === 'present') { selected = defaults; source = 'account_default'; }
    else if (defaults.output.state === 'absent') source = 'none';
  }
  const known = source === 'none' || !!selected?.parsed;
  const effective = { state: known ? 'known' : 'unknown', source, ...(known ? { entries: selected?.parsed.entries ?? {} } : {}) };
  let status = known ? 'ready' : selected?.output.error ? 'blocked' : 'limited';
  if (!known) warnings.push(issue('effective_unknown', 'Effective funding configuration is unknown; inspect the missing or invalid source before drafting.'));
  for (const observation of [repo, defaults]) {
    if (observation.parsed) warnings.push(...observation.parsed.warnings);
    if (observation.output.error) warnings.push(observation.output.error);
  }
  if (known && effective.entries.github) status = 'limited';
  if (known && (repo.output.error || defaults.output.error)) status = 'limited';
  if (known && api.state === 'observed') {
    const expected = linkIdentities(expectedLinks(effective.entries));
    const actual = linkIdentities(api.links);
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      warnings.push(issue('api_source_difference', 'Observed API platforms, destinations or declaration counts differ from the inspected editable-platform entries. Both observations are retained.'));
      status = 'limited';
    }
  }
  let candidate = null;
  let changes = [];
  let diff = null;
  if (mapping !== undefined) {
    if (!known) {
      status = 'blocked';
      warnings.push(issue('candidate_blocked', 'A candidate would risk replacing unknown effective funding links.'));
    } else {
      const draft = draftFunding(selected?.text ?? '', mapping);
      ({ candidate, changes, diff } = draft);
      warnings.push(...draft.warnings);
      if (inspectFunding(candidate).entries.github) status = 'limited';
      if (source === 'account_default') {
        warnings.push(issue('overrides_account_default', 'Creating a repository FUNDING.yml overrides inherited account defaults; the candidate preserves their effective entries.'));
      }
      if (source !== 'repository') diff = unifiedDiff('', candidate);
    }
  }
  return {
    scope, sources, observations, effective, candidate, changes, diff,
    warnings: warnings.filter((warning, index, all) => all.findIndex(item => item.code === warning.code && item.message === warning.message) === index),
    limitations, status,
  };
}
