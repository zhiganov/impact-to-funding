import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { commandEnvironment } from '../skill-package/lib/runtime-source.mjs';

// The release-runtime counterpart of the setup probe. The MCP client stays a
// build-time dependency: it resolves from this package's own node_modules, never
// from the built folder. The server under test comes from the built output.
export async function probeRuntimeFolder({ server, snapshot, expectedCommit, cwd,
  nodeExecutable = process.execPath }) {
  const require = createRequire(import.meta.url);
  const { Client } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/client')).href);
  const { StdioClientTransport } = await import(pathToFileURL(require.resolve('@modelcontextprotocol/client/stdio')).href);
  const client = new Client({ name: 'itf-runtime-build-check', version: '0.1.0' },
    { versionNegotiation: { mode: 'legacy' } });
  const transport = new StdioClientTransport({ command: nodeExecutable,
    args: [server, '--snapshot', snapshot], cwd, stderr: 'pipe', env: commandEnvironment() });
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
