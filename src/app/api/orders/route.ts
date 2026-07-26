import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

type OrderInputItem = {
  type: "PRODUCT" | "PATTERN";
  id: string;
  quantity: number;
};

/**
 * POST /api/orders
 * Body: { items: [{type, id, quantity}], address, phone, note, paymentMethod }
 * - Requires login.
 * - For each item: lookup Product/Pattern, validate existence, use DB price.
 * - Create order + OrderItems in a single transaction.
 * - Calculates shipping cost: free for orders >= 500k toman, otherwise 50k toman.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const ip = await getClientIp();
    const rl = await rateLimit(`order-create-${ip}`, 10, 60_000);
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

    const {
      items: rawItems,
      address,
      phone,
      note,
      paymentMethod,
    } = (body ?? {}) as {
      items?: OrderInputItem[];
      address?: string;
      phone?: string;
      note?: string;
      paymentMethod?: string;
    };

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return jsonError("سبد خرید خالی است.", 400);
    }
    if (!phone || !phone.trim()) {
      return jsonError("شماره تماس الزامی است.", 400);
    }
    if (phone.trim().length > 20) return jsonError("شماره تماس بسیار طولانی است.", 400);
    if (!address || !address.trim()) {
      return jsonError("آدرس الزامی است.", 400);
    }
    if (address.trim().length > 1000) return jsonError("آدرس بسیار طولانی است.", 400);
    if (note && String(note).length > 2000) return jsonError("یادداشت بسیار طولانی است.", 400);

    // Validate paymentMethod
    if (paymentMethod && paymentMethod !== "ONLINE" && paymentMethod !== "COD") {
      return jsonError("روش پرداخت نامعتبر است.", 400);
    }

    // Normalize + validate items
    const items: OrderInputItem[] = [];
    for (const it of rawItems) {
      if (!it || (it.type !== "PRODUCT" && it.type !== "PATTERN")) {
        return jsonError("نوع آیتم سبد نامعتبر است.", 400);
      }
      if (typeof it.id !== "string" || !it.id) {
        return jsonError("شناسه آیتم سبد نامعتبر است.", 400);
      }
      const qty = Math.floor(Number(it.quantity));
      if (!Number.isFinite(qty) || qty < 1) {
        return jsonError("تعداد آیتم نامعتبر است.", 400);
      }
      if (qty > 99) {
        return jsonError("حداکثر تعداد هر آیتم ۹۹ است.", 400);
      }
      items.push({ type: it.type, id: it.id, quantity: qty });
    }

    // Look up each item and snapshot its real DB price (never trust client)
    const orderItemsData: {
      itemType: "PRODUCT" | "PATTERN";
      itemId: string;
      name: string;
      price: number;
      image: string;
      quantity: number;
    }[] = [];
    let total = 0;

    // Collect product IDs that need stock checks so we can do it inside a transaction
    const productStockChecks: { id: string; quantity: number; name: string }[] = [];

    for (const it of items) {
      let name: string;
      let price: number;
      let image: string;

      if (it.type === "PRODUCT") {
        const product = await db.product.findUnique({
          where: { id: it.id },
          select: { id: true, name: true, price: true, images: true, stock: true },
        });
        if (!product) {
          return jsonError(
            "یکی از محصولات سبد یافت نشد. ممکن است حذف شده باشد.",
            400
          );
        }
        // Block ordering out-of-stock products
        if (product.stock <= 0) {
          return jsonError(`محصول «${product.name}» ناموجود است.`, 400);
        }
        // Check if requested quantity exceeds available stock
        if (it.quantity > product.stock) {
          return jsonError(
            `محصول «${product.name}»: فقط ${product.stock} عدد موجود است.`,
            400
          );
        }
        name = product.name;
        price = product.price;
        image = product.images?.split(",")[0]?.trim() ?? "";
        productStockChecks.push({ id: product.id, quantity: it.quantity, name: product.name });
      } else {
        const pattern = await db.pattern.findUnique({
          where: { id: it.id },
          select: { id: true, title: true, price: true, images: true },
        });
        if (!pattern) {
          return jsonError(
            "یکی از الگوهای سبد یافت نشد. ممکن است حذف شده باشد.",
            400
          );
        }
        name = pattern.title;
        price = pattern.price;
        image = pattern.images?.split(",")[0]?.trim() ?? "";
      }

      total += price * it.quantity;
      orderItemsData.push({
        itemType: it.type,
        itemId: it.id,
        name,
        price,
        image,
        quantity: it.quantity,
      });
    }

    // Calculate shipping cost: free for orders >= 500,000 toman, otherwise 50,000 toman
    const shippingCost = total >= 500000 ? 0 : 50000;

    // Use a transaction to atomically decrement stock and create the order
    const order = await db.$transaction(async (tx) => {
      // Re-check and decrement stock for each product inside the transaction
      for (const check of productStockChecks) {
        const product = await tx.product.findUnique({
          where: { id: check.id },
          select: { stock: true, name: true },
        });
        if (!product) {
          throw new Error(`محصول «${check.name}» یافت نشد.`);
        }
        if (product.stock < check.quantity) {
          throw new Error(
            `محصول «${product.name}»: فقط ${product.stock} عدد موجود است.`
          );
        }
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
          note: (note ?? "").toString().slice(0, 2000).trim(),
          paymentMethod: paymentMethod || "",
          paymentStatus: "UNPAID",
          shippingCost,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });
    });

    return jsonOk({ order }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * GET /api/orders
 * - Customer: own orders, newest first.
 * - Admin: all orders, newest first, with user name/email.
 */
export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === "ADMIN") {
      const orders = await db.order.findMany({
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return jsonOk({ orders });
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ orders });
  } catch (err) {
    return handleApiError(err);
  }
}
