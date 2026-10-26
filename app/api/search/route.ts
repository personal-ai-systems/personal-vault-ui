import { NextRequest } from 'next/server';
import { vault, document, failure } from '@/lib/vault-client';
import { readNotesSettled } from '@/lib/frontmatter.mjs';
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) return Response.json({ results: [], count: 0, query });
    const data = await vault('search', { query, limit: 100 });
    const matches = data.matches as any[];
    // One unreadable note must not turn the whole result set into an error.
    const settled = await readNotesSettled(matches.map((item) => item.path), document);
    const results = settled.map((entry: any, index: number) => {
      const item = matches[index];
      const name = entry.path.split('/').pop();
      const meta = { path: entry.path, relativePath: entry.path, name, content: item.preview, score: 1, matches: ['content'] };
      if (!entry.ok) return { ...meta, frontmatter: {}, size: 0, mtime: 0, metadataError: entry.error };
      const file = entry.value;
      return { ...meta, frontmatter: file.frontmatter, size: file.stats.size, mtime: file.stats.mtime, metadataError: file.metadataError || null };
    });
    return Response.json({ results, count: results.length, totalMatches: results.length, query });
  } catch (error) { return failure(error); }
}
