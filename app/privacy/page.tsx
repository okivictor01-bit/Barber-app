import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = { title: 'Privacy Policy — BarbFlow' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to BarbFlow</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: August 2026</p>

        <div className="space-y-6 text-neutral-700 text-sm leading-relaxed">
          <section>
            <p>
              This Privacy Policy explains how BarbFlow (&quot;we&quot;, &quot;us&quot;) collects, uses, and
              protects information about Business Owners, Barbers, Managers, and Customers (&quot;you&quot;) who
              use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">1. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Account information:</strong> full name, email address, phone number, and role (owner, barber, manager, or customer).</li>
              <li><strong>Business information:</strong> business name, pricing, services offered, and bank settlement details (for Business Owners who set up payouts).</li>
              <li><strong>Transaction information:</strong> ticket and payment history, amounts, and service purchased. Card details themselves are handled entirely by Paystack — we never see or store your full card number.</li>
              <li><strong>Usage information:</strong> basic technical data such as browser type and access times, used for security and troubleshooting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">2. How We Use Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To operate core features: bookings, tickets, payments, loyalty tracking, and staff management;</li>
              <li>To calculate and process payment splits between Business Owners and the Platform;</li>
              <li>To communicate with you about your account, bookings, or support requests;</li>
              <li>To maintain the security and integrity of the Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">3. Who We Share Information With</h2>
            <p>We share information only as needed to operate the Platform, specifically with:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Paystack</strong> — to process payments and, where set up, settle funds to Business Owners&apos; bank accounts;</li>
              <li><strong>Supabase</strong> — our database and authentication provider, which stores account and business data securely;</li>
              <li><strong>Cloudflare</strong> — our hosting provider, which serves the application itself.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">4. Data Retention</h2>
            <p>
              We retain account and transaction data for as long as your account is active and as needed to meet
              legal, accounting, or dispute-resolution obligations. Financial records may be retained longer where
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">5. Your Rights</h2>
            <p>
              Under the Nigeria Data Protection Act, you have the right to access, correct, or request deletion of
              your personal information, subject to our legitimate need to retain certain records (such as
              financial transaction history). To exercise these rights, contact us via our{' '}
              <Link href="/contact" className="text-brand-600 underline">Contact page</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">6. Data Security</h2>
            <p>
              We use industry-standard measures — including encrypted connections and role-based access controls —
              to protect your information. No system is perfectly secure, and we encourage you to use a strong,
              unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">7. International Data Transfers</h2>
            <p>
              Some of our service providers (including Supabase and Cloudflare) may process or store data on
              servers located outside Nigeria. Where this occurs, we rely on those providers&apos; own security and
              compliance safeguards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">8. Children&apos;s Privacy</h2>
            <p>
              The Platform is not directed at children, and we do not knowingly collect personal information from
              children under the age required to enter into a binding agreement under Nigerian law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Continued use of the Platform after changes take
              effect constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">10. Contact</h2>
            <p>
              For any privacy-related questions or requests, please reach out via our{' '}
              <Link href="/contact" className="text-brand-600 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
