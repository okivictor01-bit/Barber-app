import Sidebar from '@/components/Sidebar';

const links = [
  { href: '/dashboard/barber', label: 'Tickets' },
  { href: '/dashboard/barber/expenses', label: 'Expenses' },
  { href: '/dashboard/barber/settings', label: 'Reset Password' },
];

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar role="barber" links={links} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
