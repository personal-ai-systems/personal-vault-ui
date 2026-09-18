import { NextRequest } from 'next/server';
import { vault, failure } from '@/lib/vault-client';
export async function GET(request: NextRequest) {
  try {
    const currentPath = request.nextUrl.searchParams.get('path') || '';
    const result = await vault('list', { path: currentPath, limit: 1000 });
    const entries = result.items.map((item: any) => ({ name: item.path.split('/').pop(), path: item.path, relativePath: item.path, size: item.sizeBytes, mtime: Date.parse(item.modifiedAt), kind: item.kind }));
    return Response.json({ files: entries.filter((i: any) => i.kind === 'file'), directories: entries.filter((i: any) => i.kind === 'folder'), currentPath, exists: true, vaultRoot: 'Selected Vault' });
  } catch (error) { return failure(error); }
}
