import { NextResponse, type NextRequest } from "next/server";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_API_BODY_BYTES = 64 * 1024;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastBucketPurge = Date.now();

function securityHeaders(nonce: string): Record<string, string> {
  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    isProduction
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isProduction ? "" : " ws: wss:"}`,
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "media-src 'none'",
    "worker-src 'self' blob:",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  return {
    "Content-Security-Policy": csp,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Permitted-Cross-Domain-Policies": "none",
    // Modern browsers rely on CSP. Enabling the legacy auditor can introduce quirks.
    "X-XSS-Protection": "0",
    ...(isProduction
      ? { "Strict-Transport-Security": "max-age=31536000" }
      : {}),
  };
}

function withSecurityHeaders(response: NextResponse, pathname: string, nonce: string) {
  for (const [name, value] of Object.entries(securityHeaders(nonce))) {
    response.headers.set(name, value);
  }

  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store");
  }

  if (/^\/api\/user\/patterns\/[^/]+\/html$/.test(pathname)) {
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox"
    );
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/api/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

function getClientIp(req: NextRequest): string {
  // These headers are overwritten by their respective managed edge networks.
  const managedIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-real-ip");
  if (managedIp) return managedIp.split(",")[0]!.trim().slice(0, 64);

  // A conforming reverse proxy appends the directly connected client last.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return (parts.at(-1)?.trim() || "unknown").slice(0, 64);
  }

  // A shared conservative bucket is safer than an attacker-controlled value.
  return "unknown";
}

function consumeBucket(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  if (now - lastBucketPurge > 5 * 60_000) {
    lastBucketPurge = now;
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit,
  };
}

function rateLimitResponse(
  result: ReturnType<typeof consumeBucket>,
  pathname: string,
  nonce: string
) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  const response = NextResponse.json(
    { error: "درخواست بیش از حد. کمی بعد دوباره تلاش کنید." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
  return withSecurityHeaders(response, pathname, nonce);
}

function expectedOrigin(req: NextRequest): string {
  const configured = process.env.APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Authenticated mutations fail closed below when APP_URL is malformed.
      return "invalid://app-url";
    }
  }

  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host");
  if (proto && host) return `${proto}://${host}`;
  return req.nextUrl.origin;
}

function isSameOriginMutation(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }

  if (origin) return origin === expectedOrigin(req);
  if (fetchSite === "same-origin") return true;

  // Browser API requests send Origin and/or Fetch Metadata. Keep local curl-based
  // development usable, while production cookie-authenticated writes fail closed.
  return process.env.NODE_ENV !== "production";
}

export function proxy(req: NextRequest) {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const { pathname } = req.nextUrl;
  const ip = getClientIp(req);

  // A broad per-instance ceiling absorbs accidental request floods. Sensitive
  // route handlers additionally use the Redis-backed distributed limiter.
  const broadLimit = pathname.startsWith("/api/") ? 120 : 300;
  const broadResult = consumeBucket(
    `${pathname.startsWith("/api/") ? "api" : "page"}:${ip}`,
    broadLimit,
    60_000
  );
  if (!broadResult.success) return rateLimitResponse(broadResult, pathname, nonce);

  if (pathname.startsWith("/api/") && UNSAFE_METHODS.has(req.method)) {
    if (!isSameOriginMutation(req)) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "مبدأ درخواست معتبر نیست." },
          { status: 403 }
        ),
        pathname,
        nonce
      );
    }

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_API_BODY_BYTES) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "بدنه درخواست بیش از حد بزرگ است." },
          { status: 413 }
        ),
        pathname,
        nonce
      );
    }

    const hasBody =
      contentLength > 0 || req.headers.has("transfer-encoding");
    const contentType = req.headers.get("content-type") || "";
    if (hasBody && !contentType.toLowerCase().startsWith("application/json")) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "نوع محتوای درخواست باید application/json باشد." },
          { status: 415 }
        ),
        pathname,
        nonce
      );
    }
  }

  // This is only an early UX guard. The admin layout and every admin API still
  // perform full signature, user, and role verification on the server.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!req.cookies.get("baf_session")?.value) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname);
      return withSecurityHeaders(NextResponse.redirect(loginUrl), pathname, nonce);
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    securityHeaders(nonce)["Content-Security-Policy"]
  );
  return withSecurityHeaders(
    NextResponse.next({ request: { headers: requestHeaders } }),
    pathname,
    nonce
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|images/).*)",
  ],
};
