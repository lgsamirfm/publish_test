import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

const ALLOWED_STATUS = new Set([
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

/**
 * Valid order status transitions.
 * Prevents invalid jumps like PENDING → DELIVERED or CANCELLED → PAID.
 */
const VALID_TRANSITIONS: Record<string, Set<string>> = {
  PENDING: new Set(["PAID", "CANCELLED"]),
  PAID: new Set(["SHIPPED", "CANCELLED"]),
  SHIPPED: new Set(["DELIVERED"]),
  DELIVERED: new Set(),   // terminal state
  CANCELLED: new Set(),   // terminal state
};

/**
 * GET /api/orders/[id]
 * - Owner or admin can view.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return jsonError("سفارش یافت نشد.", 404);
    }

    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return jsonError("دسترسی غیرمجاز.", 403);
    }

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/orders/[id]
 * - Admin only. Updates order status with transition validation.
 * - Restores stock when order is cancelled.
 * Body: { status }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("بدنه درخواست نامعتبر است.", 400);
    }

    const { status } = (body ?? {}) as { status?: string };

    if (!status || !ALLOWED_STATUS.has(status)) {
      return jsonError("وضعیت نامعتبر است.", 400);
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return jsonError("سفارش یافت نشد.", 404);
    }

    // Validate status transition
    const allowed = VALID_TRANSITIONS[existing.status];
    if (!allowed || !allowed.has(status)) {
      return jsonError(
        `تغییر وضعیت از ${existing.status} به ${status} مجاز نیست.`,
        400
      );
    }

    // If cancelling, restore stock atomically
    if (status === "CANCELLED" && existing.status !== "CANCELLED") {
      await db.$transaction(async (tx) => {
        // Restore stock for each product item in the order
        for (const item of existing.items) {
          if (item.itemType === "PRODUCT") {
            await tx.product.update({
              where: { id: item.itemId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        await tx.order.update({
          where: { id },
          data: { status },
        });
      });
    } else {
      await db.order.update({
        where: { id },
        data: { status },
      });
    }

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    return jsonOk({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
