import { createClient } from '@/lib/supabase/server';
import { onboardCustomer } from '@/lib/actions';
import OnboardForm from '@/components/OnboardForm';

export default async function BarberCustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: business } = await supabase
    .from('businesses')
    .select('loyalty_interval')
    .eq('id', profile!.business_id)
    .single();

  const { data: bcRows, error: bcError } = await supabase
    .from('business_customers')
    .select('*, profiles:customer_id(full_name, phone)')
    .eq('business_id', profile!.business_id)
    .order('created_at', { ascending: false });

  const interval = business?.loyalty_interval ?? 3;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>

      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Onboard a new customer</h2>
        <OnboardForm action={onboardCustomer} submitLabel="Add customer" />
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Customers</h2>
        {bcError && (
          <p className="text-sm text-red-600 mb-4">Couldn&apos;t load customers: {bcError.message}</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Phone</th>
              <th className="py-2 pr-4">Paid visits</th>
              <th className="py-2 pr-4">Free tickets earned</th>
            </tr>
          </thead>
          <tbody>
            {(bcRows ?? []).map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{r.profiles?.full_name ?? '(name unavailable)'}</td>
                <td className="py-2 pr-4">{r.profiles?.phone}</td>
                <td className="py-2 pr-4">
                  {r.paid_transaction_count} <span className="text-neutral-400">(every {interval} is free)</span>
                </td>
                <td className="py-2 pr-4">{r.free_tickets_earned}</td>
              </tr>
            ))}
            {(!bcRows || bcRows.length === 0) && !bcError && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-400">No customers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
