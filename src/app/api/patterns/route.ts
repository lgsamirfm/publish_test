import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

const DIFFICULTIES = ["مبتدی", "متوسط", "پیشرفته"] as const;

/* GET /api/patterns?q=&difficulty=&featured=&sort= -> { patterns } */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const difficulty = url.searchParams.get("difficulty")?.trim() || "";
    const featured = url.searchParams.get("featured");
    const sort = url.searchParams.get("sort")?.trim() || "newest";

    const where: Record<string, unknown> = {};
    if (q) where.title = { contains: q };
    if (difficulty && DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
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
        // pdfUrl intentionally excluded — security risk
      },
    });

    return jsonOk({ patterns });
  } catch (err) {
    return handleApiError(err);
  }
}

/* POST /api/patterns (ADMIN) -> { pattern } 201 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("pattern-create-" + ip, 20, 60000);
    if (!rl.success) return jsonError("درخواست بیش از حد.", 429);

    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      price,
      images,
      difficulty,
      yarnType,
      needleSize,
      gauge,
      pdfUrl,
      featured,
    } = body as Record<string, unknown>;

    if (typeof title !== "string" || !title.trim()) {
      return jsonError("عنوان الگو الزامی است.", 422);
    }
    if (title.length > 200) return jsonError("عنوان الگو بسیار طولانی است.", 422);
    const descriptionStr = typeof description === "string" ? description : "";
    if (descriptionStr.length > 5000) return jsonError("توضیحات بسیار طولانی است.", 422);
    const imagesStr = typeof images === "string" ? images : "";
    if (imagesStr.length > 2000) return jsonError("لینک تصاویر بسیار طولانی است.", 422);
    const priceNum = Math.floor(Number(price));
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return jsonError("قیمت معتبر نیست.", 422);
    }

    const diff =
      typeof difficulty === "string" && DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])
        ? difficulty
        : "متوسط";

    const pattern = await db.pattern.create({
      data: {
        title: title.trim(),
        description: descriptionStr,
        price: priceNum,
        images: imagesStr,
        difficulty: diff,
        yarnType: typeof yarnType === "string" ? yarnType.slice(0, 100) : "",
        needleSize: typeof needleSize === "string" ? needleSize.slice(0, 100) : "",
        gauge: typeof gauge === "string" ? gauge.slice(0, 200) : "",
        pdfUrl: typeof pdfUrl === "string" ? pdfUrl.slice(0, 500) : "",
        featured: Boolean(featured),
      },
    });

    return jsonOk({ pattern }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}