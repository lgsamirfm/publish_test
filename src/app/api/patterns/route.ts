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
import { normalizeContentReference, normalizeImageList } from "@/lib/validation";

const DIFFICULTIES = ["مبتدی", "متوسط", "پیشرفته"] as const;

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams;
    const q = search.get("q")?.trim() || "";
    const difficulty = search.get("difficulty")?.trim() || "";
    const featured = search.get("featured");
    const sort = search.get("sort")?.trim() || "newest";
    if (q.length > 100) return jsonError("عبارت جست‌وجو بسیار طولانی است.", 400);

    const where: Record<string, unknown> = {};
    if (q) where.title = { contains: q };
    if (DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
      where.difficulty = difficulty;
    }
    if (featured === "true") where.featured = true;

    const orderBy: Record<string, "asc" | "desc"> =
      sort === "price-asc"
        ? { price: "asc" }
        : sort === "price-desc"
          ? { price: "desc" }
          : { createdAt: "desc" };

    const patterns = await db.pattern.findMany({
      where,
      orderBy,
      take: 200,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        images: true,
        difficulty: true,
        yarnType: true,
        needleSize: true,
        gauge: true,
        featured: true,
        createdAt: true,
      },
    });
    return jsonOk({ patterns });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`pattern-create:${admin.id}:${ip}`, 20, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 24 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description : "";
    const price = Math.floor(Number(body.price));
    const images = normalizeImageList(body.images, 10);
    if (!images.ok) return jsonError(images.message, 422);
    const content = normalizeContentReference(body.pdfUrl);
    if (!content.ok) return jsonError(content.message, 422);

    if (!title || title.length > 200) return jsonError("عنوان الگو معتبر نیست.", 422);
    if (description.length > 5000) return jsonError("توضیحات بسیار طولانی است.", 422);
    if (!Number.isSafeInteger(price) || price < 0 || price > 2_000_000_000) {
      return jsonError("قیمت معتبر نیست.", 422);
    }

    const difficulty =
      typeof body.difficulty === "string" &&
      DIFFICULTIES.includes(body.difficulty as (typeof DIFFICULTIES)[number])
        ? body.difficulty
        : "متوسط";
    const yarnType = typeof body.yarnType === "string" ? body.yarnType.trim() : "";
    const needleSize =
      typeof body.needleSize === "string" ? body.needleSize.trim() : "";
    const gauge = typeof body.gauge === "string" ? body.gauge.trim() : "";
    if (yarnType.length > 100 || needleSize.length > 100 || gauge.length > 200) {
      return jsonError("مشخصات الگو بسیار طولانی است.", 422);
    }

    const pattern = await db.pattern.create({
      data: {
        title,
        description,
        price,
        images: images.value,
        difficulty,
        yarnType,
        needleSize,
        gauge,
        pdfUrl: content.value,
        featured: body.featured === true,
      },
    });
    return jsonOk({ pattern }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
