import { createHash, timingSafeEqual } from 'node:crypto';
import { ccbillConfig } from '@/lib/payments';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const form = await request.formData();
  const purchaseId = String(form.get('lorePurchaseId') ?? '');
  const transactionId = String(form.get('subscriptionId') ?? form.get('transactionId') ?? '');
  const received = String(form.get('responseDigest') ?? '');
  const expected = createHash('sha256').update(`${purchaseId}${transactionId}${ccbillConfig().salt}`).digest('hex');
  const a = Buffer.from(received); const b = Buffer.from(expected);
  if (!purchaseId || a.length !== b.length || !timingSafeEqual(a, b)) return Response.json({ error: 'Firma inválida.' }, { status: 401 });
  const { error } = await createServiceClient().rpc('confirm_lore_purchase', { p_purchase_id: purchaseId, p_provider_payment_id: transactionId });
  if (error) return Response.json({ error: 'No se pudo acreditar.' }, { status: 500 });
  return Response.json({ received: true });
}
