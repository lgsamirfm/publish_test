import { NextResponse, type NextRequest } from "next/server";

/*
 * Next.js proxy (Next.js 16 rename of "middleware").
 *
 * IMPORTANT: this file MUST live next to `app/` — i.e. inside `src/`.
 * A root-level `middleware.ts`/`proxy.ts` is silently ignored when the
 * app uses the `src/` directory.
 *
 * Behavior:
 *   - /admin/*  (but NOT /api/admin/*): gate by presence of `baf_session` cookie.
 *     Real admin role check happens later (admin layout / API via requireAdmin).
 *   - /api/auth/signup, /api/auth/login, /api/auth/forgot-password:
 *     light in-memory rate limit (defense-in-depth alongside the route-handler
 *     rate limiting in src/lib/rate-limit.ts).
 *   - Adds security headers (X-Frame-Options, CSP, etc.) to all responses.
 */

// --- Rate limiting (in-memory, per instance) ---

type Bucket = { count: number; resetAt: number };

// Module-scoped Map — survives between requests in the same server instance.
// For multi-instance deployments, use the Redis-backed limiter instead.
const buckets = new Map<string, Bucket>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  purgeBuckets();
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

// Periodically purge expired buckets to avoid unbounded growth.
let lastPurge = Date.now();
function purgeBuckets() {
  const now = Date.now();
  if (now - lastPurge < 60_000) return;
  lastPurge = now;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    // Trust the LAST entry (set by our reverse proxy), not the first (settable by client).
    const parts = xff.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

// --- Security headers ---

function securityHeaders(): Record<string, string> {
  const isProd = process.env.NODE_ENV === "production";

  // Base CSP — restrictive by default
  const cspDirectives = [
    "default-src 'self'",
    // Scripts: self + inline (needed for Next.js hydration) + eval (dev only)
    `script-src 'self'${isProd ? "" : " 'unsafe-eval'"} 'unsafe-inline'`,
    // Styles: self + inline (Tailwind, CSS-in-JS)
    "style-src 'self' 'unsafe-inline'",
    // Images: self, data URIs, blobs (for uploaded previews)
    "img-src 'self' data: blob:",
    // Fonts: self (Vazirmatn from Google Fonts would need fonts.gstatic.com if not self-hosted)
    "font-src 'self'",
    // Connect: self only (API calls, polling)
    "connect-src 'self'",
    // Framing: only same-origin
    "frame-ancestors 'self'",
    // Base URI: only same-origin
    "base-uri 'self'",
    // Form actions: only same-origin
    "form-action 'self'",
    // Upgrade insecure requests in production
    ...(isProd ? ["upgrade-insecure-requests"] : []),
    // Block mixed content
    ...(isProd ? ["block-all-mixed-content"] : []),
  ];

  return {
    // Prevent clickjacking — only same-origin framing allowed.
    "X-Frame-Options": "SAMEORIGIN",
    // Prevent MIME-type sniffing.
    "X-Content-Type-Options": "nosniff",
    // Referrer policy — send origin only on cross-origin requests.
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // XSS protection (legacy, but still useful for older browsers).
    "X-XSS-Protection": "1; mode=block",
    // Permissions policy — deny features not needed.
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    // Content Security Policy — defense-in-depth against XSS.
    "Content-Security-Policy": cspDirectives.join("; "),
    // HSTS — enforce HTTPS for 1 year + subdomains + preload eligible.
    // Only set in production behind TLS termination.
    ...(isProd
      ? {
          "Strict-Transport-Security":
            "max-age=31536000; includeSubDomains; preload",
        }
      : {}),
    // Cross-Origin policies — Spectre mitigation
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    // Prevent Adobe Flash/PDF from executing in your origin's context
    "X-Permitted-Cross-Domain-Policies": "none",
  };
}

function withSecurityHeaders(
  res: ReturnType<typeof NextResponse.next> | NextResponse
): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders())) {
    res.headers.set(key, value);
  }
  return res;
}

// --- Proxy entrypoint (Next.js 16: renamed from middleware) ---

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) Admin page guard (NOT /api/admin/* — API handles its own auth via requireAdmin).
  // Redirect to login if no session cookie present.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const session = req.cookies.get("baf_session")?.value;
    if (!session) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // 2) Light rate limiting for auth endpoints (defense-in-depth alongside route handlers).
  // Uses in-memory Map — works for single instance. For multi-instance, swap to Redis (see rate-limit.ts).
  if (
    pathname === "/api/auth/signup" ||
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/forgot-password"
  ) {
    const ip = getClientIp(req);
    const limit = pathname === "/api/auth/signup" ? 5 : 10;
    const ok = rateLimit(`${pathname}-${ip}`, limit, 60_000);
    if (!ok) {
      return new NextResponse(
        JSON.stringify({ error: "درخواست بیش از حد. بعداً تلاش کنید." }),
        {
          status: 429,
          headers: { "content-type": "application/json", ...securityHeaders() },
        }
      );
    }
  }

  // 3) Apply security headers to all responses.
  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and Next.js internals.
     * Security headers + admin guard + auth rate limiting applied.
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|images/).*)",
  ],
};