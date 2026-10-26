import { vault, document, failure } from '@/lib/vault-client';
import { vaultRoot, vaultName } from '@/lib/desktop';
import { recentFiles } from '@/lib/recent-files.mjs';
export async function GET(request: Request) {
  try {
    const requested = Number(new URL(request.url).searchParams.get('limit') || 50);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(50, Math.floor(requested))) : 50;
    const data = await recentFiles((path: string) => vault('list', { path, recursive: false, limit: 1000 }), limit);
    const items = data.items;
    const files = await Promise.all(items.map(async (i: any) => {
      const d = await document(i.path);
      return { path: i.path, relativePath: i.path, name: i.path.split('/').pop(), size: i.sizeBytes, mtime: Date.parse(i.modifiedAt), category: 'Note', title: d.frontmatter.title || i.path.split('/').pop(), preview: d.content.slice(0,200), frontmatter: d.frontmatter };
    }));
    return Response.json({ files, count: files.length, totalFiles: data.total, listingWarning: data.incomplete ? 'A folder contains 1000 or more entries; this list may be incomplete.' : null, vaultRoot: vaultName() ?? 'Selected Vault', vaultPath: vaultRoot() });
  } catch (error) { return failure(error); }
}
