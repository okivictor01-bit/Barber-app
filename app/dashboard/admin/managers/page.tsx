import { createClient } from '@/lib/supabase/server';
import { onboardManager, removeStaffOrCustomer } from '@/lib/actions';
import OnboardForm from '@/components/OnboardForm';
export default async function ManagersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
  const { data: managers } = await supabase
    .from('profiles')
    .select('*')
    .eq('business_id', profile!.business_id)
    .eq('role', 'manager')
    .order('created_at', { ascending: false });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Managers</h1>
      <p className="text-sm text-neutral-500">
        Managers can onboard customers, log expenses (which need your approval), and approve tickets.
      </p>
      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Onboard a new manager</h2>
        <OnboardForm
          action={onboardManager}
          submitLabel="Add manager"
          helpText="The manager can change this password after their first login."
        />
      </div>
      <div className="card">
        <h2 className="font-semibold mb-4">Your managers</h2>
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
            {(managers ?? []).map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{m.full_name}</td>
                <td className="py-2 pr-4">{m.phone}</td>
                <td className="py-2 pr-4">
                  <span className={m.is_active ? 'badge-completed' : 'badge-cancelled'}>
                    {m.is_active ? 'Active' : 'Removed'}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {m.is_active && (
                    <form action={removeStaffOrCustomer.bind(null, m.id)}>
                      <button className="text-red-600 text-xs hover:underline">Remove</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!managers || managers.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-400">No managers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
