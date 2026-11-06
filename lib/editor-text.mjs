// Ordinary editing changes the note's text, not its optional saved header.
// Keep the original prefix byte-for-byte; an unclosed header stays visible.
export function noteEditingParts(source) {
  const text = String(source ?? '');
  const match = /^(\uFEFF?---[\t ]*\r?\n[\s\S]*?\r?\n---[\t ]*(?:\r?\n|$))([\s\S]*)$/.exec(text);
  return match ? { header: match[1], body: match[2] } : { header: '', body: text };
}
