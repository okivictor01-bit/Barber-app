import { createClient } from '@/lib/supabase/server';
import { submitExpense } from '@/lib/actions';

export default async function BarberExpensesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('submitted_by', user!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Expenses</h1>

      <div className="card max-w-lg">
        <h2 className="font-semibold mb-4">Submit an expense</h2>
        <p className="text-xs text-neutral-500 mb-3">Your expenses require the business owner&apos;s approval.</p>
        <form action={submitExpense} className="space-y-3">
          <input name="description" placeholder="Description" required className="input" />
          <input name="amount" type="number" step="0.01" placeholder="Amount (₦)" required className="input" />
          <select name="category" className="input">
            <option value="general">General</option>
            <option value="supplies">Supplies</option>
            <option value="equipment">Equipment</option>
          </select>
          <button type="submit" className="btn-primary">Submit for approval</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Your expense history</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500 border-b">
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((e) => (
              <tr key={e.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="py-2 pr-4">{e.description}</td>
                <td className="py-2 pr-4">₦{Number(e.amount).toLocaleString()}</td>
                <td className="py-2 pr-4"><span className={`badge-${e.status === 'approved' ? 'completed' : e.status === 'rejected' ? 'cancelled' : 'pending'}`}>{e.status}</span></td>
              </tr>
            ))}
            {(!expenses || expenses.length === 0) && (
              <tr><td colSpan={4} className="py-6 text-center text-neutral-400">No expenses submitted yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
