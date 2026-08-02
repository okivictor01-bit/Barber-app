'use client';

import { useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';

export default function ContactPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('support_messages').insert({
      name: form.name,
      email: form.email,
      message: form.message,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-lg mx-auto px-4 py-12 w-full">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to BarbFlow</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Contact Us</h1>
        <p className="text-neutral-600 mb-8 text-sm">
          Have a question, a problem with a booking, or feedback for us? Send a message and we&apos;ll get back to
          you.
        </p>

        {sent ? (
          <div className="card text-center space-y-2">
            <p className="font-semibold text-neutral-800">Message sent</p>
            <p className="text-sm text-neutral-600">Thanks for reaching out — we&apos;ll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <label className="text-sm font-medium">Your name</label>
              <input
                required
                className="input mt-1"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                required
                className="input mt-1"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                required
                rows={5}
                className="input mt-1"
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
