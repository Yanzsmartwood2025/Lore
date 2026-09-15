import { canonicalJson, validHmac } from '@/lib/payments';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.NOWPAYMENTS_API_KEY;
  const event = JSON.parse(raw) as { order_id?: string; payment_id?: string | number; payment_status?: string };
  if (!secret || !validHmac(canonicalJson(event), request.headers.get('x-nowpayments-sig'), secret)) return Response.json({ error: 'Firma inválida.' }, { status: 401 });
  if (!event.order_id || !['finished','confirmed'].includes(event.payment_status ?? '')) return Response.json({ received: true });
  const { error } = await createServiceClient().rpc('confirm_lore_purchase', { p_purchase_id: event.order_id, p_provider_payment_id: String(event.payment_id ?? '') });
  if (error) return Response.json({ error: 'No se pudo acreditar.' }, { status: 500 });
  return Response.json({ received: true });
}
