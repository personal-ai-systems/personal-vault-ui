import { NextRequest } from 'next/server';
import { vaultName, vaultRoot, desktopRequest } from '@/lib/desktop';

// Only reached through the token-checked proxy, so the absolute folder path is
// never exposed to an unauthenticated caller.
export async function GET() {
  const root = vaultRoot();
  return Response.json({ root: root ?? null, name: root ? vaultName() : null, desktop: Boolean(process.send), mcpEndpoint: process.env.PERSONAL_VAULT_MCP_URL || null, appVersion: process.env.PERSONAL_VAULT_APP_VERSION || null });
}

export async function POST(request: NextRequest) {
  const { action } = await request.json().catch(() => ({ action: null }));
  if (action === 'reveal') {
    // The main process reveals the folder it selected; no path crosses this API.
    const ok = desktopRequest({ type: 'vault:reveal' });
    return Response.json({ ok, reason: ok ? null : 'Desktop actions are only available in the Personal Vault app.' });
  }
  if (action === 'choose') {
    const ok = desktopRequest({ type: 'vault:choose' });
    return Response.json({ ok, reason: ok ? null : 'Desktop actions are only available in the Personal Vault app.' });
  }
  return Response.json({ error: 'Unsupported action' }, { status: 400 });
}
