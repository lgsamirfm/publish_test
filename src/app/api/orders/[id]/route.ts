import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";

const ALLOWED_STATUS = new Set([
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

const VALID_TRANSITIONS: Record<string, Set<string>> = {
  PENDING: new Set(["PAID", "CANCELLED"]),
  PAID: new Set(["SHIPPED", "CANCELLED"]),
  SHIPPED: new Set(["DELIVERED"]),
  DELIVERED: new Set(),
  CANCELLED: new Set(),
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!id || id.length > 128) return jsonError("شناسه سفارش نامعتبر است.", 400);

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return jsonError("سفارش یافت نشد.", 404);
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return jsonError("دسترسی غیرمجاز.", 403);
    }
    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`order-status:${admin.id}:${ip}`, 60, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!id || id.length > 128) return jsonError("شناسه سفارش نامعتبر است.", 400);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 2 * 1024);
    if (!parsed.ok) return parsed.response;
    const status = typeof parsed.data?.status === "string" ? parsed.data.status : "";
    if (!ALLOWED_STATUS.has(status)) return jsonError("وضعیت نامعتبر است.", 400);

    const existing = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) return jsonError("سفارش یافت نشد.", 404);

    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed?.has(status)) {
      return jsonError(
        `تغییر وضعیت از ${existing.status} به ${status} مجاز نیست.`,
        400
      );
    }

    await db.$transaction(async (tx) => {
      if (status === "CANCELLED") {
        for (const item of existing.items) {
          if (item.itemType === "PRODUCT") {
            // A product may have been removed from the catalogue after purchase.
            await tx.product.updateMany({
              where: { id: item.itemId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          status,
          ...(status === "PAID"
            ? { paymentStatus: "PAID", paidAt: existing.paidAt || new Date() }
            : {}),
        },
      });
    });

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return jsonOk({ order });
  } catch (error) {
    return handleApiError(error);
  }
}
