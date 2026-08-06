import './globals.css';
import type { ReactNode } from 'react';
export const metadata = {
  metadataBase: new URL('https://barbflow.shop'),
  title: 'BarbFlow — Barbing Business Manager',
  description: 'Manage your barbing business: tickets, staff, customers, and finance.',
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">{children}</body>
    </html>
  );
}
