import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveAccountNumber } from '@/lib/paystack';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only the business owner can set up payouts' }, { status: 403 });
  }

  const { account_number, bank_code } = await req.json();
  if (!account_number || !bank_code) {
    return NextResponse.json({ error: 'account_number and bank_code are required' }, { status: 400 });
  }

  try {
    const result = await resolveAccountNumber(account_number, bank_code);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
