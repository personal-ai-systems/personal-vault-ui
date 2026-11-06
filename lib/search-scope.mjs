import { newestFirst } from './file-order.mjs';
import { FOLDER_LIST_LIMIT, FOLDER_LIMIT_WARNING, extensionOf, materialFile, scanContentFiles, searchScannedFiles, selectMaterials } from './content-view.mjs';

export const SEARCH_SCOPES = ['ordinary', 'recent', 'memory', 'all', 'archive', 'deleted'];

/** Keep old explicit scopes working; an unknown value must never broaden access. */
export function searchScope(value = 'ordinary') {
  const scope = ({ notes: 'memory', files: 'all', browse: 'all' })[value] || value;
  if (!SEARCH_SCOPES.includes(scope)) throw new Error('Choose a valid search section.');
  return scope;
}

// All Files uses the same visible-file listing as the original browser. Hidden
// items and symlinks remain subject to the shared Vault library's rules; this
// adapter does not change those rules. Archive hides paired assets like its view.
async function scanVisibleFiles(listFolder, { root = '', hideOwnedAssets = false, allowMissingRoot = false, signal } = {}) {
  const items = [];
  let incomplete = false;
  async function walk(folder) {
    if (signal?.aborted) throw new Error('Search was cancelled.');
    let entries;
    try { ({ items: entries } = await listFolder(folder)); }
    catch (error) {
      // The current shared library already returns [] for a missing folder.
      // A legacy adapter may instead preserve code=ENOENT or the MCP error
      // text. Only the initial absent Archive is an empty collection; never
      // swallow permissions, connection errors or a disappearing child.
      const missing = error?.code === 'ENOENT' || /^ENOENT\b/.test(String(error?.message || ''));
      if (allowMissingRoot && folder === root && missing) return;
      throw error;
    }
    if (entries.length >= FOLDER_LIST_LIMIT) incomplete = true;
    const owners = new Set(entries.filter(item => item.kind === 'file' && extensionOf(item.path) === 'md').map(item => item.path.replace(/\.md$/i, '')));
    for (const entry of entries) {
      if (entry.kind === 'folder') {
        if (hideOwnedAssets && /\.assets$/i.test(entry.path) && owners.has(entry.path.replace(/\.assets$/i, ''))) continue;
        await walk(entry.path);
      } else items.push(materialFile(entry));
    }
  }
  await walk(root);
  items.sort(newestFirst);
  const warnings = incomplete ? [FOLDER_LIMIT_WARNING] : [];
  return { items, incomplete, warnings, listingWarning: warnings.join(' ') || null };
}

/** Inventory and search a selected section without introducing storage access.
 * @param {(path: string) => Promise<{items: any[]}>} listFolder
 * @param {(path: string) => Promise<any>} readFile
 * @param {string} query
 * @param {{scope?: string, limit?: number, concurrency?: number, signal?: AbortSignal, candidatePaths?: string[], listDeleted?: () => Promise<any>}} options
 */
export async function searchSectionFiles(listFolder, readFile, query, options = {}) {
  const scope = searchScope(options.scope);
  let scan;
  if (scope === 'all' || scope === 'archive') {
    scan = await scanVisibleFiles(listFolder, { root: scope === 'archive' ? 'archive' : '', hideOwnedAssets: scope === 'archive', allowMissingRoot: scope === 'archive', signal: options.signal });
  } else if (scope === 'deleted') {
    if (!options.listDeleted) throw new Error('Recently Deleted search is unavailable.');
    // Same inventory/limit as Recently Deleted. Do not infer original locations
    // for legacy entries or try to read unsupported items such as symlinks.
    const deleted = await options.listDeleted();
    const warnings = [];
    if (deleted.truncated) warnings.push('This is a partial list. More deleted files may be present.');
    if (deleted.unsupported?.length) warnings.push(`${deleted.unsupported.length} older deleted item(s) need manual recovery and were not searched.`);
    scan = { items: (deleted.items || []).map(materialFile).sort(newestFirst), warnings, listingWarning: warnings.join(' ') || null };
  } else {
    scan = await scanContentFiles(listFolder);
    if (scope === 'memory' || scope === 'recent') {
      scan.items = selectMaterials(scan.items, 'notes');
      // This is the same newest 50 used by /api/recent, selected before search.
      if (scope === 'recent') scan.items = scan.items.slice(0, 50);
    }
  }
  const results = await searchScannedFiles(scan, readFile, query, {
    ...options,
    // Generic full-Vault content search omits .trash; never use its candidates
    // to eliminate valid content in the dedicated deleted-file inventory.
    candidatePaths: scope === 'deleted' ? undefined : options.candidatePaths,
    matchPaths: scope === 'all' || scope === 'archive' || scope === 'deleted',
  });
  return { ...results, scope };
}
