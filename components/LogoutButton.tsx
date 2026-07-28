'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
      }}
      className="btn-secondary w-full mt-4 text-sm"
    >
      Sign out
    </button>
  );
}
