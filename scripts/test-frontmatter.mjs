import assert from 'node:assert/strict';
import { parseFrontmatter, readNotesSettled, METADATA_UNREADABLE } from '../lib/frontmatter.mjs';

// --- 1. Unquoted colon-space scalar: the original bug -----------------------
// A user typing "Notes from September 12: the plan" in another editor produces
// exactly this, and it used to throw and blank Recent.
const broken = '---\ntitle: Notes from September 12: the plan\n---\n\nBody text stays.\n';
const brokenResult = parseFrontmatter(broken);
assert.equal(brokenResult.metadataError, METADATA_UNREADABLE);
assert.deepEqual(brokenResult.data, {});
assert.equal(brokenResult.content, broken, 'the whole original file must be shown, fence included');

// The warning must be human-readable, not a js-yaml byte offset.
assert.doesNotMatch(METADATA_UNREADABLE, /indentation|line \d+|column|mapping entry|\(1:\d+\)/);

// --- 2. Never throws, for any input ----------------------------------------
for (const input of ['', '---', '---\n', '---\n---\n', '---\n::: bad :::\n---\n', '---\n\ttab: x\n---\n', 'not frontmatter at all']) {
  assert.doesNotThrow(() => parseFrontmatter(input), `must not throw on ${JSON.stringify(input)}`);
}
assert.doesNotThrow(() => parseFrontmatter(null));
assert.doesNotThrow(() => parseFrontmatter(undefined));
assert.doesNotThrow(() => parseFrontmatter(42));

// --- 3. Colon-space inside the body is prose, not metadata -----------------
const prose = '---\ntitle: Meeting notes\n---\n\nAgenda: 10:30 standup: keep it short\n';
const proseResult = parseFrontmatter(prose);
assert.equal(proseResult.metadataError, null, 'a colon in the body is normal prose');
assert.equal(proseResult.data.title, 'Meeting notes');
assert.equal(proseResult.content, '\nAgenda: 10:30 standup: keep it short\n');

// --- 4. Russian text -------------------------------------------------------
const russian = '---\ntitle: Заметки за сентябрь\n---\n\nТело заметки на русском.\n';
const russianResult = parseFrontmatter(russian);
assert.equal(russianResult.metadataError, null);
assert.equal(russianResult.data.title, 'Заметки за сентябрь');
assert.equal(russianResult.content, '\nТело заметки на русском.\n');

// Russian prose with a colon, unquoted, must also be fine.
const russianBroken = '---\ntitle: План: сентябрь\n---\n\nТекст\n';
assert.equal(parseFrontmatter(russianBroken).metadataError, METADATA_UNREADABLE);

// --- 5. Emoji --------------------------------------------------------------
const emoji = '---\ntitle: Идеи 🚀 на неделю\n---\n\nТело 👨‍👩‍👧‍👦\n';
const emojiResult = parseFrontmatter(emoji);
assert.equal(emojiResult.metadataError, null);
assert.equal(emojiResult.data.title, 'Идеи 🚀 на неделю');
assert.equal(emojiResult.content, '\nТело 👨‍👩‍👧‍👦\n');

// --- 6. CRLF line endings --------------------------------------------------
const crlf = '---\r\ntitle: Windows note\r\n---\r\n\r\nBody\r\n';
const crlfResult = parseFrontmatter(crlf);
assert.equal(crlfResult.metadataError, null);
assert.equal(crlfResult.data.title, 'Windows note');
assert.equal(crlfResult.content, '\r\nBody\r\n');

// --- 7. UTF-8 BOM ----------------------------------------------------------
const bom = '\uFEFF---\ntitle: BOM note\n---\n\nBody\n';
const bomResult = parseFrontmatter(bom);
assert.equal(bomResult.metadataError, null);
assert.equal(bomResult.data.title, 'BOM note');

// --- 8. Unclosed fence is not metadata; the file is shown whole ------------
const unclosed = '---\ntitle: Never closed\n\nBody\n';
const unclosedResult = parseFrontmatter(unclosed);
assert.equal(unclosedResult.metadataError, null);
assert.deepEqual(unclosedResult.data, {});
assert.equal(unclosedResult.content, unclosed, 'nothing is hidden when the fence never closes');

// --- 9. A literal --- line inside the body is not a second fence ----------
const bodyRule = '---\ntitle: Has a rule\n---\n\nAbove\n\n---\n\nBelow\n';
const ruleResult = parseFrontmatter(bodyRule);
assert.equal(ruleResult.metadataError, null);
assert.equal(ruleResult.data.title, 'Has a rule');
assert.equal(ruleResult.content, '\nAbove\n\n---\n\nBelow\n', 'the body keeps its horizontal rule');

// --- 10. Valid metadata still parses (no regression) ----------------------
const valid = '---\ntitle: "Quoted: safely"\ndate: 2026-10-26\ntags:\n  - one\n  - two\n---\nBody\n';
const validResult = parseFrontmatter(valid);
assert.equal(validResult.metadataError, null);
assert.equal(validResult.data.title, 'Quoted: safely');
assert.equal(validResult.data.date, '2026-10-26');
assert.deepEqual(validResult.data.tags, ['one', 'two']);
assert.equal(validResult.content, 'Body\n');

// A non-mapping frontmatter block degrades to empty metadata, not a throw.
assert.deepEqual(parseFrontmatter('---\n- a\n- b\n---\nBody\n').data, {});

// --- 11. Batch isolation: one bad note must not sink the batch ------------
const vault = {
  'notes/good.md': '---\ntitle: Good one\n---\nBody A\n',
  'notes/broken.md': '---\ntitle: Bad: metadata\n---\nBody B\n',
  'notes/good2.md': '---\ntitle: Заметки 🚀\n---\nBody C\n',
};
const paths = Object.keys(vault);
const settled = await readNotesSettled(paths, async (path) => vault[path]);
assert.equal(settled.length, 3, 'every note is still reported');

const byPath = Object.fromEntries(settled.map((entry) => [entry.path, entry]));
assert.equal(byPath['notes/good.md'].ok, true);
assert.equal(byPath['notes/good.md'].value.length > 0, true);
assert.equal(byPath['notes/good2.md'].ok, true);
assert.equal(byPath['notes/broken.md'].ok, true, 'unreadable metadata is not a read failure');

// The bad note parses without throwing and carries its warning.
const badParsed = parseFrontmatter(byPath['notes/broken.md'].value);
assert.equal(badParsed.metadataError, METADATA_UNREADABLE);

// A genuinely unreadable file (I/O failure) is marked, and the rest survive.
const mixed = await readNotesSettled(['a.md', 'missing.md', 'c.md'], async (path) => {
  if (path === 'missing.md') throw new Error('ENOENT: no such file or directory');
  return `---\ntitle: ${path}\n---\nBody\n`;
});
assert.equal(mixed.length, 3);
assert.equal(mixed.filter((entry) => entry.ok).length, 2, 'the other notes still load');
const failed = mixed.find((entry) => entry.path === 'missing.md');
assert.equal(failed.ok, false);
assert.equal(failed.error, 'This note could not be read.');
assert.doesNotMatch(failed.error, /ENOENT|no such file/, 'no raw I/O error text is shown');

console.log('FRONTMATTER_OK: colon-space, prose colons, Russian, emoji, CRLF, BOM, unclosed fence, body rules, valid metadata and batch isolation.');
