import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { REPOSITORY } from './releases.mjs';
import { parseVersion } from './version.mjs';

export const INSTALLATION_CONTRACT = 'itf.installation/0.1';
export const HELPER_VERSION = '0.1.0';

function git(root, args) {
  // Inspection must not borrow another repo/index/object store from the caller.
  // No network/credential operation needs inherited Git-specific overrides.
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  return execFileSync('git', ['--no-replace-objects', '--no-optional-locks', '-c', 'core.fsmonitor=false', '-C', root, ...args], {
    env, encoding: 'utf8', timeout: 10000, maxBuffer: 4 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function metadata(text) {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter || !/^name: impact-to-funding\r?$/m.test(frontmatter)) {
    throw new TypeError('Selected directory does not contain the ItF entry point');
  }
  const block = frontmatter.match(/^metadata:\r?\n((?:[ \t]+[^\n]*(?:\n|$))*)/m)?.[1];
  const value = block?.match(/^  version: ("[^\r\n]+")\r?$/m)?.[1];
  if (!value) return { declaredVersion: null, metadataState: block ? 'unrecognised-version' : 'legacy-no-version' };
  try {
    const version = JSON.parse(value);
    parseVersion(version);
    return { declaredVersion: version, metadataState: 'declared' };
  } catch {
    return { declaredVersion: null, metadataState: 'invalid-version' };
  }
}

function knownOrigin(value) {
  return /^(?:https:\/\/github\.com\/zhiganov\/impact-to-funding(?:\.git)?\/?|git@github\.com:zhiganov\/impact-to-funding(?:\.git)?)$/i.test(value);
}

function statusCounts(text) {
  let tracked = 0;
  let untracked = 0;
  let ignored = 0;
  const entries = text.split('\0').filter(Boolean);
  for (let i = 0; i < entries.length; i += 1) {
    const code = entries[i].slice(0, 2);
    if (code === '??') untracked += 1;
    else if (code === '!!') ignored += 1;
    else {
      tracked += 1;
      if (/[RC]/.test(code)) i += 1;
    }
  }
  return { tracked, untracked, ignored };
}

// Compare HEAD's actual file bytes as well as Git status: status alone can hide
// edits marked assume-unchanged/skip-worktree. Never follow tracked symlinks.
function compareTree(root, commit) {
  const entries = git(root, ['ls-tree', '-r', '-z', commit]).split('\0').filter(Boolean);
  if (entries.length > 10000) return { state: 'unknown', checkedFiles: 0 };
  let modified = false;
  let incomplete = false;
  let checkedFiles = 0;
  let totalBytes = 0;
  for (const entry of entries) {
    const match = entry.match(/^(100644|100755|120000) blob ([0-9a-f]{40})\t([\s\S]+)$/);
    if (!match) { incomplete = true; continue; }
    const [, mode, expected, relative] = match;
    const file = path.resolve(root, relative);
    if (!file.startsWith(`${root}${path.sep}`)) { incomplete = true; continue; }
    try {
      const stat = lstatSync(file);
      // An ancestor symlink can redirect even a non-symlink leaf outside the package.
      if (realpathSync(path.dirname(file)) !== path.dirname(file)) { incomplete = true; continue; }
      if (mode === '120000' ? !stat.isSymbolicLink() : !stat.isFile() || stat.isSymbolicLink()) {
        modified = true;
        continue;
      }
      totalBytes += stat.size;
      if (stat.size > 8 * 1024 * 1024 || totalBytes > 32 * 1024 * 1024) { incomplete = true; continue; }
      const bytes = mode === '120000' ? Buffer.from(readlinkSync(file)) : readFileSync(file);
      const actual = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
      checkedFiles += 1;
      if (actual !== expected) modified = true;
      if (process.platform !== 'win32' && mode !== '120000' && Boolean(stat.mode & 0o111) !== (mode === '100755')) {
        modified = true;
      }
    } catch (error) {
      if (error.code === 'ENOENT') modified = true;
      else incomplete = true;
    }
  }
  return { state: modified ? 'modified' : incomplete ? 'unknown' : 'clean', checkedFiles };
}

export function inspectInstallation(selectedPath) {
  if (typeof selectedPath !== 'string' || !selectedPath) throw new TypeError('An explicit installation directory is required');
  const selected = path.resolve(selectedPath);
  const root = realpathSync(selected);
  const entry = path.join(root, 'SKILL.md');
  if (lstatSync(entry).isSymbolicLink()) throw new TypeError('The ItF entry point cannot be a symlink');
  const entryText = readFileSync(entry, 'utf8');
  const declared = metadata(entryText);
  const report = {
    contractVersion: INSTALLATION_CONTRACT,
    helperVersion: HELPER_VERSION,
    skill: { name: 'impact-to-funding', ...declared },
    local: { selectedPath: selected, realPath: root },
    source: { kind: 'unknown', repository: null, commit: null, authenticated: false },
    files: { tracked: 'unknown', checkedFiles: 0, statusChangedEntries: null, untrackedEntries: null, ignoredEntries: null },
  };
  try {
    if (realpathSync(git(root, ['rev-parse', '--show-toplevel']).trim()) !== root) return report;
    const commit = git(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
    if (!/^[0-9a-f]{40}$/.test(commit)) return report;
    report.source = { kind: 'local-git', repository: null, commit, authenticated: false };
    try {
      if (knownOrigin(git(root, ['config', '--get', 'remote.origin.url']).trim())) report.source.repository = REPOSITORY;
    } catch { /* An absent origin does not erase the observed local Git commit. */ }
    const counts = statusCounts(git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--ignored=matching']));
    const tree = compareTree(root, commit);
    report.files = {
      tracked: counts.tracked ? 'modified' : tree.state,
      checkedFiles: tree.checkedFiles,
      statusChangedEntries: counts.tracked,
      untrackedEntries: counts.untracked,
      ignoredEntries: counts.ignored,
    };
    if (git(root, ['rev-parse', '--verify', 'HEAD^{commit}']).trim() !== commit
      || readFileSync(entry, 'utf8') !== entryText) {
      report.skill = { name: 'impact-to-funding', declaredVersion: null, metadataState: 'changed-during-inspection' };
      report.source = { kind: 'unknown', repository: null, commit: null, authenticated: false };
      report.files.tracked = 'unknown';
    }
  } catch {
    // Also covers a late failure after comparison, not only unavailable Git.
    report.files.tracked = 'unknown';
  }
  return report;
}
