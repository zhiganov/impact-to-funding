import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync,
  readdirSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { assertPlainPath } from './targets.mjs';
import { parseVersion } from './version.mjs';

export const RECEIPT_CONTRACT = 'itf.managed-installation/0.1';
export const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

export function owned(value) {
  const stat = lstatSync(value);
  if (stat.isSymbolicLink() || (process.getuid && stat.uid !== process.getuid())) {
    throw new Error('Refusing a linked or differently owned path');
  }
  return stat;
}

export function inventory(root, allowedPaths = null) {
  const result = [];
  let total = 0;
  function walk(directory, prefix = '') {
    for (const item of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = prefix ? `${prefix}/${item.name}` : item.name;
      const file = path.join(directory, item.name);
      if (!prefix && item.name === '.git') {
        if (!item.isDirectory() || item.isSymbolicLink()) throw new Error('Linked/submodule Git metadata is not managed');
        continue;
      }
      if (item.isSymbolicLink()) throw new Error('Linked package files are not managed');
      if (item.isDirectory()) { walk(file, relative); continue; }
      if (!item.isFile()) throw new Error('Unsupported package entry');
      if (allowedPaths && !allowedPaths.has(relative)) {
        const error = new Error('Unexpected package file');
        error.code = 'ITF_UNEXPECTED_FILE';
        throw error;
      }
      const stat = lstatSync(file);
      total += stat.size;
      if (stat.size > 8 * 1024 * 1024 || total > 32 * 1024 * 1024 || result.length >= 10000) {
        throw new Error('Package exceeds inspection limits');
      }
      result.push({ path: relative, mode: stat.mode & 0o111 ? '100755' : '100644',
        sha256: createHash('sha256').update(readFileSync(file)).digest('hex') });
    }
  }
  walk(root);
  return result;
}

export function validateFiles(files) {
  if (!Array.isArray(files) || files.length < 1 || files.length > 10000) throw new Error('Invalid package inventory');
  const paths = new Set();
  for (const file of files) {
    if (typeof file.path !== 'string' || /[\\:\x00-\x1f]/.test(file.path)
      || file.path.split('/').some((part) => !part || ['.', '..', '.git'].includes(part))
      || !['100644', '100755'].includes(file.mode) || !/^[a-f0-9]{64}$/.test(file.sha256)
      || paths.has(file.path)) throw new Error('Invalid package inventory entry');
    paths.add(file.path);
  }
  return files;
}

export function matchesInventory(root, expected) {
  validateFiles(expected);
  try {
    // Never open unrecognised extra files merely to decide whether a managed
    // installation has changed: they may contain private user material.
    return JSON.stringify(inventory(root, new Set(expected.map((file) => file.path)))) === JSON.stringify(expected);
  } catch (error) {
    if (error.code === 'ITF_UNEXPECTED_FILE') return false;
    throw error;
  }
}

export function readJson(file) {
  let stat;
  try { stat = owned(file); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new Error('Invalid manager metadata file');
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function writeJson(file, value) {
  assertPlainPath(path.dirname(file));
  const temporary = `${file}.${randomUUID()}.tmp`;
  const descriptor = openSync(temporary, 'wx', 0o600);
  try {
    writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`);
    fsyncSync(descriptor);
  } finally { closeSync(descriptor); }
  renameSync(temporary, file);
}

export function validateReceipt(receipt, paths) {
  if (!receipt || receipt.contractVersion !== RECEIPT_CONTRACT
    || receipt.repository !== 'zhiganov/impact-to-funding'
    || receipt.target !== paths.target || receipt.harness !== paths.harness || receipt.scope !== paths.scope
    || !uuidPattern.test(receipt.generation) || !/^[a-f0-9]{40}$/.test(receipt.sourceCommit)
    || !['git', 'manual'].includes(receipt.kind) || !['release', 'declared', 'unknown'].includes(receipt.versionSource)
    || !['stable', 'prerelease'].includes(receipt.policy?.channel)
    || (receipt.installationId !== undefined && !uuidPattern.test(receipt.installationId))
    || (receipt.previous !== null && !uuidPattern.test(receipt.previous))) throw new Error('Unrecognised managed receipt');
  validateFiles(receipt.files);
  if (receipt.version !== null) parseVersion(receipt.version);
  if ((receipt.versionSource === 'unknown') !== (receipt.version === null)
    || !Object.hasOwn(receipt.policy, 'pin')) throw new Error('Missing version or pin policy');
  const pin = receipt.policy.pin;
  if (pin !== null) {
    if (typeof pin === 'string') {
      if (!/^[a-f0-9]{40}$/.test(pin) || pin !== receipt.sourceCommit) throw new Error('Invalid stored commit pin');
    } else {
      if (!pin || typeof pin.tag !== 'string' || !pin.tag.startsWith('v')
        || pin.sourceCommit !== receipt.sourceCommit) throw new Error('Invalid locked tag pin');
      parseVersion(pin.tag.slice(1));
      if (receipt.versionSource === 'release' && pin.tag !== `v${receipt.version}`) throw new Error('Pin/version mismatch');
    }
  }
  return receipt;
}

export function stateDirectory(paths, relative, create = false) {
  const directory = path.resolve(paths.state, relative);
  if (!directory.startsWith(`${paths.state}${path.sep}`)) throw new Error('Outside-state directory');
  function verify() {
    assertPlainPath(directory);
    for (let cursor = directory; ; cursor = path.dirname(cursor)) {
      if (existsSync(cursor)) {
        if (!owned(cursor).isDirectory()) throw new Error('Manager state ancestor is not a directory');
      }
      if (cursor === paths.state) break;
    }
  }
  verify();
  if (create) { mkdirSync(directory, { recursive: true, mode: 0o700 }); verify(); }
  return directory;
}

export function currentReceipt(paths) {
  const receipt = readJson(path.join(paths.state, 'receipt.json'));
  return receipt ? validateReceipt(receipt, paths) : null;
}

export function initialiseState(paths) {
  assertPlainPath(paths.state);
  mkdirSync(path.dirname(paths.state), { recursive: true, mode: 0o700 });
  const parent = path.dirname(paths.state);
  owned(parent);
  if (!existsSync(paths.state)) mkdirSync(paths.state, { mode: 0o700 });
  owned(paths.state);
  const marker = path.join(paths.state, 'owner.json');
  if (!existsSync(marker)) {
    if (readdirSync(paths.state).length) throw new Error('Unknown existing manager state; preserve it before proceeding');
    writeJson(marker, { contractVersion: 'itf.manager-state/0.1', target: paths.target });
  }
  const value = readJson(marker);
  if (value.contractVersion !== 'itf.manager-state/0.1' || value.target !== paths.target) throw new Error('Manager state belongs to a different target');
}

export function acquireLock(paths) {
  initialiseState(paths);
  const file = path.join(paths.state, 'lock.json');
  const token = randomUUID();
  const descriptor = openSync(file, 'wx', 0o600);
  try { writeFileSync(descriptor, `${JSON.stringify({ token, pid: process.pid })}\n`); }
  finally { closeSync(descriptor); }
  return () => {
    if (readJson(file)?.token !== token) throw new Error('Manager lock ownership changed; leave it untouched');
    unlinkSync(file);
  };
}

export function clearStoppedLock(paths) {
  const file = path.join(paths.state, 'lock.json');
  const lock = readJson(file);
  if (!lock) return false;
  if (!uuidPattern.test(lock.token) || !Number.isSafeInteger(lock.pid) || lock.pid <= 0) throw new Error('Unknown lock owner');
  try { process.kill(lock.pid, 0); }
  catch (error) {
    if (error.code === 'ESRCH') { unlinkSync(file); return true; }
    throw new Error('Cannot establish that the lock owner has stopped');
  }
  throw new Error('An operation may still be running; do not remove its lock');
}
