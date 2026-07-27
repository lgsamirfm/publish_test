import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";

// POST /api/auth/login
// Body: { phone, password }
// Returns: { user: { id, name, phone, email, role } } and sets the baf_session cookie.
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts / minute per IP.
    const ip = await getClientIp();
    const rl = await rateLimit("login-" + ip, 10, 60_000);
    if (!rl.success) {
      return jsonError("تلاش‌های بیش از حد. یک دقیقه بعد تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => null);
    const rawPhone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");

    const phone = normalizeIranianPhone(rawPhone);

    if (!isValidIranianPhone(phone) || !password) {
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    // Prevent DoS via extremely long passwords
    if (password.length > 128) {
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    const user = await db.user.findFirst({ where: { phone } });
    if (!user) {
      // Always run verifyPassword with a dummy hash to prevent timing attacks
      verifyPassword(
        password,
        "00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      );
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    if (!verifyPassword(password, user.password)) {
      return jsonError("شماره موبایل یا گذرواژه نادرست است.", 401);
    }

    await createSession(user.id, user.role);

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role as "ADMIN" | "CUSTOMER",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}