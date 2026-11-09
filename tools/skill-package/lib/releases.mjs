import { compareVersions, parseVersion } from './version.mjs';

export const REPOSITORY = 'zhiganov/impact-to-funding';
export const RELEASE_CONTRACT = 'itf.release/0.1';
const commitPattern = /^[0-9a-f]{40}$/;

export function validateRelease(record) {
  if (!record || record.contractVersion !== RELEASE_CONTRACT || record.repository !== REPOSITORY) {
    throw new TypeError('Unsupported release contract or repository');
  }
  const version = parseVersion(record.version);
  if (record.tag !== `v${record.version}` || typeof record.sourceCommit !== 'string' || !commitPattern.test(record.sourceCommit)) {
    throw new TypeError('Release requires a matching version tag and resolved full commit SHA');
  }
  if (!['stable', 'prerelease'].includes(record.channel) || typeof record.draft !== 'boolean') {
    throw new TypeError('Release requires an explicit channel and draft flag');
  }
  if (version.prerelease.length && record.channel !== 'prerelease') {
    throw new TypeError('A SemVer prerelease cannot be offered as stable');
  }
  return {
    contractVersion: RELEASE_CONTRACT,
    repository: REPOSITORY,
    version: record.version,
    tag: record.tag,
    sourceCommit: record.sourceCommit,
    channel: record.channel,
    draft: record.draft,
  };
}

// The caller must resolve/peel the actual tag ref. target_commitish may be a
// moving branch, and is deliberately never used as the source commit.
export function releaseFromGitHub(release, resolvedTag) {
  if (!release || !resolvedTag || resolvedTag.tag !== release.tag_name
    || typeof release.tag_name !== 'string' || !release.tag_name.startsWith('v')
    || typeof release.prerelease !== 'boolean') {
    throw new TypeError('A GitHub release and matching resolved tag are required');
  }
  const url = new URL(release.html_url);
  if (url.origin !== 'https://github.com' || url.username || url.password || url.search || url.hash
    || decodeURIComponent(url.pathname) !== `/${REPOSITORY}/releases/tag/${release.tag_name}`) {
    throw new TypeError('Release URL must identify the intended repository and tag');
  }
  return validateRelease({
    contractVersion: RELEASE_CONTRACT,
    repository: REPOSITORY,
    version: release.tag_name.slice(1),
    tag: release.tag_name,
    sourceCommit: resolvedTag.commit,
    channel: release.prerelease ? 'prerelease' : 'stable',
    draft: release.draft,
  });
}

export function selectRelease(records, { channel, pin = null, complete } = {}) {
  if (!['stable', 'prerelease'].includes(channel)) throw new TypeError('Choose stable or prerelease explicitly');
  if (!Array.isArray(records)) throw new TypeError('Release records must be an array');
  if (typeof complete !== 'boolean') throw new TypeError('State whether the release catalogue is complete');
  let pinTag = null;
  let pinCommit = null;
  if (pin !== null) {
    if (typeof pin === 'object') {
      if (!pin || typeof pin.tag !== 'string' || !pin.tag.startsWith('v')
        || typeof pin.sourceCommit !== 'string' || !commitPattern.test(pin.sourceCommit)) {
        throw new TypeError('A locked tag pin requires its expected full source commit');
      }
      parseVersion(pin.tag.slice(1));
      pinTag = pin.tag;
      pinCommit = pin.sourceCommit;
    } else if (typeof pin === 'string' && commitPattern.test(pin)) pinCommit = pin;
    else if (typeof pin === 'string' && pin.startsWith('v')) {
      parseVersion(pin.slice(1));
      pinTag = pin;
    } else {
      throw new TypeError('Pin must be a release selector, full commit SHA or locked tag/commit pair');
    }
  }
  if (!complete) return { status: 'catalogue-incomplete', channel, pin, selected: null };
  const releases = records.map(validateRelease);
  const tags = new Map();
  for (const release of releases) {
    if (tags.has(release.tag) && JSON.stringify(tags.get(release.tag)) !== JSON.stringify(release)) {
      throw new TypeError('Conflicting records for the same release tag');
    }
    tags.set(release.tag, release);
  }
  const eligible = [...tags.values()].filter((release) => !release.draft
    && (channel === 'prerelease' || release.channel === 'stable'));
  if (pin !== null) {
    const matches = eligible.filter((release) => (!pinTag || release.tag === pinTag)
      && (!pinCommit || release.sourceCommit === pinCommit));
    matches.sort(orderReleases);
    return { status: matches.length ? 'pinned' : 'pin-unresolved', channel, pin, selected: matches[0] ?? null };
  }
  eligible.sort(orderReleases);
  return { status: eligible.length ? 'selected' : 'no-release', channel, pin: null, selected: eligible[0] ?? null };
}

function orderReleases(a, b) {
  const versionOrder = compareVersions(b.version, a.version);
  if (versionOrder) return versionOrder;
  if (a.channel !== b.channel) return a.channel === 'stable' ? -1 : 1;
  return a.tag === b.tag ? 0 : a.tag < b.tag ? -1 : 1;
}
