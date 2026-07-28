import { createClient } from '@/lib/supabase/server';
import { updateBusinessPrice } from '@/lib/actions';

export default async function FinanceOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const businessId = profile!.business_id;

  const { data: business } = await supabase
    .from('businesses')
    .select('default_price, commission_rate')
    .eq('id', businessId)
    .single();

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'success')
    .order('paid_at', { ascending: false });

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  const moneyIn = (transactions ?? []).reduce((s, t) => s + Number(t.business_amount), 0);
  const platformFees = (transactions ?? []).reduce((s, t) => s + Number(t.platform_fee), 0);
  const moneyOut = (expenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const profit = moneyIn - moneyOut;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Finance Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Money In (your 85%)" value={moneyIn} tone="green" />
        <StatCard label="Money Out (expenses)" value={moneyOut} tone="red" />
        <StatCard label={profit >= 0 ? 'Profit' : 'Loss'} value={profit} tone={profit >= 0 ? 'green' : 'red'} />
        <StatCard label="Platform Fees Paid (15%)" value={platformFees} tone="neutral" />
      </div>

      <div className="card max-w-sm">
        <h2 className="font-semibold mb-3">Standard haircut price</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Platform takes {business?.commission_rate}% — you keep {100 - Number(business?.commission_rate ?? 15)}% of every payment.
        </p>
        <form action={updateBusinessPrice} className="flex gap-2">
          <input
            name="default_price"
            type="number"
            step="0.01"
            defaultValue={business?.default_price}
            className="input"
          />
          <button type="submit" className="btn-primary shrink-0">Save</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Transactions Report</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Platform Fee</th>
                <th className="py-2 pr-4">Your Share</th>
              </tr>
            </thead>
            <tbody>
              {(transactions ?? []).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{new Date(t.paid_at).toLocaleDateString()}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{t.paystack_reference}</td>
                  <td className="py-2 pr-4">₦{Number(t.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4">₦{Number(t.platform_fee).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-medium">₦{Number(t.business_amount).toLocaleString()}</td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-400">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: 'green' | 'red' | 'neutral' }) {
  const toneClass = tone === 'green' ? 'text-green-600' : tone === 'red' ? 'text-red-600' : 'text-neutral-700';
  return (
    <div className="card">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>₦{value.toLocaleString()}</p>
    </div>
  );
}
