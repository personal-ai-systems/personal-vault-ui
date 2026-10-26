import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import matter from './frontmatter';

export async function vault(operation: string, args: Record<string, unknown> = {}) {
  const client = new Client({ name: 'personal-vault-ui', version: '0.1.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(process.env.PERSONAL_VAULT_MCP_URL || 'http://127.0.0.1:8788/mcp'), {
      requestInit: { headers: process.env.PERSONAL_VAULT_TOKEN ? { Authorization: `Bearer ${process.env.PERSONAL_VAULT_TOKEN}` } : {} },
    }));
    const result = await client.callTool({ name: `vault_files_${operation}`, arguments: args });
    if (result.isError) throw new Error(Array.isArray(result.content) ? result.content.map((item: any) => item.text || '').join(' ') : 'Vault operation failed');
    return result.structuredContent as any;
  } finally { await client.close(); }
}
export async function document(file: string) {
  const result = await vault('read', { path: file });
  const parsed = matter(result.content);
  return { path: file, fullPath: file, frontmatter: parsed.data, content: parsed.content, rawContent: result.content,
    // Non-null when the file's metadata is not valid YAML. The caller shows
    // rawContent and a warning instead of failing the request.
    metadataError: parsed.metadataError,
    stats: { size: result.sizeBytes, mtime: Date.parse(result.modifiedAt), ctime: Date.parse(result.modifiedAt) } };
}

/**
 * YAML parser messages name byte offsets inside a file the reader cannot see.
 * They are an implementation detail, not a user-facing error.
 */
const PARSER_LEAK = /bad indentation of a mapping entry|unexpected end of the stream|can not read a block mapping entry|duplicated mapping key|incomplete explicit mapping pair|end of the stream or a document separator|unacceptable character/i;

export function failure(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const message = PARSER_LEAK.test(raw) ? 'This note could not be read.' : raw;
  return Response.json({ error: message }, { status: 400 });
}
