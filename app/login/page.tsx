'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Give slow/flaky connections a real chance, but don't hang forever with no feedback
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('This is taking too long — check your connection and try again.')), 20000)
      );

      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ]);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Check your connection and try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold text-center">Sign in to BarbFlow</h1>
        {resetSuccess && (
          <p className="text-sm text-green-600 text-center">Password updated — sign in with your new password.</p>
        )}
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
        <div>
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="text-right -mt-2">
          <a href="/forgot-password" className="text-xs text-brand-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-xs text-center text-neutral-500">
          Business owners register below. Barbers & customers are onboarded by their business.
        </p>
        <a href="/register" className="btn-secondary w-full block text-center">
          Register a new business
        </a>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
