import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  metadataBase: new URL('https://barbflow.shop'),
  title: {
    default: 'BarbFlow — Barbing Business Manager',
    template: '%s | BarbFlow',
  },
  description:
    'Manage your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place. Book a haircut or register your barbershop on BarbFlow.',
  keywords: [
    'barbershop management software',
    'barbing business app',
    'book a haircut',
    'barbershop booking Nigeria',
    'salon and barbershop management',
  ],
  openGraph: {
    title: 'BarbFlow — Barbing Business Manager',
    description:
      'Run your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.',
    url: 'https://barbflow.shop',
    siteName: 'BarbFlow',
    images: [{ url: '/hero-photo.jpg', width: 1400, height: 526, alt: 'A barber trimming a customer\'s hair' }],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BarbFlow — Barbing Business Manager',
    description:
      'Run your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.',
    images: ['/hero-photo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BarbFlow',
  },
};

export const viewport: Viewport = {
  themeColor: '#c2410c',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'BarbFlow',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Manage your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.',
  url: 'https://barbflow.shop',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
