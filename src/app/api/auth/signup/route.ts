import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/signup
// Body: { name, email, password }
// Returns: { user } and sets the baf_session cookie.
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 signups / minute per IP.
    const ip = await getClientIp();
    const rl = await rateLimit("signup-" + ip, 5, 60_000);
    if (!rl.success) {
      return jsonError("تلاش‌های بیش از حد. یک دقیقه بعد تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => null);
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!name) {
      return jsonError("نام را وارد کنید.", 422);
    }
    if (name.length > 100) {
      return jsonError("نام بسیار طولانی است.", 422);
    }
    if (email.length > 200) {
      return jsonError("ایمیل بسیار طولانی است.", 422);
    }
    if (!EMAIL_RE.test(email)) {
      return jsonError("ایمیل معتبر نیست.", 422);
    }
    if (password.length < 6) {
      return jsonError("گذرواژه باید حداقل ۶ نویسه باشد.", 422);
    }
    if (password.length > 128) {
      return jsonError("گذرواژه نباید بیشتر از ۱۲۸ نویسه باشد.", 422);
    }

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      // Generic message to avoid email enumeration — don't confirm the email exists.
      return jsonError("امکان ثبت‌نام با این ایمیل وجود ندارد. اگر حساب دارید، وارد شوید.", 401);
    }

    const user = await db.user.create({
      data: { name, email, password: hashPassword(password), role: "CUSTOMER" },
      select: { id: true, name: true, email: true, role: true },
    });

    await createSession(user.id, "CUSTOMER");

    return jsonOk({ user }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
