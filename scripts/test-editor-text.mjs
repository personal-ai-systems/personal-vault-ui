import assert from 'node:assert/strict';
import { noteEditingParts } from '../lib/editor-text.mjs';
for (const source of ['# A note\n', 'Обычная заметка 📝', '---\ntitle: unclosed\nBody', 'Text\n---\nMore']) {
  assert.deepEqual(noteEditingParts(source), { header: '', body: source });
}
for (const prefix of ['---\ntitle: "Идеи 📝"\n---\n', '\uFEFF---\r\ntitle: "Идеи 📝"\r\n---\r\n']) {
  const parts = noteEditingParts(prefix + 'Old text');
  assert.equal(parts.header, prefix); assert.equal(parts.body, 'Old text');
  assert.equal(parts.header + 'Новый текст', prefix + 'Новый текст');
}
console.log('EDITOR_TEXT_OK: ordinary text and Unicode, exact optional-header preservation, CRLF/BOM and unclosed-header fallback.');
