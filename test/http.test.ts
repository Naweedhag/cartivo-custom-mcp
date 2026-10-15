import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
test('HTTP authentication, origin protection and MCP initialization', async () => {
 const port=19317; const token='test-only-'.repeat(5);
 const child=spawn(process.execPath,['dist/http.js'],{env:{...process.env,PORT:String(port),CARTIVO_MCP_TOKEN:token},stdio:'ignore'});
 const url=`http://127.0.0.1:${port}/mcp`;
 try {
  let ready=false;
  for(let i=0;i<40;i++) {try {const r=await fetch(url);assert.equal(r.status,401);ready=true;break;}catch {await delay(50);}}
  assert.ok(ready,'server started');
  const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
  assert.equal((await fetch(url,{method:'POST',headers:{...headers,Origin:'https://other.example'},body:'{}'})).status,403);
  assert.equal((await fetch(url,{method:'POST',headers,body:'invalid'})).status,400);
  const r=await fetch(url,{method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'test',version:'1'}}})});
  assert.equal(r.status,200);const body=await r.json();assert.equal(body.result.serverInfo.name,'cartivo-custom-mcp');
 } finally {child.kill();}
});
