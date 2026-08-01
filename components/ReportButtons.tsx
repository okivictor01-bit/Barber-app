'use client';

import { useState } from 'react';
import type { ReportPeriod } from '@/lib/reports';

async function generatePdf(data: {
  businessName: string;
  label: string;
  from: string;
  to: string;
  transactions: any[];
  expenses: any[];
  moneyIn: number;
  moneyOut: number;
  platformFees: number;
  profit: number;
}) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const dateRange = `${new Date(data.from).toLocaleDateString()} – ${new Date(data.to).toLocaleDateString()}`;

  doc.setFontSize(16);
  doc.text(data.businessName, 14, 18);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`${data.label} Report (${dateRange})`, 14, 25);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 31);

  doc.setFontSize(11);
  doc.setTextColor(0);
  const summaryY = 42;
  const naira = (n: number) => `NGN ${n.toLocaleString()}`;
  doc.text(`Money In: ${naira(data.moneyIn)}`, 14, summaryY);
  doc.text(`Money Out (expenses): ${naira(data.moneyOut)}`, 14, summaryY + 6);
  doc.text(`${data.profit >= 0 ? 'Profit' : 'Loss'}: ${naira(Math.abs(data.profit))}`, 14, summaryY + 12);
  doc.text(`Platform Fees: ${naira(data.platformFees)}`, 14, summaryY + 18);

  let nextY = summaryY + 30;

  if (data.transactions.length > 0) {
    doc.setFontSize(12);
    doc.text('Transactions', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Date', 'Reference', 'Service', 'Amount', 'Platform Fee', 'Your Share']],
      body: data.transactions.map((t) => [
        new Date(t.paid_at).toLocaleDateString(),
        t.paystack_reference,
        t.service_name ?? 'Haircut',
        `NGN ${Number(t.amount).toLocaleString()}`,
        `NGN ${Number(t.platform_fee).toLocaleString()}`,
        `NGN ${Number(t.business_amount).toLocaleString()}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] },
    });
    // @ts-ignore — lastAutoTable is added at runtime by the plugin
    nextY = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text('No transactions in this period.', 14, nextY + 6);
    nextY += 16;
  }

  if (data.expenses.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Expenses', 14, nextY);
    autoTable(doc, {
      startY: nextY + 4,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: data.expenses.map((e) => [
        new Date(e.created_at).toLocaleDateString(),
        e.description,
        e.category,
        `NGN ${Number(e.amount).toLocaleString()}`,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] },
    });
  }

  const filename = `${data.businessName.replace(/[^a-z0-9]+/gi, '-')}-${data.label.replace(/\s+/g, '-')}-${new Date(data.from).toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

export function DownloadReportButton({ period, label }: { period: ReportPeriod; label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports?period=${period}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not load report');
      await generatePdf(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading} className="btn-secondary text-sm w-full">
        {loading ? 'Generating…' : `${label} PDF`}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
