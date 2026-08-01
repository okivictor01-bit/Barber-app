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

  const { business_id, service_id } = await req.json();

  if (!business_id) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 });
  }

  // Fetch business price + commission rate — always from the database,
  // never trust a client-supplied amount (that would let someone tamper
  // with the request to pay less than the real price).
  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, commission_rate, default_price, paystack_subaccount_code')
    .eq('id', business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  // No service_id (or explicitly null) = the standard haircut, which is the
  // only loyalty-eligible service. Any other service_id must belong to this
  // business and be active — priced independently, never loyalty-eligible.
  let amount = Number(business.default_price);
  let serviceName = 'Haircut';
  let isLoyaltyEligible = true;

  if (service_id) {
    const { data: service, error: serviceErr } = await supabase
      .from('services')
      .select('id, name, price, is_active')
      .eq('id', service_id)
      .eq('business_id', business_id)
      .single();

    if (serviceErr || !service || !service.is_active) {
      return NextResponse.json({ error: 'Service not found or no longer available' }, { status: 404 });
    }

    amount = Number(service.price);
    serviceName = service.name;
    isLoyaltyEligible = false;
  }

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
    service_id: service_id ?? null,
    service_name: serviceName,
    is_loyalty_eligible: isLoyaltyEligible,
    used_subaccount: Boolean(business.paystack_subaccount_code),
  });

  if (txErr) {
    return NextResponse.json({ error: txErr.message }, { status: 500 });
  }

  const paystackRes = await initializeTransaction({
    email: user.email!,
    amountNaira: amount,
    reference,
    callback_url: `${req.nextUrl.origin}/dashboard/customer?payment=callback`,
    metadata: { business_id, customer_id: user.id, service_id: service_id ?? null },
    // If the owner has completed payout setup, split automatically at the
    // moment of charge: our platform_fee goes straight to the main account,
    // the rest goes straight to their bank. If not set up yet, everything
    // lands in the main account and payout stays manual for now.
    subaccount: business.paystack_subaccount_code ?? undefined,
    transactionChargeNaira: business.paystack_subaccount_code ? platform_fee : undefined,
  });

  return NextResponse.json(paystackRes);
}
