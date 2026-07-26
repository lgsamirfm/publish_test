import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { jsonOk, jsonError, handleApiError, getClientIp } from "@/lib/api";

const DIFFICULTIES = ["مبتدی", "متوسط", "پیشرفته"] as const;

type Params = Promise<{ id: string }>;

/* GET /api/patterns/[id] -> { pattern } | 404 */
export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const pattern = await db.pattern.findUnique({
      where: { id },
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
    if (!pattern) return jsonError("الگو یافت نشد.", 404);
    return jsonOk({ pattern });
  } catch (err) {
    return handleApiError(err);
  }
}

/* PUT /api/patterns/[id] (ADMIN) -> { pattern } */
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("pattern-update-" + ip, 30, 60000);
    if (!rl.success) return jsonError("درخواست بیش از حد.", 429);

    const { id } = await params;
    const existing = await db.pattern.findUnique({ where: { id } });
    if (!existing) return jsonError("الگو یافت نشد.", 404);

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

    if (typeof title === "string" && !title.trim()) {
      return jsonError("عنوان الگو نمی‌تواند خالی باشد.", 422);
    }

    const data: Record<string, unknown> = {};
    if (typeof title === "string") data.title = title.trim();
    if (typeof description === "string") data.description = description;
    if (typeof images === "string") data.images = images;
    if (typeof yarnType === "string") data.yarnType = yarnType;
    if (typeof needleSize === "string") data.needleSize = needleSize;
    if (typeof gauge === "string") data.gauge = gauge;
    if (typeof pdfUrl === "string") data.pdfUrl = pdfUrl;
    if (typeof featured === "boolean") data.featured = featured;
    if (typeof difficulty === "string" && DIFFICULTIES.includes(difficulty as (typeof DIFFICULTIES)[number])) {
      data.difficulty = difficulty;
    }
    if (price !== undefined) {
      const priceNum = Math.floor(Number(price));
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return jsonError("قیمت معتبر نیست.", 422);
      }
      data.price = priceNum;
    }

    const pattern = await db.pattern.update({ where: { id }, data });
    return jsonOk({ pattern });
  } catch (err) {
    return handleApiError(err);
  }
}

/* DELETE /api/patterns/[id] (ADMIN) -> { ok: true } */
export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    await requireAdmin();

    const ip = await getClientIp();
    const rl = await rateLimit("pattern-delete-" + ip, 30, 60000);
    if (!rl.success) return jsonError("درخواست بیش از حد.", 429);

    const { id } = await params;
    const existing = await db.pattern.findUnique({ where: { id } });
    if (!existing) return jsonError("الگو یافت نشد.", 404);

    await db.pattern.delete({ where: { id } });
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}