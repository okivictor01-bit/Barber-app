import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializeTransaction, splitAmount } from '@/lib/paystack';


export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { business_id, amount } = await req.json();

  if (!business_id || !amount) {
    return NextResponse.json({ error: 'business_id and amount are required' }, { status: 400 });
  }

  // Fetch business commission rate
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, commission_rate')
    .eq('id', business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const { platform_fee, business_amount } = splitAmount(amount, business.commission_rate);

  const reference = `barb_${crypto.randomUUID()}`;

  // Create a pending transaction row first
  const { error: txErr } = await supabase.from('transactions').insert({
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
