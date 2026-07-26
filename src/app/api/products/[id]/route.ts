import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/* ---------- GET /api/products/[id] ---------- */
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    const product = (await db.product.findUnique({ where: { id } })) as
      | Product
      | null;
    if (!product) return jsonError("محصول یافت نشد.", 404);
    return jsonOk({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

/* ---------- PUT /api/products/[id] (admin) ---------- */
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("product-update-" + ip, 20, 60_000);
    if (!rl.success) {
      return jsonError("درخواست بیش از حد. بعداً تلاش کنید.", 429);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined)
      data.description = String(body.description).trim();
    if (body.price !== undefined) {
      const price = Math.floor(Number(body.price));
      if (!Number.isFinite(price) || price < 0) {
        return jsonError("قیمت معتبر نیست.", 400);
      }
      data.price = price;
    }
    if (body.images !== undefined) data.images = String(body.images).trim();
    if (body.variants !== undefined) {
      try {
        const v = Array.isArray(body.variants) ? body.variants : [];
        const cleaned = v
          .map((x: { name?: unknown; color?: unknown }) => ({
            name: String(x?.name ?? "").trim(),
            color: x?.color ? String(x.color) : undefined,
          }))
          .filter((x: { name: string }) => x.name);
        data.variants = JSON.stringify(cleaned);
      } catch {
        data.variants = "[]";
      }
    }
    if (body.category !== undefined) {
      const category = String(body.category).trim();
      data.category = category || "عمومی";
    }
    if (body.stock !== undefined) {
      data.stock = Math.max(0, Math.floor(Number(body.stock) || 0));
    }
    if (body.featured !== undefined) data.featured = Boolean(body.featured);

    if (Object.keys(data).length === 0) {
      return jsonError("فیلدی برای به‌روزرسانی ارسال نشده است.", 400);
    }

    const product = (await db.product.update({
      where: { id },
      data,
    })) as Product;

    return jsonOk({ product });
  } catch (err) {
    return handleApiError(err);
  }
}

/* ---------- DELETE /api/products/[id] (admin) ---------- */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("product-delete-" + ip, 20, 60_000);
    if (!rl.success) {
      return jsonError("درخواست بیش از حد. بعداً تلاش کنید.", 429);
    }

    const { id } = await params;
    await db.product.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
