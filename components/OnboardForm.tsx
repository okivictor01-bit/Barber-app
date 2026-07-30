'use client';

import { useState } from 'react';

export default function OnboardForm({
  action,
  submitLabel,
  helpText,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  helpText?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      await action(formData);
      form.reset();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Done — added successfully.</p>}
      <input name="full_name" placeholder="Full name" required className="input" />
      <input name="email" type="email" placeholder="Email" required className="input" />
      <input name="phone" placeholder="Phone" className="input" />
      <input name="password" type="password" placeholder="Temporary password" required minLength={6} className="input" />
      {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Working…' : submitLabel}
      </button>
    </form>
  );
}
