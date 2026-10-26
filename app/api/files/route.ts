import { NextRequest } from 'next/server';
import { vault, failure } from '@/lib/vault-client';
import { vaultRoot, vaultName } from '@/lib/desktop';
import { newestFirst, folderOrder } from '@/lib/file-order.mjs';
export async function GET(request: NextRequest) {
  try {
    const currentPath = request.nextUrl.searchParams.get('path') || '';
    // recursive is opt-in: the folder tree stays lazy, while views that need a
    // whole subtree (the archive) make one request instead of many.
    const recursive = request.nextUrl.searchParams.get('recursive') === '1';
    const result = await vault('list', { path: currentPath, recursive, limit: 1000 });
    const entries = result.items.map((item: any) => ({ name: item.path.split('/').pop(), path: item.path, relativePath: item.path, size: item.sizeBytes, mtime: Date.parse(item.modifiedAt), kind: item.kind }));
    const root = vaultRoot();
    return Response.json({ files: entries.filter((i: any) => i.kind === 'file').sort(newestFirst), directories: entries.filter((i: any) => i.kind === 'folder').sort(folderOrder), currentPath, recursive, exists: true, vaultRoot: root ? vaultName() : 'Selected Vault', vaultPath: root, vaultMissing: !root });
  } catch (error) { return failure(error); }
}
