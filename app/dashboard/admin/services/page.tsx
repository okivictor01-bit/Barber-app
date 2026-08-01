import { createClient } from '@/lib/supabase/server';
import { addService, updateService, toggleServiceActive } from '@/lib/actions';

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: business } = await supabase
    .from('businesses')
    .select('default_price')
    .eq('id', profile!.business_id)
    .single();

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', profile!.business_id)
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Services</h1>
      <p className="text-sm text-neutral-500">
        The standard haircut (₦{Number(business?.default_price ?? 0).toLocaleString()}) is set on{' '}
        <a href="/dashboard/admin" className="text-brand-600 underline">Finance Overview</a> and is the only
        service that counts toward your loyalty program. Any extra services you add here — beard trimming, dyeing,
        dreadlocks, treatments, etc. — are priced separately and don&apos;t count toward loyalty.
      </p>

      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Add a service</h2>
        <form action={addService} className="flex gap-2">
          <input name="name" placeholder="e.g. Beard Trimming" required className="input" />
          <input name="price" type="number" step="0.01" placeholder="₦" required className="input w-28" />
          <button type="submit" className="btn-primary shrink-0">Add</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Your services</h2>
        {servicesError && (
          <p className="text-sm text-red-600 mb-4">Couldn&apos;t load services: {servicesError.message}</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Service</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(services ?? []).map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  <form action={updateService.bind(null, s.id)} className="flex gap-2 items-center">
                    <input name="name" defaultValue={s.name} className="input py-1 w-40" />
                    <input name="price" type="number" step="0.01" defaultValue={s.price} className="input py-1 w-24" />
                    <button className="btn-secondary text-xs px-2 py-1 shrink-0">Save</button>
                  </form>
                </td>
                <td className="py-2 pr-4">
                  <span className={s.is_active ? 'badge-completed' : 'badge-cancelled'}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleServiceActive.bind(null, s.id, s.is_active)}>
                    <button className="text-xs text-red-600 hover:underline">
                      {s.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!services || services.length === 0) && !servicesError && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-neutral-400">
                  No extra services added yet — just the standard haircut.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
