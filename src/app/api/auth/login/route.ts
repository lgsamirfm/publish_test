import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  jsonOk,
  jsonError,
  handleApiError,
  getClientIp,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";

const DUMMY_PASSWORD_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIp();
    const ipLimit = await rateLimit(`login:ip:${ip}`, 10, 60_000);
    if (!ipLimit.success) {
      return rateLimitError(ipLimit, "تلاش‌های بیش از حد. کمی بعد تلاش کنید.");
    }

    const parsed = await readJsonBody<Record<string, unknown>>(req, 4 * 1024);
    if (!parsed.ok) return parsed.response;

    const rawPhone = String(parsed.data?.phone ?? "").trim();
    const password = String(parsed.data?.password ?? "");
    const phone = normalizeIranianPhone(rawPhone);

    const accountLimit = await rateLimit(
      `login:account:${phone || "invalid"}`,
      10,
      15 * 60_000
    );
    if (!accountLimit.success) {
      return rateLimitError(accountLimit, "تلاش‌های بیش از حد. کمی بعد تلاش کنید.");
    }

    if (!isValidIranianPhone(phone) || !password || password.length > 128) {
      if (password && password.length <= 128) {
        await verifyPassword(password, DUMMY_PASSWORD_HASH);
      }
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    const user = await db.user.findUnique({ where: { phone } });
    const passwordMatches = await verifyPassword(
      password,
      user?.password || DUMMY_PASSWORD_HASH
    );

    if (!user || !passwordMatches) {
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    await createSession(user.id);

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role as "ADMIN" | "CUSTOMER",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
