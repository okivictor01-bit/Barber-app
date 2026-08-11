'use client';

import { useState } from 'react';

export default function BusinessUrlCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://barbflow.shop/b/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in some contexts (e.g. no HTTPS, old browsers);
      // the input below still lets someone select-and-copy manually.
    }
  }

  return (
    <div className="card max-w-lg">
      <h2 className="font-semibold mb-1">Your shop&apos;s public link</h2>
      <p className="text-xs text-neutral-500 mb-3">
        Share this with customers — it shows your services, prices, and contact info.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="input flex-1 text-sm text-neutral-600"
        />
        <button type="button" onClick={handleCopy} className="btn-primary shrink-0 text-sm">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
