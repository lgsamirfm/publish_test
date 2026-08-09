import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  requireUser,
  verifyPassword,
  hashPassword,
  createSession,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  jsonOk,
  jsonError,
  handleApiError,
  getClientIp,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const ip = await getClientIp();
    const limit = await rateLimit(`change-password:${user.id}:${ip}`, 5, 15 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;

    const currentPassword = String(parsed.data?.currentPassword ?? "");
    const newPassword = String(parsed.data?.newPassword ?? "");

    if (!currentPassword || !newPassword) {
      return jsonError("گذرواژه فعلی و گذرواژه جدید الزامی هستند.", 400);
    }
    if (currentPassword.length > 128) {
      return jsonError("گذرواژه فعلی نادرست است.", 401);
    }
    if (newPassword.length < 12) {
      return jsonError("گذرواژه جدید باید حداقل ۱۲ نویسه باشد.", 422);
    }
    if (newPassword.length > 128) {
      return jsonError("گذرواژه جدید نباید بیشتر از ۱۲۸ نویسه باشد.", 422);
    }
    if (currentPassword === newPassword) {
      return jsonError("گذرواژه جدید باید با گذرواژه فعلی متفاوت باشد.", 422);
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true },
    });
    if (!dbUser) return jsonError("کاربر یافت نشد.", 404);

    if (!(await verifyPassword(currentPassword, dbUser.password))) {
      return jsonError("گذرواژه فعلی نادرست است.", 401);
    }

    await db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    // Session tokens include a password-derived version. The update above
    // invalidates every old token, including stolen sessions, before issuing this one.
    await createSession(user.id);

    return jsonOk({ message: "گذرواژه با موفقیت تغییر کرد." });
  } catch (error) {
    return handleApiError(error);
  }
}
