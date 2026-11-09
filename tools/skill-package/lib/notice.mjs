import { createHash, randomUUID } from 'node:crypto';
import { closeSync, linkSync, mkdirSync, openSync, readdirSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { githubCatalogue } from './github.mjs';
import { createManager, verifyManagedCopy } from './manager.mjs';
import { selectRelease } from './releases.mjs';
import { currentReceipt, owned, readJson, writeJson } from './storage.mjs';
import { assertPlainPath, targetPaths } from './targets.mjs';
import { compareVersions } from './version.mjs';

const contract = 'itf.update-notice/0.1';
const day = 24 * 60 * 60 * 1000;
const attemptInterval = day;

function stateFor(target, home) {
  const key = createHash('sha256').update(target).digest('hex');
  return path.join(home, '.local/state/impact-to-funding-notices', key);
}

function preference(paths, installationId) {
  assertPlainPath(paths.noticeState);
  for (let directory = paths.noticeState; directory !== paths.home; directory = path.dirname(directory)) {
    if (!owned(directory).isDirectory()) throw new Error('Invalid or unowned notice state');
  }
  const value = readJson(path.join(paths.noticeState, 'preference.json'));
  if (!value) return null;
  if (value.contractVersion !== contract || value.target !== paths.target || typeof value.enabled !== 'boolean'
    || typeof value.installationId !== 'string') {
    throw new Error('Unknown notice preference');
  }
  return value.installationId === installationId ? value.enabled : null;
}

function readPreference(paths, installationId) {
  try { return preference(paths, installationId); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function ensureNoticeState(paths) {
  assertPlainPath(paths.noticeState);
  mkdirSync(paths.noticeState, { recursive: true, mode: 0o700 });
  assertPlainPath(paths.noticeState);
  for (let directory = paths.noticeState; directory !== paths.home; directory = path.dirname(directory)) {
    if (!owned(directory).isDirectory()) throw new Error('Notice state is not an owned directory');
  }
}

function acquireNoticeLock(paths) {
  const lockFile = path.join(paths.noticeState, 'check.lock');
  const token = randomUUID();
  const claim = (file, id) => {
    const temporary = `${file}.${id}.tmp`;
    const descriptor = openSync(temporary, 'wx', 0o600);
    try {
      try { writeFileSync(descriptor, `${JSON.stringify({ token: id, pid: process.pid })}\n`); }
      finally { closeSync(descriptor); }
      linkSync(temporary, file);
    } finally { unlinkSync(temporary); }
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      claim(lockFile, token);
      return () => { if (readJson(lockFile)?.token === token) unlinkSync(lockFile); };
    } catch (error) {
      if (error.code !== 'EEXIST' || attempt) throw error;
      // Unique, atomically complete recovery claims avoid a permanent secondary
      // lock. Concurrent recoverers detect one another and fail closed. Dead
      // claims are ignored, not removed or mistaken for permission to unlink.
      const recoveryFile = `${lockFile}.recovery.${token}`;
      claim(recoveryFile, token);
      try {
        const recoveries = readdirSync(paths.noticeState).filter((name) => name.startsWith('check.lock.recovery.') && !name.endsWith('.tmp'));
        if (recoveries.length > 1000) return null;
        for (const name of recoveries) {
          const other = readJson(path.join(paths.noticeState, name));
          if (!other || !Number.isSafeInteger(other.pid) || other.pid <= 0 || typeof other.token !== 'string') return null;
          if (other.token === token) continue;
          try { process.kill(other.pid, 0); return null; }
          catch (failure) { if (failure.code !== 'ESRCH') return null; }
        }
        const previous = readJson(lockFile);
        if (!previous || !Number.isSafeInteger(previous.pid) || previous.pid <= 0 || typeof previous.token !== 'string') return null;
        try { process.kill(previous.pid, 0); return null; }
        catch (failure) {
          if (failure.code !== 'ESRCH' || readJson(lockFile)?.token !== previous.token) return null;
          unlinkSync(lockFile);
        }
      } finally {
        if (readJson(recoveryFile)?.token === token) unlinkSync(recoveryFile);
      }
    }
  }
  return null;
}

// This maps only an explicitly selected directory to its own #55 receipt. It
// cannot prove which bytes a host already loaded into an existing conversation.
function selectedInstallation(selected, home = homedir(), project = process.cwd(), { verify = true } = {}) {
  const target = path.resolve(selected);
  const homeRoot = realpathSync(path.resolve(home));
  assertPlainPath(target);
  if (realpathSync(target) !== target) throw new Error('Linked installation');
  const key = createHash('sha256').update(target).digest('hex');
  const state = path.join(homeRoot, '.local/state/impact-to-funding', key);
  assertPlainPath(state);
  for (let directory = state; directory !== homeRoot; directory = path.dirname(directory)) {
    if (!owned(directory).isDirectory()) throw new Error('Invalid or unowned manager state');
  }
  const raw = readJson(path.join(state, 'receipt.json'));
  if (!raw || raw.target !== target) throw new Error('No receipt for this selected copy');
  const base = { state, target, harness: raw.harness, scope: raw.scope };
  const receipt = currentReceipt(base);
  if (!receipt) throw new Error('No managed receipt');
  const selectedProject = receipt.scope === 'project' ? path.dirname(path.dirname(path.dirname(target))) : project;
  let configHome;
  if (receipt.harness === 'opencode' && receipt.scope === 'personal') {
    configHome = path.dirname(path.dirname(path.dirname(target)));
  }
  const paths = targetPaths({ harness: receipt.harness, scope: receipt.scope,
    project: selectedProject, home: homeRoot, configHome });
  if (paths.target !== target || paths.state !== state) throw new Error('Receipt does not identify the selected copy');
  if (verify) verifyManagedCopy(paths, receipt);
  paths.noticeState = stateFor(target, homeRoot);
  return { paths, receipt, options: { harness: paths.harness, scope: paths.scope,
    project: paths.project, home: paths.home, configHome: paths.config } };
}

export function configureNotice({ harness, scope, project, home, configHome, selected, enabled, apply = false }) {
  if (enabled !== null && typeof enabled !== 'boolean') throw new TypeError('Choose enable or disable');
  if (enabled === null && apply) throw new TypeError('Status is read-only');
  if (selected && (harness || scope || project || configHome)) throw new TypeError('Choose an explicit loaded root or a harness/scope, not both');
  const paths = selected ? selectedInstallation(selected, home, process.cwd(), { verify: false }).paths
    : targetPaths({ harness, scope, project, home, configHome });
  paths.noticeState = stateFor(paths.target, paths.home);
  assertPlainPath(paths.state);
  const receipt = currentReceipt(paths);
  if (!receipt) throw new Error('Select a managed installation before configuring notices');
  for (let directory = paths.state; directory !== paths.home; directory = path.dirname(directory)) {
    if (!owned(directory).isDirectory()) throw new Error('Invalid or unowned manager state');
  }
  if (enabled) verifyManagedCopy(paths, receipt);
  const helperBundled = receipt.files.some((file) => file.path === 'tools/skill-package/notice-entry.mjs');
  const installationId = receipt.installationId ?? receipt.generation;
  const previous = readPreference(paths, installationId);
  const currentlyEnabled = previous === true;
  const result = { target: paths.target, scope: paths.scope, harness: paths.harness,
    configured: previous !== null, currentlyEnabled, requestedEnabled: enabled, helperBundled, applied: false,
    disclosure: 'When enabled, the loaded skill may check public GitHub release metadata. GitHub sees normal network metadata, including your IP; no prompt, evidence or local path is sent. The agent follows host permissions and never updates automatically.' };
  if (!apply || enabled === null) return result;
  if (enabled && !helperBundled) throw new Error('This installed skill predates in-skill notices; update that copy first');
  ensureNoticeState(paths);
  const unlock = acquireNoticeLock(paths);
  if (!unlock) throw new Error('A notice check is in progress; retry the preference change later');
  try {
    const current = currentReceipt(paths);
    if (!current || (current.installationId ?? current.generation) !== installationId) throw new Error('Selected installation changed; preview again');
    if (readPreference(paths, installationId) === enabled) return result;
    writeJson(path.join(paths.noticeState, 'preference.json'), { contractVersion: contract,
      target: paths.target, installationId, enabled });
    return { ...result, applied: true };
  } finally { unlock(); }
}

function fresh(timestamp, now, interval) {
  return Number.isFinite(timestamp) && timestamp >= 0 && now >= timestamp && now - timestamp < interval;
}

function validCache(cache) {
  return cache?.contractVersion === contract && Number.isFinite(cache.attemptedAt)
    && typeof cache.installationId === 'string'
    && ['complete', 'unknown'].includes(cache.state)
    && (cache.state !== 'complete' || Array.isArray(cache.records))
    && cache.reminders && typeof cache.reminders === 'object' && !Array.isArray(cache.reminders);
}

function boundedCatalogue() {
  const deadline = AbortSignal.timeout(2500);
  return githubCatalogue({ request: (url, options) => fetch(url, {
    ...options, signal: AbortSignal.any([deadline, options.signal]),
  }) });
}

export async function checkNotice(selected, {
  home = homedir(), project = process.cwd(), now = Date.now(), catalogue = boundedCatalogue,
  managerFactory = createManager, disabled = false, networkAllowed = false,
} = {}) {
  // Any inspection, network, cache or policy failure is an unknown outcome,
  // never an assertion that the copy is current and never an update action.
  let unlock;
  try {
    if (disabled || process.env.ITF_UPDATE_NOTICES === 'off') return { status: 'disabled' };
    const { paths, receipt, options } = selectedInstallation(selected, home, project);
    if (!receipt.files.some((file) => file.path === 'tools/skill-package/notice-entry.mjs')) return { status: 'unknown' };
    const installationId = receipt.installationId ?? receipt.generation;
    const initial = readPreference(paths, installationId);
    if (initial === null) return { status: 'offer' };
    if (!initial) return { status: 'disabled' };
    if (!Number.isFinite(now) || now < 0) return { status: 'unknown' };
    unlock = acquireNoticeLock(paths);
    if (!unlock) return { status: 'busy' };
    if (!readPreference(paths, installationId)) return { status: 'disabled' };
    const cacheFile = path.join(paths.noticeState, 'cache.json');
    let cache = readJson(cacheFile);
    if (cache && !validCache(cache)) return { status: 'unknown' };
    if (cache?.installationId !== installationId) cache = null;
    if (!cache || !fresh(cache.attemptedAt, now, day)) {
      if (!networkAllowed) return { status: 'unknown' };
      const reminders = cache?.reminders ?? {};
      // Persist an unknown attempt before networking; interruption, unwritable
      // state and failures must not cause repeated uncached outbound requests.
      cache = { contractVersion: contract, installationId, attemptedAt: now, state: 'unknown', reminders };
      writeJson(cacheFile, cache);
      let response;
      try { response = await catalogue(); } catch { response = null; }
      cache = response?.complete === true && Array.isArray(response.records)
        ? { contractVersion: contract, installationId, attemptedAt: now, state: 'complete', records: response.records, reminders }
        : { contractVersion: contract, installationId, attemptedAt: now, state: 'unknown', reminders };
      // Without durable state we suppress notices rather than repeatedly nag.
      writeJson(cacheFile, cache);
    }
    if (cache.state !== 'complete') return { status: 'unknown' };
    const records = cache.records;
    const selectedPin = receipt.policy.pin ?? receipt.sourceCommit;
    const currentRelease = selectRelease(records, { channel: receipt.policy.channel, complete: true, pin: selectedPin });
    // A locked release tag must still resolve to its saved commit. A plain
    // development/commit pin may not be represented in the release catalogue;
    // that is not proof it is older or newer than an available release.
    if (!currentRelease.selected && typeof selectedPin === 'object') return { status: 'unknown' };
    if (currentRelease.selected && (currentRelease.selected.sourceCommit !== receipt.sourceCommit
      || (receipt.versionSource === 'release' && currentRelease.selected.version !== receipt.version))) return { status: 'unknown' };
    const manager = managerFactory({ catalogue: async () => ({ records, complete: true }) });
    const result = await manager.run('check', { ...options, followChannel: true, allowDowngrade: true });
    if (result.target !== paths.target || result.current?.sourceCommit !== receipt.sourceCommit
      || !result.targetSource?.version || JSON.stringify(currentReceipt(paths)) !== JSON.stringify(receipt)) return { status: 'unknown' };
    if (result.targetSource.sourceCommit === receipt.sourceCommit) return { status: 'no-newer-release' };
    if (currentRelease.selected && compareVersions(result.targetSource.version, currentRelease.selected.version) <= 0) {
      return { status: 'no-newer-release' };
    }
    const tag = result.targetSource.tag;
    if (typeof tag !== 'string' || !/^v[0-9A-Za-z.+-]+$/.test(tag)) return { status: 'unknown' };
    if (fresh(cache.reminders[tag], now, attemptInterval)) return { status: 'suppressed' };
    // An offline/read-only invocation must not change reminder state or emit
    // an unthrottled notice when no durable attempt can be recorded.
    if (!networkAllowed) return { status: 'unknown' };
    if (!readPreference(paths, installationId) || JSON.stringify(currentReceipt(paths)) !== JSON.stringify(receipt)) return { status: 'unknown' };
    cache.reminders[tag] = now;
    writeJson(cacheFile, cache);
    return { status: currentRelease.selected ? 'available' : 'release-available',
      installed: currentRelease.selected?.version ?? null, available: result.targetSource.version,
      channel: receipt.policy.channel, tag,
      releaseUrl: `https://github.com/zhiganov/impact-to-funding/releases/tag/${tag}` };
  } catch {
    return { status: 'unknown' };
  } finally {
    try { unlock?.(); } catch { /* The next check can recover a provably stopped owner. */ }
  }
}

export function formatNotice(result) {
  if (result.status === 'offer') {
    return 'NOTICE_OFFER: Optional ItF update notices are off until enabled. A version-only GitHub check would expose your IP to GitHub, not your prompts or local files. You can ask to enable them for this copy.';
  }
  if (result.status === 'release-available') {
    return `RELEASE_AVAILABLE: ItF release ${result.available} (${result.channel}) is available, but this installed source's freshness is unknown. ${result.releaseUrl} Your copy has not changed; review the release before deciding whether to update.`;
  }
  if (result.status !== 'available') return '';
  return `UPDATE_AVAILABLE: ItF ${result.installed} → ${result.available} (${result.channel}). ${result.releaseUrl} Your installed copy has not changed. To update later, see https://github.com/zhiganov/impact-to-funding/blob/main/docs/managed-skill-updates.md.`;
}
