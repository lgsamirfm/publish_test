import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

type Params = Promise<{ id: string }>;

/**
 * PATCH /api/admin/users/[id]
 * Body: { role: "ADMIN" | "CUSTOMER" }
 * Requires admin.
 * Prevents: self-demotion, demoting the last admin.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;

    const body = await req.json().catch(() => null);
    const role = String(body?.role ?? "");

    if (role !== "ADMIN" && role !== "CUSTOMER") {
      return jsonError("نقش باید ADMIN یا CUSTOMER باشد.", 400);
    }

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return jsonError("کاربر یافت نشد.", 404);
    }

    // Prevent self-demotion
    if (id === admin.id && role === "CUSTOMER") {
      return jsonError("شما نمی‌توانید نقش خود را تغییر دهید.", 400);
    }

    // Prevent demoting the last admin
    if (role === "CUSTOMER" && user.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return jsonError("نمی‌توان آخرین مدیر را تنزل داد.", 400);
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return jsonOk({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
