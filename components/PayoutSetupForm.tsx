'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Bank = { name: string; code: string };

export default function PayoutSetupForm() {
  const router = useRouter();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/paystack/banks')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setBanks(data.banks ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setBanksLoading(false));
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResolvedName(null);
    setVerifying(true);
    try {
      const res = await fetch('/api/paystack/resolve-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not verify account');
      setResolvedName(data.account_name);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleConfirm() {
    setError(null);
    setSaving(true);
    try {
      const bankName = banks.find((b) => b.code === bankCode)?.name ?? '';
      const res = await fetch('/api/paystack/subaccount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: accountNumber,
          bank_code: bankCode,
          bank_name: bankName,
          account_name: resolvedName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not set up payouts');
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (resolvedName) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm text-neutral-500">Confirm this is correct before saving:</p>
          <p className="font-semibold text-neutral-800 mt-1">{resolvedName}</p>
          <p className="text-sm text-neutral-600">
            {banks.find((b) => b.code === bankCode)?.name} — {accountNumber}
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={handleConfirm} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Confirm & Save'}
          </button>
          <button
            onClick={() => setResolvedName(null)}
            disabled={saving}
            className="btn-secondary"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div>
        <label className="text-sm font-medium block mb-1">Bank</label>
        <select
          required
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="input"
          disabled={banksLoading}
        >
          <option value="">{banksLoading ? 'Loading banks…' : 'Select your bank'}</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium block mb-1">Account number</label>
        <input
          required
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="input"
          inputMode="numeric"
          maxLength={10}
        />
      </div>
      <button type="submit" disabled={verifying || !bankCode || !accountNumber} className="btn-primary">
        {verifying ? 'Verifying…' : 'Verify account'}
      </button>
    </form>
  );
}
