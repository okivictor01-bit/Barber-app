import { createClient } from '@/lib/supabase/server';
import { approveTicket, completeTicket } from '@/lib/actions';

export default async function AdminTicketsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, profiles:customer_id(full_name, phone)')
    .eq('business_id', profile!.business_id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tickets</h1>
      <p className="text-sm text-neutral-500">
        Tickets appear here once a customer submits them after payment (or a free ticket is auto-generated on their 3rd visit).
      </p>

      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Submitted</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t: any) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{t.profiles?.full_name}</td>
                <td className="py-2 pr-4">{t.is_free ? '🎁 Free (loyalty)' : 'Paid'}</td>
                <td className="py-2 pr-4">₦{Number(t.amount).toLocaleString()}</td>
                <td className="py-2 pr-4">{t.submitted_at ? new Date(t.submitted_at).toLocaleString() : '—'}</td>
                <td className="py-2 pr-4">
                  <span className={`badge-${t.status}`}>{t.status}</span>
                </td>
                <td className="py-2 pr-4 space-x-2">
                  {t.status === 'pending' && t.submitted_at && (
                    <form action={approveTicket.bind(null, t.id)} className="inline">
                      <button className="btn-primary text-xs px-3 py-1">Approve</button>
                    </form>
                  )}
                  {t.status === 'approved' && (
                    <form action={completeTicket.bind(null, t.id)} className="inline">
                      <button className="btn-secondary text-xs px-3 py-1">Mark completed</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {(!tickets || tickets.length === 0) && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-neutral-400">No tickets yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
