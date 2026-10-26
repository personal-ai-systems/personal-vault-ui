import { NextRequest } from 'next/server';
import { vault, document, failure } from '@/lib/vault-client';
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) return Response.json({ results: [], count: 0, query });
    const data = await vault('search', { query, limit: 100 });
    const results = await Promise.all(data.matches.map(async (item: any) => {
      const file = await document(item.path);
      return { path: item.path, relativePath: item.path, name: item.path.split('/').pop(), content: item.preview, frontmatter: file.frontmatter, size: file.stats.size, mtime: file.stats.mtime, score: 1, matches: ['content'] };
    }));
    return Response.json({ results, count: results.length, totalMatches: results.length, query });
  } catch (error) { return failure(error); }
}
