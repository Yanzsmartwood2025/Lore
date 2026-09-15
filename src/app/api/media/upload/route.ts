import { randomUUID } from 'node:crypto';
import { signedUploadUrl } from '@/lib/r2';
import { requireUser } from '@/lib/supabase/server';

const ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp','video/mp4','video/webm']);

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  const body = await request.json() as { fileName?: string; contentType?: string; byteSize?: number; personaSlug?: string; isVip?: boolean; packId?: string };
  if (!body.contentType || !ALLOWED_TYPES.has(body.contentType) || !body.fileName || !Number.isSafeInteger(body.byteSize) || (body.byteSize ?? 0) > 100_000_000) {
    return Response.json({ error: 'Archivo inválido (máximo 100 MB).' }, { status: 400 });
  }
  const extension = body.fileName.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
  const key = `users/${auth.user.id}/${randomUUID()}.${extension}`;
  const { data: asset, error } = await auth.supabase.from('lore_media_assets').insert({
    owner_id: auth.user.id, pack_id: body.packId ?? null, persona_slug: body.personaSlug ?? null,
    r2_key: key, mime_type: body.contentType, byte_size: body.byteSize, is_vip: body.isVip ?? true,
  }).select('id').single();
  if (error) return Response.json({ error: 'No se pudo registrar el archivo.' }, { status: 500 });
  return Response.json({ assetId: asset.id, uploadUrl: await signedUploadUrl(key, body.contentType), expiresIn: 300 });
}
