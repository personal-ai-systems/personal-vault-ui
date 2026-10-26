import assert from 'node:assert/strict';
import { newestFirst, folderOrder } from '../lib/file-order.mjs';
import { recentFiles } from '../lib/recent-files.mjs';
import { vaultLink } from '../lib/vault-links.mjs';

assert.deepEqual([{ name: '2029-old.md', mtime: 10 }, { name: '2020-new.md', mtime: 20 }].sort(newestFirst).map(i => i.name), ['2020-new.md', '2029-old.md']);
assert.deepEqual([{ name: '2024' }, { name: '2026' }].sort(folderOrder).map(i => i.name), ['2026', '2024']);
assert.deepEqual([{ name: '01' }, { name: '10' }].sort(folderOrder).map(i => i.name), ['10', '01']);
assert.deepEqual([{ name: 'structured' }, { name: 'raw' }].sort(folderOrder).map(i => i.name), ['raw', 'structured']);
const note = (p, day) => ({ path: p, kind: 'file', modifiedAt: `2099-01-${String(day).padStart(2, '0')}T00:00:00Z` });
const tree = {
  '': { items: ['early', 'late', 'archive', 'image.assets'].map(p => ({ path: p, kind: 'folder' })) },
  early: { items: Array.from({ length: 900 }, (_, i) => note(`early/${i}.md`, 1)) },
  late: { items: Array.from({ length: 900 }, (_, i) => note(`late/${i}.md`, 2)) },
};
const recent = await recentFiles(async p => { assert.ok(p in tree); return tree[p]; });
assert.equal(recent.total, 1800); assert.equal(recent.items.length, 50);
assert.ok(recent.items.every(i => i.path.startsWith('late/')));
await assert.rejects(() => recentFiles(async () => { throw new Error('Permission denied'); }), /Permission denied/);
assert.deepEqual(vaultLink('./note.assets/pic.png', 'raw/note.md'), { kind: 'asset', href: '/api/assets/raw/note.assets/pic.png' });
assert.deepEqual(vaultLink('../other.md', 'raw/2026/note.md'), { kind: 'note', path: 'raw/other.md' });
assert.equal(vaultLink('javascript:alert(1)', 'raw/note.md').kind, 'blocked');
assert.equal(vaultLink('https://example.com', 'raw/note.md').kind, 'external');
console.log('UI_RULES_OK: newest-first files/calendar folders, 1800-note Recent scan, visible failures and relative/safe links.');
