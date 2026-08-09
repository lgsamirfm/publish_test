import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";

type Params = Promise<{ id: string }>;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`admin-role:${admin.id}:${ip}`, 20, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!id || id.length > 128) return jsonError("شناسه کاربر نامعتبر است.", 400);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 2 * 1024);
    if (!parsed.ok) return parsed.response;
    const role = String(parsed.data?.role ?? "");
    if (role !== "ADMIN" && role !== "CUSTOMER") {
      return jsonError("نقش باید ADMIN یا CUSTOMER باشد.", 400);
    }
    if (id === admin.id && role === "CUSTOMER") {
      return jsonError("شما نمی‌توانید نقش خود را تغییر دهید.", 400);
    }

    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id } });
      if (!user) return { kind: "missing" as const };

      if (role === "CUSTOMER" && user.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) return { kind: "last-admin" as const };
      }

      const updated = await tx.user.update({
        where: { id },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });
      return { kind: "updated" as const, user: updated };
    });

    if (result.kind === "missing") return jsonError("کاربر یافت نشد.", 404);
    if (result.kind === "last-admin") {
      return jsonError("نمی‌توان آخرین مدیر را تنزل داد.", 400);
    }
    return jsonOk({ user: result.user });
  } catch (error) {
    return handleApiError(error);
  }
}
