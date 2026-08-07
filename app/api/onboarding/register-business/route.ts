import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
export async function POST(req: NextRequest) {
  const { email, password, full_name, business_name, phone } = await req.json();
  if (!email || !password || !full_name || !business_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const admin = createAdminClient();
  // 1. Create the auth user
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !userRes.user) {
    return NextResponse.json({ error: userErr?.message ?? 'Failed to create user' }, { status: 400 });
  }
  const userId = userRes.user.id;
  const slug = business_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  // 2. Create the business — commission_rate defaults to 10% for every new
  // business; adjustable later per-business from the Super Admin dashboard.
  const { data: business, error: bizErr } = await admin
    .from('businesses')
    .insert({ owner_id: userId, name: business_name, slug, phone, commission_rate: 10 })
    .select()
    .single();
  if (bizErr) {
    await admin.auth.admin.deleteUser(userId); // rollback
    return NextResponse.json({ error: bizErr.message }, { status: 400 });
  }
  // 3. Create the profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id: userId,
    role: 'admin',
    full_name,
    phone,
    business_id: business.id,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userId); // rollback
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }
  // 4. Stamp the role onto the auth account itself — middleware reads this
  // directly (no database round-trip) to decide which dashboard to route to.
  const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: 'admin', business_id: business.id },
  });
  if (metaErr) {
    return NextResponse.json({ error: metaErr.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, business_id: business.id });
}
