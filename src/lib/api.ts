import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { RateLimitResult } from "@/lib/rate-limit";

const DEFAULT_MAX_JSON_BYTES = 32 * 1024;

/* ---------- JSON helpers ---------- */

export function jsonOk(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...Object.fromEntries(new Headers(headers)) },
  });
}

export function jsonError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
  headers?: HeadersInit
) {
  return NextResponse.json(
    { error: message, ...extra },
    {
      status,
      headers: { "Cache-Control": "no-store", ...Object.fromEntries(new Headers(headers)) },
    }
  );
}

export function rateLimitError(
  result: RateLimitResult,
  message = "درخواست بیش از حد. کمی بعد دوباره تلاش کنید."
) {
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return jsonError(message, 429, {}, {
    "Retry-After": String(retryAfter),
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  });
}

export type JsonBodyResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

/**
 * Reads JSON incrementally and aborts once the configured limit is exceeded.
 * Content-Length alone is insufficient because chunked bodies do not have it.
 */
export async function readJsonBody<T = unknown>(
  req: Request,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<JsonBodyResult<T>> {
  const contentType = req.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    return {
      ok: false,
      response: jsonError("نوع محتوای درخواست باید application/json باشد.", 415),
    };
  }

  const declaredLength = Number(req.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      response: jsonError("بدنه درخواست بیش از حد بزرگ است.", 413),
    };
  }

  const reader = req.body?.getReader();
  if (!reader) {
    return { ok: false, response: jsonError("بدنه درخواست نامعتبر است.", 400) };
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  let total = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return {
          ok: false,
          response: jsonError("بدنه درخواست بیش از حد بزرگ است.", 413),
        };
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch {
    return { ok: false, response: jsonError("بدنه درخواست نامعتبر است.", 400) };
  }

  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, response: jsonError("بدنه درخواست نامعتبر است.", 400) };
  }
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const managedIp =
    h.get("cf-connecting-ip") ||
    h.get("x-vercel-forwarded-for") ||
    h.get("x-real-ip");
  if (managedIp) return managedIp.split(",")[0]!.trim().slice(0, 64);

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return (parts.at(-1)?.trim() || "unknown").slice(0, 64);
  }
  return "unknown";
}

/* ---------- Error handling for route handlers ---------- */

export function handleApiError(err: unknown) {
  const e = err as { status?: number; message?: string; name?: string };
  if (e?.message === "UNAUTHORIZED")
    return jsonError("ابتدا وارد حساب کاربری خود شوید.", 401);
  if (e?.message === "FORBIDDEN")
    return jsonError("دسترسی غیرمجاز.", 403);
  if (e?.name === "RateLimitUnavailableError")
    return jsonError("سرویس موقتاً در دسترس نیست. کمی بعد تلاش کنید.", 503);
  console.error("[api error]", err);
  return jsonError("خطایی رخ داد. لطفاً دوباره تلاش کنید.", 500);
}
