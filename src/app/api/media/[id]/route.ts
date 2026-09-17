import { signedDownloadUrl } from '@/lib/r2';
import { createClient, requireUser } from '@/lib/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = request.headers.has('authorization') ? await requireUser(request) : null;
  if (request.headers.has('authorization') && !auth) {
    return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  }
  const supabase = auth?.supabase ?? await createClient();
  const { data, error } = await supabase.from('lore_media_assets').select('r2_key').eq('id', id).single();
  if (error || !data) return Response.json({ error: 'Contenido no encontrado o sin acceso.' }, { status: 404 });
  return Response.json({ url: await signedDownloadUrl(data.r2_key), expiresIn: 300 }, { headers: { 'Cache-Control': 'private, no-store' } });
}
