import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

const links = [
  { href: '/dashboard/admin', label: 'Finance Overview' },
  { href: '/dashboard/admin/payouts', label: 'Payouts' },
  { href: '/dashboard/admin/tickets', label: 'Tickets' },
  { href: '/dashboard/admin/services', label: 'Services' },
  { href: '/dashboard/admin/barbers', label: 'Barbers' },
  { href: '/dashboard/admin/managers', label: 'Managers' },
  { href: '/dashboard/admin/customers', label: 'Customers' },
  { href: '/dashboard/admin/expenses', label: 'Expenses' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('business_id').eq('id', user!.id).single();
  const { data: business } = await supabase
    .from('businesses')
    .select('name')
    .eq('id', profile?.business_id)
    .maybeSingle();

  return (
    <div className="flex">
      <Sidebar role="admin" links={links} businessName={business?.name} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
