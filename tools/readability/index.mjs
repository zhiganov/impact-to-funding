// Local readability checks for English prose. Simple rules, no network.

export const LONG_SENTENCE_WORDS = 20;
export const VERY_LONG_SENTENCE_WORDS = 30;

const ADVERB_EXCEPTIONS = new Set([
  'only', 'early', 'family', 'reply', 'apply', 'supply', 'july', 'italy', 'ugly',
  'holy', 'daily', 'weekly', 'monthly', 'yearly', 'quarterly', 'likely', 'unlikely',
  'friendly', 'lonely', 'lovely', 'elderly', 'costly', 'timely', 'orderly', 'silly',
  'belly', 'jelly', 'rally', 'ally', 'tally', 'bully', 'fly', 'rely', 'imply',
  'multiply', 'comply', 'assembly', 'anomaly', 'butterfly', 'monopoly',
  'curly', 'hourly', 'nightly', 'scholarly', 'kindly', 'deadly', 'lively',
  'manly', 'motherly', 'fatherly', 'sly', 'wily', 'oily', 'hilly', 'chilly',
]);

const IRREGULAR_PARTICIPLES = new Set([
  'been', 'begun', 'broken', 'brought', 'built', 'bought', 'caught', 'chosen', 'done',
  'drawn', 'driven', 'eaten', 'fallen', 'felt', 'found', 'forgotten', 'given', 'gone',
  'grown', 'heard', 'held', 'hidden', 'kept', 'known', 'laid', 'led', 'left', 'lent',
  'lost', 'made', 'meant', 'met', 'paid', 'put', 'read', 'run', 'said', 'seen', 'sent',
  'set', 'shown', 'shut', 'sold', 'spent', 'spoken', 'stolen', 'taken', 'taught',
  'thought', 'told', 'understood', 'won', 'worn', 'written', 'cut', 'hit', 'hurt',
]);

const BE_FORMS = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);

// Words that end in -ed but usually work as adjectives after "be".
const ED_ADJECTIVES = new Set([
  'interested', 'excited', 'tired', 'bored', 'married', 'qualified', 'concerned',
  'involved', 'supposed', 'used', 'based', 'related', 'limited', 'needed', 'red',
  'bed', 'shed', 'sped', 'fed', 'wed', 'bled', 'fled', 'led', 'need', 'feed', 'seed',
]);

function words(text) {
  return text.match(/[A-Za-z0-9]+(?:['’][A-Za-z]+)*/g) ?? [];
}

function letters(text) {
  return (text.match(/[A-Za-z0-9]/g) ?? []).length;
}

/** Automated Readability Index: an approximate US school grade. */
export function gradeLevel(characterCount, wordCount, sentenceCount) {
  if (wordCount === 0 || sentenceCount === 0) return 0;
  const grade = 4.71 * (characterCount / wordCount) + 0.5 * (wordCount / sentenceCount) - 21.43;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/** Split one block of prose into sentences. */
export function splitSentences(block) {
  return block
    .replace(/\b(e\.g|i\.e|etc|vs|Dr|Mr|Mrs|Ms|St|No)\./g, '$1\u0000')
    .split(/(?<=[.!?])\s+(?=["'“‘(]?[A-Z0-9])/)
    .map((sentence) => sentence.replace(/\u0000/g, '.').trim())
    .filter((sentence) => words(sentence).length > 0);
}

export function findPassive(sentence) {
  const tokens = words(sentence).map((word) => word.toLowerCase());
  const found = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    if (!BE_FORMS.has(tokens[i])) continue;
    let j = i + 1;
    if (tokens[j]?.endsWith('ly') && tokens[j + 1]) j += 1;
    if (tokens[j] === 'not' && tokens[j + 1]) j += 1;
    const candidate = tokens[j];
    const regular = /^[a-z]{3,}ed$/.test(candidate) && !ED_ADJECTIVES.has(candidate);
    if (regular || IRREGULAR_PARTICIPLES.has(candidate)) found.push(`${tokens[i]} ${tokens.slice(i + 1, j + 1).join(' ')}`);
  }
  return found;
}

export function findAdverbs(sentence) {
  return words(sentence).filter((word) => {
    const lower = word.toLowerCase();
    return lower.length > 4 && lower.endsWith('ly') && !ADVERB_EXCEPTIONS.has(lower);
  });
}

/** Turn Markdown into prose blocks with their starting line numbers. */
export function markdownBlocks(markdown) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let current = null;
  let fenced = false;
  const flush = () => {
    if (current && current.text.trim()) blocks.push(current);
    current = null;
  };
  lines.forEach((raw, index) => {
    const line = index + 1;
    if (index === 0 && raw === '---') {
      const end = lines.indexOf('---', 1);
      if (end > 0) {
        for (let skip = 1; skip <= end; skip += 1) lines[skip] = '';
        return;
      }
    }
    if (/^\s*(```|~~~)/.test(raw)) {
      flush();
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    const trimmed = raw.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed) || /^\|/.test(trimmed) || /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)
      || /^<!--/.test(trimmed)) {
      flush();
      return;
    }
    const listItem = /^([-*+]|\d+[.)])\s+/.test(trimmed);
    if (listItem) flush();
    const text = trimmed
      .replace(/^>\s?/, '')
      .replace(/^([-*+]|\d+[.)])\s+/, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/`[^`]*`/g, 'code')
      .replace(/<[^>]+>/g, '')
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
    if (!current) current = { line, text, starts: [{ offset: 0, line }] };
    else {
      current.starts.push({ offset: current.text.length + 1, line });
      current.text += ` ${text}`;
    }
    if (listItem) flush();
  });
  flush();
  return blocks;
}

/** Collect prose strings from a JSON value, labelled by their JSON path. */
export function jsonBlocks(value, pathLabel = '$') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (words(trimmed).length >= 4 && !/^[a-z][a-z0-9+.-]*:\S+$/i.test(trimmed)) return [{ path: pathLabel, text: trimmed }];
    return [];
  }
  if (Array.isArray(value)) return value.flatMap((item, index) => jsonBlocks(item, `${pathLabel}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => jsonBlocks(item, `${pathLabel}.${key}`));
  }
  return [];
}

/** The source line where a character offset in a Markdown block falls. */
function lineAt(block, offset) {
  let { line } = block;
  for (const start of block.starts ?? []) {
    if (start.offset > offset) break;
    ({ line } = start);
  }
  return line;
}

/** Analyse prose blocks. Each block has `text` and either `line` or `path`. */
export function analyse(blocks) {
  const sentences = [];
  for (const block of blocks) {
    let cursor = 0;
    for (const text of splitSentences(block.text)) {
      const offset = Math.max(block.text.indexOf(text, cursor), cursor);
      cursor = offset + text.length;
      const count = words(text).length;
      sentences.push({
        location: block.path ?? `line ${lineAt(block, offset)}`,
        text,
        words: count,
        length: count >= VERY_LONG_SENTENCE_WORDS ? 'very long' : count >= LONG_SENTENCE_WORDS ? 'long' : 'ok',
        passive: findPassive(text),
        adverbs: findAdverbs(text),
      });
    }
  }
  const wordCount = sentences.reduce((sum, sentence) => sum + sentence.words, 0);
  const characterCount = sentences.reduce((sum, sentence) => sum + letters(sentence.text), 0);
  return {
    sentences: sentences.length,
    words: wordCount,
    averageSentenceWords: sentences.length ? Math.round((wordCount / sentences.length) * 10) / 10 : 0,
    grade: gradeLevel(characterCount, wordCount, sentences.length),
    long: sentences.filter((sentence) => sentence.length === 'long').length,
    veryLong: sentences.filter((sentence) => sentence.length === 'very long').length,
    passive: sentences.reduce((sum, sentence) => sum + sentence.passive.length, 0),
    adverbs: sentences.reduce((sum, sentence) => sum + sentence.adverbs.length, 0),
    flagged: sentences.filter((sentence) => sentence.length !== 'ok' || sentence.passive.length || sentence.adverbs.length),
  };
}

export function analyseMarkdown(markdown) {
  return analyse(markdownBlocks(markdown));
}

export function analyseJson(text) {
  return analyse(jsonBlocks(JSON.parse(text)));
}
