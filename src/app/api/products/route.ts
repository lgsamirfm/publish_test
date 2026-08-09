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

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const q = search.get("q")?.trim() || "";
    const category = search.get("category")?.trim() || "";
    const featured = search.get("featured");
    const sort = search.get("sort") || "newest";

    if (q.length > 100 || category.length > 100) {
      return jsonError("پارامتر جست‌وجو بسیار طولانی است.", 400);
    }

    const where: {
      name?: { contains: string };
      category?: string;
      featured?: boolean;
    } = {};
    if (q) where.name = { contains: q };
    if (category && category !== "all") where.category = category;
    if (featured === "true") where.featured = true;

    const orderBy =
      sort === "price-asc"
        ? { price: "asc" as const }
        : sort === "price-desc"
          ? { price: "desc" as const }
          : { createdAt: "desc" as const };

    const products = await db.product.findMany({ where, orderBy, take: 200 });
    return jsonOk({ products });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`product-create:${admin.id}:${ip}`, 20, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() || "عمومی" : "عمومی";
    const price = Math.floor(Number(body.price));
    const stock = Math.floor(Number(body.stock ?? 0));
    const images = normalizeImageList(body.images, 10);
    if (!images.ok) return jsonError(images.message, 400);
    const submissionImages = normalizeImageList(body.submissionImages, 6);
    if (!submissionImages.ok) return jsonError(submissionImages.message, 400);
    const variants = normalizeVariants(body.variants);
    if (!variants.ok) return jsonError(variants.message, 400);

    let productionDays = 7;
    if (body.productionDays !== undefined && String(body.productionDays).trim()) {
      productionDays = Math.floor(Number(toEnDigits(String(body.productionDays))));
    }

    if (!name) return jsonError("نام محصول الزامی است.", 400);
    if (name.length > 200) return jsonError("نام محصول بسیار طولانی است.", 400);
    if (description.length > 5000) return jsonError("توضیحات بسیار طولانی است.", 400);
    if (category.length > 100) return jsonError("نام دسته بسیار طولانی است.", 400);
    if (!Number.isSafeInteger(price) || price <= 0 || price > 2_000_000_000) {
      return jsonError("قیمت معتبر نیست.", 400);
    }
    if (!Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000) {
      return jsonError("موجودی معتبر نیست.", 400);
    }
    if (!Number.isSafeInteger(productionDays) || productionDays < 1 || productionDays > 365) {
      return jsonError("مدت آماده‌سازی باید بین ۱ تا ۳۶۵ روز کاری باشد.", 400);
    }

    const product = await db.product.create({
      data: {
        name,
        description,
        price,
        images: images.value,
        submissionImages: submissionImages.value,
        variants: variants.value,
        category,
        stock,
        productionDays,
        featured: body.featured === true,
      },
    });
    return jsonOk({ product }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
