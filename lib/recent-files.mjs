import { newestFirst } from './file-order.mjs';
import { FOLDER_LIMIT_WARNING, isOrdinaryNote, scanContentFiles } from './content-view.mjs';

// Ordinary is opt-in so existing non-UI consumers keep their previous scope.
export async function recentFiles(listFolder, limit = 50, { ordinary = false } = {}) {
  if (ordinary) {
    const scan = await scanContentFiles(listFolder);
    const notes = scan.items.filter((item) => isOrdinaryNote(item.path));
    return { ...scan, items: notes.slice(0, limit), total: notes.length };
  }
  const notes = [];
  let incomplete = false;
  async function walk(folder = '') {
    const { items } = await listFolder(folder);
    if (items.length >= 1000) incomplete = true;
    for (const item of items) {
      if (item.kind === 'folder') {
        const name = item.path.split('/').pop();
        if (name !== 'archive' && !name.endsWith('.assets')) await walk(item.path);
      } else if (/\.md$/i.test(item.path)) {
        notes.push({ ...item, name: item.path.split('/').pop(), mtime: Date.parse(item.modifiedAt) });
      }
    }
  }
  await walk();
  notes.sort(newestFirst);
  return { items: notes.slice(0, limit), total: notes.length, incomplete, listingWarning: incomplete ? FOLDER_LIMIT_WARNING : null };
}
