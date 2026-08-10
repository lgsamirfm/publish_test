import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/api";

export async function POST(req: Request) {
  try {
    // Rate limit: 5 attempts / minute per IP (OTP brute-force protection).
    const ip = await getClientIp();
    const rl = await rateLimit("forgot-password-" + ip, 5, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "تلاش‌های بیش از حد. یک دقیقه بعد تلاش کنید." },
        { status: 429 }
      );
    }

    const { phone: rawPhone } = await req.json().catch(() => ({}));
    const phone = normalizeIranianPhone(String(rawPhone ?? ""));

    if (!phone || !isValidIranianPhone(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل وارد شده معتبر نیست. (مثال: 09121234567)" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { phone },
    });

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "کد تأیید به شماره موبایل ارسال شد (اگر در سیستم ثبت شده باشد).",
      });
    }

    // Generate random 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set 2-minute expiration (2 * 60 * 1000 ms)
    const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiry },
    });

    return NextResponse.json({
      ok: true,
      message: "کد تأیید ۲ دقیقه‌ای به شماره موبایل شما ارسال شد.",
      code, // Included for testing/simulation convenience
      expiresInSeconds: 120,
    });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}