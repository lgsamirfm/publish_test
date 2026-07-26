import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser, verifyPaymentSignature } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

/**
 * POST /api/payment/verify
 * Verifies payment after the simulated gateway processes it.
 * Body: { transactionId, orderId, success: boolean, signature }
 *
 * The signature is generated server-side by the gateway route and proves
 * the request came from our simulated gateway — not from a malicious client.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    const rl = await rateLimit(`payment-verify-${ip}`, 10, 60_000);
    if (!rl.success) {
      return jsonError(
        "تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد تلاش کنید.",
        429
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonError("بدنه درخواست نامعتبر است.", 400);
    }

    const { transactionId, orderId, success, signature } = (body ?? {}) as {
      transactionId?: string;
      orderId?: string;
      success?: boolean;
      signature?: string;
    };

    // Validate inputs
    if (!transactionId || typeof transactionId !== "string") {
      return jsonError("شناسه تراکنش الزامی است.", 400);
    }

    if (!orderId || typeof orderId !== "string") {
      return jsonError("شناسه سفارش الزامی است.", 400);
    }

    if (typeof success !== "boolean") {
      return jsonError("پارامتر success باید از نوع boolean باشد.", 400);
    }

    // Validate the HMAC signature to prevent payment bypass
    if (!signature || typeof signature !== "string") {
      return jsonError("امضای تراکنش الزامی است.", 400);
    }

    const isValidSignature = verifyPaymentSignature(
      transactionId,
      orderId,
      success,
      signature
    );

    if (!isValidSignature) {
      return jsonError("امضای تراکنش نامعتبر است.", 400);
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return jsonError("سفارش یافت نشد.", 404);
    }

    // Verify ownership
    if (order.userId !== user.id) {
      return jsonError("این سفارش متعلق به شما نیست.", 403);
    }

    // Verify transaction ID matches
    if (order.transactionId !== transactionId) {
      return jsonError("شناسه تراکنش با سفارش مطابقت ندارد.", 400);
    }

    // Check order is in PENDING payment status
    if (order.paymentStatus !== "PENDING") {
      return jsonError("وضعیت پرداخت این سفارش قابل تأیید نیست.", 400);
    }

    if (success) {
      // Payment succeeded
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "PAID",
          paidAt: new Date(),
        },
      });

      return jsonOk({
        success: true,
        message: "پرداخت با موفقیت انجام شد",
      });
    }

    // Payment failed
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "FAILED",
      },
    });

    return jsonOk({
      success: false,
      message: "پرداخت ناموفق بود",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
