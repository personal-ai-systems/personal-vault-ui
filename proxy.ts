import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
  // These legacy Assistant routes are not part of the desktop Vault product.
  if (/^\/api\/(resume|today|transcript)(\/|$)/.test(request.nextUrl.pathname)) return new NextResponse('Not part of Personal Vault', { status: 404 });
  const token = process.env.PERSONAL_VAULT_UI_TOKEN;
  if (token && request.headers.get('x-vault-desktop-token') !== token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const origin = request.headers.get('origin');
  // Standalone Next can normalize nextUrl to localhost even when the actual
  // desktop page is on 127.0.0.1. Compare with the received Host instead, after
  // token validation. Do not disable the cross-origin check to fix local writes.
  const expectedOrigin = `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (request.method !== 'GET' && origin && origin !== expectedOrigin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  return NextResponse.next();
}
