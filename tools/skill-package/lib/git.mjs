import { execFileSync } from 'node:child_process';

// Git's own spelling of the null device, not Node's os.devNull. On Windows os.devNull is
// `\\.\nul`, which Git for Windows rejects as GIT_CONFIG_GLOBAL/GIT_CONFIG_SYSTEM ("unable to
// access '\\.\nul': Invalid argument"), so every clone failed there. Git for Windows maps
// `/dev/null` to its null device, and POSIX Git reads it natively.
const GIT_NULL = '/dev/null';

export const SOURCE_URL = 'https://github.com/zhiganov/impact-to-funding.git';

export function sourceGit(args, { cwd, timeout = 60000 } = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: GIT_NULL,
    GIT_CONFIG_SYSTEM: GIT_NULL, GIT_TERMINAL_PROMPT: '0',
  });
  return execFileSync('git', ['--no-replace-objects', '--no-optional-locks',
    '-c', `core.hooksPath=${GIT_NULL}`, '-c', `core.attributesFile=${GIT_NULL}`,
    '-c', 'core.fsmonitor=false', '-c', 'credential.helper=',
    // Staging paths (state hash + run id + .git/objects/pack/…) pass Windows' 260-character
    // MAX_PATH under a long home or temp directory, and the isolated config above also hides a
    // user's own core.longpaths. Git for Windows needs it set here; other platforms ignore it.
    '-c', 'core.longpaths=true', ...args], {
    cwd, env, encoding: 'utf8', timeout, maxBuffer: 8 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function prepareFromGitHub(destination, commit, { git = sourceGit } = {}) {
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new TypeError('A full source commit is required');
  git(['clone', '--quiet', '--no-checkout', '--no-tags', SOURCE_URL, destination]);
  try { git(['-C', destination, 'cat-file', '-e', `${commit}^{commit}`]); }
  catch { git(['-C', destination, 'fetch', '--quiet', '--no-tags', 'origin', commit]); }
  git(['-C', destination, 'checkout', '--quiet', '--detach', commit]);
  if (git(['-C', destination, 'rev-parse', 'HEAD']).trim() !== commit) throw new Error('Prepared HEAD differs from selected source');
}
