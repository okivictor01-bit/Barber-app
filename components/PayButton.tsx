'use client';

import { useState } from 'react';

export default function PayButton({ businessId, amount }: { businessId: string; amount: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, amount }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        throw new Error(data.error ?? data.message ?? 'Could not start payment');
      }
      window.location.href = data.data.authorization_url;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handlePay} disabled={loading} className="btn-primary">
        {loading ? 'Redirecting to Paystack…' : `Pay ₦${amount.toLocaleString()} for a haircut`}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
