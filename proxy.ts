import { NextRequest, NextResponse } from 'next/server';
export function proxy(request: NextRequest) {
  // These legacy Assistant routes are not part of the desktop Vault product.
  if (/^\/api\/(resume|today|transcript)(\/|$)/.test(request.nextUrl.pathname)) return new NextResponse('Not part of Personal Vault', { status: 404 });
  const token = process.env.PERSONAL_VAULT_UI_TOKEN;
  if (token && request.headers.get('x-vault-desktop-token') !== token) return new NextResponse('Unauthorized', { status: 401 });
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin && origin !== request.nextUrl.origin) return new NextResponse('Invalid origin', { status: 403 });
  return NextResponse.next();
}
