import { createClient } from '@/lib/supabase/server';
import { updateCommissionRate, toggleBusinessActive } from '@/lib/actions';

export default async function BusinessesPage() {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from('businesses')
    .select('*, profiles!businesses_owner_id_fkey(full_name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Businesses</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Business</th>
              <th className="py-2 pr-4">Owner</th>
              <th className="py-2 pr-4">Commission %</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(businesses ?? []).map((b: any) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{b.name}</td>
                <td className="py-2 pr-4">{b.profiles?.full_name ?? '—'}</td>
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
            {(!businesses || businesses.length === 0) && (
              <tr><td colSpan={5} className="py-6 text-center text-neutral-400">No businesses registered yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
