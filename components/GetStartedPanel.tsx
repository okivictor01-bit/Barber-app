'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GetStartedPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [audience, setAudience] = useState<'customer' | 'business'>('customer');

  const signinHref = audience === 'customer' ? '/login' : '/login?as=business';
  const signupHref = audience === 'customer' ? '/register?as=customer' : '/register';

  return (
    <div className="card max-w-md w-full mx-auto">
      <div className="flex rounded-lg bg-neutral-100 p-1 mb-4">
        <button
          onClick={() => setMode('signin')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            mode === 'signin' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'
          }`}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            mode === 'signup' ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'
          }`}
        >
          Create account
        </button>
      </div>

      <div className="flex rounded-lg border border-neutral-200 p-1 mb-6">
        <button
          onClick={() => setAudience('customer')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            audience === 'customer' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-neutral-500'
          }`}
        >
          Customer
        </button>
        <button
          onClick={() => setAudience('business')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            audience === 'business' ? 'bg-brand-50 text-brand-700 border border-brand-200' : 'text-neutral-500'
          }`}
        >
          Business owner
        </button>
      </div>

      <p className="text-sm text-neutral-500 mb-5">
        {mode === 'signin'
          ? audience === 'customer'
            ? 'Sign in to book your next cut and track your loyalty rewards.'
            : 'Sign in to manage your barbershop — staff, tickets, and finances.'
          : audience === 'customer'
          ? 'Create a free account to start booking haircuts nearby.'
          : 'Register your barbershop and start accepting bookings and payments.'}
      </p>

      <Link
        href={mode === 'signin' ? signinHref : signupHref}
        className="btn-primary w-full text-center block"
      >
        {mode === 'signin' ? 'Continue to sign in' : 'Continue to create account'}
      </Link>
    </div>
  );
}
