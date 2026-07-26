import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, verifyPassword, hashPassword, destroySession, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    const rl = await rateLimit(`change-pw-${ip}`, 5, 60_000);
    if (!rl.success) {
      return jsonError("تعداد درخواست‌ها بیش از حد مجاز است.", 429);
    }

    const body = await req.json().catch(() => null);
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return jsonError("گذرواژه فعلی و گذرواژه جدید الزامی هستند.", 400);
    }

    // Prevent DoS via extremely long current password (scrypt is CPU-intensive)
    if (currentPassword.length > 128) {
      return jsonError("گذرواژه فعلی نادرست است.", 401);
    }

    if (newPassword.length < 6) {
      return jsonError("گذرواژه جدید باید حداقل ۶ نویسه باشد.", 422);
    }

    if (newPassword.length > 128) {
      return jsonError("گذرواژه جدید نباید بیشتر از ۱۲۸ نویسه باشد.", 422);
    }

    // Look up the user with their password hash
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });

    if (!dbUser) {
      return jsonError("کاربر یافت نشد.", 404);
    }

    // Verify current password
    if (!verifyPassword(currentPassword, dbUser.password)) {
      return jsonError("گذرواژه فعلی نادرست است.", 401);
    }

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });

    // Invalidate the old session and issue a new one so that any
    // previously-stolen session token is no longer valid.
    await destroySession();
    await createSession(user.id, user.role);

    return jsonOk({ message: "گذرواژه با موفقیت تغییر کرد." });
  } catch (err) {
    return handleApiError(err);
  }
}
