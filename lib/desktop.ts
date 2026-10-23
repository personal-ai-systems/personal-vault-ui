import path from 'node:path';

// The Electron main process owns the selected folder and passes it to this
// bundled web server. Nothing else is trusted for it: the UI can display the
// path, but only /api/vault-info's tiny message channel can act on it.
export function vaultRoot(): string | null {
  const root = process.env.PERSONAL_VAULT_ROOT;
  return root ? path.resolve(root) : null;
}

export function vaultName(): string | null {
  const root = vaultRoot();
  return root ? path.basename(root) : null;
}

// The desktop app forks this server with an IPC channel. Browser-only dev
// servers have no channel and simply report that desktop actions are unavailable.
export function desktopRequest(message: Record<string, unknown>): boolean {
  if (!process.send || !process.connected) return false;
  try { process.send(message); return true; } catch { return false; }
}
