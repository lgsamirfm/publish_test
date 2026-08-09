import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import { simulatedPaymentsEnabled } from "@/lib/payment";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const ip = await getClientIp();
    const limit = await rateLimit(`payment-create:${user.id}:${ip}`, 10, 60_000);
    if (!limit.success) return rateLimitError(limit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 4 * 1024);
    if (!parsed.ok) return parsed.response;
    const orderId = parsed.data?.orderId;
    const paymentMethod = parsed.data?.paymentMethod;

    if (typeof orderId !== "string" || !orderId || orderId.length > 128) {
      return jsonError("شناسه سفارش الزامی است.", 400);
    }
    if (paymentMethod !== "ONLINE" && paymentMethod !== "COD") {
      return jsonError("روش پرداخت نامعتبر است.", 400);
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return jsonError("سفارش یافت نشد.", 404);
    if (order.userId !== user.id) return jsonError("این سفارش متعلق به شما نیست.", 403);
    if (order.status === "CANCELLED") return jsonError("این سفارش لغو شده است.", 409);
    if (order.paymentStatus === "PAID") return jsonError("این سفارش قبلاً پرداخت شده است.", 409);
    if (order.paymentMethod && order.paymentMethod !== paymentMethod) {
      return jsonError("روش پرداخت سفارش قابل تغییر نیست.", 409);
    }

    const hasPattern = order.items.some((item) => item.itemType === "PATTERN");
    if (hasPattern && paymentMethod === "COD") {
      return jsonError("الگوهای دیجیتال فقط به‌صورت آنلاین قابل پرداخت هستند.", 400);
    }

    if (paymentMethod === "ONLINE") {
      if (!simulatedPaymentsEnabled()) {
        return jsonError(
          "درگاه پرداخت آنلاین واقعی پیکربندی نشده است. درگاه آزمایشی در محیط عملیاتی غیرفعال است.",
          503
        );
      }
      if (order.paymentStatus === "PENDING" && order.transactionId) {
        return jsonError("یک پرداخت قبلاً در حال پردازش است.", 409);
      }

      const transactionId = `DEV-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
          transactionId,
        },
      });

      return jsonOk({
        paymentUrl: `/api/payment/gateway?txn=${encodeURIComponent(transactionId)}&order=${encodeURIComponent(orderId)}`,
        transactionId,
        amount: order.total + order.shippingCost,
        simulated: true,
      });
    }

    await db.order.update({
      where: { id: orderId },
      data: { paymentMethod: "COD", paymentStatus: "UNPAID", transactionId: "" },
    });
    return jsonOk({ method: "COD", message: "پرداخت در محل ثبت شد" });
  } catch (error) {
    return handleApiError(error);
  }
}
