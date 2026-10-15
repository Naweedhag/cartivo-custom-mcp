import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../dist/server.js';
import { localCheck, githubStatus } from '../dist/core.js';
test('MCP negotiation, tool discovery, plan, validation and closed release boundary', async () => {
 const [a,b] = InMemoryTransport.createLinkedPair();
 const server = createServer(); const client = new Client({ name:'test', version:'1' });
 await server.connect(a); await client.connect(b);
 try {
  const tools = await client.listTools(); assert.equal(tools.tools.length,5);
  assert.ok(!tools.tools.some(t => /deploy|approve|payment/.test(t.name)));
  const result = await client.callTool({name:'cartivo_plan_change',arguments:{request:'Add filter',repositories:['application']}});
  const data=JSON.parse(result.content[0].text); assert.equal(data.status,'plan_only'); assert.equal(data.productionRevision,'unverified');
  const bad = await client.callTool({name:'cartivo_domain_protocol',arguments:{domain:'shell'}}); assert.equal(bad.isError,true);
 } finally { await client.close(); await server.close(); }
});
test('local execution fails closed', async () => {
 await assert.rejects(localCheck('application','test',{}),/disabled/);
 await assert.rejects(localCheck('backend','test',{CARTIVO_ENABLE_LOCAL_CHECKS:'true'}),/isolated/);
});
test('GitHub failures do not leak response or token', async () => {
 await assert.rejects(githubStatus('backend','secret',async () => new Response('private data',{status:403})),/^Error: GitHub request failed \(403\)/);
});
