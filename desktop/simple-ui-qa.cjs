// Rendered-window acceptance for the simpler UI. The desktop smoke harness is
// the only caller: both the selected Vault and application settings are temporary.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

module.exports = async (window, { root, invoke, uiURL, token }) => {
  assert.ok(process.env.PV_DESKTOP_SMOKE_ROOT, 'Simple UI QA requires the isolated desktop smoke harness.');
  const realRoot = await fs.realpath(root);
  const smokeRoot = await fs.realpath(process.env.PV_DESKTOP_SMOKE_ROOT);
  const tempRoot = await fs.realpath(os.tmpdir());
  const relativeRoot = path.relative(tempRoot, realRoot);
  assert.equal(realRoot, smokeRoot, 'Simple UI QA must use the smoke harness Vault.');
  assert.ok(relativeRoot && relativeRoot !== '..' && !relativeRoot.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeRoot), 'Simple UI QA refuses a Vault outside the system temporary folder.');
  assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(uiURL).hostname), 'Simple UI QA requires the local fixture UI.');
  assert.ok(token, 'Simple UI QA requires the smoke harness UI token.');

  const js = expression => window.webContents.executeJavaScript(expression, true).catch(error => { console.error('Simple UI expression failed:', expression); throw error; });
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  async function wait(expression, label) {
    for (let attempt = 0; attempt < 200; attempt++) {
      if (await js(expression)) return;
      await pause();
    }
    console.error('Simple UI fixture state:', await js('document.body.innerText.slice(0, 6000)'));
    throw new Error(`Simple UI did not reach: ${label}`);
  }
  async function click(selector, label = selector) {
    assert.equal(await js(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element || element.disabled) return false; element.click(); return true; })()`), true, `Missing or disabled ${label}`);
  }
  async function clickButton(text, scope = 'main') {
    assert.equal(await js(`(() => { const roots = Array.from(document.querySelectorAll(${JSON.stringify(scope)})); const button = roots.flatMap(root => Array.from(root.querySelectorAll('button'))).find(button => button.textContent.trim() === ${JSON.stringify(text)}); if (!button || button.disabled) return false; button.click(); return true; })()`), true, `Missing or disabled button: ${text}`);
  }
  async function search(value) {
    await js(`(() => { const input = Array.from(document.querySelectorAll('input[data-vault-search]')).find(input => input.getClientRects().length); if (!input) throw Error('No visible search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  }
  async function searchLabel(label) {
    await wait(`Array.from(document.querySelectorAll('input[data-vault-search]')).filter(input => input.getClientRects().length).every(input => input.placeholder === ${JSON.stringify(label)} && input.getAttribute('aria-label') === ${JSON.stringify(label)}) && Array.from(document.querySelectorAll('input[data-vault-search]')).some(input => input.getClientRects().length)`, label);
  }
  const row = (attribute, value) => `[${attribute}=${JSON.stringify(value)}]`;
  const notesButton = 'aside button[aria-label="Memory"]';
  const userPath = 'custom/logs/2026-10-30-Идеи.md';
  const userSource = '---\ntitle: Идеи 📝\n---\n# Идеи 📝\n\nSurfaceNeedle — ordinary user content in a custom folder.\n';
  const serviceSources = new Map([
    ['indexes/technical.md', '# Technical index\n\nServiceNeedle index fixture.\n'],
    ['logs/technical.md', '# Technical log\n\nServiceNeedle log fixture.\n'],
    ['AGENTS.md', '# Agent instructions fixture\n\nServiceNeedle root fixture.\n'],
  ]);
  for (const [file, content] of serviceSources) await invoke('create', { path: file, content });
  await invoke('create', { path: userPath, content: userSource });
  const duplicatePaths = ['files-a/shared-result.md', 'files-b/shared-result.md'];
  for (const file of duplicatePaths) await invoke('create', { path: file, content: '# DuplicatePathNeedle\n' });
  const exportMemoryPath = 'exports/2026-10-30-export-memory.md';
  await invoke('create', { path: exportMemoryPath, content: '# ExportOnlyNeedle\n' });
  const previewSources = new Map([
    ['qa-preview-a.md', '# PreviewANeedle\n'],
    ['qa-preview-b.md', '# PreviewBNeedle\n'],
  ]);
  for (const [file, content] of previewSources) await invoke('create', { path: file, content });

  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/pkAAAAASUVORK5CYII=';
  const png = Buffer.from(pngBase64, 'base64');
  // A small real PDF fixture; only binary documents/media are written directly.
  const pdfObjects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let pdfSource = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of pdfObjects.entries()) {
    offsets.push(Buffer.byteLength(pdfSource));
    pdfSource += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdfSource);
  pdfSource += `xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const pdf = Buffer.from(pdfSource);
  const imagePath = 'exports/2024-01-15-sample.png';
  const pdfPath = 'output/2025-02-03-report.pdf';
  for (const directory of ['exports', 'output']) await fs.mkdir(path.join(realRoot, directory), { recursive: true });
  await fs.writeFile(path.join(realRoot, imagePath), png, { flag: 'wx' });
  await fs.writeFile(path.join(realRoot, pdfPath), pdf, { flag: 'wx' });

  const deletePath = 'notes/2026-10-30-simple-ui-delete.md';
  const assetPath = deletePath.replace(/\.md$/, '.assets/kept.png');
  const deleteSource = '# Disposable delete fixture\n\nRestoreNeedle stays readable.\n\n![Kept evidence](./2026-10-30-simple-ui-delete.assets/kept.png)\n';
  await invoke('create', { path: deletePath, content: deleteSource });
  await invoke('attach', { markdownPath: deletePath, name: 'kept.png', dataBase64: pngBase64 });
  const unchanged = new Map();
  for (const file of [...serviceSources.keys(), ...previewSources.keys(), ...duplicatePaths, exportMemoryPath, userPath, imagePath, pdfPath]) unchanged.set(file, await fs.readFile(path.join(realRoot, file)));
  const recentScopeFixtures = [];

  try {
    window.setSize(1200, 850);
    window.webContents.reload();
    await wait(`document.querySelector('aside button[aria-current="page"]')?.getAttribute('aria-label') === 'Recent'`, 'Recent as the default view');
    await searchLabel('Search in Recent');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-recent-path', userPath))}))`, 'custom-folder user memory in Recent');
    assert.equal(await js(`Boolean(document.querySelector('aside [data-vault-folder], aside button[aria-label^="Expand "]'))`), false, 'Normal navigation must not expose the original folder tree.');
    assert.equal(await js(`/(?:AGENTS\.md|technical\.md|indexes|^logs$)/m.test(document.querySelector('aside').innerText)`), false, 'Normal navigation must not show service folders/files.');
    for (const file of serviceSources.keys()) assert.equal(await js(`Boolean(document.querySelector(${JSON.stringify(row('data-recent-path', file))}))`), false, `Service file leaked into Recent: ${file}`);
    assert.equal(await js(`document.querySelector('main').innerText.includes('ServiceNeedle')`), false);

    await search('SurfaceNeedle');
    await wait(`document.querySelector('main').innerText.includes('1 result for "SurfaceNeedle"') && document.querySelector('main').innerText.includes('SurfaceNeedle')`, 'ordinary user search result');
    assert.equal(await js(`document.querySelector('main').innerText.includes('ServiceNeedle')`), false);
    await search('ServiceNeedle');
    await wait(`document.querySelector('main').innerText.includes('0 results for "ServiceNeedle"') && !document.querySelector('[data-search-path]')`, 'Recent search excludes service content');

    await click(notesButton, 'Memory navigation');
    await searchLabel('Search in Memory');
    assert.equal(await js(`Array.from(document.querySelectorAll('input[data-vault-search]')).every(input => input.value === '')`), true, 'Changing tabs must clear the previous search.');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', userPath))}))`, 'custom-folder memory in Memory');
    for (const file of serviceSources.keys()) assert.equal(await js(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', file))}))`), false, `Service file leaked into Memory: ${file}`);
    for (const query of ['ServiceNeedle', 'sample.png', 'ExportOnlyNeedle']) {
      await search(query);
      await wait(`document.querySelector('main').innerText.includes(${JSON.stringify(`0 results for "${query}"`)}) && !document.querySelector('[data-search-path]')`, `Memory search excludes ${query}`);
    }
    await search('');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', userPath))}))`, 'Memory collection restored after search');
    await click(row('data-material-path', userPath), 'Unicode user-memory row');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('SurfaceNeedle')`, 'memory opened through the rendered Memory row');
    assert.equal(await js(`(() => { const summary = Array.from(document.querySelectorAll('main summary')).find(summary => summary.textContent.trim() === 'File details'); return !!summary && !summary.parentElement.open; })()`), true, 'The source path belongs in a closed File details disclosure.');
    assert.equal(await js(`document.querySelector('main').innerText.includes(${JSON.stringify(userPath)})`), false, 'Ordinary memory details should not expose the full source path by default.');
    await js(`Array.from(document.querySelectorAll('main summary')).find(summary => summary.textContent.trim() === 'File details').click()`);

    await clickButton('Edit', 'main section');
    await wait(`Boolean(document.querySelector('section textarea'))`, 'ordinary editor');
    assert.equal(await js(`document.querySelector('section textarea').value.startsWith('# Идеи') && !document.querySelector('section textarea').value.includes('title:')`), true, 'Ordinary editing must show memory text without its saved header.');
    assert.equal(await js(`document.querySelector('section input[type="file"]')?.disabled`), true, 'Attaching a file must not overwrite an unsaved draft.');
    await clickButton('Cancel', 'main section');
    assert.equal(await js(`document.querySelector('section input[type="file"]')?.disabled`), false, 'Attachment controls become available after cancelling the edit.');
    assert.equal(await fs.readFile(path.join(realRoot, userPath), 'utf8'), userSource, 'Cancelling an ordinary edit preserves the entire source.');
    await wait(`document.querySelector('main').innerText.includes(${JSON.stringify(userPath)})`, 'expanded source path');
    await js(`Array.from(document.querySelectorAll('main summary')).find(summary => summary.textContent.trim() === 'File details').click()`);

    await click('aside button[aria-label="Files"]', 'Files navigation');
    await searchLabel('Search in Files');
    await wait(`Boolean(document.querySelector('[data-vault-folder="indexes"]')) && Boolean(document.querySelector('[data-vault-folder="logs"]')) && Boolean(document.querySelector('[data-vault-file="AGENTS.md"]'))`, 'Files opens the original Vault root, including technical folders');
    assert.equal(await js(`Boolean(document.querySelector('aside button[aria-label="Expand indexes"]')) && Boolean(document.querySelector('aside button[aria-label="Expand logs"]'))`), true, 'Files retains the original expandable folder tree.');
    await click('[data-vault-file="qa-preview-a.md"]', 'preview fixture before Files reset');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('PreviewANeedle')`, 'first preview fixture');
    await clickButton('Edit', 'main section');
    await wait(`Boolean(document.querySelector('section textarea'))`, 'file editor before Files reset');
    await click('aside button[aria-label="Files"]', 'active Files resets its browser');
    await wait(`Boolean(document.querySelector('[data-vault-file="qa-preview-a.md"]')) && !document.querySelector('.markdown-content') && !document.querySelector('section textarea')`, 'active Files clears old preview/editor actions at the root');
    await click('[data-vault-file="qa-preview-a.md"]', 'preview fixture before breadcrumb reset');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('PreviewANeedle')`, 'preview before root breadcrumb');
    const rootBreadcrumb = await js(`document.querySelector('main button')?.textContent.trim()`);
    await clickButton(rootBreadcrumb);
    await wait(`!document.querySelector('.markdown-content') && !document.querySelector('section textarea')`, 'root breadcrumb clears preview/actions even at the current root');

    // Complete A's real fixture read, then hold a copied response while B opens.
    // The copied response deliberately ignores cancellation: the UI must check
    // its aborted request before rendering, rather than trusting completion order.
    await js(`(() => { window.__pvPreviewOriginalFetch = window.fetch; window.__pvPreviewAborted = false; window.__pvPreviewHeld = false; window.__pvPreviewReleased = false; window.fetch = async (input, init) => { if (String(input) !== '/api/files/qa-preview-a.md') return window.__pvPreviewOriginalFetch(input, init); init?.signal?.addEventListener('abort', () => { window.__pvPreviewAborted = true; }, { once: true }); const response = await window.__pvPreviewOriginalFetch(input, init); const body = await response.text(); const copy = new Response(body, { status: response.status, headers: response.headers }); window.__pvPreviewHeld = true; await new Promise(resolve => { window.__pvPreviewRelease = resolve; }); window.__pvPreviewReleased = true; return copy; }; })()`);
    try {
      await click('[data-vault-file="qa-preview-a.md"]', 'delayed preview A');
      await wait('window.__pvPreviewHeld === true', 'A response held until B loads');
      await click('[data-vault-file="qa-preview-b.md"]', 'newer preview B');
      await wait(`document.querySelector('.markdown-content')?.textContent.includes('PreviewBNeedle')`, 'B renders before the delayed A response');
      assert.equal(await js('window.__pvPreviewAborted'), true, 'Selecting B aborts the old A request.');
      await js('window.__pvPreviewRelease(); new Promise(resolve => setTimeout(resolve, 100))');
      assert.equal(await js(`window.__pvPreviewReleased && document.querySelector('main h2')?.textContent === 'qa-preview-b.md' && document.querySelector('.markdown-content')?.textContent.includes('PreviewBNeedle') && !document.querySelector('.markdown-content')?.textContent.includes('PreviewANeedle')`), true, 'A late response must not replace the selected B header or body.');
    } finally {
      await js('if (window.__pvPreviewRelease) window.__pvPreviewRelease(); if (window.__pvPreviewOriginalFetch) window.fetch = window.__pvPreviewOriginalFetch; delete window.__pvPreviewOriginalFetch; delete window.__pvPreviewRelease; true');
    }
    await click('aside button[title="files-a"]', 'sidebar folder replaces old preview');
    await wait(`Boolean(document.querySelector('[data-vault-file="files-a/shared-result.md"]')) && !document.querySelector('.markdown-content') && !document.querySelector('section textarea')`, 'another sidebar folder clears old preview/editor actions');
    await click('[data-vault-file="files-a/shared-result.md"]', 'same-folder preview');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('DuplicatePathNeedle')`, 'same-folder memory opened');
    await click('aside button[title="files-a"]', 'reselect current sidebar folder');
    await wait(`Boolean(document.querySelector('[data-vault-file="files-a/shared-result.md"]')) && !document.querySelector('.markdown-content') && !document.querySelector('section textarea')`, 'reselecting the current sidebar folder clears stale preview/actions');
    await click('aside button[aria-label="Files"]', 'return to root before global search');
    await wait(`Boolean(document.querySelector('[data-vault-folder="exports"]'))`, 'Vault root before global-search checks');
    await click('[data-vault-folder="exports"]', 'exports folder');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-vault-file', imagePath))}))`, 'exported image at its original filesystem path');
    await click(row('data-vault-file', imagePath), 'exported image');
    await wait(`Boolean(document.querySelector('main img')?.naturalWidth)`, 'exported image preview');
    await search('report.pdf');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-search-path', pdfPath))}))`, 'Files search finds a PDF outside the current exports folder');
    assert.equal(await js(`document.querySelector(${JSON.stringify(row('data-search-path', pdfPath))}).innerText.includes(${JSON.stringify(pdfPath)})`), true, 'Global file search shows the original relative path.');
    await search('sample.png');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-search-path', imagePath))}))`, 'Files search includes binary filenames');
    await search('ServiceNeedle');
    await wait(`document.querySelector('main').innerText.includes('3 results for "ServiceNeedle"')`, 'Files search includes technical content globally');
    for (const file of serviceSources.keys()) assert.equal(await js(`Boolean(document.querySelector(${JSON.stringify(row('data-search-path', file))}))`), true, `Global Files search omitted ${file}`);
    await search('shared-result.md');
    await wait(`document.querySelector('main').innerText.includes('2 results for "shared-result.md"')`, 'same-named files in different folders');
    for (const file of duplicatePaths) assert.equal(await js(`document.querySelector(${JSON.stringify(row('data-search-path', file))})?.innerText.includes(${JSON.stringify(file)})`), true, `Duplicate filename must show its path: ${file}`);
    if (process.env.PV_SIMPLE_UI_SEARCH_SCREENSHOT) {
      await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
      await wait(`document.querySelectorAll('[data-search-path]').length === 2 && !document.querySelector('main .animate-spin') && document.querySelector('main').innerText.includes('2 results for "shared-result.md"')`, 'global search is ready for its screenshot');
      await fs.writeFile(process.env.PV_SIMPLE_UI_SEARCH_SCREENSHOT, (await window.webContents.capturePage()).toPNG());
    }
    await search('');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-vault-file', imagePath))}))`, 'clearing search returns to the browsed folder');
    const fixtureVaultName = await js(`document.querySelector('main button')?.textContent.trim()`);
    assert.ok(fixtureVaultName, 'Files has a Vault-root breadcrumb.');
    await clickButton(fixtureVaultName);
    await wait(`Boolean(document.querySelector('[data-vault-folder="exports"]')) && Boolean(document.querySelector('[data-vault-file="AGENTS.md"]'))`, 'root breadcrumb returns to the selected Vault root');
    await click('[data-vault-folder="exports"]', 'exports folder before leaving Files');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-vault-file', imagePath))}))`, 'nested Files view before tab change');
    await click(notesButton, 'Memory between Files visits');
    await click('aside button[aria-label="Files"]', 'return to Files');
    await wait(`Boolean(document.querySelector('[data-vault-folder="exports"]')) && Boolean(document.querySelector('[data-vault-file="AGENTS.md"]'))`, 'returning to Files starts at the Vault root');
    if (process.env.PV_SIMPLE_UI_FILES_SCREENSHOT) await fs.writeFile(process.env.PV_SIMPLE_UI_FILES_SCREENSHOT, (await window.webContents.capturePage()).toPNG());

    await click(notesButton, 'Memory navigation');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', deletePath))}))`, 'disposable memory');
    await click(row('data-material-path', deletePath), 'disposable memory row');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('RestoreNeedle') && Boolean(document.querySelector('.markdown-content img')?.naturalWidth)`, 'disposable memory and linked asset');
    await js('window.__pvSimpleConfirm = window.confirm; window.__pvSimpleConfirmCalls = 0; window.confirm = () => { window.__pvSimpleConfirmCalls++; return false; }; true');
    await clickButton('Delete', 'main section');
    await wait('window.__pvSimpleConfirmCalls === 1', 'Delete confirmation cancellation');
    assert.equal(await fs.readFile(path.join(realRoot, deletePath), 'utf8'), deleteSource, 'Cancelling Delete must preserve the original memory.');
    assert.deepEqual(await fs.readFile(path.join(realRoot, assetPath)), png, 'Cancelling Delete must preserve the adjacent asset.');
    assert.equal(await js(`Boolean(document.querySelector('.markdown-content'))`), true, 'Cancelling Delete must keep the memory open.');
    await js('window.confirm = () => { window.__pvSimpleConfirmCalls++; return true; }; true');
    await clickButton('Delete', 'main section');
    await wait(`!document.querySelector(${JSON.stringify(row('data-material-path', deletePath))}) && !document.querySelector('.markdown-content')`, 'memory removed from the ordinary view after Delete');
    await assert.rejects(fs.stat(path.join(realRoot, deletePath)), { code: 'ENOENT' });
    await assert.rejects(fs.stat(path.join(realRoot, assetPath)), { code: 'ENOENT' });

    await click('aside button[aria-label="Recently Deleted"]', 'Recently Deleted navigation');
    await searchLabel('Search in Recently Deleted');
    const deletedRowExpression = `Array.from(document.querySelectorAll('[data-deleted-path]')).find(element => element.textContent.includes(${JSON.stringify(path.basename(deletePath))}))`;
    await wait(`Boolean(${deletedRowExpression})`, 'recoverable deleted memory');
    assert.equal(await js(`Array.from(document.querySelectorAll('main button')).some(button => /permanent|empty\s+(?:trash|bin|recently deleted)|erase/i.test(button.textContent))`), false, 'Recently Deleted must not offer permanent deletion or empty-trash controls.');
    const deletedPath = await js(`(${deletedRowExpression}).getAttribute('data-deleted-path')`);
    assert.equal(await fs.readFile(path.join(realRoot, deletedPath), 'utf8'), deleteSource, 'Deleted memory remains an ordinary recoverable file.');
    assert.deepEqual(await fs.readFile(path.join(realRoot, deletedPath.replace(/\.md$/, '.assets/kept.png'))), png, 'Deleted memory retains its adjacent assets.');
    await search('SurfaceNeedle');
    await wait(`document.querySelector('main').innerText.includes('0 results for "SurfaceNeedle"')`, 'Recently Deleted search excludes active memory');
    await search('RestoreNeedle');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-search-path', deletedPath))}))`, 'Recently Deleted search finds recoverable content');
    await search('');
    await wait(`Boolean(${deletedRowExpression})`, 'Recently Deleted collection restored after search');
    await js(`(() => { const button = (${deletedRowExpression}).querySelector('button'); if (!button || button.textContent.trim() !== 'Restore' || button.disabled) throw Error('Missing enabled Restore button'); button.click(); })()`);
    await wait(`!(${deletedRowExpression}) && document.querySelector('main').innerText.includes('Restored.')`, 'Restore from Recently Deleted');
    assert.equal(await fs.readFile(path.join(realRoot, deletePath), 'utf8'), deleteSource);
    assert.deepEqual(await fs.readFile(path.join(realRoot, assetPath)), png);
    await assert.rejects(fs.stat(path.join(realRoot, deletedPath)), { code: 'ENOENT' });

    await click('button[title="Settings"]', 'Settings');
    await wait(`Boolean(document.querySelector('[role="menu"]'))`, 'Settings menu');
    assert.equal(await js(`Array.from(document.querySelectorAll('[role="menu"] button')).some(button => button.textContent.includes('All files'))`), false, 'Settings must not duplicate Files navigation.');
    await click('button[title="Settings"]', 'close Settings');
    await click('aside button[aria-label="Files"]', 'direct Files navigation');
    await wait(`Boolean(document.querySelector('[data-vault-file="AGENTS.md"]'))`, 'original root file in Files');
    await click('[data-vault-file="AGENTS.md"]', 'root instruction file');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('ServiceNeedle')`, 'technical content remains readable in Files');

    await click(notesButton, 'return to Memory');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', deletePath))}))`, 'restored memory in Memory');
    await click(row('data-material-path', deletePath), 'restored memory row');
    await wait(`document.querySelector('.markdown-content')?.textContent.includes('RestoreNeedle') && Boolean(document.querySelector('.markdown-content img')?.naturalWidth)`, 'restored relative asset link still works');
    await click('button[title="Close memory"]', 'Close memory');

    window.setSize(600, 800);
    await wait('window.innerWidth <= 600', 'narrow window');
    assert.equal(await js(`document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1`), true, 'The narrow window must not overflow horizontally.');
    assert.equal(await js(`Array.from(document.querySelectorAll('input[data-vault-search]')).some(input => { const bounds = input.getBoundingClientRect(); return bounds.width > 0 && bounds.left >= 0 && bounds.right <= innerWidth && bounds.bottom <= innerHeight; })`), true, 'Search must remain visible in the narrow window.');
    await searchLabel('Search in Memory');
    assert.equal(await js(`['Recent', 'Memory', 'Files', 'Recently Deleted', 'Archive'].every(label => { const button = Array.from(document.querySelectorAll('aside button')).find(button => button.getAttribute('aria-label') === label); if (!button) return false; const bounds = button.getBoundingClientRect(); return bounds.width > 0 && bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight; })`), true, 'All navigation actions need visible, labelled controls in the narrow window.');
    await click('aside button[aria-label="Files"]', 'narrow Files navigation');
    await searchLabel('Search in Files');
    await wait(`Boolean(document.querySelector('[data-vault-folder="exports"]')) && Boolean(document.querySelector('[data-vault-file="AGENTS.md"]')) && !document.querySelector('main .animate-spin')`, 'narrow Files opens the Vault root');
    await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    assert.equal(await js(`document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1`), true, 'The narrow Files root must not overflow horizontally.');
    await search('shared-result.md');
    await wait(`document.querySelectorAll('[data-search-path]').length === 2 && !document.querySelector('main .animate-spin')`, 'narrow global Files search');
    assert.equal(await js(`document.documentElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1`), true, 'Narrow Files search results and their paths must not overflow horizontally.');
    await click(notesButton, 'return to narrow Memory');
    await searchLabel('Search in Memory');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-material-path', userPath))})) && !document.querySelector('main .animate-spin')`, 'Memory restored after narrow Files test');
    await click('button[title="Settings"]', 'narrow Settings');
    await wait(`Boolean(document.querySelector('[role="menu"]'))`, 'narrow Settings menu');
    window.focus();
    window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
    window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    await wait(`!document.querySelector('[role="menu"]')`, 'Settings closes with Escape');

    window.setSize(1200, 850);
    await wait('window.innerWidth >= 1100', 'wide window restored');
    // Search in Recent means exactly its newest 50 memories, not every saved
    // memory. These known fixture paths are created only after the temp-root
    // safety gate above and removed individually in finally.
    const olderPath = 'scope-history/older-memory.md';
    await invoke('create', { path: olderPath, content: '# OlderScopeNeedle\n' });
    recentScopeFixtures.push(olderPath);
    await fs.utimes(path.join(realRoot, olderPath), new Date('1999-01-01T00:00:00Z'), new Date('1999-01-01T00:00:00Z'));
    for (let index = 0; index < 51; index++) {
      const file = `scope-history/newer-${String(index).padStart(2, '0')}.md`;
      await invoke('create', { path: file, content: `# Newer fixture ${index}\n` });
      recentScopeFixtures.push(file);
    }
    await click('aside button[aria-label="Recent"]', 'Recent search scope');
    await searchLabel('Search in Recent');
    await wait(`document.querySelectorAll('[data-recent-path]').length === 50`, 'Recent newest50 collection');
    assert.equal(await js(`Boolean(document.querySelector(${JSON.stringify(row('data-recent-path', olderPath))}))`), false, 'The older memory is outside the displayed Recent collection.');
    await search('OlderScopeNeedle');
    await wait(`document.querySelector('main').innerText.includes('0 results for "OlderScopeNeedle"')`, 'Recent search does not reach outside its displayed collection');
    await click(notesButton, 'Memory searches the complete memory collection');
    await searchLabel('Search in Memory');
    assert.equal(await js(`Array.from(document.querySelectorAll('input[data-vault-search]')).every(input => input.value === '')`), true, 'Search clears when changing from Recent to Memory.');
    await search('OlderScopeNeedle');
    await wait(`Boolean(document.querySelector(${JSON.stringify(row('data-search-path', olderPath))}))`, 'Memory search includes older saved memory');
    await search('');
    await click(notesButton, 'final Memory view');
    await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const finalMemoryReady = `Boolean(document.querySelector(${JSON.stringify(row('data-material-path', userPath))})) && !document.querySelector('main .animate-spin') && !document.querySelector('main').innerText.includes('Loading your notes')`;
    await wait(finalMemoryReady, 'final Memory content after navigation and loading');
    await js('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    await wait(finalMemoryReady, 'painted final Memory content, not a loading frame');
    assert.equal(await js(`document.querySelector('aside button[aria-current="page"]')?.getAttribute('aria-label')`), 'Memory');
    for (const [file, bytes] of unchanged) assert.deepEqual(await fs.readFile(path.join(realRoot, file)), bytes, `Inspection must not change source bytes: ${file}`);
    if (process.env.PV_SIMPLE_UI_SCREENSHOT) await fs.writeFile(process.env.PV_SIMPLE_UI_SCREENSHOT, (await window.webContents.capturePage()).toPNG());
    console.log('DESKTOP_SIMPLE_UI_QA_OK: default Recent, quiet Recent/Memory, contextual search labels and scopes including newest50 Recent, Files root/tree/breadcrumbs and global filename/content search, duplicate paths, unchanged source bytes, Unicode memory/editor, cancel/delete/restore with assets, narrow layout, Settings Escape; final view Memory.');
  } finally {
    for (const file of recentScopeFixtures) await fs.unlink(path.join(realRoot, file)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await js('if (window.__pvSimpleConfirm) { window.confirm = window.__pvSimpleConfirm; delete window.__pvSimpleConfirm; } delete window.__pvSimpleConfirmCalls; true').catch(() => {});
    window.setSize(1200, 850);
  }
};
