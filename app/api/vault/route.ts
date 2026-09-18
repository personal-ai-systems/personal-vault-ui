import { vault, failure } from '@/lib/vault-client';
export async function POST(request: Request) {
  try {
    const { operation, args } = await request.json();
    if (!['create','update','attach','archive','restore'].includes(operation)) throw new Error('Unsupported operation');
    return Response.json(await vault(operation, args));
  } catch (error) { return failure(error); }
}
