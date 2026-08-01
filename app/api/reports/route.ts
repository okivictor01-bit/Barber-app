import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPeriodRange, ReportPeriod } from '@/lib/reports';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Only the business owner can view reports' }, { status: 403 });
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', profile.business_id)
    .single();

  const searchParams = req.nextUrl.searchParams;
  const period = (searchParams.get('period') ?? 'today') as ReportPeriod;
  const customFrom = searchParams.get('from') ?? undefined;
  const customTo = searchParams.get('to') ?? undefined;

  const { from, to, label } = getPeriodRange(period, customFrom, customTo);

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('status', 'success')
    .gte('paid_at', from.toISOString())
    .lte('paid_at', to.toISOString())
    .order('paid_at', { ascending: false });

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', profile.business_id)
    .eq('status', 'approved')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false });

  if (expError) {
    return NextResponse.json({ error: expError.message }, { status: 500 });
  }

  const moneyIn = (transactions ?? []).reduce((s, t) => s + Number(t.business_amount), 0);
  const platformFees = (transactions ?? []).reduce((s, t) => s + Number(t.platform_fee), 0);
  const moneyOut = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const profit = moneyIn - moneyOut;

  return NextResponse.json({
    businessName: business?.name ?? 'Business',
    period,
    label,
    from: from.toISOString(),
    to: to.toISOString(),
    transactions: transactions ?? [],
    expenses: expenses ?? [],
    moneyIn,
    moneyOut,
    platformFees,
    profit,
  });
}
