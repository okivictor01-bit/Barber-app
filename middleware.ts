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

  // Role-gate specific dashboard sub-paths.
  // Role is read directly from the user's auth metadata (set server-side at
  // account-creation time — see lib/actions.ts / register-business route),
  // NOT queried from the `profiles` table. This avoids an extra database
  // round-trip inside Middleware's restricted Edge Runtime entirely, which
  // was proving unreliable. `profiles` remains the source of truth for
  // everything else the app displays.
  if (user && isDashboard) {
    const role = (user.app_metadata as any)?.role as string | undefined;

    // No role in metadata: either a genuinely orphaned/legacy account, or
    // metadata hasn't propagated to this session yet. Don't dead-end —
    // send back to login so they can retry cleanly.
    if (!role) {
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL('/login?issue=no-role', request.url));
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

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
      return NextResponse.redirect(new URL(roleHome[role] ?? '/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
