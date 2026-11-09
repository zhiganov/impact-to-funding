import { readFileSync } from 'node:fs';
import { Server, ProtocolError, ProtocolErrorCode } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { Library } from './library.mjs';
import { TOOLS } from './schemas.mjs';

const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== '--snapshot' || !args[1]) {
  console.error('Usage: node mcp/server.mjs --snapshot PREPARED_SNAPSHOT_FILE');
  process.exitCode = 1;
} else {
  let library;
  try {
    library = new Library(JSON.parse(readFileSync(args[1], 'utf8')));
  } catch {
    // No local path, query, credential or raw source/parser exception in diagnostics.
    console.error('Prepared snapshot unavailable or invalid. All library tools will return snapshot_unavailable.');
    library = new Library(null);
  }
  serveStdio(() => {
    const server = new Server({ name: 'itf-reference-library', version: '0.1.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler('tools/list', async () => ({ tools: TOOLS }));
    server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: toolArgs = {} } = request.params;
      if (!TOOLS.some((tool) => tool.name === name)) {
        throw new ProtocolError(ProtocolErrorCode.InvalidParams, 'Unknown library tool.');
      }
      const payload = library.call(name, toolArgs);
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
        structuredContent: payload, isError: payload.status === 'error',
      };
    });
    return server;
  });
}
