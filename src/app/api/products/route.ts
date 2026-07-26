import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

/* ---------- GET /api/products ---------- */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim() || "";
    const category = sp.get("category");
    const featured = sp.get("featured");
    const sort = sp.get("sort") || "newest";

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

    const products = (await db.product.findMany({
      where,
      orderBy,
    })) as Product[];

    return jsonOk({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

/* ---------- POST /api/products (admin) ---------- */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("product-create-" + ip, 20, 60_000);
    if (!rl.success) {
      return jsonError("درخواست بیش از حد. بعداً تلاش کنید.", 429);
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const description = String(body.description ?? "").trim();
    const price = Math.floor(Number(body.price));
    const images = String(body.images ?? "").trim();
    const category = String(body.category ?? "عمومی").trim() || "عمومی";
    const stock = Math.max(0, Math.floor(Number(body.stock ?? 0)));
    const featured = Boolean(body.featured);
    // variants: array of {name, color?} -> store as JSON string.
    let variantsJson = "[]";
    try {
      const v = Array.isArray(body.variants) ? body.variants : [];
      const cleaned = v
        .map((x: { name?: unknown; color?: unknown }) => ({
          name: String(x?.name ?? "").trim(),
          color: x?.color ? String(x.color) : undefined,
        }))
        .filter((x: { name: string }) => x.name);
      variantsJson = JSON.stringify(cleaned);
    } catch {
      variantsJson = "[]";
    }

    if (!name) return jsonError("نام محصول الزامی است.", 400);
    if (name.length > 200) return jsonError("نام محصول بسیار طولانی است.", 400);
    if (description.length > 5000) return jsonError("توضیحات بسیار طولانی است.", 400);
    if (images.length > 2000) return jsonError("لینک تصاویر بسیار طولانی است.", 400);
    if (category.length > 100) return jsonError("نام دسته بسیار طولانی است.", 400);
    if (!Number.isFinite(price) || price <= 0) {
      return jsonError("قیمت معتبر نیست.", 400);
    }

    const product = (await db.product.create({
      data: {
        name,
        description,
        price,
        images,
        variants: variantsJson,
        category,
        stock,
        featured,
      },
    })) as Product;

    return jsonOk({ product }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
