import { adminEnv } from '@/lib/env';
import { signedDownloadUrl } from '@/lib/r2';
import { createServiceClient, requireUser } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Check admin key or require authenticated user
  const adminKey = adminEnv().adminUploadKey;
  const headerAdminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  let isAdmin = false;
  let user: { id: string } | null = null;

  if (adminKey && headerAdminKey === adminKey) {
    isAdmin = true;
  } else {
    try {
      const auth = await requireUser(request);
      if (!auth) {
        return Response.json({ error: 'Inicia sesión para acceder a este contenido.' }, { status: 401 });
      }
      user = auth.user;
    } catch {
      return Response.json({ error: 'Inicia sesión para acceder a este contenido.' }, { status: 401 });
    }
  }

  // 2. Fetch asset record from Supabase
  const supabase = createServiceClient();
  const { data: asset, error } = await supabase
    .from('lore_media_assets')
    .select('id, r2_key, mime_type, byte_size, persona_slug, is_vip, owner_id, pack_id')
    .eq('id', id)
    .maybeSingle();

  if (error || !asset) {
    return Response.json({ error: 'Contenido no encontrado.' }, { status: 404 });
  }

  // 3. Authorization check for non-admin users if asset is VIP
  if (!isAdmin && asset.is_vip) {
    if (user && asset.owner_id === user.id) {
      // Owner has access
    } else if (user) {
      const { data: profile } = await supabase
        .from('lore_profiles')
        .select('is_vip')
        .eq('id', user.id)
        .single();

      let hasPurchase = false;
      if (asset.pack_id) {
        const { data: purchase } = await supabase
          .from('lore_purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('pack_id', asset.pack_id)
          .eq('status', 'confirmed')
          .maybeSingle();
        if (purchase) hasPurchase = true;
      }

      if (!profile?.is_vip && !hasPurchase) {
        return Response.json({ error: 'Este contenido requiere una suscripción VIP o compra del paquete.' }, { status: 403 });
      }
    } else {
      return Response.json({ error: 'Acceso no autorizado.' }, { status: 403 });
    }
  }

  // 4. Generate signed download URL (expiring in 300 seconds / 5 minutes)
  const expiresIn = 300;
  const url = await signedDownloadUrl(asset.r2_key, expiresIn);

  return Response.json(
    {
      id: asset.id,
      url,
      expiresIn,
      mimeType: asset.mime_type,
      byteSize: asset.byte_size,
      personaSlug: asset.persona_slug,
      isVip: asset.is_vip,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    }
  );
}
