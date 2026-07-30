import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

const links = [
  { href: '/dashboard/barber', label: 'Tickets' },
  { href: '/dashboard/barber/customers', label: 'Customers' },
  { href: '/dashboard/barber/expenses', label: 'Expenses' },
  { href: '/dashboard/barber/settings', label: 'Reset Password' },
];

export default async function BarberLayout({ children }: { children: React.ReactNode }) {
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
      <Sidebar role="barber" links={links} businessName={business?.name} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
