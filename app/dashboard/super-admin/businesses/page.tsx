import { createClient, createAdminClient } from '@/lib/supabase/server';
import { updateCommissionRate, toggleBusinessActive } from '@/lib/actions';
import { getPeriodRange } from '@/lib/reports';
export default async function BusinessesPage() {
  const supabase = await createClient();
  const { data: businesses, error: businessesError } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });
  const ownerIds = [...new Set((businesses ?? []).map((b) => b.owner_id))];
  const { data: ownerProfiles } = ownerIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ownerIds)
    : { data: [] };
  const profileMap = new Map((ownerProfiles ?? []).map((p) => [p.id, p]));

  // Owner emails live in Supabase Auth, not the profiles table — fetch them
  // via the admin API, one lookup per distinct owner.
  const admin = createAdminClient();
  const emailMap = new Map<string, string>();
  await Promise.all(
    ownerIds.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) emailMap.set(id, data.user.email);
    })
  );

  // Count successful transactions THIS MONTH per business, in one query.
  const { from: monthFrom, to: monthTo } = getPeriodRange('month');
  const { data: monthTransactions } = await supabase
    .from('transactions')
    .select('business_id')
    .eq('status', 'success')
    .gte('paid_at', monthFrom.toISOString())
    .lte('paid_at', monthTo.toISOString());
  const txCountMap = new Map<string, number>();
  (monthTransactions ?? []).forEach((t) => {
    txCountMap.set(t.business_id, (txCountMap.get(t.business_id) ?? 0) + 1);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Businesses</h1>
      <div className="card overflow-x-auto">
        {businessesError && (
          <p className="text-sm text-red-600 mb-4">Couldn&apos;t load businesses: {businessesError.message}</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Business</th>
              <th className="py-2 pr-4">Owner</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Transactions (this month)</th>
              <th className="py-2 pr-4">Commission %</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(businesses ?? []).map((b: any) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{b.name}</td>
                <td className="py-2 pr-4">{profileMap.get(b.owner_id)?.full_name ?? '—'}</td>
                <td className="py-2 pr-4">{b.phone ?? '—'}</td>
                <td className="py-2 pr-4">{emailMap.get(b.owner_id) ?? '—'}</td>
                <td className="py-2 pr-4">{txCountMap.get(b.id) ?? 0}</td>
                <td className="py-2 pr-4">
                  <form action={updateCommissionRate.bind(null, b.id)} className="flex gap-2 items-center">
                    <input
                      name="commission_rate"
                      type="number"
                      step="0.1"
                      defaultValue={b.commission_rate}
                      className="input w-20 py-1"
                    />
                    <button className="btn-secondary text-xs px-2 py-1">Save</button>
                  </form>
                </td>
                <td className="py-2 pr-4">
                  <span className={b.is_active ? 'badge-completed' : 'badge-cancelled'}>
                    {b.is_active ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleBusinessActive.bind(null, b.id, b.is_active)}>
                    <button className="text-xs text-red-600 hover:underline">
                      {b.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!businesses || businesses.length === 0) && !businessesError && (
              <tr><td colSpan={8} className="py-6 text-center text-neutral-400">No businesses registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
