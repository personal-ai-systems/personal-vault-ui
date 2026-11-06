import { newestFirst } from './file-order.mjs';

// These are known Vault service locations, not a general folder-name heuristic.
// In particular, projects/logs, custom/app and structured user notes stay visible.
const SERVICE_ROOTS = ['indexes', 'logs', 'tmp', 'config', 'structured/assistant-infrastructure'];
const LIFECYCLE_ROOTS = ['archive', '.trash'];
const SERVICE_FILES = new Set([
  'AGENTS.md',
  'README.md',
  'app/api/projects/route.ts',
  'app/api/projects/[project]/route.ts',
]);
const EXPORT_ROOTS = ['exports', 'output'];
const READABLE_EXTENSIONS = new Set(['md', 'txt', 'json', 'jsonl', 'csv', 'yaml', 'yml']);

export const FOLDER_LIST_LIMIT = 1000;
export const FOLDER_LIMIT_WARNING = 'A folder contains 1000 or more files and folders; this list may be incomplete.';

function cleanPath(value) {
  return String(value ?? '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '');
}

function within(path, root) {
  return path === root || path.startsWith(`${root}/`);
}

export function isOrdinaryPath(value) {
  const path = cleanPath(value);
  return !SERVICE_FILES.has(path)
    && !SERVICE_ROOTS.some((root) => within(path, root))
    && !LIFECYCLE_ROOTS.some((root) => within(path, root));
}

export function isExportPath(value) {
  const path = cleanPath(value);
  return EXPORT_ROOTS.some((root) => within(path, root));
}

export function extensionOf(value) {
  const name = cleanPath(value).split('/').pop() || '';
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1].toLowerCase() : '';
}

export function isOrdinaryNote(value) {
  return isOrdinaryPath(value) && !isExportPath(value) && extensionOf(value) === 'md';
}

export function isReadableContent(value) {
  return isOrdinaryPath(value) && READABLE_EXTENSIONS.has(extensionOf(value));
}

export function isReadableFile(value) {
  return READABLE_EXTENSIONS.has(extensionOf(value));
}

export function fileType(value) {
  const extension = extensionOf(value);
  if (extension === 'md') return 'Note';
  if (extension === 'pdf') return 'PDF';
  if (['doc', 'docx', 'odt', 'rtf', 'pages', 'txt'].includes(extension)) return 'Document';
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'heic', 'heif', 'avif', 'tif', 'tiff', 'bmp'].includes(extension)) return 'Image';
  if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv', 'mpeg', 'mpg'].includes(extension)) return 'Video';
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'aiff'].includes(extension)) return 'Audio';
  if (['xls', 'xlsx', 'ods', 'csv', 'tsv', 'numbers'].includes(extension)) return 'Spreadsheet';
  if (['ppt', 'pptx', 'odp', 'key'].includes(extension)) return 'Presentation';
  return 'Other';
}

// A saved date prefix is stable evidence. Never infer a creation date from a
// frontmatter guess or an import's modification time. UTC makes fallback groups
// portable rather than dependent on the timezone of the machine running Next.
export function contentDate(item) {
  const name = cleanPath(item.path).split('/').pop() || '';
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[-_. ]|$)/.exec(name);
  if (match) {
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const timestamp = Date.parse(`${date}T00:00:00.000Z`);
    if (Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date) {
      return { groupYear: match[1], groupMonth: match[2], groupDate: date, dateSource: 'filename' };
    }
  }
  const timestamp = Date.parse(item.modifiedAt);
  if (Number.isFinite(timestamp)) {
    const date = new Date(timestamp).toISOString();
    return { groupYear: date.slice(0, 4), groupMonth: date.slice(5, 7), groupDate: date, dateSource: 'modifiedAt' };
  }
  return { groupYear: null, groupMonth: null, groupDate: null, dateSource: 'unknown' };
}

export function materialFile(item) {
  const path = cleanPath(item.path);
  const name = path.split('/').pop() || path;
  const type = fileType(path);
  const modified = Date.parse(item.modifiedAt);
  return {
    ...item,
    path,
    relativePath: path,
    name,
    title: extensionOf(path) === 'md'
      ? name.replace(/\.md$/i, '').replace(/^\d{4}-\d{2}-\d{2}[-_ ]+/, '').replace(/^openai[-_ ]+/i, '').replace(/[-_]+/g, ' ').trim() || name
      : name,
    kind: 'file',
    size: item.sizeBytes,
    mtime: Number.isFinite(modified) ? modified : 0,
    extension: extensionOf(path),
    type,
    category: type,
    ...contentDate(item),
  };
}

/**
 * Walk ordinary material through the generic Vault listing adapter. No local
 * filesystem access or replacement storage implementation belongs in the UI.
 * Owned note.assets folders travel with their sibling note; orphan .assets
 * folders remain discoverable instead of vanishing behind a suffix filter.
 *
 * @param {(path: string) => Promise<{items: any[]}>} listFolder
 */
export async function scanContentFiles(listFolder) {
  const items = [];
  const orphanAssetFolders = [];
  const ownedAssetFolders = [];
  let incomplete = false;
  async function walk(folder = '') {
    const { items: entries } = await listFolder(folder);
    if (entries.length >= FOLDER_LIST_LIMIT) incomplete = true;
    const siblingNotes = new Set(entries
      .filter((entry) => entry.kind === 'file' && extensionOf(entry.path) === 'md')
      .map((entry) => cleanPath(entry.path).replace(/\.md$/i, '')));
    for (const item of entries) {
      const path = cleanPath(item.path);
      if (!isOrdinaryPath(path)) continue;
      if (item.kind === 'folder') {
        if (/\.assets$/i.test(path)) {
          if (siblingNotes.has(path.replace(/\.assets$/i, ''))) {
            ownedAssetFolders.push(path);
            continue;
          }
          orphanAssetFolders.push(path);
        }
        await walk(path);
      } else {
        items.push(materialFile({ ...item, path }));
      }
    }
  }
  await walk();
  items.sort(newestFirst);
  const warnings = [];
  if (incomplete) warnings.push(FOLDER_LIMIT_WARNING);
  if (orphanAssetFolders.length) {
    warnings.push(`${orphanAssetFolders.length} attachment folder${orphanAssetFolders.length === 1 ? ' has' : 's have'} no matching memory file; their files remain listed separately.`);
  }
  return { items, incomplete, warnings, listingWarning: warnings.join(' ') || null, orphanAssetFolders, ownedAssetFolders };
}

export function selectMaterials(items, kind = 'notes') {
  if (kind === 'notes') return items.filter((item) => isOrdinaryNote(item.path));
  if (kind === 'files') return items.filter((item) => isOrdinaryPath(item.path) && extensionOf(item.path) !== 'md');
  if (kind === 'exports') return items.filter((item) => isOrdinaryPath(item.path) && isExportPath(item.path));
  throw new Error('Choose Memory, Files or Exports.');
}

/** Which empty state a collection should show, or null when it has rows.
 * An empty collection and a filter that hides every row are different
 * situations: the first invites creating content, the second invites clearing
 * filters. Conflating them tells a user their memory is empty when it is not.
 * @param {{total: number, visible: number}} counts rows before and after filters
 * @returns {'empty' | 'no-matches' | null}
 */
export function emptyState({ total, visible }) {
  if (visible > 0) return null;
  return total > 0 ? 'no-matches' : 'empty';
}

export function groupMaterials(items) {
  const grouped = new Map();
  for (const file of items) {
    const key = `${file.groupYear || ''}/${file.groupMonth || ''}`;
    if (!grouped.has(key)) grouped.set(key, { year: file.groupYear, month: file.groupMonth, files: [] });
    grouped.get(key).files.push(file);
  }
  return [...grouped.values()].sort((a, b) => `${b.year || ''}/${b.month || ''}`.localeCompare(`${a.year || ''}/${a.month || ''}`));
}

/** Search ordinary filenames and readable content before limiting results.
 * The generic MCP search caps its matches before UI classification, which can
 * otherwise let technical files crowd out every actual user note.
 * @param {(path: string) => Promise<{items: any[]}>} listFolder
 * @param {(path: string) => Promise<any>} readFile
 * @param {string} query
 * @param {{limit?: number, concurrency?: number, signal?: AbortSignal, candidatePaths?: string[]}} options
 */
export async function searchContentFiles(listFolder, readFile, query, { limit = 100, concurrency = 6, signal, candidatePaths } = {}) {
  const scan = await scanContentFiles(listFolder);
  return searchScannedFiles(scan, readFile, query, { limit, concurrency, signal, candidatePaths });
}

/** Search an already selected collection. Select the collection before matching
 * or limiting results, so e.g. a Recent search cannot include older memory.
 * Callers supply the inventory through the generic Vault adapter, never fs.
 * @param {{items: any[], warnings?: string[], listingWarning?: string | null, [key: string]: any}} scan
 * @param {(path: string) => Promise<any>} readFile
 * @param {string} query
 * @param {{limit?: number, concurrency?: number, signal?: AbortSignal, candidatePaths?: string[], matchPaths?: boolean}} options
 */
export async function searchScannedFiles(scan, readFile, query, { limit = 100, concurrency = 6, signal, candidatePaths, matchPaths = false } = {}) {
  // An uncapped generic search can supply candidates. Reaching its result cap
  // must instead search the ordinary files themselves, before limiting results.
  const candidates = candidatePaths ? new Set(candidatePaths.map(cleanPath)) : null;
  const readable = scan.items.filter((item) => isReadableFile(item.path) && (!candidates || candidates.has(item.path)));
  const byPath = new Map();
  const unreadableFiles = [];
  const needle = query.toLowerCase();
  if (needle.trim()) {
    for (const item of scan.items) {
      const filenameMatch = item.name.toLowerCase().includes(needle);
      const pathMatch = matchPaths && String(item.originalPath || item.path).toLowerCase().includes(needle);
      if (!filenameMatch && !pathMatch) continue;
      // A filename match needs no binary/text read. Content matches below can
      // enrich this same row rather than adding a duplicate result.
      byPath.set(item.path, {
        ...item,
        matches: [filenameMatch ? 'filename' : 'path'],
        preview: item.name,
        document: { frontmatter: {}, stats: { size: item.size, mtime: item.mtime }, metadataError: null },
      });
    }
  }
  let cursor = 0;
  async function worker() {
    while (cursor < readable.length) {
      if (signal?.aborted) throw new Error('Search was cancelled.');
      const item = readable[cursor++];
      try {
        const document = await readFile(item.path);
        const content = String(document.rawContent ?? document.content ?? '');
        const index = content.toLowerCase().indexOf(needle);
        if (signal?.aborted) throw new Error('Search was cancelled.');
        if (index >= 0) {
          const filenameMatch = byPath.get(item.path);
          byPath.set(item.path, {
            ...item,
            matches: filenameMatch ? [...filenameMatch.matches, 'content'] : ['content'],
            preview: content.slice(Math.max(0, index - 120), index + needle.length + 280).replace(/\s+/g, ' ').trim(),
            // Keep only metadata after checking the body; large matching files
            // must not all remain in memory just to show a short result row.
            document: { frontmatter: document.frontmatter || {}, stats: document.stats, metadataError: document.metadataError || null },
          });
        }
      } catch (error) {
        if (signal?.aborted) throw error;
        unreadableFiles.push(item.path);
      }
    }
  }
  if (needle.trim()) await Promise.all(Array.from({ length: Math.max(1, Math.min(12, concurrency, readable.length)) }, worker));
  const matches = [...byPath.values()];
  matches.sort(newestFirst);
  const warnings = [...(scan.warnings || [])];
  if (unreadableFiles.length) warnings.push(`${unreadableFiles.length} readable file${unreadableFiles.length === 1 ? '' : 's'} could not be searched.`);
  if (matches.length > limit) warnings.push(`Showing the newest ${limit} of ${matches.length} matching files. Refine your search to narrow the results.`);
  return { ...scan, items: matches.slice(0, limit), total: matches.length, unreadableFiles, searchWarning: warnings.join(' ') || null };
}
