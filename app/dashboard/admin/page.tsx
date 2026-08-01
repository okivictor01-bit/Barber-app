import { createClient } from '@/lib/supabase/server';
import { updateBusinessPrice, updateLoyaltyInterval } from '@/lib/actions';
import { getPeriodRange, formatDateInput } from '@/lib/reports';
import { DownloadReportButton } from '@/components/ReportButtons';

export default async function FinanceOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from: fromParam, to: toParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const businessId = profile!.business_id;

  const { data: business } = await supabase
    .from('businesses')
    .select('default_price, commission_rate, loyalty_interval')
    .eq('id', businessId)
    .single();

  // Top summary stats always reflect THIS MONTH — they naturally reset
  // themselves the moment a new month starts, without deleting any data.
  const { from: monthFrom, to: monthTo } = getPeriodRange('month');
  const { data: monthTransactions } = await supabase
    .from('transactions')
    .select('business_amount, platform_fee')
    .eq('business_id', businessId)
    .eq('status', 'success')
    .gte('paid_at', monthFrom.toISOString())
    .lte('paid_at', monthTo.toISOString());

  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('business_id', businessId)
    .eq('status', 'approved')
    .gte('created_at', monthFrom.toISOString())
    .lte('created_at', monthTo.toISOString());

  const moneyIn = (monthTransactions ?? []).reduce((s, t) => s + Number(t.business_amount), 0);
  const platformFees = (monthTransactions ?? []).reduce((s, t) => s + Number(t.platform_fee), 0);
  const moneyOut = (monthExpenses ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const profit = moneyIn - moneyOut;

  // Transaction report defaults to TODAY; searching by date shows past days.
  const isSearching = Boolean(fromParam || toParam);
  const { from: reportFrom, to: reportTo, label: reportLabel } = isSearching
    ? getPeriodRange('custom', fromParam, toParam)
    : getPeriodRange('today');

  const { data: reportTransactions, error: reportError } = await supabase
    .from('transactions')
    .select('*')
    .eq('business_id', businessId)
    .eq('status', 'success')
    .gte('paid_at', reportFrom.toISOString())
    .lte('paid_at', reportTo.toISOString())
    .order('paid_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Finance Overview</h1>
      <p className="text-xs text-neutral-500 -mt-4">
        The figures below reflect <strong>this month</strong> and reset automatically at the start of each new month.
        Your full history is never deleted — download any past period below.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={`Money In (your ${100 - Number(business?.commission_rate ?? 10)}%)`} value={moneyIn} tone="green" />
        <StatCard label="Money Out (expenses)" value={moneyOut} tone="red" />
        <StatCard label={profit >= 0 ? 'Profit' : 'Loss'} value={profit} tone={profit >= 0 ? 'green' : 'red'} />
        <StatCard label={`Platform Fees Paid (${business?.commission_rate ?? 10}%)`} value={platformFees} tone="neutral" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card max-w-sm">
          <h2 className="font-semibold mb-3">Standard haircut price</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Platform takes {business?.commission_rate}% — you keep {100 - Number(business?.commission_rate ?? 10)}% of every payment.
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

        <div className="card max-w-sm">
          <h2 className="font-semibold mb-3">Loyalty program</h2>
          <p className="text-xs text-neutral-500 mb-3">
            Give customers a free haircut every Nth paid visit. Currently: every {business?.loyalty_interval ?? 3} paid visits.
          </p>
          <form action={updateLoyaltyInterval} className="flex gap-2 items-center">
            <span className="text-sm text-neutral-600 shrink-0">Every</span>
            <input
              name="loyalty_interval"
              type="number"
              min={2}
              step="1"
              defaultValue={business?.loyalty_interval ?? 3}
              className="input"
            />
            <span className="text-sm text-neutral-600 shrink-0">visits</span>
            <button type="submit" className="btn-primary shrink-0">Save</button>
          </form>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Download Reports</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DownloadReportButton period="today" label="Daily" />
          <DownloadReportButton period="week" label="Weekly" />
          <DownloadReportButton period="month" label="Monthly" />
          <DownloadReportButton period="year" label="Yearly" />
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-semibold">Transaction Report — {isSearching ? reportLabel : 'Today'}</h2>
        </div>

        <form className="flex flex-wrap items-end gap-2 mb-4" action="/dashboard/admin">
          <div>
            <label className="text-xs text-neutral-500 block mb-1">From</label>
            <input type="date" name="from" defaultValue={fromParam} className="input py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">To</label>
            <input type="date" name="to" defaultValue={toParam} className="input py-1.5 text-sm" />
          </div>
          <button type="submit" className="btn-primary text-sm py-1.5">Search past transactions</button>
          {isSearching && (
            <a href="/dashboard/admin" className="btn-secondary text-sm py-1.5">Back to today</a>
          )}
        </form>

        {reportError && (
          <p className="text-sm text-red-600 mb-4">Couldn&apos;t load transactions: {reportError.message}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Reference</th>
                <th className="py-2 pr-4">Service</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Platform Fee</th>
                <th className="py-2 pr-4">Your Share</th>
              </tr>
            </thead>
            <tbody>
              {(reportTransactions ?? []).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{new Date(t.paid_at).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{t.paystack_reference}</td>
                  <td className="py-2 pr-4">{t.service_name ?? 'Haircut'}</td>
                  <td className="py-2 pr-4">₦{Number(t.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4">₦{Number(t.platform_fee).toLocaleString()}</td>
                  <td className="py-2 pr-4 font-medium">₦{Number(t.business_amount).toLocaleString()}</td>
                </tr>
              ))}
              {(!reportTransactions || reportTransactions.length === 0) && !reportError && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    No transactions {isSearching ? 'in this range' : 'today'}.
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
