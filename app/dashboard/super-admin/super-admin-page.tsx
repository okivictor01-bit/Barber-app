import { createClient } from '@/lib/supabase/server';
import { updatePlatformDefaultRate } from '@/lib/actions';
export default async function SuperAdminOverview() {
  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, platform_fee, business_amount, status');
  const { data: businesses } = await supabase.from('businesses').select('id, is_active');
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('default_commission_rate')
    .eq('id', true)
    .single();
  const successful = (transactions ?? []).filter((t) => t.status === 'success');
  const totalRevenue = successful.reduce((s, t) => s + Number(t.amount), 0);
  const platformEarnings = successful.reduce((s, t) => s + Number(t.platform_fee), 0);
  const businessPayouts = successful.reduce((s, t) => s + Number(t.business_amount), 0);
  const activeBusinesses = (businesses ?? []).filter((b) => b.is_active).length;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Platform Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Active Businesses" value={activeBusinesses} isCurrency={false} />
        <Stat label="Total Platform Revenue" value={totalRevenue} isCurrency />
        <Stat label="Platform Earnings" value={platformEarnings} isCurrency tone="green" />
        <Stat label="Paid Out to Businesses" value={businessPayouts} isCurrency />
      </div>

      <div className="card max-w-sm">
        <h2 className="font-semibold mb-2">Default platform fee</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Applied automatically to every new business at signup. Doesn&apos;t affect existing businesses — change
          those individually from the Businesses tab.
        </p>
        <form action={updatePlatformDefaultRate} className="flex gap-2 items-center">
          <input
            name="default_commission_rate"
            type="number"
            step="0.1"
            min="0"
            defaultValue={settings?.default_commission_rate ?? 7}
            className="input w-24"
          />
          <span className="text-sm text-neutral-500">%</span>
          <button type="submit" className="btn-primary shrink-0">Save</button>
        </form>
      </div>

      <p className="text-sm text-neutral-500">
        See the <a href="/dashboard/super-admin/businesses" className="text-brand-600 underline">Businesses</a> tab
        to manage per-business commission rates.
      </p>
    </div>
  );
}
function Stat({
  label,
  value,
  isCurrency,
  tone,
}: {
  label: string;
  value: number;
  isCurrency: boolean;
  tone?: 'green';
}) {
  return (
    <div className="card">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${tone === 'green' ? 'text-green-600' : ''}`}>
        {isCurrency ? `₦${value.toLocaleString()}` : value}
      </p>
    </div>
  );
}
