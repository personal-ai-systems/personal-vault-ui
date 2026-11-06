import { NextRequest } from 'next/server';
import { vault, failure } from '@/lib/vault-client';
import { vaultRoot, vaultName } from '@/lib/desktop';
import { groupMaterials, scanContentFiles, selectMaterials } from '@/lib/content-view.mjs';

export async function GET(request: NextRequest) {
  try {
    const kind = request.nextUrl.searchParams.get('kind') || 'notes';
    if (!['notes', 'files', 'exports'].includes(kind)) throw new Error('Choose Notes, Files or Exports.');
    const scan = await scanContentFiles((path: string) => vault('list', { path, recursive: false, limit: 1000 }));
    const files = selectMaterials(scan.items, kind);
    return Response.json({
      kind,
      files,
      groups: groupMaterials(files),
      count: files.length,
      totalFiles: files.length,
      listingWarning: scan.listingWarning,
      orphanAssetFolders: scan.orphanAssetFolders,
      vaultRoot: vaultName() ?? 'Selected Vault',
      vaultPath: vaultRoot(),
    });
  } catch (error) { return failure(error); }
}
