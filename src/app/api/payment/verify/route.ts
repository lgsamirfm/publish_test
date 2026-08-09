import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, verifyPaymentSignature } from "@/lib/auth";
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

/** Development-only fake payment completion. Never available in production. */
export async function POST(req: NextRequest) {
  if (!simulatedPaymentsEnabled()) return jsonError("یافت نشد.", 404);

  try {
    const user = await requireUser();
    const ip = await getClientIp();
    const limit = await rateLimit(`payment-verify:${user.id}:${ip}`, 10, 60_000);
    if (!limit.success) return rateLimitError(limit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;

    const transactionId = parsed.data?.transactionId;
    const orderId = parsed.data?.orderId;
    const success = parsed.data?.success;
    const signature = parsed.data?.signature;
    if (
      typeof transactionId !== "string" ||
      !transactionId ||
      transactionId.length > 128 ||
      typeof orderId !== "string" ||
      !orderId ||
      orderId.length > 128 ||
      typeof success !== "boolean" ||
      typeof signature !== "string" ||
      signature.length > 128
    ) {
      return jsonError("پارامترهای تراکنش نامعتبر هستند.", 400);
    }
    if (!verifyPaymentSignature(transactionId, orderId, success, signature)) {
      return jsonError("امضای تراکنش نامعتبر است.", 400);
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return jsonError("سفارش یافت نشد.", 404);
    if (order.userId !== user.id) return jsonError("این سفارش متعلق به شما نیست.", 403);
    if (order.transactionId !== transactionId) {
      return jsonError("شناسه تراکنش با سفارش مطابقت ندارد.", 400);
    }

    const updated = await db.order.updateMany({
      where: {
        id: orderId,
        userId: user.id,
        transactionId,
        paymentStatus: "PENDING",
      },
      data: success
        ? { paymentStatus: "PAID", status: "PAID", paidAt: new Date() }
        : { paymentStatus: "FAILED" },
    });
    if (updated.count !== 1) {
      return jsonError("وضعیت پرداخت این سفارش قابل تأیید نیست.", 409);
    }

    return jsonOk({
      success,
      message: success ? "پرداخت آزمایشی موفق بود" : "پرداخت آزمایشی ناموفق بود",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
