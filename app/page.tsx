import Link from 'next/link';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold text-brand-700 mb-3">BarbFlow</h1>
        <p className="text-neutral-600 max-w-md mb-8">
          Run your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">Sign in</Link>
          <Link href="/register" className="btn-secondary">Register your business</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
