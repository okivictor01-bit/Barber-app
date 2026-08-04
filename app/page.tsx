import Link from 'next/link';
import Footer from '@/components/Footer';
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col-reverse md:flex-row items-center max-w-5xl mx-auto px-4 py-12 md:py-20 gap-10">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-700 mb-4">BarbFlow</h1>
          <p className="text-neutral-600 max-w-md mx-auto md:mx-0 mb-8 text-lg">
            Run your barbing business end-to-end: staff, customers, tickets, payments, and finance — all in one place.
          </p>
          <div className="flex gap-3 justify-center md:justify-start">
            <Link href="/login" className="btn-primary">Sign in</Link>
            <Link href="/register" className="btn-secondary">Register your business</Link>
          </div>
        </div>
        <div className="flex-1 w-full max-w-md md:max-w-lg">
          <picture>
            <source srcSet="/hero-photo.webp" type="image/webp" />
            <img
              src="/hero-photo.jpg"
              alt="A barber trimming a customer's hair in a modern barbershop"
              className="w-full h-auto rounded-2xl object-cover"
              width={1400}
              height={526}
            />
          </picture>
        </div>
      </div>
      <Footer />
    </div>
  );
}
