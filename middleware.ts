import { createServerClient } from '@supabase/ssr';
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

  // Role-gate specific dashboard sub-paths. Wrapped defensively — this is a
  // routing convenience, not a security boundary (every page's own Supabase
  // queries are protected by RLS regardless), so if anything here errors
  // unexpectedly, we let the request through rather than crash the app.
  if (user && isDashboard) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      // Orphaned session: a login exists but no profile row (e.g. an
      // interrupted signup). Don't leave the user stranded on a 404 — sign
      // them out and send them back to login so they can retry cleanly.
      // If the lookup itself errored (vs. cleanly finding no row), don't
      // treat that as "no profile" — just let the request through so a
      // transient error can't wrongly sign someone out.
      if (!profile && !error) {
        await supabase.auth.signOut();
        const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
        return redirectResponse;
      }

      if (profile) {
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
        if (matchedSegment && roleSegmentMap[matchedSegment] !== role) {
          return NextResponse.redirect(new URL(roleHome[role] ?? '/login', request.url));
        }

        if (path === '/dashboard') {
          return NextResponse.redirect(new URL(roleHome[role], request.url));
        }
      }
    } catch {
      return response;
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
