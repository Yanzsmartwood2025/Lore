import { randomUUID } from 'node:crypto';
import { adminEnv } from '@/lib/env';
import { uploadToR2 } from '@/lib/r2';
import { createServiceClient, requireUser } from '@/lib/supabase/server';

function getCategoryAndExt(mimeType: string, originalName?: string): { category: 'fotos' | 'videos' | 'musica'; ext: string } | null {
  const mime = mimeType.toLowerCase();
  const extFromName = originalName?.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase();

  if (mime.startsWith('image/')) {
    const ext = extFromName || (mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg');
    return { category: 'fotos', ext };
  }
  if (mime.startsWith('video/')) {
    const ext = extFromName || (mime === 'video/webm' ? 'webm' : 'mp4');
    return { category: 'videos', ext };
  }
  if (mime.startsWith('audio/')) {
    const ext = extFromName || (mime === 'audio/wav' ? 'wav' : 'mp3');
    return { category: 'musica', ext };
  }
  return null;
}

export async function POST(request: Request) {
  // 1. Authenticate: check admin key or user session
  const adminKey = adminEnv().adminUploadKey;
  const headerAdminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  let ownerId: string | null = null;
  let isAuthenticated = false;

  if (adminKey && headerAdminKey === adminKey) {
    isAuthenticated = true;
  } else {
    try {
      const auth = await requireUser(request);
      if (auth) {
        isAuthenticated = true;
        ownerId = auth.user.id;
      }
    } catch {
      // Ignore auth service errors
    }
  }

  if (!isAuthenticated) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  // 2. Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error al procesar formulario.';
    return Response.json({ error: errorMessage }, { status: 400 });
  }

  const file = (formData.get('file') || formData.get('media')) as File | null;
  if (!file || typeof file.arrayBuffer !== 'function') {
    return Response.json({ error: 'Se requiere un archivo válido (campo "file" o "media").' }, { status: 400 });
  }

  const personaSlug = (formData.get('persona') || formData.get('personaSlug')) as string | null;
  const isVipRaw = formData.get('isVip') || formData.get('is_vip');
  const isVip = isVipRaw === 'true' || isVipRaw === '1';
  const packId = (formData.get('packId') || formData.get('pack_id')) as string | null;

  const classification = getCategoryAndExt(file.type, file.name);
  if (!classification) {
    return Response.json({ error: `Tipo de archivo no soportado: ${file.type}` }, { status: 400 });
  }

  const { category, ext } = classification;
  const fileUuid = randomUUID();

  // 3. Build R2 key
  // fotos/{persona}/uuid.ext or fotos/uuid.ext
  // videos/{persona}/uuid.ext or videos/uuid.ext
  // musica/uuid.ext
  let key: string;
  if (category === 'musica') {
    key = `musica/${fileUuid}.${ext}`;
  } else {
    key = personaSlug ? `${category}/${personaSlug}/${fileUuid}.${ext}` : `${category}/${fileUuid}.${ext}`;
  }

  // 4. Read file content as Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 5. Upload to Cloudflare R2
  try {
    await uploadToR2(key, buffer, file.type);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error al subir a R2';
    console.error('Error uploading file to Cloudflare R2:', errorMessage);
    return Response.json({ error: `Error en la subida a R2: ${errorMessage}` }, { status: 500 });
  }

  // 6. Save asset metadata in Supabase `lore_media_assets`
  let dbAsset = null;
  try {
    const supabase = createServiceClient();
    const { data: asset, error: dbError } = await supabase
      .from('lore_media_assets')
      .insert({
        owner_id: ownerId,
        pack_id: packId || null,
        persona_slug: personaSlug || null,
        r2_key: key,
        mime_type: file.type,
        byte_size: buffer.length,
        is_vip: isVip,
      })
      .select('id, r2_key, mime_type, byte_size, persona_slug, is_vip, created_at')
      .single();

    if (dbError) {
      console.warn('Unable to record asset in Supabase lore_media_assets:', dbError.message);
    } else {
      dbAsset = asset;
    }
  } catch (dbErr: unknown) {
    const msg = dbErr instanceof Error ? dbErr.message : String(dbErr);
    console.warn('Supabase DB insertion skipped or unreachable:', msg);
  }

  const assetResult = dbAsset || {
    id: fileUuid,
    r2_key: key,
    mime_type: file.type,
    byte_size: buffer.length,
    persona_slug: personaSlug || null,
    is_vip: isVip,
  };

  return Response.json({
    success: true,
    asset: assetResult,
  });
}
