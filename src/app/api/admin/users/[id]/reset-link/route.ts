import { NextResponse } from "next/server";
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

    // 6-digit random code with 2-minute expiry
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiry },
    });

    return NextResponse.json({ code, phone: user.phone });
  } catch {
    return NextResponse.json({ error: "خطای سرور." }, { status: 500 });
  }
}