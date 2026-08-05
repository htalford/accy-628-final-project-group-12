import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getDashboardPath,
  isPublicPath,
  isRolePath,
  pathRequiresAuth,
  USER_ROLES,
} from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database";

function roleFromPath(pathname: string): UserRole | null {
  for (const role of USER_ROLES) {
    if (isRolePath(pathname, role)) return role;
  }
  return null;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
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

  const { data: claimsData } = await supabase.auth.getClaims();
  const authId = claimsData?.claims?.sub;
  const isAuthenticated = typeof authId === "string" && authId.length > 0;

  if (pathRequiresAuth(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && isAuthenticated) {
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

  const pathRole = roleFromPath(pathname);
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
