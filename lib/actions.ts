'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) throw new Error('Profile not found');

  return { supabase, user, profile };
}

// ---------- SUPER ADMIN ----------

export async function updateCommissionRate(businessId: string, formData: FormData) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'super_admin') throw new Error('Only the super admin can change commission rates');

  const commission_rate = Number(formData.get('commission_rate'));
  const { error } = await supabase.from('businesses').update({ commission_rate }).eq('id', businessId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/super-admin/businesses');
}

export async function toggleBusinessActive(businessId: string, isActive: boolean) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'super_admin') throw new Error('Only the super admin can suspend businesses');

  const { error } = await supabase.from('businesses').update({ is_active: !isActive }).eq('id', businessId);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/super-admin/businesses');
}

// ---------- BUSINESS SETTINGS ----------

export async function updateBusinessPrice(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'admin') throw new Error('Only the business owner can update pricing');

  const default_price = Number(formData.get('default_price'));
  const { error } = await supabase
    .from('businesses')
    .update({ default_price })
    .eq('id', profile.business_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin');
}

// ---------- ONBOARDING (owner or barber can onboard customers; only owner onboards barbers) ----------

export async function onboardBarber(formData: FormData) {
  const { profile } = await requireProfile();
  if (profile.role !== 'admin') throw new Error('Only the business owner can onboard barbers');

  const email = String(formData.get('email'));
  const full_name = String(formData.get('full_name'));
  const phone = String(formData.get('phone') ?? '');
  const temp_password = String(formData.get('password'));

  const admin = createAdminClient();

  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
  });
  if (userErr || !userRes.user) throw new Error(userErr?.message ?? 'Failed to create barber account');

  const { error: profileErr } = await admin.from('profiles').insert({
    id: userRes.user.id,
    role: 'barber',
    full_name,
    phone,
    business_id: profile.business_id,
    created_by: profile.id,
  });
  if (profileErr) {
    await admin.auth.admin.deleteUser(userRes.user.id);
    throw new Error(profileErr.message);
  }

  revalidatePath('/dashboard/admin/barbers');
}

export async function onboardCustomer(formData: FormData) {
  const { profile } = await requireProfile();
  if (!['admin', 'barber'].includes(profile.role)) throw new Error('Not authorized');

  const email = String(formData.get('email'));
  const full_name = String(formData.get('full_name'));
  const phone = String(formData.get('phone') ?? '');
  const temp_password = String(formData.get('password'));

  const admin = createAdminClient();

  // Customer might already exist (onboarded at another business) — check first
  const { data: existing } = await admin.from('profiles').select('id').eq('id', email).maybeSingle();

  let customerId: string;

  const { data: existingUser } = await admin.auth.admin.listUsers();
  const found = existingUser.users.find((u) => u.email === email);

  if (found) {
    customerId = found.id;
  } else {
    const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: true,
    });
    if (userErr || !userRes.user) throw new Error(userErr?.message ?? 'Failed to create customer account');
    customerId = userRes.user.id;

    await admin.from('profiles').insert({
      id: customerId,
      role: 'customer',
      full_name,
      phone,
      created_by: profile.id,
    });
  }

  // Link to this business (loyalty tracking is per business_customers row)
  await admin
    .from('business_customers')
    .upsert(
      { business_id: profile.business_id, customer_id: customerId, onboarded_by: profile.id },
      { onConflict: 'business_id,customer_id', ignoreDuplicates: true }
    );

  revalidatePath('/dashboard/admin/customers');
  revalidatePath('/dashboard/barber/customers');
}

export async function removeStaffOrCustomer(userId: string) {
  const { profile, supabase } = await requireProfile();
  if (profile.role !== 'admin') throw new Error('Only the business owner can remove staff/customers');

  // Deactivate rather than hard-delete to preserve transaction/ticket history
  await supabase.from('profiles').update({ is_active: false }).eq('id', userId).eq('business_id', profile.business_id);
  await supabase
    .from('business_customers')
    .delete()
    .eq('customer_id', userId)
    .eq('business_id', profile.business_id);

  revalidatePath('/dashboard/admin/barbers');
  revalidatePath('/dashboard/admin/customers');
}

// ---------- TICKETS ----------

export async function submitTicket(ticketId: string) {
  const { supabase, user } = await requireProfile();
  const { error } = await supabase
    .from('tickets')
    .update({ submitted_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('customer_id', user.id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/customer');
}

export async function approveTicket(ticketId: string) {
  const { supabase, profile } = await requireProfile();
  if (!['admin', 'barber'].includes(profile.role)) throw new Error('Not authorized');

  const { error } = await supabase
    .from('tickets')
    .update({
      status: 'approved',
      barber_id: profile.role === 'barber' ? profile.id : null,
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', ticketId)
    .eq('business_id', profile.business_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin/tickets');
  revalidatePath('/dashboard/barber/tickets');
}

export async function completeTicket(ticketId: string) {
  const { supabase, profile } = await requireProfile();
  if (!['admin', 'barber'].includes(profile.role)) throw new Error('Not authorized');

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', ticketId)
    .eq('business_id', profile.business_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin/tickets');
  revalidatePath('/dashboard/barber/tickets');
}

// ---------- EXPENSES ----------

export async function submitExpense(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  if (!['admin', 'barber'].includes(profile.role)) throw new Error('Not authorized');

  const description = String(formData.get('description'));
  const amount = Number(formData.get('amount'));
  const category = String(formData.get('category') ?? 'general');

  const { error } = await supabase.from('expenses').insert({
    business_id: profile.business_id,
    submitted_by: profile.id,
    description,
    amount,
    category,
    // Owner's own expenses can be auto-approved; barber's require owner approval
    status: profile.role === 'admin' ? 'approved' : 'pending',
    approved_by: profile.role === 'admin' ? profile.id : null,
    approved_at: profile.role === 'admin' ? new Date().toISOString() : null,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin/expenses');
  revalidatePath('/dashboard/barber/expenses');
}

export async function reviewExpense(expenseId: string, decision: 'approved' | 'rejected') {
  const { supabase, profile } = await requireProfile();
  if (profile.role !== 'admin') throw new Error('Only the business owner can approve expenses');

  const { error } = await supabase
    .from('expenses')
    .update({ status: decision, approved_by: profile.id, approved_at: new Date().toISOString() })
    .eq('id', expenseId)
    .eq('business_id', profile.business_id);
  if (error) throw new Error(error.message);

  revalidatePath('/dashboard/admin/expenses');
}
