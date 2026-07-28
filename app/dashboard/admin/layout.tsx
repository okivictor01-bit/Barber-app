import Sidebar from '@/components/Sidebar';

const links = [
  { href: '/dashboard/admin', label: 'Finance Overview' },
  { href: '/dashboard/admin/tickets', label: 'Tickets' },
  { href: '/dashboard/admin/barbers', label: 'Barbers' },
  { href: '/dashboard/admin/customers', label: 'Customers' },
  { href: '/dashboard/admin/expenses', label: 'Expenses' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar role="admin" links={links} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
