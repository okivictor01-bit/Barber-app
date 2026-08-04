import Link from 'next/link';
import Footer from '@/components/Footer';
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="relative flex-1 flex items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-photo.jpg')" }}
      >
        {/* dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 md:py-32 text-center md:text-left w-full">
          <img
            src="/logo.png"
            alt="BarbFlow"
            className="h-20 md:h-24 w-auto mx-auto md:mx-0 mb-4"
          />
          <p className="text-neutral-100 max-w-md mx-auto md:mx-0 mb-8 text-lg">
            Run your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.
          </p>
          <div className="flex gap-3 justify-center md:justify-start">
            <Link href="/login" className="btn-primary">Sign in</Link>
            <Link href="/register" className="btn-secondary">Register your business</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
