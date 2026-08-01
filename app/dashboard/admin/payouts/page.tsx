import { createClient } from '@/lib/supabase/server';
import PayoutSetupForm from '@/components/PayoutSetupForm';

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: business } = await supabase
    .from('businesses')
    .select('paystack_subaccount_code, settlement_bank_name, settlement_account_name, settlement_account_number, commission_rate')
    .eq('id', profile!.business_id)
    .single();

  const isSetUp = Boolean(business?.paystack_subaccount_code);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Payouts</h1>

      {isSetUp ? (
        <div className="card max-w-lg space-y-4">
          <div className="flex items-center gap-2">
            <span className="badge-completed">Active</span>
            <p className="font-semibold">Automatic payouts are set up</p>
          </div>
          <p className="text-sm text-neutral-600">
            Every payment now splits automatically the moment a customer pays: your {100 - Number(business?.commission_rate ?? 10)}%
            goes straight to your account below, and the platform&apos;s {business?.commission_rate}% goes to us — no manual
            transfers needed. Paystack&apos;s own processing fee is deducted from your side, not the platform&apos;s.
          </p>
          <div className="rounded-lg border border-neutral-200 p-3">
            <p className="text-sm text-neutral-500">Settlement account</p>
            <p className="font-medium">{business?.settlement_account_name}</p>
            <p className="text-sm text-neutral-600">
              {business?.settlement_bank_name} — {business?.settlement_account_number}
            </p>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-brand-600">Change bank account</summary>
            <div className="mt-3">
              <PayoutSetupForm />
            </div>
          </details>
        </div>
      ) : (
        <div className="card max-w-lg space-y-4">
          <p className="text-sm text-neutral-600">
            Set up your bank account once, and every future payment splits automatically — your share lands straight in
            your account, no manual transfers needed. You&apos;ll cover Paystack&apos;s own processing fee on your share;
            the platform&apos;s cut is unaffected by it.
          </p>
          <p className="text-xs text-neutral-500">
            Until this is set up, all payments land in the platform&apos;s account and payouts happen manually outside the app.
          </p>
          <PayoutSetupForm />
        </div>
      )}
    </div>
  );
}
