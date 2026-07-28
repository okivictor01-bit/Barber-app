import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Standard client — respects RLS as the logged-in user
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component — safe to ignore with middleware refreshing sessions
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {}
        },
      },
    }
  );
}

// Admin client — bypasses RLS. ONLY use in trusted server code
// (e.g. Paystack webhook, onboarding barbers/customers on behalf of an owner).
// Requires SUPABASE_SERVICE_ROLE_KEY — never expose this to the client.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
