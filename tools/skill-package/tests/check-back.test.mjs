import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  CHECK_BACK_DAYS, LATER_DAYS, checkBackLink, checkBackStatus, formatCheckBack, readCheckBack, setCheckBack,
} from '../lib/check-back.mjs';

const day = 24 * 60 * 60 * 1000;
const start = Date.UTC(2026, 10, 21);
const entry = fileURLToPath(new URL('../check-back-entry.mjs', import.meta.url));

function home(t) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), 'itf-check-back-')));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

test('offers once before any choice, then waits ninety days before asking', (t) => {
  const h = home(t);
  assert.equal(checkBackStatus({ home: h, now: start }).status, 'offer');
  assert.match(setCheckBack('opt-in', { home: h, now: start }), /^CHECK_BACK_SAVED: due 2027-02-19$/);
  assert.equal(checkBackStatus({ home: h, now: start + (CHECK_BACK_DAYS - 1) * day }).status, 'waiting');
  const due = checkBackStatus({ home: h, now: start + CHECK_BACK_DAYS * day });
  assert.deepEqual(due, { status: 'due', since: '2026-11-21' });
  assert.match(formatCheckBack(due), /^CHECK_BACK_DUE: The person agreed on 2026-11-21/);
});

test('stored state holds only dates and a status', (t) => {
  const h = home(t);
  setCheckBack('opt-in', { home: h, now: start });
  const file = path.join(h, '.local/state/impact-to-funding-check-back/state.json');
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(file, 'utf8'))).sort(), ['contractVersion', 'dueAt', 'optedInAt', 'status']);
});

test('later postpones a due check-back by two weeks, keeping the original date', (t) => {
  const h = home(t);
  setCheckBack('opt-in', { home: h, now: start });
  const due = start + CHECK_BACK_DAYS * day;
  setCheckBack('later', { home: h, now: due });
  assert.equal(checkBackStatus({ home: h, now: due + (LATER_DAYS - 1) * day }).status, 'waiting');
  assert.deepEqual(checkBackStatus({ home: h, now: due + LATER_DAYS * day }), { status: 'due', since: '2026-11-21' });
  assert.throws(() => setCheckBack('later', { home: home(t), now: due }), /No check-back is waiting/);
});

test('decline and done stop all prompts; forget starts again', (t) => {
  const h = home(t);
  for (const action of ['decline', 'done']) {
    setCheckBack(action, { home: h, now: start });
    const result = checkBackStatus({ home: h, now: start + 400 * day });
    assert.equal(formatCheckBack(result), '');
  }
  setCheckBack('forget', { home: h });
  assert.equal(readCheckBack({ home: h }), null);
  assert.equal(checkBackStatus({ home: h }).status, 'offer');
  assert.equal(setCheckBack('forget', { home: h }), 'CHECK_BACK_SAVED: forgotten');
  assert.throws(() => setCheckBack('enable', { home: h }), /Choose opt-in/);
});

test('linked, unknown or malformed state produces no prompt', (t) => {
  const h = home(t);
  const elsewhere = path.join(h, 'elsewhere');
  mkdirSync(elsewhere);
  mkdirSync(path.join(h, '.local/state'), { recursive: true });
  symlinkSync(elsewhere, path.join(h, '.local/state/impact-to-funding-check-back'));
  assert.equal(formatCheckBack(checkBackStatus({ home: h })), '');
  assert.throws(() => setCheckBack('opt-in', { home: h }), /symlinked/);

  const other = home(t);
  const directory = path.join(other, '.local/state/impact-to-funding-check-back');
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'state.json'), '{"contractVersion":"itf.check-back/9","status":"waiting","dueAt":1}\n');
  assert.equal(formatCheckBack(checkBackStatus({ home: other })), '');
  writeFileSync(path.join(directory, 'state.json'), 'not json');
  assert.equal(formatCheckBack(checkBackStatus({ home: other })), '');
});

test('the link pre-fills the public check-back form and bounds each answer', () => {
  const url = new URL(checkBackLink({
    version: 'v0.6.0, Claude Code', usedAgain: 'Yes, a second support brief', whatFor: 'A grant draft',
    shown: 'Helped one colleague set it up', stopped: 'x'.repeat(5000),
  }));
  assert.equal(url.origin + url.pathname, 'https://github.com/zhiganov/impact-to-funding/issues/new');
  assert.equal(url.searchParams.get('template'), 'check-back.yml');
  assert.equal(url.searchParams.get('used-again'), 'Yes, a second support brief');
  assert.equal(url.searchParams.get('shown'), 'Helped one colleague set it up');
  assert.equal(url.searchParams.get('stopped').length, 1000);
  assert.equal(new URL(checkBackLink({})).searchParams.has('what-for'), false);
  assert.throws(() => checkBackLink({ whatFor: 42 }), /must be text/);
});

test('the form defines every field the link fills', () => {
  const form = readFileSync(fileURLToPath(new URL('../../../.github/ISSUE_TEMPLATE/check-back.yml', import.meta.url)), 'utf8');
  for (const id of ['version', 'used-again', 'what-for', 'shown', 'stopped']) assert.match(form, new RegExp(`id: ${id}\\n`), id);
  assert.match(form, /\*\*This issue is public\.\*\*/);
});

test('the entry reports through its own output contract and stays silent on failure', (t) => {
  const h = home(t);
  const run = (args, input = '') => spawnSync(process.execPath, [entry, ...args], {
    env: { ...process.env, HOME: h }, input, encoding: 'utf8', timeout: 10000,
  });
  assert.match(run([]).stdout, /^CHECK_BACK_OFFER: /);
  assert.match(run(['opt-in']).stdout, /^CHECK_BACK_SAVED: due \d{4}-\d{2}-\d{2}\n$/);
  assert.equal(run([]).stdout, '');
  assert.match(run(['link'], '{"usedAgain":"No"}').stdout, /^CHECK_BACK_LINK: https:\/\/github\.com\/zhiganov\/impact-to-funding\/issues\/new\?template=check-back\.yml&/);
  const bad = run(['link'], '{');
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /^CHECK_BACK_ERROR: /);
  rmSync(path.join(h, '.local'), { recursive: true });
  mkdirSync(path.join(h, '.local'));
  writeFileSync(path.join(h, '.local/state'), 'not a directory');
  const silent = run([]);
  assert.equal(silent.stdout, '');
  assert.equal(silent.status, 0);
});
