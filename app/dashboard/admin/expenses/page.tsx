import { createClient } from '@/lib/supabase/server';
import { submitExpense, reviewExpense } from '@/lib/actions';

export default async function AdminExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, profiles:submitted_by(full_name, role)')
    .eq('business_id', profile!.business_id)
    .order('created_at', { ascending: false });

  const pending = (expenses ?? []).filter((e) => e.status === 'pending');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>

      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Log an expense</h2>
        <form action={submitExpense} className="space-y-3">
          <input name="description" placeholder="Description" required className="input" />
          <input name="amount" type="number" step="0.01" placeholder="Amount (₦)" required className="input" />
          <select name="category" className="input">
            <option value="general">General</option>
            <option value="supplies">Supplies</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="equipment">Equipment</option>
          </select>
          <button type="submit" className="btn-primary">Submit expense</button>
        </form>
      </div>

      {pending.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-4">Pending approval ({pending.length})</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b">
                <th className="py-2 pr-4">Submitted by</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((e: any) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{e.profiles?.full_name}</td>
                  <td className="py-2 pr-4">{e.description}</td>
                  <td className="py-2 pr-4">₦{Number(e.amount).toLocaleString()}</td>
                  <td className="py-2 pr-4 space-x-2">
                    <form action={reviewExpense.bind(null, e.id, 'approved')} className="inline">
                      <button className="btn-primary text-xs px-3 py-1">Approve</button>
                    </form>
                    <form action={reviewExpense.bind(null, e.id, 'rejected')} className="inline">
                      <button className="text-red-600 text-xs hover:underline">Reject</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-4">All expenses</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Submitted by</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((e: any) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{e.profiles?.full_name}</td>
                <td className="py-2 pr-4">{e.description}</td>
                <td className="py-2 pr-4">₦{Number(e.amount).toLocaleString()}</td>
                <td className="py-2 pr-4"><span className={`badge-${e.status === 'approved' ? 'completed' : e.status === 'rejected' ? 'cancelled' : 'pending'}`}>{e.status}</span></td>
              </tr>
            ))}
            {(!expenses || expenses.length === 0) && (
              <tr><td colSpan={5} className="py-6 text-center text-neutral-400">No expenses logged yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
