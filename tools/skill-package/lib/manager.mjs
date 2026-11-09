import { randomUUID } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { githubCatalogue } from './github.mjs';
import { prepareFromGitHub } from './git.mjs';
import { HELPER_VERSION, inspectInstallation } from './installation.mjs';
import { selectRelease } from './releases.mjs';
import { compareVersions, parseVersion } from './version.mjs';
import { assertPlainPath, discoverCopies, targetPaths } from './targets.mjs';
import {
  RECEIPT_CONTRACT, acquireLock, clearStoppedLock, currentReceipt, inventory,
  initialiseState, matchesInventory, owned, readJson, stateDirectory, uuidPattern, validateReceipt, writeJson,
} from './storage.mjs';

const repository = 'zhiganov/impact-to-funding';
const pendingFile = (paths) => path.join(paths.state, 'pending.json');
const receiptFile = (paths) => path.join(paths.state, 'receipt.json');
const staging = (paths, id) => path.join(paths.state, 'staging', id);
const backup = (paths, id) => path.join(paths.state, 'backups', id);

// A Git for Windows clone made with the default core.autocrlf=true has CRLF text files, so its
// byte inventory never matches the LF source and adoption refuses. Integrity hashes stay byte-exact
// on purpose; this only points the user at the documented LF re-checkout instead of a bare refusal.
function crlfHint(target) {
  try {
    if (!readFileSync(path.join(target, 'SKILL.md')).includes('\r\n')) return '';
  } catch { return ''; }
  return '. Its files use Windows (CRLF) line endings; re-check it out with LF endings first:'
    + ' see "Adopting a Windows clone" in docs/managed-skill-updates.md';
}

function validateCandidate(root, source) {
  const observation = inspectInstallation(root);
  if (observation.source.commit !== source.sourceCommit || observation.source.repository !== repository
    || observation.files.tracked !== 'clean' || observation.files.untrackedEntries || observation.files.ignoredEntries) {
    throw new Error('Candidate is not the selected complete, clean source');
  }
  if (source.version && observation.skill.declaredVersion && source.version !== observation.skill.declaredVersion) {
    throw new Error('Declared skill version does not match the release');
  }
  const files = inventory(root);
  const names = new Set(files.map((file) => file.path));
  for (const name of ['SKILL.md', 'LICENSE', 'PRIVACY.md', 'SOURCES.md']) {
    if (!names.has(name)) throw new Error('Candidate lacks required package files');
  }
  for (const file of files.filter((entry) => entry.path.endsWith('.md'))) {
    for (const match of readFileSync(path.join(root, file.path), 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      const resolved = path.resolve(root, path.dirname(file.path), target.split('#')[0]);
      if (!resolved.startsWith(`${root}${path.sep}`) || !names.has(path.relative(root, resolved).split(path.sep).join('/'))) {
        throw new Error('Candidate has an incomplete or outside-package reference');
      }
    }
  }
  return { files, declaredVersion: observation.skill.declaredVersion };
}

function checkCurrent(paths, receipt) {
  assertPlainPath(paths.target);
  owned(paths.target);
  if (!matchesInventory(paths.target, receipt.files)) throw new Error('Local files changed or extras exist; preserve them before updating');
  if (receipt.kind === 'git') {
    const observation = inspectInstallation(paths.target);
    if (observation.source.commit !== receipt.sourceCommit || observation.source.repository !== repository
      || observation.files.tracked !== 'clean' || observation.files.untrackedEntries || observation.files.ignoredEntries) {
      throw new Error('Git provenance or local files changed; do not overwrite this copy');
    }
  }
}

// Exposed to the optional notice path so it can prove the selected managed copy
// is still intact before offering consent or making a release-metadata request.
export function verifyManagedCopy(paths, receipt) {
  checkCurrent(paths, receipt);
}

function preventSelfReplacement(paths) {
  if (fileURLToPath(import.meta.url).startsWith(`${paths.target}${path.sep}`)) {
    throw new Error('Run an external CLI copy; do not replace the manager currently executing inside this skill');
  }
}

function validateTransaction(value, paths) {
  if (!value || value.contractVersion !== 'itf.transaction/0.1'
    || !uuidPattern.test(value.id) || !uuidPattern.test(value.backupId)) throw new Error('Unknown recovery journal');
  validateReceipt(value.after, paths);
  if (value.before) validateReceipt(value.before, paths);
  return value;
}

// A pending journal always rolls back to the before-state, never assumes that
// a partially completed install was successful. Ambiguous/new local edits stop it.
function recoverPending(paths, rename = renameSync) {
  const transaction = readJson(pendingFile(paths));
  if (!transaction) return false;
  const tx = validateTransaction(transaction, paths);
  const oldRoot = path.join(stateDirectory(paths, `backups/${tx.backupId}`), 'skill');
  // Establish a usable restore source before displacing the current installation.
  if (tx.before && existsSync(oldRoot)) checkCurrent({ ...paths, target: oldRoot }, tx.before);
  const preserved = path.join(stateDirectory(paths, `staging/${tx.id}`, true), 'interrupted');
  assertPlainPath(preserved);
  if (existsSync(paths.target)) {
    if (tx.before && !existsSync(oldRoot)) {
      checkCurrent(paths, tx.before);
      writeJson(receiptFile(paths), tx.before);
      unlinkSync(pendingFile(paths));
      return true;
    }
    checkCurrent(paths, tx.after);
    if (existsSync(preserved)) throw new Error('Recovery has preserved files already; inspect state without overwriting it');
    rename(paths.target, preserved);
  }
  if (tx.before) {
    if (!existsSync(oldRoot)) throw new Error('Previous copy is unavailable; preserve recovery state');
    checkCurrent({ ...paths, target: oldRoot }, tx.before);
    rename(oldRoot, paths.target);
    writeJson(receiptFile(paths), tx.before);
  } else if (existsSync(receiptFile(paths))) {
    const current = currentReceipt(paths);
    if (current.generation !== tx.after.generation) throw new Error('Receipt changed during recovery');
    unlinkSync(receiptFile(paths));
  }
  unlinkSync(pendingFile(paths));
  return true;
}

export function createManager({ catalogue = githubCatalogue, prepare = prepareFromGitHub, rename = renameSync } = {}) {
  async function plan(command, options) {
    const paths = targetPaths(options);
    assertPlainPath(paths.state);
    const receipt = currentReceipt(paths);
    const pending = readJson(pendingFile(paths));
    const duplicates = discoverCopies(paths);
    const common = { command, harness: paths.harness, scope: paths.scope, target: paths.target,
      privateState: paths.state, discoveryCoverage: 'default native folders only', duplicates,
      current: receipt ? { sourceCommit: receipt.sourceCommit, version: receipt.version, versionSource: receipt.versionSource, policy: receipt.policy } : null };
    if (pending && command !== 'recover') throw new Error('Interrupted operation: use recover before any other change');
    if (command === 'recover') return { ...common, targetSource: null,
      status: pending || readJson(path.join(paths.state, 'lock.json')) ? 'recovery-needed' : 'no-recovery',
      paths, receipt, expectedJournal: pending };
    if (command === 'rollback') {
      if (!receipt?.previous) throw new Error('No previous managed copy is recorded');
      checkCurrent(paths, receipt);
      const previous = stateDirectory(paths, `backups/${receipt.previous}`);
      const prior = validateReceipt(readJson(path.join(previous, 'receipt.json')), paths);
      const priorRoot = path.join(previous, 'skill');
      checkCurrent({ ...paths, target: priorRoot }, prior);
      return { ...common, targetSource: prior, status: 'rollback-available', paths, receipt, priorRoot };
    }
    if (!['install', 'check', 'update', 'adopt'].includes(command)) throw new TypeError('Unknown managed operation');
    if (command === 'install' && (receipt || existsSync(paths.target))) throw new Error('Destination exists; inspect it or deliberately adopt an owned copy');
    if (['update', 'check'].includes(command) && !receipt) throw new Error('No managed receipt; use inspect or deliberate adoption first');
    if (command === 'adopt' && (receipt || !existsSync(paths.target))) throw new Error('Adoption requires an existing unmanaged copy');
    if (receipt) checkCurrent(paths, receipt);
    const channel = options.channel ?? receipt?.policy.channel;
    if (!['stable', 'prerelease'].includes(channel)) throw new TypeError('Choose stable or prerelease explicitly');
    if ([options.commit, options.release, options.followChannel].filter(Boolean).length > 1) throw new TypeError('Choose one source selector');
    let pin = options.followChannel ? null : receipt?.policy.pin ?? null;
    let source;
    if (options.commit) {
      if (!/^[a-f0-9]{40}$/.test(options.commit)) throw new TypeError('Commit must be a full lowercase SHA');
      pin = options.commit;
      source = { sourceCommit: pin, version: null, tag: null, channel };
    } else {
      if (options.release) {
        if (!options.release.startsWith('v')) throw new TypeError('Choose an exact version tag');
        parseVersion(options.release.slice(1));
        pin = receipt?.policy.pin?.tag === options.release ? receipt.policy.pin : options.release;
      }
      if (typeof pin === 'string' && /^[a-f0-9]{40}$/.test(pin)) {
        source = { sourceCommit: pin, version: receipt?.version ?? null, versionSource: receipt?.versionSource ?? 'unknown', tag: null, channel };
      } else {
        const data = await catalogue();
        const selection = selectRelease(data.records, { channel, pin, complete: data.complete });
        if (!selection.selected) return { ...common, targetSource: null, status: selection.status, paths, receipt };
        source = selection.selected;
        if (options.release) pin = { tag: source.tag, sourceCommit: source.sourceCommit };
      }
    }
    const noChange = receipt?.sourceCommit === source.sourceCommit;
    const policyChanged = receipt && JSON.stringify(receipt.policy) !== JSON.stringify({ channel, pin });
    if (receipt?.version && source.version && compareVersions(source.version, receipt.version) < 0 && !options.allowDowngrade) {
      throw new Error('Target version is older; choose rollback or explicitly allow the downgrade');
    }
    return { ...common, targetSource: source, status: noChange ? policyChanged ? 'policy-change' : 'current' : receipt ? 'update-available' : 'installable',
      policy: { channel, pin }, paths, receipt };
  }

  async function run(command, options = {}) {
    const result = await plan(command, options);
    const { paths, receipt, priorRoot, expectedJournal = null, ...fields } = result;
    const source = fields.targetSource;
    const publicResult = { ...fields, targetSource: source ? {
      sourceCommit: source.sourceCommit, version: source.version,
      versionSource: source.versionSource ?? (source.tag ? 'release' : 'unknown'),
      tag: source.tag ?? null, channel: source.channel ?? source.policy?.channel,
    } : null };
    options.onPlan?.({ ...publicResult, applied: false });
    if (!options.apply || command === 'check' || ['current', 'no-recovery'].includes(result.status) || !result.targetSource && command !== 'recover') {
      return { ...publicResult, applied: false };
    }
    if (result.duplicates.length && !options.ackDuplicates) throw new Error('Other copies are discoverable; inspect them and acknowledge duplicates explicitly');
    assertPlainPath(paths.target);
    assertPlainPath(paths.state);
    preventSelfReplacement(paths);
    let stoppedLockCleared = false;
    if (command === 'recover') { initialiseState(paths); stoppedLockCleared = clearStoppedLock(paths); }
    const releaseLock = acquireLock(paths);
    const id = randomUUID();
    const stageRoot = staging(paths, id);
    const candidateRoot = path.join(stageRoot, 'skill');
    let transactionStarted = false;
    let canRemoveStage = true;
    const assertSnapshot = () => {
      if (JSON.stringify(currentReceipt(paths)) !== JSON.stringify(receipt)
        || JSON.stringify(readJson(pendingFile(paths))) !== JSON.stringify(expectedJournal)) {
        throw new Error('Managed state changed since the plan; preview again before applying');
      }
    };
    try {
      assertSnapshot();
      if (command === 'recover') {
        const recovered = recoverPending(paths, rename);
        return { ...publicResult, applied: recovered || stoppedLockCleared,
          status: recovered || stoppedLockCleared ? 'recovered' : 'no-recovery' };
      }
      if (receipt) checkCurrent(paths, receipt);
      if (result.status === 'policy-change') {
        writeJson(receiptFile(paths), { ...receipt, policy: result.policy });
        return { ...publicResult, applied: true, status: 'policy-updated' };
      }
      stateDirectory(paths, `staging/${id}`, true);
      if (command === 'rollback') cpSync(priorRoot, candidateRoot, { recursive: true, dereference: false, force: false, errorOnExist: true });
      else await prepare(candidateRoot, result.targetSource.sourceCommit);
      const candidate = command === 'rollback'
        ? { files: result.targetSource.files, declaredVersion: result.targetSource.version }
        : validateCandidate(candidateRoot, result.targetSource);
      if (!matchesInventory(candidateRoot, candidate.files)) throw new Error('Candidate changed during validation');
      if (command === 'rollback') checkCurrent({ ...paths, target: candidateRoot }, result.targetSource);
      if (command === 'adopt') {
        owned(paths.target);
        if (!matchesInventory(paths.target, candidate.files)) {
          throw new Error(`Unknown or modified adoption files; preserve this copy${crlfHint(paths.target)}`);
        }
        if (existsSync(path.join(paths.target, '.git'))) {
          const observation = inspectInstallation(paths.target);
          if (observation.source.repository !== repository || observation.source.commit !== result.targetSource.sourceCommit
            || observation.files.tracked !== 'clean' || observation.files.untrackedEntries || observation.files.ignoredEntries
            || !lstatSync(path.join(paths.target, '.git')).isDirectory()) throw new Error('Linked or changed Git copy cannot be adopted');
        }
      }
      if (receipt) checkCurrent(paths, receipt);
      else if (command === 'install' && existsSync(paths.target)) throw new Error('Destination appeared during preparation; leave it untouched');
      assertSnapshot();
      const after = {
        contractVersion: RECEIPT_CONTRACT, repository, helperVersion: HELPER_VERSION,
        generation: id, installationId: receipt?.installationId ?? receipt?.generation ?? id,
        harness: paths.harness, scope: paths.scope, target: paths.target,
        sourceCommit: result.targetSource.sourceCommit,
        version: result.targetSource.version ?? candidate.declaredVersion,
        versionSource: command === 'rollback' ? result.targetSource.versionSource
          : result.targetSource.versionSource ?? (result.targetSource.tag ? 'release' : candidate.declaredVersion ? 'declared' : 'unknown'),
        kind: command === 'rollback' ? result.targetSource.kind
          : command === 'adopt' && !existsSync(path.join(paths.target, '.git')) ? 'manual' : 'git',
        policy: command === 'rollback' ? result.targetSource.policy : result.policy,
        files: candidate.files, previous: null,
      };
      if (command === 'adopt') {
        writeJson(receiptFile(paths), after);
        return { ...publicResult, applied: true, status: 'adopted' };
      }
      const backupId = randomUUID();
      after.previous = receipt ? backupId : null;
      const tx = { contractVersion: 'itf.transaction/0.1', id, backupId, before: receipt, after };
      if (receipt) {
        stateDirectory(paths, `backups/${backupId}`, true);
        writeJson(path.join(backup(paths, backupId), 'receipt.json'), receipt);
      }
      mkdirSync(path.dirname(paths.target), { recursive: true });
      assertPlainPath(paths.target);
      writeJson(pendingFile(paths), tx);
      transactionStarted = true;
      if (receipt) rename(paths.target, path.join(backup(paths, backupId), 'skill'));
      rename(candidateRoot, paths.target);
      writeJson(receiptFile(paths), after);
      unlinkSync(pendingFile(paths));
      transactionStarted = false;
      return { ...publicResult, applied: true, status: command === 'rollback' ? 'rolled-back' : 'installed',
        previousCopyRetained: Boolean(receipt) };
    } catch (error) {
      if (transactionStarted) {
        try { recoverPending(paths, rename); }
        catch {
          canRemoveStage = false;
          throw new Error('Operation interrupted; previous files are preserved in private state. Inspect and use recover; do not delete state.');
        }
      }
      throw error;
    } finally {
      try {
        if (canRemoveStage && existsSync(stageRoot)) {
          stateDirectory(paths, `staging/${id}`);
          rmSync(stageRoot, { recursive: true });
        }
      } finally { releaseLock(); }
    }
  }
  return { run };
}
