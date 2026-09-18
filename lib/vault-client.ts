import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import matter from 'gray-matter';

export async function vault(operation: string, args: Record<string, unknown> = {}) {
  const client = new Client({ name: 'personal-vault-ui', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(process.env.PERSONAL_VAULT_MCP_URL || 'http://127.0.0.1:8788/mcp'), {
      requestInit: { headers: process.env.PERSONAL_VAULT_TOKEN ? { Authorization: `Bearer ${process.env.PERSONAL_VAULT_TOKEN}` } : {} },
    }));
    const result = await client.callTool({ name: `vault.files.${operation}`, arguments: args });
    if (result.isError) throw new Error(Array.isArray(result.content) ? result.content.map((item: any) => item.text || '').join(' ') : 'Vault operation failed');
    return result.structuredContent as any;
  } finally { await client.close(); }
}
export async function document(file: string) {
  const result = await vault('read', { path: file });
  const parsed = matter(result.content);
  return { path: file, fullPath: file, frontmatter: parsed.data, content: parsed.content, rawContent: result.content,
    stats: { size: result.sizeBytes, mtime: Date.parse(result.modifiedAt), ctime: Date.parse(result.modifiedAt) } };
}
export function failure(error: unknown) {
  return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
}
