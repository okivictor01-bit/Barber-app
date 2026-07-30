import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

const links = [
  { href: '/dashboard/manager', label: 'Customers' },
  { href: '/dashboard/manager/tickets', label: 'Tickets' },
  { href: '/dashboard/manager/expenses', label: 'Expenses' },
  { href: '/dashboard/manager/settings', label: 'Reset Password' },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
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
      <Sidebar role="manager" links={links} businessName={business?.name} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
