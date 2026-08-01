import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listBanks } from '@/lib/paystack';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const banks = await listBanks();
    return NextResponse.json({ banks });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
