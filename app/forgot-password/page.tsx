'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Deliberately show the same success message whether or not the email
    // exists — this stops someone from using this form to check which
    // emails are registered on the platform.
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-neutral-600">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It may
            take a minute or two to arrive — check your spam folder if you don&apos;t see it.
          </p>
          <a href="/login" className="text-sm text-brand-600 hover:underline block">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Reset your password</h1>
        <p className="text-sm text-neutral-500 text-center">
          Enter the email on your account and we&apos;ll send you a link to set a new password.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
        <a href="/login" className="text-sm text-brand-600 hover:underline block text-center">
          Back to sign in
        </a>
      </form>
    </div>
  );
}
