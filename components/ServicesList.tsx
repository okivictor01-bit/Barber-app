'use client';

import { useState } from 'react';

type Service = {
  id: string | null; // null = standard haircut
  name: string;
  price: number;
};

export default function ServicesList({ businessId, services }: { businessId: string; services: Service[] }) {
  const [payingId, setPayingId] = useState<string | null | 'none'>('none');
  const [error, setError] = useState<string | null>(null);

  async function handlePay(service: Service) {
    setPayingId(service.id ?? 'haircut');
    setError(null);
    try {
      const res = await fetch('/api/paystack/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, service_id: service.id }),
      });

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Something went wrong starting your payment. Please try again in a moment.');
      }

      if (!res.ok || !data.status) {
        throw new Error(data.error ?? data.message ?? 'Could not start payment');
      }
      window.location.href = data.data.authorization_url;
    } catch (e: any) {
      setError(e.message);
      setPayingId('none');
    }
  }

  return (
    <div className="space-y-2">
      {services.map((service) => {
        const key = service.id ?? 'haircut';
        const isPaying = payingId === key;
        return (
          <button
            key={key}
            onClick={() => handlePay(service)}
            disabled={payingId !== 'none'}
            className="w-full flex items-center justify-between gap-3 border border-neutral-200 rounded-lg px-4 py-3 hover:border-brand-500 hover:bg-brand-50 disabled:opacity-50 text-left"
          >
            <span className="font-medium text-neutral-800">{service.name}</span>
            <span className="text-brand-600 font-semibold shrink-0">
              {isPaying ? 'Redirecting…' : `Pay ₦${service.price.toLocaleString()}`}
            </span>
          </button>
        );
      })}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
