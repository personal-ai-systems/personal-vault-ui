import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, rm, chmod } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import connectionHelpers from '../desktop/mcp-connection.cjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = await mkdtemp(path.join(tmpdir(), 'vault-bridge-'));
const root = path.join(fixture, 'Selected Vault');
const token = 'fixture-only-token';
const clients = [];
const children = [];
let descriptor;

async function startServer(selectedRoot = root) {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const server = spawn(process.execPath, [path.join(appRoot, '../personal-vault/mcp/personal-vault-server.mjs')], {
    env: { ...process.env, PERSONAL_VAULT_ROOT: selectedRoot, MCP_PORT: String(port), MCP_HOST: '127.0.0.1', MCP_SERVICE_TOKENS: token, MCP_GOOGLE_AUTH: 'false', MCP_TRUST_LOCALHOST: 'false', MCP_AUTH_CHALLENGE_MODE: 'http-401', MCP_CONTEXT_FILE: '' },
    stdio: 'ignore',
  });
  children.push(server);
  const url = `http://127.0.0.1:${port}/mcp`;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/status`)).ok) return { server, url }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error('Fixture MCP server did not start.');
}

async function connect() {
  const client = new Client({ name: 'desktop-bridge-fixture', version: '1.0.0' });
  clients.push(client);
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(appRoot, 'desktop/codex-mcp-bridge.cjs'), descriptor], stderr: 'pipe' }));
  return client;
}

try {
  await mkdir(root);
  const first = await startServer();
  descriptor = await connectionHelpers.publishConnection(fixture, { url: first.url, token, root, pid: process.pid });
  assert.equal((await fetch(first.url, { method: 'POST' })).status, 401);
  const client = await connect();
  const names = (await client.listTools()).tools.map(tool => tool.name);
  assert.ok(names.includes('capture_note') && names.includes('vault_files_read'));
  const saved = await client.callTool({ name: 'capture_note', arguments: { title: 'Bridge test', input: 'Проверка MCP — fixture only.' } });
  assert.equal(saved.isError, undefined);
  const savedPath = saved.structuredContent.path;
  const readBack = await client.callTool({ name: 'vault_files_read', arguments: { path: savedPath } });
  assert.match(readBack.structuredContent.content, /Проверка MCP — fixture only\./);
  assert.equal(readBack.structuredContent.content, await readFile(path.join(root, savedPath), 'utf8'));
  const command = connectionHelpers.codexCommand('/Applications/Personal Vault.app/Contents/MacOS/Personal Vault', '/bundle/app.asar/desktop/codex-mcp-bridge.cjs', descriptor);
  assert.ok(command.includes('--env ELECTRON_RUN_AS_NODE=1'));
  assert.equal(command.includes(token), false);

  const secondRoot = path.join(fixture, 'Another Vault');
  await mkdir(secondRoot);
  const second = await startServer(secondRoot);
  await connectionHelpers.publishConnection(fixture, { url: second.url, token: `${token}-invalid`, root: secondRoot, pid: process.pid });
  await assert.rejects(client.listTools(), /unavailable/);
  await connectionHelpers.publishConnection(fixture, { url: second.url, token, root: secondRoot, pid: process.pid });
  assert.equal((await client.callTool({ name: 'vault_files_list', arguments: {} })).structuredContent.items.length, 0);
  await chmod(descriptor, 0o644);
  await assert.rejects(client.listTools(), /unavailable/);
  await chmod(descriptor, 0o600);
  const stopped = once(second.server, 'exit');
  second.server.kill('SIGTERM');
  await stopped;
  await assert.rejects(client.listTools(), /unavailable/);
  connectionHelpers.removeConnection(descriptor);
  await assert.rejects(readFile(descriptor), { code: 'ENOENT' });
  console.log('MCP_BRIDGE_OK: discovery, capture/read via MCP, private credentials, root/port rotation, wrong token, stopped app, and no filesystem fallback.');
} finally {
  await Promise.all(clients.map(client => client.close().catch(() => {})));
  await Promise.all(children.map(async child => {
    if (child.exitCode !== null || child.signalCode) return;
    const exited = once(child, 'exit');
    child.kill('SIGTERM');
    await exited;
  }));
  await rm(fixture, { recursive: true, force: true });
}
