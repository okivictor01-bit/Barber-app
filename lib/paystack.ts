const PAYSTACK_BASE = 'https://api.paystack.co';

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set');
  return key;
}

/**
 * Initialize a Paystack transaction. Amount is in Naira (converted to kobo here).
 * If a subaccount is given, the payment auto-splits at the moment of charge:
 * `transaction_charge` (kobo) goes to the platform's main account, the rest
 * goes straight to the business's subaccount. `bearer` is intentionally left
 * unset so Paystack uses its default ('account'): the platform absorbs
 * Paystack's own processing fee, not the business.
 */
export async function initializeTransaction(params: {
  email: string;
  amountNaira: number;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  subaccount?: string;
  transactionChargeNaira?: number;
}) {
  const body: Record<string, unknown> = {
    email: params.email,
    amount: Math.round(params.amountNaira * 100), // kobo
    reference: params.reference,
    callback_url: params.callback_url,
    metadata: params.metadata,
  };

  if (params.subaccount) {
    body.subaccount = params.subaccount;
    // bearer intentionally omitted: Paystack defaults to 'account', meaning
    // the platform (main account) bears the processing fee, not the business.
    if (params.transactionChargeNaira !== undefined) {
      body.transaction_charge = Math.round(params.transactionChargeNaira * 100); // kobo, platform's cut
    }
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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

/** List Nigerian banks Paystack supports for settlement (used to populate a bank picker). */
export async function listBanks() {
  const res = await fetch(`${PAYSTACK_BASE}/bank?country=nigeria&currency=NGN`, {
    headers: { Authorization: `Bearer ${secretKey()}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Paystack bank list failed: ${err}`);
  }
  const json = await res.json();
  return json.data as { name: string; code: string }[];
}

/** Resolve an account number + bank code to the account holder's name, so the
 * owner can confirm it's correct before we save it (protects against typos
 * sending money to the wrong account). */
export async function resolveAccountNumber(accountNumber: string, bankCode: string) {
  const res = await fetch(
    `${PAYSTACK_BASE}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Could not verify that account number');
  }
  return json.data as { account_number: string; account_name: string };
}

/** Create a Paystack Subaccount for a business — this is what future payments
 * split to automatically. `percentage_charge` is required by Paystack but is
 * overridden per-transaction via `transaction_charge`, so it's just a sensible
 * default here. */
export async function createSubaccount(params: {
  businessName: string;
  settlementBankCode: string;
  accountNumber: string;
  percentageCharge: number;
}) {
  const res = await fetch(`${PAYSTACK_BASE}/subaccount`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name: params.businessName,
      settlement_bank: params.settlementBankCode,
      account_number: params.accountNumber,
      percentage_charge: params.percentageCharge,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message ?? 'Could not create Paystack subaccount');
  }
  return json.data as { subaccount_code: string; account_name: string };
}
