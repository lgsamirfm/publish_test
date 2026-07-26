import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError } from "@/lib/api";

/**
 * GET /api/payment/status?orderId=xxx
 *
 * Returns the current payment status of an order from the database.
 * This is the SERVER TRUTH — the cart page polls this endpoint
 * to know whether payment succeeded, failed, or is still pending.
 * The client cannot manipulate this value.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();

    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId || typeof orderId !== "string") {
      return jsonError("شناسه سفارش الزامی است.", 400);
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        paymentStatus: true,
        status: true,
        paymentMethod: true,
      },
    });

    if (!order) {
      return jsonError("سفارش یافت نشد.", 404);
    }

    if (order.userId !== user.id) {
      return jsonError("این سفارش متعلق به شما نیست.", 403);
    }

    return jsonOk({
      orderId: order.id,
      paymentStatus: order.paymentStatus, // UNPAID | PENDING | PAID | FAILED
      orderStatus: order.status,          // PENDING | PAID | SHIPPED | DELIVERED | CANCELLED
      paymentMethod: order.paymentMethod,
    });
  } catch (err) {
    return handleApiError(err);
  }
}