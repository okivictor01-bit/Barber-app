'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase's client automatically exchanges the recovery token in the
    // URL for a temporary session on load. We just need to confirm that
    // happened before showing the "set new password" form.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setHasValidSession(true);
        setReady(true);
      }
    });

    // Fallback in case the event already fired before this component mounted
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasValidSession(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push('/login?reset=success');
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-neutral-500">Verifying your reset link…</p>
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Link expired or invalid</h1>
          <p className="text-sm text-neutral-600">
            This password reset link is no longer valid — it may have already been used, or expired. Request a new
            one below.
          </p>
          <a href="/forgot-password" className="btn-primary w-full block">
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Set a new password</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="text-sm font-medium">New password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm password</label>
          <input
            type="password"
            required
            minLength={6}
            className="input mt-1"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    </div>
  );
}
