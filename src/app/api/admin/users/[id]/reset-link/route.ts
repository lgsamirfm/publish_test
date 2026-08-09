import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateResetCode, hashResetCode, requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
} from "@/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(
      `admin-reset:${admin.id}:${ip}`,
      10,
      60 * 60_000
    );
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!id || id.length > 128) return jsonError("شناسه کاربر نامعتبر است.", 400);

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return jsonError("کاربر یافت نشد.", 404);

    const code = generateResetCode();
    await db.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashResetCode(user.phone, code),
        resetTokenExpiry: new Date(Date.now() + 2 * 60_000),
      },
    });

    // The code is intentionally shown only to an authenticated administrator,
    // for support-assisted recovery. It is hashed at rest.
    return jsonOk({ code, phone: user.phone });
  } catch (error) {
    return handleApiError(error);
  }
}
