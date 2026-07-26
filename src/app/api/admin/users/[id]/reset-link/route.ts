import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    return NextResponse.json({ token: resetToken });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}