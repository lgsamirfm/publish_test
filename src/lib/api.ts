import { NextResponse } from "next/server";
import { headers } from "next/headers";

/* ---------- JSON helpers ---------- */

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  // Trust the LAST x-forwarded-for entry (set by our reverse proxy),
  // not the first (which could be spoofed by the client).
  const xff = h.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",");
    const last = parts[parts.length - 1]?.trim();
    if (last) return last;
  }
  return h.get("x-real-ip") || "127.0.0.1";
}

/* ---------- Error handling for route handlers ---------- */

export function handleApiError(err: unknown) {
  const e = err as { status?: number; message?: string };
  if (e?.message === "UNAUTHORIZED")
    return jsonError("ابتدا وارد حساب کاربری خود شوید.", 401);
  if (e?.message === "FORBIDDEN")
    return jsonError("دسترسی غیرمجاز.", 403);
  console.error("[api error]", err);
  return jsonError("خطایی رخ داد. لطفاً دوباره تلاش کنید.", 500);
}
