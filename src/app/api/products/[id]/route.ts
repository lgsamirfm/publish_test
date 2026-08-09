import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import { toEnDigits } from "@/lib/format";
import { normalizeImageList, normalizeVariants } from "@/lib/validation";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

function validId(id: string) {
  return Boolean(id && id.length <= 128);
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه محصول نامعتبر است.", 400);
    const product = await db.product.findUnique({ where: { id } });
    if (!product) return jsonError("محصول یافت نشد.", 404);
    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`product-update:${admin.id}:${ip}`, 40, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه محصول نامعتبر است.", 400);
    if (!(await db.product.findUnique({ where: { id }, select: { id: true } }))) {
      return jsonError("محصول یافت نشد.", 404);
    }

    const parsed = await readJsonBody<Record<string, unknown>>(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 200) {
        return jsonError("نام محصول معتبر نیست.", 400);
      }
      data.name = body.name.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string" || body.description.length > 5000) {
        return jsonError("توضیحات معتبر نیست.", 400);
      }
      data.description = body.description.trim();
    }
    if (body.price !== undefined) {
      const price = Math.floor(Number(body.price));
      if (!Number.isSafeInteger(price) || price <= 0 || price > 2_000_000_000) {
        return jsonError("قیمت معتبر نیست.", 400);
      }
      data.price = price;
    }
    if (body.images !== undefined) {
      const result = normalizeImageList(body.images, 10);
      if (!result.ok) return jsonError(result.message, 400);
      data.images = result.value;
    }
    if (body.submissionImages !== undefined) {
      const result = normalizeImageList(body.submissionImages, 6);
      if (!result.ok) return jsonError(result.message, 400);
      data.submissionImages = result.value;
    }
    if (body.variants !== undefined) {
      const result = normalizeVariants(body.variants);
      if (!result.ok) return jsonError(result.message, 400);
      data.variants = result.value;
    }
    if (body.category !== undefined) {
      if (typeof body.category !== "string" || body.category.trim().length > 100) {
        return jsonError("نام دسته معتبر نیست.", 400);
      }
      data.category = body.category.trim() || "عمومی";
    }
    if (body.stock !== undefined) {
      const stock = Math.floor(Number(body.stock));
      if (!Number.isSafeInteger(stock) || stock < -1_000_000 || stock > 1_000_000) {
        return jsonError("موجودی معتبر نیست.", 400);
      }
      data.stock = stock;
    }
    if (body.productionDays !== undefined) {
      const days = Math.floor(Number(toEnDigits(String(body.productionDays))));
      if (!Number.isSafeInteger(days) || days < 1 || days > 365) {
        return jsonError("مدت آماده‌سازی باید بین ۱ تا ۳۶۵ روز کاری باشد.", 400);
      }
      data.productionDays = days;
    }
    if (body.featured !== undefined) {
      if (typeof body.featured !== "boolean") {
        return jsonError("مقدار ویژه معتبر نیست.", 400);
      }
      data.featured = body.featured;
    }

    if (Object.keys(data).length === 0) {
      return jsonError("فیلدی برای به‌روزرسانی ارسال نشده است.", 400);
    }

    const product = await db.product.update({ where: { id }, data });
    return jsonOk({ product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`product-delete:${admin.id}:${ip}`, 20, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه محصول نامعتبر است.", 400);
    const deleted = await db.product.deleteMany({ where: { id } });
    if (deleted.count !== 1) return jsonError("محصول یافت نشد.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
