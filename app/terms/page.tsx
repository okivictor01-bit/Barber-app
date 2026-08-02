import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = { title: 'Terms of Service — BarbFlow' };

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="text-sm text-brand-600 hover:underline">← Back to BarbFlow</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Terms of Service</h1>
        <p className="text-sm text-neutral-500 mb-8">Last updated: August 2026</p>

        <div className="space-y-6 text-neutral-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By registering a business, onboarding as staff, or booking services on BarbFlow (&quot;the Platform&quot;),
              you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">2. What BarbFlow Is</h2>
            <p>
              BarbFlow is a booking and business-management platform that connects barbing businesses
              (&quot;Business Owners&quot;) with their staff and customers. BarbFlow facilitates payment
              processing between Customers and Business Owners but does not itself provide barbing or grooming
              services — those are provided solely by the independent Business Owners listed on the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">3. Accounts &amp; Roles</h2>
            <p>
              The Platform supports several account types: Super Admin (platform operator), Business Owner,
              Barber, Manager, and Customer. Business Owners are responsible for the accuracy of information about
              their business and for the conduct of staff they onboard. Each person is responsible for keeping
              their login credentials confidential and for all activity under their account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">4. Payments, Fees &amp; Payouts</h2>
            <p>
              Payments are processed through Paystack. When a Customer pays for a service, the amount is split
              between the Business Owner and the Platform according to the commission rate shown to the Business
              Owner at the time of setup (a percentage of each transaction). Where a Business Owner has completed
              payout setup, funds are settled automatically to their linked bank account, less the Platform&apos;s
              commission and Paystack&apos;s own processing fee, which is borne by the Business Owner. Where payout
              setup has not been completed, settlement may occur manually outside the Platform.
            </p>
            <p className="mt-2">
              Prices for services are set by each Business Owner and may vary between businesses. The Platform is
              not responsible for pricing disputes between a Customer and a Business Owner beyond facilitating the
              payment itself.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">5. Loyalty Program</h2>
            <p>
              Business Owners may offer a loyalty program in which a free service is granted after a set number of
              paid visits, as configured by that Business Owner. Loyalty eligibility, thresholds, and which
              services qualify are determined solely by each Business Owner and may be changed at their discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">6. Cancellations &amp; Refunds</h2>
            <p>
              Refund requests should first be directed to the Business Owner for the relevant booking, as they are
              the party providing the service. Where a refund is agreed, it will be processed in line with
              Paystack&apos;s refund capabilities and timelines. The Platform reserves the right to assist in
              resolving disputes but does not guarantee any particular outcome.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the Platform for any unlawful purpose or to facilitate fraud;</li>
              <li>Attempt to circumvent payment processing or fees owed to the Platform;</li>
              <li>Access or attempt to access accounts, data, or systems you are not authorized to use;</li>
              <li>Upload false, misleading, or defamatory information about any business or individual.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">8. Termination</h2>
            <p>
              The Platform may suspend or terminate any account that violates these Terms, engages in fraudulent
              activity, or poses a risk to other users. Business Owners may stop using the Platform at any time;
              outstanding obligations (such as owed payouts or platform fees) survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">9. Disclaimers &amp; Limitation of Liability</h2>
            <p>
              The Platform is provided &quot;as is&quot; without warranties of any kind. To the fullest extent
              permitted by law, the Platform and its operators are not liable for indirect, incidental, or
              consequential damages arising from use of the Platform, including but not limited to service quality
              issues between a Customer and a Business Owner, which are outside the Platform&apos;s control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">10. Changes to These Terms</h2>
            <p>
              These Terms may be updated from time to time. Continued use of the Platform after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">11. Governing Law</h2>
            <p>These Terms are governed by the laws of the Federal Republic of Nigeria.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">12. Contact</h2>
            <p>
              Questions about these Terms can be sent via our{' '}
              <Link href="/contact" className="text-brand-600 underline">Contact page</Link>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
