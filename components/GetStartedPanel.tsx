'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GetStartedPanel() {
  const [audience, setAudience] = useState<'customer' | 'business'>('customer');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="card max-w-md w-full mx-auto">
      <div className="flex rounded-lg border border-neutral-200 p-1 mb-6">
        <button
          onClick={() => {
            setAudience('customer');
            setMode('signin');
          }}
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

      {audience === 'business' && (
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
      )}

      {audience === 'customer' ? (
        <>
          <p className="text-sm text-neutral-600 mb-2">
            Sign in to book your next cut and track your loyalty rewards.
          </p>
          <p className="text-xs text-neutral-400 mb-5">
            New here? Customer accounts are created by your barbershop when you visit — ask staff to add you, then
            sign in with the details they give you.
          </p>
          <Link href="/login" className="btn-primary w-full text-center block">
            Continue to sign in
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-neutral-600 mb-5">
            {mode === 'signin'
              ? 'Sign in to manage your barbershop — staff, tickets, and finances.'
              : 'Register your barbershop and start accepting bookings and payments.'}
          </p>
          <Link
            href={mode === 'signin' ? '/login' : '/register'}
            className="btn-primary w-full text-center block"
          >
            {mode === 'signin' ? 'Continue to sign in' : 'Continue to create account'}
          </Link>
        </>
      )}
    </div>
  );
}
