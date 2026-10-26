// Display order only. Never rename files or rewrite their saved dates.
export function newestFirst(a, b) {
  const modified = (Number(b.mtime) || 0) - (Number(a.mtime) || 0);
  return modified || String(b.name).localeCompare(String(a.name), undefined, { numeric: true });
}

export function folderOrder(a, b) {
  // Calendar folders (2026 / 10) are newest first; ordinary names stay A–Z.
  const calendar = /^\d{2}(?:\d{2})?$/;
  if (calendar.test(a.name) && calendar.test(b.name)) return Number(b.name) - Number(a.name);
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}
