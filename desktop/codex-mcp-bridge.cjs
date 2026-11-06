const fs = require('node:fs/promises');
const readline = require('node:readline');

async function relay(message, descriptor) {
  const metadata = await fs.lstat(descriptor);
  if (!metadata.isFile() || metadata.isSymbolicLink() || (metadata.mode & 0o077) !== 0 || metadata.uid !== process.getuid()) {
    throw new Error('The Personal Vault connection file must be private to your macOS user.');
  }
  const connection = JSON.parse(await fs.readFile(descriptor, 'utf8'));
  const endpoint = new URL(connection.url);
  if (connection.version !== 1 || endpoint.protocol !== 'http:' || endpoint.hostname !== '127.0.0.1' || endpoint.pathname !== '/mcp' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || typeof connection.token !== 'string' || !connection.token) {
    throw new Error('The Personal Vault connection is invalid. Restart Personal Vault.');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${connection.token}` },
    body: JSON.stringify(message),
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error('Personal Vault refused the MCP request. Restart the app and reconnect the client.');
  if (response.status === 202 || response.status === 204) return null;
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Personal Vault returned an unsupported response.');
  const result = await response.json();
  if (message.method === 'initialize' && result.result) {
    result.result.instructions = `${result.result.instructions || ''}\nUse this Personal Vault MCP connection for authorized Vault reads and saves. Paths are relative to the folder selected in the app. To save a note, use capture_note; read the returned path with vault_files_read before reporting success. If this connection is unavailable, report it and do not silently fall back to filesystem writes. Connecting this server does not automatically archive conversations or grant access to other chats.`;
  }
  return result;
}

async function main() {
  const descriptor = process.argv[2];
  if (!descriptor) throw new Error('A Personal Vault connection file is required. Use the app’s Connect Codex command.');
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try {
      if (Buffer.byteLength(line) > 20 * 1024 * 1024) throw new Error('Request exceeds the local bridge size limit.');
      message = JSON.parse(line);
      const result = await relay(message, descriptor);
      if (result && Object.hasOwn(message, 'id')) process.stdout.write(`${JSON.stringify(result)}\n`);
    } catch {
      if (message && Object.hasOwn(message, 'id')) {
        process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32001, message: 'Personal Vault is unavailable. Open Personal Vault, then reconnect this MCP client. No filesystem fallback was used.' } })}\n`);
      } else process.stderr.write('Personal Vault could not process an MCP notification.\n');
    }
  }
}

main().catch(() => { process.stderr.write('Personal Vault bridge could not start. Use the app’s Connect Codex command.\n'); process.exitCode = 1; });
