import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { initializeTransaction, splitAmount } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { business_id } = await req.json();

  if (!business_id) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
  }

  // Fetch business price + commission rate — always from the database,
  // never trust a client-supplied amount (that would let someone tamper
  // with the request to pay less than the real price).
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, commission_rate, default_price')
    .eq('id', business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const amount = Number(business.default_price);
  const { platform_fee, business_amount } = splitAmount(amount, business.commission_rate);

  const reference = `barb_${crypto.randomUUID()}`;

  // Insert via the admin client — customers don't have (and shouldn't have)
  // direct write access to transactions; only this controlled server-side
  // path and the Paystack webhook should ever write here.
  const admin = createAdminClient();
  const { error: txErr } = await admin.from('transactions').insert({
    business_id,
    customer_id: user.id,
    amount,
    platform_fee,
    business_amount,
    paystack_reference: reference,
    status: 'pending',
  });

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  const paystackRes = await initializeTransaction({
    email: user.email!,
    amountNaira: amount,
    reference,
    callback_url: `${req.nextUrl.origin}/dashboard/customer?payment=callback`,
    metadata: { business_id, customer_id: user.id },
  });

  return NextResponse.json(paystackRes);
}
