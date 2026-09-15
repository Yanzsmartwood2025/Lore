import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type CheckoutProvider = 'ccbill' | 'nowpayments';
export type CcbillConfig = { accountNumber: string; subaccountNumber: string; flexFormId: string; salt: string };

export function ccbillConfig(): CcbillConfig {
  if (!process.env.CCBILL_API_KEY) throw new Error('Falta CCBILL_API_KEY');
  const parsed = JSON.parse(process.env.CCBILL_API_KEY) as Partial<CcbillConfig>;
  if (!parsed.accountNumber || !parsed.subaccountNumber || !parsed.flexFormId || !parsed.salt) throw new Error('CCBILL_API_KEY no contiene la configuración requerida');
  return parsed as CcbillConfig;
}

export function ccbillCheckout(config: CcbillConfig, purchaseId: string, amountCents: number) {
  const price = (amountCents / 100).toFixed(2);
  const digest = createHash('md5').update(`${price}30${'840'}${config.salt}`).digest('hex');
  const query = new URLSearchParams({ clientAccnum: config.accountNumber, clientSubacc: config.subaccountNumber, initialPrice: price, initialPeriod: '30', currencyCode: '840', formDigest: digest, lorePurchaseId: purchaseId, testMode: '1' });
  return `https://api.ccbill.com/wap-frontflex/flexforms/${config.flexFormId}?${query}`;
}

export function validHmac(raw: string, received: string | null, secret: string) {
  if (!received) return false;
  const expected = createHmac('sha512', secret).update(raw).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
