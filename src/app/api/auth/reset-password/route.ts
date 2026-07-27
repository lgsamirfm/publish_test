import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";

export async function POST(req: Request) {
  try {
    const { phone: rawPhone, code, password } = await req.json().catch(() => ({}));

    const phone = normalizeIranianPhone(String(rawPhone ?? ""));

    if (!phone || !isValidIranianPhone(phone)) {
      return NextResponse.json(
        { error: "شماره موبایل وارد شده معتبر نیست." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json({ error: "کد تأیید الزامی است." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "گذرواژه جدید باید حداقل ۶ نویسه باشد." },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "گذرواژه جدید خیلی طولانی است." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    // Check if user exists with matching phone, reset token/code and expiry > now
    const user = await db.user.findFirst({
      where: {
        phone,
        resetToken: cleanCode,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "کد تأیید نامعتبر است یا مهلت ۲ دقیقه‌ای آن به پایان رسیده است." },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "گذرواژه با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید.",
    });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}