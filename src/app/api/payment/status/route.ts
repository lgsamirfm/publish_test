import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
} from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const ip = await getClientIp();
    const limit = await rateLimit(`payment-status:${user.id}:${ip}`, 120, 5 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const orderId = req.nextUrl.searchParams.get("orderId");
    if (!orderId || orderId.length > 128) {
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
    if (!order) return jsonError("سفارش یافت نشد.", 404);
    if (order.userId !== user.id) return jsonError("این سفارش متعلق به شما نیست.", 403);

    return jsonOk({
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
