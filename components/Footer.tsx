import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 mt-12">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutral-500">
        <Link href="/faq" className="hover:text-brand-600">FAQ</Link>
        <Link href="/contact" className="hover:text-brand-600">Contact</Link>
        <Link href="/terms" className="hover:text-brand-600">Terms of Service</Link>
        <Link href="/privacy" className="hover:text-brand-600">Privacy Policy</Link>
      </div>
    </footer>
  );
}
