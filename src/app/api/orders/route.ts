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
  readJsonBody,
} from "@/lib/api";
import { simulatedPaymentsEnabled } from "@/lib/payment";

type OrderInputItem = {
  type: "PRODUCT" | "PATTERN";
  id: string;
  quantity: number;
};

const MAX_DISTINCT_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;
const MAX_ORDER_TOTAL = 2_000_000_000;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const ip = await getClientIp();

    const minuteLimit = await rateLimit(`order-create:ip:${ip}`, 10, 60_000);
    if (!minuteLimit.success) return rateLimitError(minuteLimit);
    const accountLimit = await rateLimit(
      `order-create:user:${user.id}`,
      30,
      60 * 60_000
    );
    if (!accountLimit.success) return rateLimitError(accountLimit);

    const parsed = await readJsonBody<{
      items?: unknown;
      address?: unknown;
      phone?: unknown;
      note?: unknown;
      paymentMethod?: unknown;
    }>(req, 24 * 1024);
    if (!parsed.ok) return parsed.response;

    const rawItems = parsed.data?.items;
    const address = typeof parsed.data?.address === "string" ? parsed.data.address : "";
    const phone = typeof parsed.data?.phone === "string" ? parsed.data.phone : "";
    const note = typeof parsed.data?.note === "string" ? parsed.data.note : "";
    const paymentMethod = parsed.data?.paymentMethod;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return jsonError("سبد خرید خالی است.", 400);
    }
    if (rawItems.length > MAX_DISTINCT_ITEMS) {
      return jsonError("تعداد آیتم‌های سبد بیش از حد مجاز است.", 400);
    }
    if (!phone.trim() || phone.trim().length > 20) {
      return jsonError("شماره تماس معتبر الزامی است.", 400);
    }
    if (!address.trim() || address.trim().length > 1000) {
      return jsonError("آدرس معتبر الزامی است.", 400);
    }
    if (note.length > 2000) return jsonError("یادداشت بسیار طولانی است.", 400);
    if (paymentMethod !== "ONLINE" && paymentMethod !== "COD") {
      return jsonError("روش پرداخت نامعتبر است.", 400);
    }
    if (paymentMethod === "ONLINE" && !simulatedPaymentsEnabled()) {
      return jsonError(
        "درگاه پرداخت آنلاین واقعی هنوز پیکربندی نشده است. سفارش ایجاد نشد.",
        503
      );
    }

    // Normalize and combine duplicate product rows before any pricing or stock work.
    const combined = new Map<string, OrderInputItem>();
    for (const value of rawItems) {
      const item = value as Partial<OrderInputItem> | null;
      if (!item || (item.type !== "PRODUCT" && item.type !== "PATTERN")) {
        return jsonError("نوع آیتم سبد نامعتبر است.", 400);
      }
      if (typeof item.id !== "string" || !item.id || item.id.length > 128) {
        return jsonError("شناسه آیتم سبد نامعتبر است.", 400);
      }
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) {
        return jsonError("تعداد آیتم نامعتبر است.", 400);
      }
      if (item.type === "PATTERN" && quantity !== 1) {
        return jsonError("هر الگوی دیجیتال فقط یک‌بار قابل خرید است.", 400);
      }

      const key = `${item.type}:${item.id}`;
      const previous = combined.get(key);
      if (previous && item.type === "PATTERN") {
        return jsonError("الگوی تکراری در سبد خرید وجود دارد.", 400);
      }
      const combinedQuantity = (previous?.quantity || 0) + quantity;
      if (combinedQuantity > MAX_ITEM_QUANTITY) {
        return jsonError("حداکثر تعداد هر محصول ۹۹ است.", 400);
      }
      combined.set(key, { type: item.type, id: item.id, quantity: combinedQuantity });
    }
    const items = Array.from(combined.values());

    const hasPattern = items.some((item) => item.type === "PATTERN");
    if (hasPattern && paymentMethod === "COD") {
      return jsonError("الگوهای دیجیتال فقط به‌صورت آنلاین قابل پرداخت هستند.", 400);
    }

    const patternIds = items
      .filter((item) => item.type === "PATTERN")
      .map((item) => item.id);
    if (patternIds.length > 0) {
      const alreadyOwned = await db.order.findFirst({
        where: {
          userId: user.id,
          paymentStatus: "PAID",
          status: { not: "CANCELLED" },
          items: {
            some: { itemType: "PATTERN", itemId: { in: patternIds } },
          },
        },
        select: { id: true },
      });
      if (alreadyOwned) {
        return jsonError("یکی از الگوهای سبد قبلاً خریداری شده است.", 409);
      }
    }

    const orderItems: {
      itemType: "PRODUCT" | "PATTERN";
      itemId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }[] = [];
    const stockChecks: { id: string; quantity: number; name: string }[] = [];
    let total = 0;

    for (const item of items) {
      if (item.type === "PRODUCT") {
        const product = await db.product.findUnique({
          where: { id: item.id },
          select: { id: true, name: true, price: true, images: true },
        });
        if (!product || !Number.isSafeInteger(product.price) || product.price < 0) {
          return jsonError("یکی از محصولات سبد معتبر نیست.", 400);
        }
        total += product.price * item.quantity;
        orderItems.push({
          itemType: "PRODUCT",
          itemId: product.id,
          name: product.name,
          price: product.price,
          image: product.images?.split(",")[0]?.trim() || "",
          quantity: item.quantity,
        });
        stockChecks.push({ id: product.id, quantity: item.quantity, name: product.name });
      } else {
        const pattern = await db.pattern.findUnique({
          where: { id: item.id },
          select: { id: true, title: true, price: true, images: true },
        });
        if (!pattern || !Number.isSafeInteger(pattern.price) || pattern.price < 0) {
          return jsonError("یکی از الگوهای سبد معتبر نیست.", 400);
        }
        total += pattern.price;
        orderItems.push({
          itemType: "PATTERN",
          itemId: pattern.id,
          name: pattern.title,
          price: pattern.price,
          image: pattern.images?.split(",")[0]?.trim() || "",
          quantity: 1,
        });
      }

      if (!Number.isSafeInteger(total) || total > MAX_ORDER_TOTAL) {
        return jsonError("مبلغ سفارش بیش از حد مجاز است.", 400);
      }
    }

    const hasPhysicalProduct = items.some((item) => item.type === "PRODUCT");
    const shippingCost = hasPhysicalProduct && total < 500_000 ? 50_000 : 0;

    const order = await db.$transaction(async (tx) => {
      for (const check of stockChecks) {
        const product = await tx.product.findUnique({
          where: { id: check.id },
          select: { stock: true },
        });
        if (!product) throw new Error(`Product disappeared: ${check.id}`);

        // Negative stock represents made-to-order demand. Reserving the complete
        // quantity lets cancellation restore exactly what this order reserved.
        await tx.product.update({
          where: { id: check.id },
          data: { stock: { decrement: check.quantity } },
        });
      }

      return tx.order.create({
        data: {
          userId: user.id,
          total,
          status: "PENDING",
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(),
          paymentMethod,
          paymentStatus: "UNPAID",
          shippingCost,
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });

    return jsonOk({ order }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === "ADMIN") {
      const orders = await db.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });
      return jsonOk({ orders });
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({ orders });
  } catch (error) {
    return handleApiError(error);
  }
}
