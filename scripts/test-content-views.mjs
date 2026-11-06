import assert from 'node:assert/strict';
import {
  contentDate,
  emptyState,
  fileType,
  groupMaterials,
  isExportPath,
  isOrdinaryNote,
  isOrdinaryPath,
  scanContentFiles,
  searchContentFiles,
  selectMaterials,
} from '../lib/content-view.mjs';
import { recentFiles } from '../lib/recent-files.mjs';
import { searchScope, searchSectionFiles } from '../lib/search-scope.mjs';

// Adapter fixtures only: no reads or writes against a user's selected Vault.
const folder = (path) => ({ path, kind: 'folder', modifiedAt: '2026-10-30T12:00:00.000Z', sizeBytes: 0 });
const file = (path, modifiedAt = '2026-10-30T12:00:00.000Z') => ({ path, kind: 'file', modifiedAt, sizeBytes: 42 });
const tree = {
  '': [
    file('AGENTS.md'), file('README.md'), file('welcome.md'),
    ...['raw', 'structured', 'custom', 'indexes', 'logs', 'tmp', 'config', 'app', 'archive', '.trash', 'attachments', 'exports', 'output', 'apps', 'application'].map(folder),
  ],
  raw: [file('raw/2026-09-01-capture.md'), folder('raw/2026-09-01-capture.assets'), folder('raw/orphan.assets')],
  // An owned adjacent assets folder must never be separately traversed.
  'raw/orphan.assets': [file('raw/orphan.assets/loose.png')],
  structured: [folder('structured/assistant-infrastructure'), folder('structured/work')],
  'structured/work': [file('structured/work/current-plan.md'), file('structured/work/user-data.json'), file('structured/work/user-output.yaml')],
  custom: [file('custom/README.md'), folder('custom/logs'), folder('custom/archive'), folder('custom/app'), folder('custom/exports')],
  'custom/logs': [file('custom/logs/diary.md')],
  'custom/archive': [file('custom/archive/family-history.md')],
  'custom/app': [file('custom/app/design.md')],
  'custom/exports': [file('custom/exports/ideas.md')],
  app: [file('app/user-note.md'), folder('app/api')],
  'app/api': [folder('app/api/projects')],
  'app/api/projects': [file('app/api/projects/route.ts'), folder('app/api/projects/[project]')],
  'app/api/projects/[project]': [file('app/api/projects/[project]/route.ts')],
  attachments: [file('attachments/legacy.pdf')],
  exports: [file('exports/report.pdf'), file('exports/2026-08-12-published.md')],
  output: [file('output/movie.mp4')],
  apps: [file('apps/user-project.md')],
  application: [file('application/notes.md')],
};
const visited = [];
async function list(path) {
  visited.push(path);
  assert.ok(path in tree, `Unexpectedly traversed hidden/unknown fixture folder: ${path}`);
  return { items: tree[path] };
}

for (const path of ['AGENTS.md', 'README.md', 'indexes', 'indexes/a.md', 'logs/a.md', 'tmp/a.txt', 'config/a.yaml', 'app/api/projects/route.ts', 'app/api/projects/[project]/route.ts', 'structured/assistant-infrastructure/rules.md', 'archive/2026-10-30/raw/a.md', '.trash/a.md']) {
  assert.equal(isOrdinaryPath(path), false, path);
}
for (const path of ['raw/a.md', 'structured/work/current-plan.md', 'custom/logs/diary.md', 'custom/archive/family-history.md', 'custom/README.md', 'app/user-note.md', 'app/api/custom/route.ts', 'apps/user-project.md', 'application/notes.md', 'custom/exports/ideas.md', 'attachments/legacy.pdf']) {
  assert.equal(isOrdinaryPath(path), true, path);
}
assert.equal(isOrdinaryPath('custom\\logs\\diary.md'), true, 'portable path separators');
assert.equal(isOrdinaryNote('exports/published.md'), false, 'exports are not duplicate ordinary notes');
assert.equal(isOrdinaryNote('output/published.md'), false);
assert.equal(isExportPath('custom/exports/ideas.md'), false, 'do not guess custom folder semantics');

const scan = await scanContentFiles(list);
const notes = selectMaterials(scan.items, 'notes');
const files = selectMaterials(scan.items, 'files');
const exports = selectMaterials(scan.items, 'exports');
assert.deepEqual(new Set(notes.map((item) => item.path)), new Set([
  'welcome.md', 'raw/2026-09-01-capture.md', 'structured/work/current-plan.md',
  'custom/README.md', 'custom/logs/diary.md', 'custom/archive/family-history.md',
  'custom/app/design.md', 'custom/exports/ideas.md', 'app/user-note.md', 'apps/user-project.md', 'application/notes.md',
]));
assert.deepEqual(new Set(files.map((item) => item.path)), new Set(['attachments/legacy.pdf', 'exports/report.pdf', 'output/movie.mp4', 'raw/orphan.assets/loose.png', 'structured/work/user-data.json', 'structured/work/user-output.yaml']));
assert.ok(files.some((item) => item.path === 'structured/work/user-data.json'), 'data extensions alone do not prove service ownership');
assert.deepEqual(new Set(exports.map((item) => item.path)), new Set(['exports/report.pdf', 'exports/2026-08-12-published.md', 'output/movie.mp4']));
assert.deepEqual(scan.ownedAssetFolders, ['raw/2026-09-01-capture.assets']);
assert.deepEqual(scan.orphanAssetFolders, ['raw/orphan.assets']);
assert.match(scan.listingWarning, /no matching memory file/);
assert.equal(scan.incomplete, false);
assert.ok(!visited.includes('raw/2026-09-01-capture.assets'));
assert.ok(!visited.includes('archive'));
assert.ok(!visited.includes('structured/assistant-infrastructure'));
assert.throws(() => selectMaterials(scan.items, 'anything'), /Choose Memory/);

const recent = await recentFiles(list, 50, { ordinary: true });
assert.equal(recent.total, notes.length);
assert.deepEqual(new Set(recent.items.map((item) => item.path)), new Set(notes.map((item) => item.path)));
assert.ok(!recent.items.some((item) => isExportPath(item.path)));
// Preserve newest-modified Recent order; date groups are not a new sort rule.
const dated = await recentFiles(async (path) => ({ items: path ? [] : [file('2026-01-01-edited.md', '2026-10-30T00:00:00Z'), file('2026-10-29-new.md', '2026-10-29T00:00:00Z')] }), 50, { ordinary: true });
assert.equal(dated.items[0].path, '2026-01-01-edited.md');

assert.deepEqual(contentDate(file('raw/2024-02-29-valid.md')), { groupYear: '2024', groupMonth: '02', groupDate: '2024-02-29', dateSource: 'filename' });
assert.equal(contentDate(file('raw/2026-02-30-invalid.md')).dateSource, 'modifiedAt');
assert.deepEqual(contentDate(file('undated.md', '2025-12-31T23:30:00-02:00')), { groupYear: '2026', groupMonth: '01', groupDate: '2026-01-01T01:30:00.000Z', dateSource: 'modifiedAt' });
assert.deepEqual(contentDate(file('undated.md', 'unavailable')), { groupYear: null, groupMonth: null, groupDate: null, dateSource: 'unknown' });
const groups = groupMaterials(notes);
assert.deepEqual(groups.map((group) => `${group.year}/${group.month}`), ['2026/10', '2026/09']);
assert.ok(groups.every((group) => group.files.every((item) => item.relativePath === item.path && item.name && Number.isFinite(item.mtime))));
assert.equal(fileType('deck.PPTX'), 'Presentation');
assert.equal(fileType('photo.HEIC'), 'Image');
assert.equal(fileType('video.mp4'), 'Video');
assert.equal(fileType('receipt.pdf'), 'PDF');

// Never silently stop a whole-Vault collection at 1000 total files. The cap is
// per folder, and reaching it is explicitly disclosed to the caller.
const large = await scanContentFiles(async (path) => ({ items: path === '' ? [folder('one'), folder('two')] : Array.from({ length: 1000 }, (_, index) => file(`${path}/${index}.md`)) }));
assert.equal(large.items.length, 2000);
assert.equal(large.incomplete, true);
assert.match(large.listingWarning, /may be incomplete/);
await assert.rejects(() => scanContentFiles(async () => { throw new Error('Permission denied'); }), /Permission denied/);

let active = 0;
let peakActive = 0;
const read = async (path) => {
  active++;
  peakActive = Math.max(peakActive, active);
  await Promise.resolve();
  active--;
  if (path === 'custom/README.md') throw new Error('not readable');
  return { rawContent: 'Saved material containing SPARK and more text.', frontmatter: {}, stats: { size: 42, mtime: 10 } };
};
const search = await searchContentFiles(list, read, 'spark', { limit: 2, concurrency: 3 });
assert.equal(search.total, notes.length + 2, 'search includes the published markdown export and user data, minus one unreadable ordinary file');
assert.equal(search.items.length, 2);
assert.equal(peakActive, 3, 'bounded read fanout');
assert.deepEqual(search.unreadableFiles, ['custom/README.md']);
assert.match(search.searchWarning, /could not be searched/);
assert.match(search.searchWarning, /Showing the newest 2/);
assert.ok(search.items.every((item) => item.preview.includes('SPARK')));
// More than 100 hidden service entries cannot crowd the ordinary match out.
const afterService = await searchContentFiles(async (path) => ({ items: path === '' ? [folder('logs'), file('user-note.md')] : assert.fail('service files must not be read') }), async () => ({ content: 'spark' }), 'spark');
assert.equal(afterService.total, 1);
assert.equal(afterService.items[0].path, 'user-note.md');
const candidatesRead = [];
const candidateSearch = await searchContentFiles(list, async (path) => {
  candidatesRead.push(path);
  return { content: 'spark' };
}, 'spark', { candidatePaths: ['AGENTS.md', 'logs/technical.md', 'structured/work/current-plan.md', 'raw/2026-09-01-capture.assets/data.json'] });
assert.deepEqual(candidatesRead, ['structured/work/current-plan.md'], 'uncapped MCP candidates skip unnecessary body reads and still enforce ordinary scope/owned assets');
assert.equal(candidateSearch.total, 1);
const noCandidates = await searchContentFiles(list, async () => assert.fail('no matching content needs a read'), 'spark', { candidatePaths: [] });
assert.equal(noCandidates.total, 0);

const filenameTree = {
  '': [folder('raw'), folder('logs'), file('AGENTS.md')],
  raw: [
    file('raw/spark-photo.PNG', '2026-10-30T00:00:00Z'),
    file('raw/spark-video.mp4', '2026-10-29T00:00:00Z'),
    file('raw/spark-summary.md', '2026-10-28T00:00:00Z'),
    file('raw/spark-reference.md', '2026-10-27T00:00:00Z'),
    folder('raw/spark-reference.assets'),
  ],
};
const filenameList = async (path) => {
  assert.ok(path in filenameTree, `technical/owned assets must not be traversed: ${path}`);
  return { items: filenameTree[path] };
};
const filenameReads = [];
const filenameRead = async (path) => {
  filenameReads.push(path);
  assert.match(path, /\.md$/, 'binary filename matches never use the text/document reader');
  return { content: path.endsWith('spark-reference.md') ? 'spark in the body too' : 'unrelated body', stats: { size: 42, mtime: 1 }, frontmatter: {} };
};
const filenamesOnly = await searchContentFiles(filenameList, filenameRead, 'SPARK', { candidatePaths: [] });
assert.equal(filenamesOnly.total, 4, 'filename matches survive omission from uncapped content candidates');
assert.deepEqual(filenameReads, [], 'filename-only matches need no body or binary read');
assert.deepEqual(filenamesOnly.items.map((item) => item.path), ['raw/spark-photo.PNG', 'raw/spark-video.mp4', 'raw/spark-summary.md', 'raw/spark-reference.md']);
const pngResult = filenamesOnly.items[0];
assert.deepEqual(pngResult.matches, ['filename']);
assert.deepEqual(pngResult.document, { frontmatter: {}, stats: { size: 42, mtime: Date.parse('2026-10-30T00:00:00Z') }, metadataError: null });
assert.equal(pngResult.type, 'Image');
const combinedNames = await searchContentFiles(filenameList, filenameRead, 'spark');
assert.equal(combinedNames.total, 4, 'a content+filename match is one row');
assert.deepEqual(filenameReads.sort(), ['raw/spark-reference.md', 'raw/spark-summary.md']);
assert.deepEqual(combinedNames.items.find((item) => item.path.endsWith('spark-reference.md')).matches, ['filename', 'content']);
assert.deepEqual(combinedNames.items.find((item) => item.path.endsWith('spark-summary.md')).matches, ['filename']);
const filenameCap = await searchContentFiles(filenameList, filenameRead, 'spark', { limit: 1, candidatePaths: [] });
assert.equal(filenameCap.items[0].path, 'raw/spark-photo.PNG');
assert.equal(filenameCap.total, 4);
assert.match(filenameCap.searchWarning, /Showing the newest 1 of 4/);
const technicalName = await searchContentFiles(filenameList, async () => assert.fail('technical filename must be excluded before reads'), 'AGENTS', { candidatePaths: [] });
assert.equal(technicalName.total, 0);

// An empty collection and an over-narrow filter are different messages: telling
// someone their memory is empty when a year filter hid it is a factual error.
assert.equal(emptyState({ total: 0, visible: 0 }), 'empty', 'a genuinely empty collection invites creating content');
assert.equal(emptyState({ total: 12, visible: 0 }), 'no-matches', 'a filter that hides every row offers Clear filters');
assert.equal(emptyState({ total: 12, visible: 3 }), null, 'a populated list shows no empty state');
assert.equal(emptyState({ total: 1, visible: 0 }), 'no-matches', 'one hidden memory is still not an empty vault');

// Contextual search selects the exact section before matching, not just a
// different placeholder above the same all-content results.
assert.equal(searchScope(), 'ordinary', 'legacy default remains ordinary');
assert.equal(searchScope('files'), 'all');
assert.equal(searchScope('notes'), 'memory');
assert.throws(() => searchScope('unknown'), /valid search section/, 'unknown scopes never silently broaden to global');
const scopedTree = {
  '': [folder('raw'), folder('logs'), folder('archive'), folder('exports'), file('AGENTS.md')],
  raw: [...Array.from({ length: 51 }, (_, index) => file(`raw/memory-${String(index).padStart(2, '0')}.md`, new Date(Date.parse('2026-10-01T00:00:00Z') + index * 1000).toISOString())), folder('raw/memory-50.assets')],
  'raw/memory-50.assets': [file('raw/memory-50.assets/kept.png')],
  logs: [file('logs/technical.md')],
  archive: [folder('archive/2026-10-30')],
  'archive/2026-10-30': [file('archive/2026-10-30/old.md'), folder('archive/2026-10-30/old.assets')],
  'archive/2026-10-30/old.assets': [file('archive/2026-10-30/old.assets/photo.png')],
  exports: [file('exports/published.md'), file('exports/photo.png')],
};
const scopedList = async path => {
  assert.ok(path in scopedTree, `Unexpected scoped traversal: ${path}`);
  return { items: scopedTree[path] };
};
const scopedRead = async path => {
  assert.match(path, /\.md$/, 'binary search matches never call the text reader');
  return { rawContent: 'SharedNeedle — Имя пользователя 📝', frontmatter: {}, stats: { size: 42, mtime: 10 } };
};
const recentScope = await searchSectionFiles(scopedList, scopedRead, 'SharedNeedle', { scope: 'recent' });
assert.equal(recentScope.total, 50);
assert.ok(!recentScope.items.some(item => item.path === 'raw/memory-00.md'), 'older than the current Recent fifty must not leak into Recent search');
assert.ok(recentScope.items.every(item => /^raw\/memory-\d+\.md$/.test(item.path)));
const memoryScope = await searchSectionFiles(scopedList, scopedRead, 'SharedNeedle', { scope: 'memory' });
assert.equal(memoryScope.total, 51);
assert.ok(memoryScope.items.some(item => item.path === 'raw/memory-00.md'), 'Memory search includes older memory');
assert.ok(!memoryScope.items.some(item => /exports|logs|archive|AGENTS/.test(item.path)), 'Memory excludes exported/service/lifecycle files');
const recentOlderName = await searchSectionFiles(scopedList, scopedRead, 'memory-00', { scope: 'recent', candidatePaths: [] });
assert.equal(recentOlderName.total, 0, 'Recent membership also applies to filename matching');
const filesScope = await searchSectionFiles(scopedList, scopedRead, 'SharedNeedle', { scope: 'all' });
for (const expected of ['logs/technical.md', 'AGENTS.md', 'exports/published.md', 'archive/2026-10-30/old.md', 'raw/memory-00.md']) {
  assert.ok(filesScope.items.some(item => item.path === expected), `global Files content search must include ${expected}`);
}
const duplicatePhoto = await searchSectionFiles(scopedList, scopedRead, 'photo', { scope: 'all', candidatePaths: [] });
assert.deepEqual(new Set(duplicatePhoto.items.map(item => item.path)), new Set(['exports/photo.png', 'archive/2026-10-30/old.assets/photo.png']), 'global binary filename search retains paths for duplicate names');
const pathSearch = await searchSectionFiles(scopedList, scopedRead, 'logs/', { scope: 'all', candidatePaths: [] });
assert.equal(pathSearch.total, 1, 'Files supports path matches');
assert.deepEqual(pathSearch.items[0].matches, ['path']);
const archiveScope = await searchSectionFiles(scopedList, scopedRead, 'SharedNeedle', { scope: 'archive' });
assert.deepEqual(archiveScope.items.map(item => item.path), ['archive/2026-10-30/old.md']);
const archivePhoto = await searchSectionFiles(scopedList, scopedRead, 'photo', { scope: 'archive', candidatePaths: [] });
assert.equal(archivePhoto.total, 0, 'Archive search follows its view: owned attachments are not separate entries');
for (const missing of [Object.assign(new Error('archive is missing'), { code: 'ENOENT' }), new Error("ENOENT: no such file or directory, scandir 'archive'")]) {
  const absentArchive = await searchSectionFiles(async path => {
    assert.equal(path, 'archive'); throw missing;
  }, () => assert.fail('an absent archive has no content'), 'needle', { scope: 'archive' });
  assert.equal(absentArchive.total, 0, 'initial missing Archive is empty, including legacy MCP error-text mapping');
}
await assert.rejects(() => searchSectionFiles(async () => { throw Object.assign(new Error('Permission denied'), { code: 'EACCES' }); }, scopedRead, 'needle', { scope: 'archive' }), /Permission denied/, 'Archive permissions must not masquerade as empty');
await assert.rejects(() => searchSectionFiles(async path => {
  if (path === 'archive') return { items: [folder('archive/disappeared')] };
  throw Object.assign(new Error('child disappeared'), { code: 'ENOENT' });
}, scopedRead, 'needle', { scope: 'archive' }), /child disappeared/, 'Only the initial Archive absence is empty; child read failures stay visible');
const deletedPath = '.trash/2026-10-30/raw/deleted.md';
const deletedScope = await searchSectionFiles(() => assert.fail('Recently Deleted uses its own safe inventory'), scopedRead, 'SharedNeedle', {
  scope: 'deleted', candidatePaths: [],
  listDeleted: async () => ({ items: [{ ...file(deletedPath), originalPath: 'raw/deleted.md' }], unsupported: [{ path: '.trash/legacy' }], truncated: true }),
});
assert.equal(deletedScope.total, 1, 'deleted content is not eliminated by generic content candidates that omit .trash');
assert.equal(deletedScope.items[0].path, deletedPath);
assert.match(deletedScope.searchWarning, /partial list/);
assert.match(deletedScope.searchWarning, /manual recovery/);
await assert.rejects(() => searchSectionFiles(scopedList, scopedRead, 'x', { scope: 'deleted' }), /unavailable/);
const cancelled = new AbortController(); cancelled.abort();
await assert.rejects(() => searchSectionFiles(scopedList, scopedRead, 'x', { scope: 'all', signal: cancelled.signal }), /cancelled/);
await assert.rejects(() => searchSectionFiles(async () => { throw new Error('Permission denied'); }, scopedRead, 'x', { scope: 'all' }), /Permission denied/);

console.log('CONTENT_VIEWS_OK: narrow service paths, raw/structured/custom notes, exports, legacy/orphan attachments, stable date groups, limits, scoped Recent/Memory/Files/Archive/Deleted search, bounded filename/content reads and distinct empty/no-match states.');
