const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

/**
 * Initialize a Paystack transaction. Amount is in Naira (converted to kobo here).
 */
export async function initializeTransaction(params: {
  email: string;
  amountNaira: number;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amountNaira * 100), // kobo
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack init failed: ${err}`);
  }
  return res.json();
}

/**
 * Verify a transaction by reference (used as a fallback / on redirect;
 * the webhook is the source of truth).
 */
export async function verifyTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack verify failed: ${err}`);
  }
  return res.json();
}

/**
 * Verify the X-Paystack-Signature header on incoming webhooks using HMAC SHA512.
 */
export async function verifyWebhookSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey()),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return computed === signature;
}

/** Split amount (Naira) into platform fee + business amount given a commission % (default 15). */
export function splitAmount(amountNaira: number, commissionRate = 10) {
  const platform_fee = Math.round(amountNaira * (commissionRate / 100) * 100) / 100;
  const business_amount = Math.round((amountNaira - platform_fee) * 100) / 100;
  return { platform_fee, business_amount };
}
