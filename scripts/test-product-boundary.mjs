import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

// Read repository source only. Do not start the app or touch a person's Vault.
const source = (relative) => new URL(`../${relative}`, import.meta.url);
const removedAssistantFiles = [
  'components/ResumeMe.tsx',
  'app/api/resume/route.ts',
  'app/api/today/route.ts',
  'app/api/transcript/route.ts',
];
for (const relative of removedAssistantFiles) {
  await assert.rejects(access(source(relative)), { code: 'ENOENT' },
    `${relative} is Assistant implementation and must not return to the Vault UI.`);
}

const page = await readFile(source('app/page.tsx'), 'utf8');
assert.doesNotMatch(page, /\bResumeMe\b/, 'The active Vault page must not import/render Resume Me.');
assert.doesNotMatch(page, /\/api\/(?:resume|today|transcript)(?:[/?'"`]|$)/,
  'The active Vault page must not call Assistant-only routes.');

const layout = await readFile(source('app/layout.tsx'), 'utf8');
const manifest = JSON.parse(await readFile(source('public/manifest.json'), 'utf8'));
const layoutDescription = /description:\s*"([^"]+)"/.exec(layout)?.[1];
for (const description of [layoutDescription, manifest.description]) {
  assert.equal(typeof description, 'string');
  assert.match(description, /memory/i, 'Describe the memory store, not the UI implementation.');
  assert.match(description, /independent/i);
  assert.doesNotMatch(description, /material design|daily assistant|executive mode|second brain/i);
}
assert.match(await readFile(source('AGENTS.md'), 'utf8'), /personal-vault\/docs\/product-boundary\.md/,
  'The UI instructions must point to the shared product decision.');

// Execute the actual proxy in memory with a response stub. This verifies the
// guard behaviour without binding a port, importing Next runtime or using data.
const proxySource = await readFile(source('proxy.ts'), 'utf8');
const compiled = ts.transpileModule(proxySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
class ResponseStub {
  constructor(body, { status } = {}) { this.body = body; this.status = status; }
  static json(body, options) { return new ResponseStub(body, options); }
  static next() { return { next: true }; }
}
const exports = {};
vm.runInNewContext(compiled, {
  exports,
  require(name) {
    assert.equal(name, 'next/server', 'The proxy boundary test imports only its response stub.');
    return { NextResponse: ResponseStub };
  },
  process: { env: {} },
}, { filename: fileURLToPath(source('proxy.ts')), timeout: 1000 });

const request = (pathname) => ({
  nextUrl: { pathname, protocol: 'http:' },
  method: 'GET',
  headers: new Map([['host', '127.0.0.1']]),
});
for (const route of ['resume', 'today', 'transcript']) {
  for (const pathname of [`/api/${route}`, `/api/${route}/`, `/api/${route}/nested`]) {
    const response = exports.proxy(request(pathname));
    assert.equal(response.status, 404, `${pathname} must remain outside the Vault product.`);
    assert.equal(response.body, 'Not part of Personal Vault');
  }
}
for (const pathname of ['/', '/api/files', '/api/materials', '/api/vault', '/api/recent']) {
  assert.equal(exports.proxy(request(pathname)).next, true,
    `Neutral memory/file access must remain available: ${pathname}`);
}

console.log('PRODUCT_BOUNDARY_OK: independent-memory identity, shared decision pointer, no Assistant implementations, active page stays file/memory-only, legacy Assistant paths return 404.');
