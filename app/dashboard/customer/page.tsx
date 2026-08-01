import { createClient } from '@/lib/supabase/server';
import ServicesList from '@/components/ServicesList';
import SubmitTicketButton from '@/components/SubmitTicketButton';

export default async function CustomerDashboard({
  searchParams,
}: {
  searchParams: Promise<{ business?: string }>;
}) {
  const { business: businessParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memberships, error: membershipsError } = await supabase
    .from('business_customers')
    .select('*, businesses(id, name, default_price, loyalty_interval)')
    .eq('customer_id', user!.id);

  const businesses = (memberships ?? []).map((m: any) => m.businesses).filter(Boolean);
  const activeBusinessId = businessParam ?? businesses[0]?.id;
  const activeBusiness = businesses.find((b: any) => b.id === activeBusinessId);
  const activeMembership = (memberships ?? []).find((m: any) => m.businesses?.id === activeBusinessId);

  const { data: tickets } = activeBusinessId
    ? await supabase
        .from('tickets')
        .select('*')
        .eq('customer_id', user!.id)
        .eq('business_id', activeBusinessId)
        .order('created_at', { ascending: false })
    : { data: [] };

  const { data: extraServices } = activeBusinessId
    ? await supabase
        .from('services')
        .select('id, name, price')
        .eq('business_id', activeBusinessId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
    : { data: [] };

  const loyaltyInterval = activeBusiness?.loyalty_interval ?? 3;
  const progress = activeMembership ? activeMembership.paid_transaction_count % loyaltyInterval : 0;

  const services = activeBusiness
    ? [
        { id: null, name: 'Haircut', price: Number(activeBusiness.default_price) },
        ...(extraServices ?? []).map((s) => ({ id: s.id, name: s.name, price: Number(s.price) })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Tickets</h1>

      {membershipsError && (
        <div className="card">
          <p className="text-sm text-red-600">
            Couldn&apos;t load your businesses: {membershipsError.message}
          </p>
        </div>
      )}

      {businesses.length === 0 && !membershipsError && (
        <div className="card">
          <p className="text-neutral-500">
            You&apos;re not yet linked to a barbing business. Ask your barber shop to onboard you.
          </p>
        </div>
      )}

      {businesses.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {businesses.map((b: any) => (
            <a
              key={b.id}
              href={`/dashboard/customer?business=${b.id}`}
              className={`px-3 py-1.5 rounded-full text-sm border ${
                b.id === activeBusinessId ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-neutral-300'
              }`}
            >
              {b.name}
            </a>
          ))}
        </div>
      )}

      {activeBusiness && (
        <>
          <div className="card space-y-4">
            <div>
              <h2 className="font-semibold">{activeBusiness.name}</h2>
              <p className="text-sm text-neutral-500">
                {progress}/{loyaltyInterval} visits toward your next free haircut 🎁 (haircuts only)
              </p>
              <div className="w-48 h-2 bg-neutral-100 rounded-full mt-2">
                <div
                  className="h-2 bg-brand-500 rounded-full"
                  style={{ width: `${(progress / loyaltyInterval) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Pick a service to pay for:</p>
              <ServicesList businessId={activeBusiness.id} services={services} />
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Ticket history</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Service</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {(tickets ?? []).map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="py-2 pr-4">{t.is_free ? '🎁 ' : ''}{t.service_name ?? 'Haircut'}</td>
                    <td className="py-2 pr-4">{t.is_free ? 'Free' : `₦${Number(t.amount).toLocaleString()}`}</td>
                    <td className="py-2 pr-4"><span className={`badge-${t.status}`}>{t.status}</span></td>
                    <td className="py-2 pr-4">
                      {t.status === 'pending' && !t.submitted_at && <SubmitTicketButton ticketId={t.id} />}
                      {t.status === 'pending' && t.submitted_at && (
                        <span className="text-xs text-neutral-400">Waiting for approval…</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(!tickets || tickets.length === 0) && (
                  <tr><td colSpan={5} className="py-6 text-center text-neutral-400">No tickets yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
