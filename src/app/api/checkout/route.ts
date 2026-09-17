import { ccbillCheckout, ccbillConfig, type CheckoutProvider } from '@/lib/payments';
import { createServiceClient, requireUser } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if (!auth) return Response.json({ error: 'Inicia sesión.' }, { status: 401 });
  const body = await request.json() as { packId?: string; provider?: CheckoutProvider };
  if (!body.packId || !['ccbill','nowpayments'].includes(body.provider ?? '')) return Response.json({ error: 'Checkout inválido.' }, { status: 400 });
  const { data: pack } = await auth.supabase.from('lore_content_packs').select('id,price_cents,currency,credits').eq('id', body.packId).eq('is_active', true).single();
  if (!pack) return Response.json({ error: 'Paquete no disponible.' }, { status: 404 });
  // Prices/credits come from the RLS-readable catalog, never from client input.
  // Purchase writes are server-only; user clients can only read their purchases.
  const payments = createServiceClient();
  const { data: purchase, error } = await payments.from('lore_purchases').insert({
    user_id: auth.user.id, pack_id: pack.id, provider: body.provider, amount_cents: pack.price_cents, currency: pack.currency, credits: pack.credits,
  }).select('id').single();
  if (error || !purchase) return Response.json({ error: 'No se pudo iniciar el pago.' }, { status: 500 });

  if (body.provider === 'ccbill') return Response.json({ purchaseId: purchase.id, checkoutUrl: ccbillCheckout(ccbillConfig(), purchase.id, pack.price_cents), sandbox: true });
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return Response.json({ error: 'Falta NOWPAYMENTS_API_KEY.' }, { status: 503 });
  const origin = new URL(request.url).origin;
  const payment = await fetch('https://api-sandbox.nowpayments.io/v1/invoice', {
    method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ price_amount: pack.price_cents / 100, price_currency: pack.currency.toLowerCase(), order_id: purchase.id, order_description: `Lore credits: ${pack.credits}`, ipn_callback_url: `${origin}/api/webhooks/nowpayments`, success_url: `${origin}/?payment=success`, cancel_url: `${origin}/?payment=cancelled` }),
  });
  const result = await payment.json() as { invoice_url?: string; id?: string; message?: string };
  if (!payment.ok || !result.invoice_url) return Response.json({ error: result.message ?? 'NOWPayments no creó el checkout.' }, { status: 502 });
  await payments.from('lore_purchases').update({ provider_payment_id: String(result.id) }).eq('id', purchase.id).eq('user_id', auth.user.id);
  return Response.json({ purchaseId: purchase.id, checkoutUrl: result.invoice_url, sandbox: true });
}
