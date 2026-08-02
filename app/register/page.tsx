'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    business_name: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 25000);

      const res = await fetch('/api/onboarding/register-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        signal: controller.signal,
      });
      clearTimeout(abortTimer);

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Registration failed');
        setLoading(false);
        return;
      }

      // Now sign the owner in
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Your business was created, but signing you in is taking too long. Try signing in manually below.')), 20000)
      );

      const { error: signInErr } = await Promise.race([
        supabase.auth.signInWithPassword({ email: form.email, password: form.password }),
        timeout,
      ]);

      if (signInErr) {
        setError(signInErr.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard/admin');
      router.refresh();
    } catch (err: any) {
      setError(
        err?.name === 'AbortError'
          ? 'The request took too long. Check your connection — your business may or may not have been created; try signing in below to check.'
          : err?.message ?? 'Something went wrong. Check your connection and try again.'
      );
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">Register your barbing business</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <label className="text-sm font-medium">Business name</label>
          <input required className="input mt-1" value={form.business_name}
            onChange={(e) => update('business_name', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Your full name</label>
          <input required className="input mt-1" value={form.full_name}
            onChange={(e) => update('full_name', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input type="email" required className="input mt-1" value={form.email}
            onChange={(e) => update('email', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input className="input mt-1" value={form.phone}
            onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <input type="password" required minLength={6} className="input mt-1" value={form.password}
            onChange={(e) => update('password', e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating your business…' : 'Create business & continue'}
        </button>
        <p className="text-xs text-center text-neutral-500">
          By registering, you agree to our{' '}
          <a href="/terms" target="_blank" className="text-brand-600 underline">Terms of Service</a> and{' '}
          <a href="/privacy" target="_blank" className="text-brand-600 underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}
