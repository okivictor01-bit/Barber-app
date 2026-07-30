import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function Sidebar({
  role,
  links,
  businessName,
}: {
  role: string;
  links: { href: string; label: string }[];
  businessName?: string;
}) {
  return (
    <aside className="w-56 shrink-0 bg-white border-r border-neutral-200 min-h-screen p-4 flex flex-col">
      <div className="mb-6">
        <p className="font-bold text-lg text-brand-700">BarbFlow</p>
        {businessName && <p className="text-sm font-bold text-neutral-800 mt-1">{businessName}</p>}
        <p className="text-xs text-neutral-500 capitalize">{role.replace('_', ' ')}</p>
      </div>
      <nav className="flex-1 space-y-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-700"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <LogoutButton />
    </aside>
  );
}
