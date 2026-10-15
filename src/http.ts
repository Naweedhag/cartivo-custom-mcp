import { createServer as createHttpServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
const token = process.env.CARTIVO_MCP_TOKEN;
if (!token || token.length < 32) throw new Error('Set CARTIVO_MCP_TOKEN to a random secret of at least 32 characters.');
const port = Number(process.env.PORT ?? 3100);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
const expected = Buffer.from(`Bearer ${token}`);
const app = createHttpServer(async (req, res) => {
  if (req.headers.origin || ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host ?? '')) { res.writeHead(403).end(); return; }
  const provided = Buffer.from(req.headers.authorization ?? '');
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) { res.writeHead(401).end(); return; }
  if (req.url !== '/mcp') { res.writeHead(404).end(); return; }
  if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }).end(); return; }
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  res.on('close', () => { void transport.close(); void server.close(); });
  try {
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) { res.writeHead(413).end(); return; }
      chunks.push(chunk);
    }
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { res.writeHead(400).end(); return; }
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
});
app.requestTimeout = 15000;
app.listen(port, '127.0.0.1');
for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal, () => app.close(() => process.exit(0)));
