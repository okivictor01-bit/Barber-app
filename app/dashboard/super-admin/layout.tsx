import Sidebar from '@/components/Sidebar';

const links = [
  { href: '/dashboard/super-admin', label: 'Platform Overview' },
  { href: '/dashboard/super-admin/businesses', label: 'Businesses' },
  { href: '/dashboard/super-admin/messages', label: 'Messages' },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar role="super_admin" links={links} />
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
