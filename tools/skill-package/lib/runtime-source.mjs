import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { prepareFromGitHub, SOURCE_URL, sourceGit } from './git.mjs';
import { inspectInstallation } from './installation.mjs';

export function checkRuntimeSource(root, commit) {
  const observation = inspectInstallation(root);
  if (observation.source.commit !== commit
    || observation.source.repository !== 'zhiganov/impact-to-funding'
    || observation.files.tracked !== 'clean') {
    throw new Error('Library runtime source differs from the selected clean ItF commit');
  }
  return { sourceCommit: commit, skillVersion: observation.skill.declaredVersion,
    serverVersion: JSON.parse(readFileSync(path.join(root, 'mcp/package.json'), 'utf8')).version };
}

export function commandEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^npm_config_/i.test(key) && !key.startsWith('GIT_')
    && !['NODE_OPTIONS', 'NODE_PATH', 'NODE_ENV'].includes(key)));
}

function checkRuntimeLock(root) {
  const lock = JSON.parse(readFileSync(path.join(root, 'mcp/package-lock.json'), 'utf8'));
  for (const [name, dependency] of Object.entries(lock.packages ?? {})) {
    if (!name) continue;
    if (!dependency.resolved?.startsWith('https://registry.npmjs.org/')
      || !/^sha512-[A-Za-z0-9+/]+=*$/.test(dependency.integrity ?? '')
      || dependency.link) throw new Error('Runtime lock contains an unsupported dependency source');
  }
}

function installWithNpm(root, includeDev) {
  const output = path.join(root, 'outputs');
  mkdirSync(output, { mode: 0o700 });
  const userConfig = path.join(output, 'npm-user.config');
  const globalConfig = path.join(output, 'npm-global.config');
  for (const file of [userConfig, globalConfig]) writeFileSync(file, '', { flag: 'wx', mode: 0o600 });
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npm, ['ci', '--ignore-scripts', includeDev ? '--include=dev' : '--omit=dev', '--no-audit', '--no-fund',
    '--registry=https://registry.npmjs.org', `--userconfig=${userConfig}`, `--globalconfig=${globalConfig}`], {
    cwd: path.join(root, 'mcp'), env: commandEnvironment(), timeout: 180000,
    maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

// Shared preparation for every library runtime: a clean clone at one commit,
// source verification, the lockfile checks and a dependency install. `itf setup`
// installs dev dependencies too (it needs the MCP client for its probe); the
// release-runtime build passes includeDev: false and resolves the client from
// its own package instead.
export function prepareRuntimeSource(root, commit, { localSource = null, includeDev = true, install = installWithNpm } = {}) {
  if (localSource) {
    const origin = sourceGit(['-C', localSource, 'remote', 'get-url', 'origin']).trim();
    if (!/^(?:https:\/\/github\.com\/zhiganov\/impact-to-funding(?:\.git)?\/?|git@github\.com:zhiganov\/impact-to-funding(?:\.git)?)$/i.test(origin)) {
      throw new Error('Selected local source does not declare the ItF repository origin');
    }
    // --no-local avoids hard links and alternates to the user's working copy.
    sourceGit(['clone', '--quiet', '--no-checkout', '--no-local', '--no-tags', localSource, root]);
    sourceGit(['-C', root, 'remote', 'set-url', 'origin', SOURCE_URL]);
    sourceGit(['-C', root, 'checkout', '--quiet', '--detach', commit]);
  } else prepareFromGitHub(root, commit);
  const observed = checkRuntimeSource(root, commit);
  checkRuntimeLock(root);
  install(root, includeDev);
  return observed;
}

export function prepareRuntimeSnapshot(root, commit, snapshot) {
  // The realpath keeps the producer's argv[1] guard working when the clone sits
  // behind a symlinked temp directory (macOS /var -> /private/var): Node
  // resolves the ESM main module to its real path, so a symlinked argv[1] would
  // make the producer exit silently without writing the snapshot.
  execFileSync(process.execPath, [realpathSync(path.join(root, 'mcp/prepare.mjs')),
    '--revision', commit, '--output', snapshot], {
    cwd: root, env: commandEnvironment(), timeout: 15000,
    maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}
