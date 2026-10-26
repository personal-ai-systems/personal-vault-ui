// Real rendered-window regression checks. Only called in an isolated smoke
// process whose selected Vault and application settings are temporary.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = async (window, { root, invoke, uiURL, backendURL, token, resources }) => {
  const packagePaths = { paths: [path.join(resources, 'vault')] };
  const { Client } = require(require.resolve('@modelcontextprotocol/sdk/client/index.js', packagePaths));
  const { StreamableHTTPClientTransport } = require(require.resolve('@modelcontextprotocol/sdk/client/streamableHttp.js', packagePaths));
  const js = expression => window.webContents.executeJavaScript(expression, true);
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  async function wait(expression, label) {
    for (let n = 0; n < 160; n++) { if (await js(expression)) return; await pause(); }
    console.error('QA fixture UI state:', await js('document.body.innerText.slice(0,4500)'));
    throw new Error(`UI did not reach: ${label}`);
  }
  async function click(text, selector = 'body') {
    assert.equal(await js(`(() => { const root=document.querySelector(${JSON.stringify(selector)}); const b=root&&Array.from(root.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(text)}||(${JSON.stringify(selector)}==='aside'&&b.textContent.trim().startsWith(${JSON.stringify(text)}))); if(!b)return false;b.click();return true; })()`), true, `Missing button ${text}`);
  }
  async function set(selector, value) {
    await js(`(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing input');Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  }
  await click('Cancel', '[role="dialog"]');
  await invoke('create', { path: 'qa/2024/01/older.md', content: '# Old fixture' });
  await invoke('create', { path: 'qa/2026/10/2029-old.md', content: '# Older modification' });
  await invoke('create', { path: 'qa/2026/10/2020-new.md', content: '---\ntitle: Newest fixture\n---\n# QA newest\n\n[Other note](./2029-old.md)\n\n[Website](https://example.com)\n' });
  await fs.utimes(path.join(root, 'qa/2026/10/2029-old.md'), new Date('2020-01-01'), new Date('2020-01-01'));
  await fs.utimes(path.join(root, 'qa/2026/10/2020-new.md'), new Date('2021-01-01'), new Date('2021-01-01'));
  window.webContents.reload();
  await wait(`Boolean(document.querySelector('[data-vault-folder="qa"]'))`, 'root listing');
  await wait(`Boolean(document.querySelector('button[aria-label="Expand qa"]'))`, 'folder tree');
  await js(`document.querySelector('button[aria-label="Expand qa"]').click()`);
  await wait(`Boolean(document.querySelector('aside button[title="qa/2026"]'))`, 'expanded years');
  assert.deepEqual(await js(`Array.from(document.querySelectorAll('aside button[title]')).map(b=>b.title).filter(p=>p.startsWith('qa/')&&p.split('/').length===2)`), ['qa/2026', 'qa/2024']);
  await js(`document.querySelector('button[aria-label="Expand 2026"]').click()`);
  await wait(`Boolean(document.querySelector('button[aria-label="Expand 10"]'))`, 'expanded month');
  await js(`document.querySelector('button[aria-label="Expand 10"]').click()`);
  await wait(`Boolean(document.querySelector('aside button[title="qa/2026/10/2020-new.md"]'))`, 'tree files');
  assert.deepEqual(await js(`Array.from(document.querySelectorAll('aside button[title]')).map(b=>b.title).filter(p=>p.endsWith('.md')&&p.startsWith('qa/2026/10/'))`), ['qa/2026/10/2020-new.md', 'qa/2026/10/2029-old.md']);
  for (const folder of ['qa', 'qa/2026', 'qa/2026/10']) {
    await js(`document.querySelector('[data-vault-folder=${JSON.stringify(folder)}]').click()`);
    const expected = folder === 'qa' ? '[data-vault-folder="qa/2026"]' : folder === 'qa/2026' ? '[data-vault-folder="qa/2026/10"]' : '[data-vault-file="qa/2026/10/2020-new.md"]';
    await wait(`Boolean(document.querySelector(${JSON.stringify(expected)}))`, `folder ${folder}`);
  }
  assert.deepEqual(await js(`Array.from(document.querySelectorAll('[data-vault-file]')).map(e=>e.dataset.vaultFile)`), ['qa/2026/10/2020-new.md', 'qa/2026/10/2029-old.md']);
  await js(`document.querySelector('[data-vault-file="qa/2026/10/2020-new.md"]').click()`);
  await wait(`Boolean(document.querySelector('.markdown-content a[data-vault-note]'))`, 'rendered linked note');
  await js(`document.querySelector('.markdown-content a[data-vault-note]').click()`);
  await wait(`document.querySelector('.markdown-content')?.textContent.includes('Older modification')`, 'internal Markdown link');

  // A newly saved file opens even when a search is active.
  await set('input[placeholder="Search in vault..."]', 'QA newest');
  await wait(`document.body.innerText.includes('Search')`, 'search view');
  await js(`document.querySelector('button[title="New note"]').click()`);
  await wait(`Boolean(document.querySelector('[role="dialog"] input'))`, 'new-note dialog');
  await set('[role="dialog"] input', 'qa-created.md');
  await set('[role="dialog"] textarea', '# QA-created\n\nReadable test only.');
  await click('Save note', '[role="dialog"]');
  await wait(`document.querySelector('.markdown-content')?.textContent.includes('QA-created')`, 'newly saved note');
  const createdPath = 'qa/2026/10/qa-created.md';
  assert.match(await fs.readFile(path.join(root, createdPath), 'utf8'), /Readable test only/);
  await js(`document.querySelector('button[title="New note"]').click()`);
  await wait(`Boolean(document.querySelector('[role="dialog"] input'))`, 'duplicate dialog');
  await set('[role="dialog"] input', 'qa-created.md');
  await set('[role="dialog"] textarea', 'must not overwrite');
  await click('Save note', '[role="dialog"]');
  await wait(`document.querySelector('[role="alert"]')?.textContent.includes('already exists')`, 'duplicate refusal');
  assert.match(await fs.readFile(path.join(root, createdPath), 'utf8'), /Readable test only/);
  await click('Cancel', '[role="dialog"]');
  await click('Edit note', 'section');
  await set('section textarea', '# QA-edited\n\nReadable test only.');
  await js('window.confirm = () => true; true');
  await click('Save changes', 'section');
  await wait(`document.querySelector('.markdown-content')?.textContent.includes('QA-edited')`, 'saved edit');

  // Trigger the real React attachment input without writing outside the fixture.
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/pkAAAAASUVORK5CYII=';
  await js(`(() => {const data=Uint8Array.from(atob(${JSON.stringify(png)}),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([data],'qa.png',{type:'image/png'}));const input=document.querySelector('section input[type="file"]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait(`Boolean(document.querySelector('.markdown-content img')?.naturalWidth)`, 'inline attachment image');
  assert.match(await fs.readFile(path.join(root, createdPath), 'utf8'), /!\[qa.png\]\(/);
  await click('Archive', 'section');
  await wait(`Array.from(document.querySelectorAll('section button')).some(b=>b.textContent.trim()==='Restore')`, 'archived note');
  await wait(`Boolean(document.querySelector('.markdown-content img')?.naturalWidth)`, 'archived attachment');
  await click('Restore', 'section');
  await wait(`Array.from(document.querySelectorAll('section button')).some(b=>b.textContent.trim()==='Edit note')`, 'restored note');
  assert.equal((await fs.readFile(path.join(root, createdPath.replace(/\.md$/, '.assets/qa.png')))).length > 0, true);

  await set('input[placeholder="Search in vault..."]', 'QA-edited');
  await click('Recent', 'aside');
  await wait(`document.body.innerText.includes('Recent Changes') && document.body.innerText.includes('QA-edited')`, 'Recent view');
  await click('Archive', 'aside');
  await wait(`document.body.innerText.includes('Nothing archived yet') || document.body.innerText.includes('Notes you archived')`, 'Archive view');
  await js(`document.querySelector('button[title="Settings"]').click()`);
  await wait(`Boolean(document.querySelector('[role="menu"]'))`, 'Settings menu');
  assert.equal(await js(`Array.from(document.querySelectorAll('[role="menu"] button')).some(b=>b.textContent.includes('Import OpenAI'))`), true);
  await wait(`document.querySelector('[role="menu"]')?.textContent.includes(${JSON.stringify(backendURL + '/mcp')})`, 'displayed local MCP endpoint');
  await js(`document.querySelector('button[title="Settings"]').click()`);

  // Independent MCP SDK client, not the renderer's existing connection.
  const client = new Client({ name: 'desktop-independent-qa', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(backendURL + '/mcp')));
    const tools = await client.listTools();
    assert.ok(tools.tools.some(t => t.name === 'vault_files_read_binary'));
    const read = await client.callTool({ name: 'vault_files_read', arguments: { path: createdPath } });
    assert.match(read.structuredContent.content, /QA-edited/);
  } finally { await client.close(); }
  const assetPath = createdPath.replace(/\.md$/, '.assets/qa.png');
  const asset = await fetch(uiURL + '/api/assets/' + assetPath, { headers: { 'x-vault-desktop-token': token } });
  assert.equal(asset.status, 200); assert.equal(asset.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await asset.arrayBuffer()).toString('base64'), png);
  assert.equal((await fetch(uiURL + '/api/assets/' + assetPath)).status, 401);
  const crossOrigin = await fetch(uiURL + '/api/vault', { method: 'POST', headers: { 'x-vault-desktop-token': token, Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ operation: 'create', args: { path: 'must-not-exist.md', content: 'not allowed' } }) });
  assert.equal(crossOrigin.status, 403);
  assert.equal((await crossOrigin.json()).error, 'Invalid origin');
  const search = await fetch(uiURL + '/api/search?q=QA-edited', { headers: { 'x-vault-desktop-token': token } }).then(r => r.json());
  assert.equal(Number.isFinite(search.results[0].mtime), true);

  await set('input[placeholder="Search in vault..."]', 'QA newest');
  await wait(`Array.from(document.querySelectorAll('main button')).some(b=>b.textContent.includes('Newest fixture'))`, 'search result');
  await js(`Array.from(document.querySelectorAll('main button')).find(b=>b.textContent.includes('Newest fixture')).click()`);
  await wait(`Boolean(document.querySelector('[aria-label="Note preview"] .markdown-content'))`, 'search preview');
  const downloadedPath = path.join(root, 'qa-downloaded.md');
  const download = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Download did not complete')), 8000);
    window.webContents.session.once('will-download', (_event, item) => {
      item.setSavePath(downloadedPath);
      item.once('done', (_event, state) => { clearTimeout(timer); state === 'completed' ? resolve() : reject(new Error(state)); });
    });
  });
  await js(`document.querySelector('button[title="Download"]').click()`);
  await download;
  assert.equal(await fs.readFile(downloadedPath, 'utf8'), await fs.readFile(path.join(root, 'qa/2026/10/2020-new.md'), 'utf8'));
  await js(`Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:text=>{window.__qaCopy=text;return Promise.resolve()}});true`);
  await js(`document.querySelector('button[title="Copy content"]').click()`);
  assert.equal(await js('window.__qaCopy'), await fs.readFile(downloadedPath, 'utf8'));
  await js(`delete navigator.clipboard.writeText; document.querySelector('[aria-label="Note preview"] button[title="Close"]').click(); true`);

  // End on the fixture note so a captured image shows the checked UI state.
  await js(`window.dispatchEvent(new CustomEvent('vault:open-note',{detail:${JSON.stringify(createdPath)}}))`);
  await wait(`Boolean(document.querySelector('.markdown-content img')?.naturalWidth)`, 'final note preview');
  if (process.env.PV_DESKTOP_QA_SCREENSHOT) await fs.writeFile(process.env.PV_DESKTOP_QA_SCREENSHOT, (await window.webContents.capturePage()).toPNG());
  console.log('DESKTOP_QA_OK: rendered controls — newest-first list/tree, linked note, create during search, duplicate refusal, edit/save, image attachment, archive/restore, Recent/Archive/Settings, original Markdown download, copy payload (clipboard stub); independent MCP read, displayed endpoint, protected binary preview and rejected foreign Origin.');
};
