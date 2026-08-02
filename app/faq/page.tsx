import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = { title: 'FAQ — BarbFlow' };

const faqs = [
  {
    q: 'How do I book and pay for a haircut?',
    a: 'Once your barbershop has onboarded you as a customer, sign in and go to "My Tickets." Pick the service you want (haircut, beard trim, dyeing, etc.), pay securely through Paystack, then tap "Submit ticket" so your barber can see and approve it.',
  },
  {
    q: 'What is the loyalty program?',
    a: 'Each business can offer a free haircut after a set number of paid visits (often every 3rd visit, but this varies by business). Only standard haircuts count toward this — add-on services like beard trims or dyeing don\'t. Your progress is shown on your dashboard.',
  },
  {
    q: 'Is my payment information safe?',
    a: 'Yes. All payments are processed directly by Paystack, a licensed payment processor. BarbFlow never sees or stores your full card details.',
  },
  {
    q: 'What happens after I pay?',
    a: 'A ticket is created for your payment. You need to tap "Submit ticket" so it shows up on your barbershop\'s dashboard — from there, the owner, a manager, or a barber will approve it and you\'ll get your service.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refund requests should go through the business you paid, since they\'re providing the service — you can reach them directly, or use our Contact page and we\'ll help facilitate.',
  },
  {
    q: 'I run a barbershop — how do I get on BarbFlow?',
    a: 'Go to the homepage and tap "Register your business." You\'ll be able to onboard your barbers, managers, and customers right away, and set your own prices and loyalty program.',
  },
  {
    q: 'How does the platform make money?',
    a: 'BarbFlow takes a small commission on each payment (shown transparently to business owners), and the rest goes straight to the business.',
  },
  {
    q: 'I forgot my password — what do I do?',
    a: 'On the sign-in page, tap "Forgot password?" and follow the emailed link to set a new one.',
  },
  {
    q: "I'm a barber or manager — who onboards me?",
    a: 'Only the business owner can onboard barbers and managers. If you haven\'t received login details, ask your business owner.',
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to BarbFlow</Link>
        <h1 className="text-3xl font-bold mt-4 mb-8">Frequently Asked Questions</h1>

        <div className="space-y-4">
          {faqs.map((item, i) => (
            <details key={i} className="card group">
              <summary className="font-medium text-neutral-800 cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-neutral-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
              </summary>
              <p className="text-sm text-neutral-600 mt-3">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="text-sm text-neutral-500 mt-8">
          Didn&apos;t find what you&apos;re looking for?{' '}
          <Link href="/contact" className="text-brand-600 underline">Contact us</Link>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
