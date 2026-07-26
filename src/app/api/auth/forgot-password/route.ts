import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || email.trim().length > 254) {
      return NextResponse.json({ error: "ایمیل نامعتبر است." }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "اگر این ایمیل در سیستم باشد، لینک بازیابی ارسال شده است.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In production, send email here instead of returning the token
    return NextResponse.json({
      ok: true,
      message: "اگر این ایمیل در سیستم باشد، لینک بازیابی ارسال شده است.",
      token: resetToken, // ← Remove in production!
    });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}