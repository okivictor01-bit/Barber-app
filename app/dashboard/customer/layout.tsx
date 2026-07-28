import Sidebar from '@/components/Sidebar';

const links = [{ href: '/dashboard/customer', label: 'My Tickets' }];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar role="customer" links={links} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
