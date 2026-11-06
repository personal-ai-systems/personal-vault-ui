import { NextRequest } from 'next/server';
import { vault, document, failure } from '@/lib/vault-client';
import { searchScope, searchSectionFiles } from '@/lib/search-scope.mjs';
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    const scope = searchScope(request.nextUrl.searchParams.get('scope') || 'ordinary');
    if (!query.trim()) return Response.json({ results: [], count: 0, query, scope });
    const data = scope === 'deleted' ? null : await vault('search', { query, limit: 100 });
    const matches = (data?.matches || []) as any[];
    const searched = await searchSectionFiles(
      (path: string) => vault('list', { path, recursive: false, limit: 1000 }),
      document,
      query,
      { scope, limit: 100, signal: request.signal,
        listDeleted: () => vault('list_deleted', { limit: 200 }),
        // Below the generic tool's cap, only matching bodies need reading.
        // At its cap, scan the selected collection before limiting matches.
        candidatePaths: matches.length < 100 ? matches.map((item) => item.path) : undefined },
    );
    const results = searched.items.map((item: any) => ({
      path: item.path,
      relativePath: item.path,
      name: item.name,
      content: item.preview,
      score: 1,
      matches: item.matches,
      type: item.type,
      extension: item.extension,
      frontmatter: item.document.frontmatter,
      size: item.document.stats.size,
      mtime: item.document.stats.mtime,
      metadataError: item.document.metadataError || null,
    }));
    return Response.json({ results, count: results.length, totalMatches: searched.total, query, scope, listingWarning: searched.listingWarning, searchWarning: searched.searchWarning });
  } catch (error) { return failure(error); }
}
