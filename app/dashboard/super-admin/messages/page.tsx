import { createClient } from '@/lib/supabase/server';
import { updateMessageStatus } from '@/lib/actions';

export default async function MessagesPage() {
  const supabase = await createClient();

  const { data: messages, error } = await supabase
    .from('support_messages')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Support Messages</h1>

      {error && (
        <div className="card">
          <p className="text-sm text-red-600">Couldn&apos;t load messages: {error.message}</p>
        </div>
      )}

      <div className="space-y-3">
        {(messages ?? []).map((m) => (
          <div key={m.id} className="card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-neutral-800">{m.name}</p>
                <p className="text-sm text-neutral-500">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    m.status === 'new' ? 'badge-pending' : m.status === 'resolved' ? 'badge-completed' : 'badge-approved'
                  }
                >
                  {m.status}
                </span>
                <span className="text-xs text-neutral-400">{new Date(m.created_at).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm text-neutral-700 mt-3 whitespace-pre-wrap">{m.message}</p>
            <div className="flex gap-2 mt-3">
              {m.status !== 'read' && (
                <form action={updateMessageStatus.bind(null, m.id, 'read')}>
                  <button className="btn-secondary text-xs px-3 py-1">Mark read</button>
                </form>
              )}
              {m.status !== 'resolved' && (
                <form action={updateMessageStatus.bind(null, m.id, 'resolved')}>
                  <button className="btn-primary text-xs px-3 py-1">Mark resolved</button>
                </form>
              )}
            </div>
          </div>
        ))}
        {(!messages || messages.length === 0) && !error && (
          <div className="card">
            <p className="text-center text-neutral-400 py-6">No messages yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
