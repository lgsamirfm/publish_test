import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/login
// Body: { email, password }
// Returns: { user: { id, name, email, role } } and sets the baf_session cookie.
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 attempts / minute per IP.
    const ip = await getClientIp();
    const rl = await rateLimit("login-" + ip, 10, 60_000);
    if (!rl.success) {
      return jsonError("تلاش‌های بیش از حد. یک دقیقه بعد تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!EMAIL_RE.test(email) || !password) {
      return jsonError("ایمیل یا گذرواژه نادرست است.", 401);
    }

    // Prevent DoS via extremely long passwords
    if (password.length > 128) {
      return jsonError("ایمیل یا گذرواژه نادرست است.", 401);
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Always run verifyPassword with a dummy hash to prevent timing attacks
      // that could enumerate valid email addresses.
      verifyPassword(password, "00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
      return jsonError("ایمیل یا گذرواژه نادرست است.", 401);
    }
    if (!verifyPassword(password, user.password)) {
      return jsonError("ایمیل یا گذرواژه نادرست است.", 401);
    }

    await createSession(user.id, user.role);

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as "ADMIN" | "CUSTOMER",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
