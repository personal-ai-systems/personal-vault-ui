import { document, failure } from '@/lib/vault-client';
export async function GET(_request: Request, { params }: { params: Promise<{ path: string }> }) {
  try { return Response.json(await document((await params).path)); } catch (error) { return failure(error); }
}
