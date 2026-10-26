import { vault, document, failure } from '@/lib/vault-client';
import { vaultRoot, vaultName } from '@/lib/desktop';
import { recentFiles } from '@/lib/recent-files.mjs';
import { readNotesSettled } from '@/lib/frontmatter.mjs';
export async function GET(request: Request) {
  try {
    const requested = Number(new URL(request.url).searchParams.get('limit') || 50);
    const limit = Number.isFinite(requested) ? Math.max(1, Math.min(50, Math.floor(requested))) : 50;
    const data = await recentFiles((path: string) => vault('list', { path, recursive: false, limit: 1000 }), limit);
    const items = data.items as any[];
    // Read every note independently: one note with unreadable metadata must
    // degrade to a marked row, not blank the whole Recent list.
    const settled = await readNotesSettled(items.map((i) => i.path), document);
    const files = settled.map((entry: any, index: number) => {
      const i = items[index];
      const name = entry.path.split('/').pop();
      const meta = { path: entry.path, relativePath: entry.path, name, size: i.sizeBytes, mtime: Date.parse(i.modifiedAt), category: 'Note' };
      if (!entry.ok) return { ...meta, title: name, preview: '', frontmatter: {}, metadataError: entry.error };
      const d = entry.value;
      const metadataError = d.metadataError || null;
      return {
        ...meta,
        title: typeof d.frontmatter?.title === 'string' && d.frontmatter.title.trim()
          ? d.frontmatter.title : name,
        // Raw frontmatter would render as a stray "---" in a two-line preview.
        preview: metadataError ? '' : String(d.content || '').trim().slice(0, 200),
        frontmatter: d.frontmatter,
        metadataError,
      };
    });
    return Response.json({ files, count: files.length, totalFiles: data.total, listingWarning: data.incomplete ? 'A folder contains 1000 or more entries; this list may be incomplete.' : null, vaultRoot: vaultName() ?? 'Selected Vault', vaultPath: vaultRoot() });
  } catch (error) { return failure(error); }
}
