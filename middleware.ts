import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isDashboard = path.startsWith('/dashboard');
  const isAuthPage = path === '/login' || path === '/register';

  if (isDashboard && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Role-gate specific dashboard sub-paths
  if (user && isDashboard) {
    // Use a service-role client for this specific lookup, bypassing RLS.
    // We only ever read `role` here for routing decisions — never exposed
    // to the client — so this is safe, and it sidesteps any edge-runtime
    // cookie/session propagation quirks affecting the RLS-scoped client.
    const adminSupabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Orphaned session: a login exists but no profile row (e.g. an interrupted
    // signup). Don't leave the user stranded on a 404 — sign them out and
    // send them back to login so they can retry cleanly.
    // Note: if this lookup itself errored (e.g. transient network issue),
    // profileError will be set and profile will be null — we deliberately
    // let the user through to /dashboard rather than sign them out on a
    // false alarm; the page-level Supabase queries will still enforce auth.
    if (!profile && !profileError) {
      await supabase.auth.signOut(); // triggers the cookie 'remove' callback above, clearing it on `response`
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    if (!profile) {
      // Lookup errored — don't block navigation, just pass through.
      return response;
    }

    const role = profile.role;
    const roleHome: Record<string, string> = {
      super_admin: '/dashboard/super-admin',
      admin: '/dashboard/admin',
      barber: '/dashboard/barber',
      customer: '/dashboard/customer',
    };

    const roleSegmentMap: Record<string, string> = {
      '/dashboard/super-admin': 'super_admin',
      '/dashboard/admin': 'admin',
      '/dashboard/barber': 'barber',
      '/dashboard/customer': 'customer',
    };

    const matchedSegment = Object.keys(roleSegmentMap).find((seg) => path.startsWith(seg));
    if (matchedSegment && role && roleSegmentMap[matchedSegment] !== role) {
      return NextResponse.redirect(new URL(roleHome[role] ?? '/login', request.url));
    }

    if (path === '/dashboard' && role) {
      return NextResponse.redirect(new URL(roleHome[role], request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
