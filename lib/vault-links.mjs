export function vaultLink(href, sourcePath) {
  if (!href || href.startsWith('#')) return { kind: 'anchor', href };
  if (/^https?:\/\//i.test(href)) return { kind: 'external', href };
  if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return { kind: 'blocked' };
  if (!sourcePath) return { kind: 'blocked' };
  try {
    const base = 'https://vault.invalid/' + sourcePath.split('/').map(encodeURIComponent).join('/');
    const url = new URL(href, base);
    const relative = decodeURIComponent(url.pathname.slice(1));
    if (relative.includes('\0') || relative.includes('\\')) return { kind: 'blocked' };
    return /\.md$/i.test(relative)
      ? { kind: 'note', path: relative }
      : { kind: 'asset', href: '/api/assets/' + relative.split('/').map(encodeURIComponent).join('/') };
  } catch { return { kind: 'blocked' }; }
}
