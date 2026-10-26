import { vault, failure } from '@/lib/vault-client';

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const relative = (await params).path.join('/');
    const file = await vault('read_binary', { path: relative });
    const extension = relative.split('.').pop()?.toLowerCase() || '';
    const types: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf' };
    const type = types[extension] || 'application/octet-stream';
    return new Response(new Uint8Array(Buffer.from(file.dataBase64, 'base64')), { headers: {
      'Content-Type': type,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `${types[extension] ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(relative.split('/').pop() || 'attachment')}`,
      'Content-Security-Policy': "sandbox; default-src 'none'",
    } });
  } catch (error) { return failure(error); }
}
