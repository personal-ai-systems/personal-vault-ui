import { NextRequest } from 'next/server';
import { vault, failure } from '@/lib/vault-client';
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get('q') || '';
    if (!query.trim()) return Response.json({ results: [], count: 0, query });
    const data = await vault('search', { query, limit: 100 });
    const results = data.matches.map((item: any) => ({ path: item.path, relativePath: item.path, name: item.path.split('/').pop(), content: item.preview, frontmatter: {}, score: 1, matches: ['content'] }));
    return Response.json({ results, count: results.length, totalMatches: results.length, query });
  } catch (error) { return failure(error); }
}
