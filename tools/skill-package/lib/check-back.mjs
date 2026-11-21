import { mkdirSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { owned, readJson, writeJson } from './storage.mjs';
import { assertPlainPath } from './targets.mjs';

// A person-level, local-only reminder for the three-month check-back (#134).
// It stores dates and a status, never answers, project details or identities,
// and it never contacts a network service.
const contract = 'itf.check-back/0.1';
const day = 24 * 60 * 60 * 1000;
export const CHECK_BACK_DAYS = 90;
export const LATER_DAYS = 14;
const STATUSES = new Set(['waiting', 'declined', 'done']);
const REPOSITORY = 'https://github.com/zhiganov/impact-to-funding';
const FIELD_LIMIT = 1000;

function stateDirectory(home) {
  return path.join(path.resolve(home), '.local/state/impact-to-funding-check-back');
}

function checkDirectory(directory, home) {
  assertPlainPath(directory);
  for (let cursor = directory; cursor !== path.resolve(home); cursor = path.dirname(cursor)) {
    if (!owned(cursor).isDirectory()) throw new Error('Check-back state is not an owned directory');
  }
}

export function readCheckBack({ home = homedir() } = {}) {
  const directory = stateDirectory(home);
  let value;
  try {
    checkDirectory(directory, home);
    value = readJson(path.join(directory, 'state.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  if (!value) return null;
  if (value.contractVersion !== contract || !STATUSES.has(value.status)
    || (value.status === 'waiting' && !Number.isSafeInteger(value.dueAt))) {
    throw new Error('Unknown check-back state');
  }
  return value;
}

function save(home, value) {
  const directory = stateDirectory(home);
  assertPlainPath(directory);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  checkDirectory(directory, home);
  writeJson(path.join(directory, 'state.json'), { contractVersion: contract, ...value });
}

// Status for one activation: an offer before any choice, due once the date has
// passed, and nothing otherwise. Unreadable state yields nothing.
export function checkBackStatus({ home = homedir(), now = Date.now() } = {}) {
  let state;
  try { state = readCheckBack({ home }); } catch { return { status: 'unknown' }; }
  if (!state) return { status: 'offer' };
  if (state.status === 'waiting' && now >= state.dueAt) {
    return { status: 'due', since: new Date(state.optedInAt ?? state.dueAt - CHECK_BACK_DAYS * day).toISOString().slice(0, 10) };
  }
  return { status: state.status };
}

export function formatCheckBack(result) {
  if (result.status === 'offer') return 'CHECK_BACK_OFFER: Offer once, after a finished task, to ask four short questions in about three months.';
  if (result.status === 'due') return `CHECK_BACK_DUE: The person agreed on ${result.since} to a three-month check-back. Ask the four questions.`;
  return '';
}

export function setCheckBack(action, { home = homedir(), now = Date.now() } = {}) {
  if (action === 'opt-in') {
    save(home, { status: 'waiting', optedInAt: now, dueAt: now + CHECK_BACK_DAYS * day });
    return `CHECK_BACK_SAVED: due ${new Date(now + CHECK_BACK_DAYS * day).toISOString().slice(0, 10)}`;
  }
  if (action === 'later') {
    const current = readCheckBack({ home });
    if (current?.status !== 'waiting') throw new Error('No check-back is waiting');
    save(home, { ...current, dueAt: now + LATER_DAYS * day });
    return `CHECK_BACK_SAVED: due ${new Date(now + LATER_DAYS * day).toISOString().slice(0, 10)}`;
  }
  if (action === 'decline' || action === 'done') {
    save(home, { status: action === 'decline' ? 'declined' : 'done', decidedAt: now });
    return `CHECK_BACK_SAVED: ${action === 'decline' ? 'declined' : 'done'}`;
  }
  if (action === 'forget') {
    const directory = stateDirectory(home);
    try {
      checkDirectory(directory, home);
      unlinkSync(path.join(directory, 'state.json'));
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return 'CHECK_BACK_SAVED: forgotten';
  }
  throw new TypeError('Choose opt-in, later, decline, done or forget');
}

function field(value, label) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new TypeError(`${label} must be text`);
  return value.trim().slice(0, FIELD_LIMIT);
}

// Builds a pre-filled link to the public check-back form. The person reviews
// and submits it themselves; nothing is sent from here.
export function checkBackLink(answers = {}) {
  const query = new URLSearchParams({ template: 'check-back.yml', title: 'Check-back: three months on' });
  for (const [id, key, label] of [
    ['version', 'version', 'Version'],
    ['used-again', 'usedAgain', 'Used again'],
    ['what-for', 'whatFor', 'What for'],
    ['shown', 'shown', 'Shown to anyone'],
    ['stopped', 'stopped', 'What stopped you'],
  ]) {
    const value = field(answers[key], label);
    if (value) query.set(id, value);
  }
  return `${REPOSITORY}/issues/new?${query}`;
}
