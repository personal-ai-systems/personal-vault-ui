import { vault, failure } from '@/lib/vault-client';

export async function GET() {
  try { return Response.json(await vault('list_deleted', { limit: 200 })); }
  catch (error) { return failure(error); }
}
