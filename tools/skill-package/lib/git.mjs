import { execFileSync } from 'node:child_process';
import { devNull } from 'node:os';

export const SOURCE_URL = 'https://github.com/zhiganov/impact-to-funding.git';

export function sourceGit(args, { cwd, timeout = 60000 } = {}) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: devNull,
    GIT_CONFIG_SYSTEM: devNull, GIT_TERMINAL_PROMPT: '0',
  });
  return execFileSync('git', ['--no-replace-objects', '--no-optional-locks',
    '-c', `core.hooksPath=${devNull}`, '-c', `core.attributesFile=${devNull}`,
    '-c', 'core.fsmonitor=false', '-c', 'credential.helper=', ...args], {
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
