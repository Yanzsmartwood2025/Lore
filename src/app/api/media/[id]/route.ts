import { signedDownloadUrl } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('lore_media_assets').select('r2_key').eq('id', id).single();
  if (error || !data) return Response.json({ error: 'Contenido no encontrado o sin acceso.' }, { status: 404 });
  return Response.json({ url: await signedDownloadUrl(data.r2_key), expiresIn: 300 }, { headers: { 'Cache-Control': 'private, no-store' } });
}
