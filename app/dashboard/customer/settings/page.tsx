'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CustomerSettingsPage() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    setMessage('Password updated successfully.');
    setPassword('');
    setConfirm('');
  }

  return (
    <div className="max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Reset Password</h1>
      <form onSubmit={handleReset} className="card space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}
        <div>
          <label className="text-sm font-medium">New password</label>
          <input type="password" required minLength={6} className="input mt-1" value={password}
            onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm password</label>
          <input type="password" required minLength={6} className="input mt-1" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full">Update password</button>
      </form>
    </div>
  );
}
