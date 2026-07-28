import { createClient } from '@/lib/supabase/server';
import { onboardBarber, removeStaffOrCustomer } from '@/lib/actions';

export default async function BarbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: barbers } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_id', profile!.business_id)
    .eq('role', 'barber')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Barbers</h1>

      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Onboard a new barber</h2>
        <form action={onboardBarber} className="space-y-3">
          <input name="full_name" placeholder="Full name" required className="input" />
          <input name="email" type="email" placeholder="Email" required className="input" />
          <input name="phone" placeholder="Phone" className="input" />
          <input name="password" type="password" placeholder="Temporary password" required minLength={6} className="input" />
          <p className="text-xs text-neutral-500">
            The barber can change this password after their first login.
          </p>
          <button type="submit" className="btn-primary">Add barber</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Your barbers</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(barbers ?? []).map((b) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{b.full_name}</td>
                <td className="py-2 pr-4">{b.phone}</td>
                <td className="py-2 pr-4">
                  <span className={b.is_active ? 'badge-completed' : 'badge-cancelled'}>
                    {b.is_active ? 'Active' : 'Removed'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {b.is_active && (
                    <form action={removeStaffOrCustomer.bind(null, b.id)}>
                      <button className="text-red-600 text-xs hover:underline">Remove</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!barbers || barbers.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-400">No barbers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
