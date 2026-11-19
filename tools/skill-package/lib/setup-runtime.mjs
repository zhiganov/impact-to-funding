import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { commandEnvironment, prepareRuntimeSource } from './runtime-source.mjs';

export { checkRuntimeSource, prepareRuntimeSnapshot } from './runtime-source.mjs';

// `itf setup` keeps its historical behaviour: the prepared clone also installs
// dev dependencies, because the setup probe resolves the MCP client from it.
export function prepareRuntime(root, commit, localSource = null) {
  return prepareRuntimeSource(root, commit, { localSource, includeDev: true });
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
