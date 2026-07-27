import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";

// POST /api/auth/signup
// Body: { name, phone, password }
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
    const rawPhone = String(body?.phone ?? "").trim();
    const password = String(body?.password ?? "");

    const phone = normalizeIranianPhone(rawPhone);

    if (!name) {
      return jsonError("نام را وارد کنید.", 422);
    }
    if (name.length > 100) {
      return jsonError("نام بسیار طولانی است.", 422);
    }
    if (!phone || !isValidIranianPhone(phone)) {
      return jsonError("شماره موبایل وارد شده معتبر نیست. (مثال: 09121234567)", 422);
    }
    if (password.length < 6) {
      return jsonError("گذرواژه باید حداقل ۶ نویسه باشد.", 422);
    }
    if (password.length > 128) {
      return jsonError("گذرواژه نباید بیشتر از ۱۲۸ نویسه باشد.", 422);
    }

    const existing = await db.user.findFirst({
      where: { phone },
      select: { id: true },
    });
    if (existing) {
      return jsonError("حسابی با این شماره موبایل قبلاً ثبت شده است. اگر حساب دارید، وارد شوید.", 409);
    }

    const user = await db.user.create({
      data: {
        name,
        phone,
        email: "",
        password: hashPassword(password),
        role: "CUSTOMER",
      },
      select: { id: true, name: true, phone: true, email: true, role: true },
    });

    await createSession(user.id, "CUSTOMER");

    return jsonOk({ user }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}