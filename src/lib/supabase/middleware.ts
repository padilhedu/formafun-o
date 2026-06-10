import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiter (resets on cold start — good enough for Edge middleware)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  if (entry.count > maxPerWindow) return true;
  return false;
}

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  // Rate limiting on sensitive endpoints
  const sensitiveRoutes = ["/api/portal/magic-link", "/api/portal/primeiro-acesso", "/login"];
  if (sensitiveRoutes.some(r => pathname.startsWith(r))) {
    if (isRateLimited(`rl:${ip}:${pathname}`, 10, 60_000)) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Public routes (no auth required)
  const publicRoutes = [
    "/login", "/auth/callback",
    "/api/webhooks",
    "/portal/login",
    "/api/portal/magic-link", "/api/portal/primeiro-acesso",
  ];
  const isPublic = publicRoutes.some(r => pathname.startsWith(r));

  // Portal routes: need auth but separate from internal app
  const isPortalRoute = pathname.startsWith("/portal");

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = isPortalRoute ? "/portal/login" : "/login";
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login pages
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (user && pathname === "/portal/login") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return supabaseResponse;
}
