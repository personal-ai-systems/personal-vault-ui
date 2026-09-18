import { vault, document, failure } from '@/lib/vault-client';
export async function GET() {
  try {
    const data = await vault('list', { recursive: true, limit: 1000 });
    const items = data.items.filter((i: any) => i.kind === 'file' && i.path.endsWith('.md')).sort((a: any,b: any) => b.modifiedAt.localeCompare(a.modifiedAt)).slice(0,50);
    const files = await Promise.all(items.map(async (i: any) => {
      const d = await document(i.path);
      return { path: i.path, relativePath: i.path, name: i.path.split('/').pop(), size: i.sizeBytes, mtime: Date.parse(i.modifiedAt), category: 'Note', title: d.frontmatter.title || i.path.split('/').pop(), preview: d.content.slice(0,200), frontmatter: d.frontmatter };
    }));
    return Response.json({ files, count: files.length, totalFiles: items.length, vaultRoot: 'Selected Vault' });
  } catch (error) { return failure(error); }
}
