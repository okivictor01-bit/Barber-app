import { createClient } from '@/lib/supabase/server';

export default async function SuperAdminOverview() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, platform_fee, business_amount, status');

  const { data: businesses } = await supabase.from('businesses').select('id, is_active');

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
        <Stat label="Platform Earnings (15%)" value={platformEarnings} isCurrency tone="green" />
        <Stat label="Paid Out to Businesses (85%)" value={businessPayouts} isCurrency />
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
