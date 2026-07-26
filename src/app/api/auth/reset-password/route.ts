import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "توکن نامعتبر است." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "گذرواژه باید حداقل ۶ کاراکتر باشد." },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "گذرواژه خیلی طولانی است." },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "توکن نامعتبر یا منقضی شده است." },
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

    return NextResponse.json({ ok: true, message: "گذرواژه با موفقیت تغییر کرد." });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}