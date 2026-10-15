import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
const server = createServer();
await server.connect(new StdioServerTransport());
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void server.close().then(() => process.exit(0)); });
