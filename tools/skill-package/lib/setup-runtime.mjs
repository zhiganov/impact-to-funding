import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
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

function commandEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(([key]) =>
    !/^npm_config_/i.test(key) && !key.startsWith('GIT_')
    && !['NODE_OPTIONS', 'NODE_PATH', 'NODE_ENV'].includes(key)));
}

export function prepareRuntime(root, commit, localSource = null) {
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
  checkRuntimeSource(root, commit);
  const lock = JSON.parse(readFileSync(path.join(root, 'mcp/package-lock.json'), 'utf8'));
  for (const [name, dependency] of Object.entries(lock.packages ?? {})) {
    if (!name) continue;
    if (!dependency.resolved?.startsWith('https://registry.npmjs.org/')
      || !/^sha512-[A-Za-z0-9+/]+=*$/.test(dependency.integrity ?? '')
      || dependency.link) throw new Error('Runtime lock contains an unsupported dependency source');
  }
  const output = path.join(root, 'outputs');
  mkdirSync(output, { mode: 0o700 });
  const userConfig = path.join(output, 'npm-user.config');
  const globalConfig = path.join(output, 'npm-global.config');
  for (const file of [userConfig, globalConfig]) writeFileSync(file, '', { flag: 'wx', mode: 0o600 });
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execFileSync(npm, ['ci', '--ignore-scripts', '--include=dev', '--no-audit', '--no-fund',
    '--registry=https://registry.npmjs.org', `--userconfig=${userConfig}`, `--globalconfig=${globalConfig}`], {
    cwd: path.join(root, 'mcp'), env: commandEnvironment(), timeout: 180000,
    maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function prepareRuntimeSnapshot(root, commit, snapshot) {
  execFileSync(process.execPath, [path.join(root, 'mcp/prepare.mjs'),
    '--revision', commit, '--output', snapshot], {
    cwd: root, env: commandEnvironment(), timeout: 15000,
    maxBuffer: 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export async function probeRuntime(root, snapshot, expectedCommit, nodeExecutable = process.execPath) {
  const require = createRequire(path.join(root, 'mcp/package.json'));
  const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/client')).href);
  const { StdioClientTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/client/stdio')).href);
  const client = new Client({ name: 'itf-setup-check', version: '0.4.0' },
    { versionNegotiation: { mode: 'legacy' } });
  const transport = new StdioClientTransport({ command: nodeExecutable,
    args: [path.join(root, 'mcp/server.mjs'), '--snapshot', snapshot], cwd: root, stderr: 'pipe',
    env: commandEnvironment() });
  // Drain diagnostics without copying source text or local paths into the result.
  transport.stderr?.on('data', () => {});
  const options = { timeout: 5000, signal: AbortSignal.timeout(20000) };
  try {
    await client.connect(transport, options);
    const { tools } = await client.listTools(undefined, options);
    if (JSON.stringify(tools.map((tool) => tool.name).sort())
      !== JSON.stringify(['get_reference', 'library_info', 'search_references'])) {
      throw new Error('Unexpected library tool inventory');
    }
    async function call(name, args = {}) {
      const response = await client.callTool({ name, arguments: args }, options);
      const payload = response.structuredContent;
      if (response.isError || payload?.status !== 'ok' || payload.sourceRevision !== expectedCommit) {
        throw new Error('Library operation did not return the selected source');
      }
      return payload;
    }
    const info = await call('library_info');
    const found = await call('search_references', { limit: 1, snapshotId: info.snapshotId });
    const item = found.data.items[0];
    if (!item) throw new Error('Prepared library has no readable reference');
    const detail = await call('get_reference', {
      id: item.id, revision: item.recordRevision, snapshotId: info.snapshotId,
    });
    if (detail.snapshotId !== info.snapshotId || found.snapshotId !== info.snapshotId) {
      throw new Error('Library snapshot changed during the check');
    }
    return { status: 'passed', transport: 'stdio', sourceCommit: expectedCommit,
      snapshotId: info.snapshotId, tools: tools.map((tool) => tool.name).sort(),
      operations: ['library_info', 'search_references', 'get_reference'],
      hostConnection: 'not_checked', modelRun: false };
  } finally {
    await client.close();
    await transport.close();
  }
}
