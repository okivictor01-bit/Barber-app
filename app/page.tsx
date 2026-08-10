import Link from 'next/link';
import Footer from '@/components/Footer';
import GetStartedPanel from '@/components/GetStartedPanel';

const steps = [
  {
    number: '1',
    title: 'Book Your Slot',
    description: 'Find a barbershop on BarbFlow and pick the service and time that works for you.',
  },
  {
    number: '2',
    title: 'Get Your Cut',
    description: 'Walk in, get your ticket handled by staff, and enjoy your haircut or grooming service.',
  },
  {
    number: '3',
    title: 'Pay & Earn Loyalty',
    description: 'Pay securely with Paystack and earn a free haircut every few paid visits.',
  },
];

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

      <section className="max-w-5xl mx-auto px-4 py-16 w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">How BarbFlow works</h2>
        <p className="text-neutral-500 text-center max-w-xl mx-auto mb-10">
          Three simple steps between you and a fresh cut, at any barbershop on the network.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="card relative overflow-hidden">
              <span className="absolute top-2 right-4 text-6xl font-bold text-neutral-100 select-none">
                {step.number}
              </span>
              <h3 className="font-semibold text-lg mb-2 relative">{step.title}</h3>
              <p className="text-sm text-neutral-600 relative">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-neutral-50 border-t border-neutral-100 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">Get started in seconds</h2>
          <p className="text-neutral-500 text-center max-w-xl mx-auto mb-10">
            Sign up as a <strong>Customer</strong> to book from any barbershop, or as a{' '}
            <strong>Business owner</strong> to run your shop on BarbFlow.
          </p>
          <GetStartedPanel />
        </div>
      </section>

      <Footer />
    </div>
  );
}
