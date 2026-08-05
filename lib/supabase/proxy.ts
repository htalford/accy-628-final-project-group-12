import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAuthBypassEmail,
  isAuthBypassEnabled,
} from "@/lib/auth/bypass";
import {
  employerToClientPath,
  getDashboardPath,
  isPublicPath,
  pathRequiresAuth,
  roleFromPathname,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public marketing pages skip auth work (login handled below for bypass).
  const isLoginRoute = pathname === "/login" || pathname === "/signup";
  if (isPublicPath(pathname) && !isLoginRoute) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  let { data: claimsData } = await supabase.auth.getClaims();
  let authId = claimsData?.claims?.sub;
  let isAuthenticated = typeof authId === "string" && authId.length > 0;
  let justSignedInViaBypass = false;

  // Dev/demo: auto sign-in as demo employer so Client Portal works without the form.
  if (!isAuthenticated && isAuthBypassEnabled()) {
    const password = process.env.DEMO_PASSWORD;
    if (password) {
      const { data: signedIn, error } = await supabase.auth.signInWithPassword({
        email: getAuthBypassEmail(),
        password,
      });
      if (!error && signedIn.user) {
        authId = signedIn.user.id;
        isAuthenticated = true;
        justSignedInViaBypass = true;
      }
    }
  }

  // After programatic sign-in, redirect so App Router cookies() pick up the session.
  if (justSignedInViaBypass) {
    const url = request.nextUrl.clone();
    if (isLoginRoute) {
      url.pathname = getDashboardPath("employer");
      url.search = "";
    }
    const redirect = NextResponse.redirect(url);
    return copyCookies(supabaseResponse, redirect);
  }

  // Legacy /employer/* → /client/*
  const clientRedirect = employerToClientPath(pathname);
  if (clientRedirect && clientRedirect !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = clientRedirect;
    return NextResponse.redirect(url);
  }

  if (pathRequiresAuth(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginRoute && isAuthenticated) {
    const { data: appUser } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", authId)
      .maybeSingle();

    if (appUser?.role) {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPath(appUser.role as UserRole);
      return NextResponse.redirect(url);
    }
  }

  // Public login/signup with no session: fall through to the page.
  if (isLoginRoute && !isAuthenticated) {
    return supabaseResponse;
  }

  const pathRole = roleFromPathname(pathname);
  if (pathRole && isAuthenticated) {
    const { data: appUser } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", authId)
      .maybeSingle();

    if (appUser?.role && appUser.role !== pathRole) {
      const url = request.nextUrl.clone();
      url.pathname = getDashboardPath(appUser.role as UserRole);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
