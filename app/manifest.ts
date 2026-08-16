import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BarbFlow — Barbing Business Manager',
    short_name: 'BarbFlow',
    description:
      'Manage your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafafa',
    theme_color: '#c2410c',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
