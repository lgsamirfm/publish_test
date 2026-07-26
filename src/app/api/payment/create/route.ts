import { NextRequest } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

/**
 * POST /api/payment/create
 * Creates a payment request for an order.
 * Body: { orderId, paymentMethod: "ONLINE" | "COD" }
 * Amount is computed server-side — never trusted from the client.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    const rl = await rateLimit(`payment-create-${ip}`, 10, 60_000);
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

    const { orderId, paymentMethod } = (body ?? {}) as {
      orderId?: string;
      paymentMethod?: string;
    };

    // Validate orderId
    if (!orderId || typeof orderId !== "string") {
      return jsonError("شناسه سفارش الزامی است.", 400);
    }

    // Validate paymentMethod
    if (paymentMethod !== "ONLINE" && paymentMethod !== "COD") {
      return jsonError("روش پرداخت نامعتبر است. مقادیر مجاز: ONLINE, COD", 400);
    }

    // Look up the order and verify ownership
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return jsonError("سفارش یافت نشد.", 404);
    }

    if (order.userId !== user.id) {
      return jsonError("این سفارش متعلق به شما نیست.", 403);
    }

    // Compute amount server-side — never trust the client
    const expectedAmount = order.total + order.shippingCost;

    // Check if already paid
    if (order.paymentStatus === "PAID") {
      return jsonError("این سفارش قبلاً پرداخت شده است.", 400);
    }

    // Prevent duplicate pending payments
    if (order.paymentStatus === "PENDING" && order.transactionId) {
      return jsonError(
        "یک پرداخت قبلاً در حال پردازش است. ابتدا آن را تکمیل یا لغو کنید.",
        409
      );
    }

    if (paymentMethod === "ONLINE") {
      // Generate a simulated transaction ID
      const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
      const transactionId = `BF-${Date.now()}-${randomHex}`;

      // Update order with payment info
      await db.order.update({
        where: { id: orderId },
        data: {
          paymentMethod: "ONLINE",
          paymentStatus: "PENDING",
          transactionId,
        },
      });

      return jsonOk({
        paymentUrl: `/api/payment/gateway?txn=${transactionId}&order=${orderId}`,
        transactionId,
        amount: expectedAmount,
      });
    }

    // COD (Cash on Delivery)
    await db.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        // status remains PENDING for COD
      },
    });

    return jsonOk({
      method: "COD",
      message: "پرداخت در محل ثبت شد",
    });
  } catch (err) {
    return handleApiError(err);
  }
}
