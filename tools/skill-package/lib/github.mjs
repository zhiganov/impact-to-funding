import { releaseFromGitHub } from './releases.mjs';

const api = 'https://api.github.com/repos/zhiganov/impact-to-funding';

async function getJson(url, request, deadline) {
  const response = await request(url, {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.any([deadline, AbortSignal.timeout(5000)]), redirect: 'error',
  });
  if (!response.ok) throw new Error(`Public release metadata unavailable (HTTP ${response.status})`);
  return response.json();
}

export async function githubCatalogue({ request = fetch } = {}) {
  const releases = [];
  const deadline = AbortSignal.timeout(15000);
  for (let page = 1; page <= 10; page += 1) {
    const data = await getJson(`${api}/releases?per_page=100&page=${page}`, request, deadline);
    if (!Array.isArray(data)) throw new TypeError('Unrecognised GitHub release response');
    for (const release of data) {
      // Ignore unrelated historical tag formats, never reinterpret them as SemVer.
      if (typeof release.tag_name !== 'string' || !/^v[0-9]+\.[0-9]+\.[0-9]+/.test(release.tag_name)) continue;
      if (release.draft) continue;
      const ref = await getJson(`${api}/git/ref/tags/${encodeURIComponent(release.tag_name)}`, request, deadline);
      if (ref.ref !== `refs/tags/${release.tag_name}`) throw new TypeError('GitHub returned a different tag ref');
      let object = ref.object;
      for (let depth = 0; object?.type === 'tag' && depth < 4; depth += 1) {
        if (!/^[0-9a-f]{40}$/.test(object.sha)) throw new TypeError('Invalid annotated tag object');
        object = (await getJson(`${api}/git/tags/${object.sha}`, request, deadline)).object;
      }
      if (object?.type !== 'commit') throw new TypeError('Release tag did not resolve to a commit');
      releases.push(releaseFromGitHub(release, { tag: release.tag_name, commit: object.sha }));
    }
    if (data.length < 100) return { records: releases, complete: true };
  }
  return { records: releases, complete: false };
}
