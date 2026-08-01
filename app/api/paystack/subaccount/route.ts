import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubaccount } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only the business owner can set up payouts' }, { status: 403 });
  }

  const { account_number, bank_code, bank_name, account_name } = await req.json();
  if (!account_number || !bank_code || !account_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: business, error: bizErr } = await supabase
    .from('businesses')
    .select('id, name, commission_rate')
    .eq('id', profile.business_id)
    .single();

  if (bizErr || !business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  try {
    const subaccount = await createSubaccount({
      businessName: business.name,
      settlementBankCode: bank_code,
      accountNumber: account_number,
      percentageCharge: Number(business.commission_rate ?? 10),
    });

    const { error: updateErr } = await supabase
      .from('businesses')
      .update({
        paystack_subaccount_code: subaccount.subaccount_code,
        settlement_bank_name: bank_name,
        settlement_account_name: subaccount.account_name ?? account_name,
        settlement_account_number: account_number,
      })
      .eq('id', business.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
