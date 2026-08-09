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
type Params = Promise<{ id: string }>;

function validId(id: string) {
  return Boolean(id && id.length <= 128);
}

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه الگو نامعتبر است.", 400);
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
      },
    });
    if (!pattern) return jsonError("الگو یافت نشد.", 404);
    return jsonOk({ pattern });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`pattern-update:${admin.id}:${ip}`, 40, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه الگو نامعتبر است.", 400);
    if (!(await db.pattern.findUnique({ where: { id }, select: { id: true } }))) {
      return jsonError("الگو یافت نشد.", 404);
    }

    const parsed = await readJsonBody<Record<string, unknown>>(req, 24 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 200) {
        return jsonError("عنوان الگو معتبر نیست.", 422);
      }
      data.title = body.title.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string" || body.description.length > 5000) {
        return jsonError("توضیحات معتبر نیست.", 422);
      }
      data.description = body.description;
    }
    if (body.images !== undefined) {
      const result = normalizeImageList(body.images, 10);
      if (!result.ok) return jsonError(result.message, 422);
      data.images = result.value;
    }
    if (body.pdfUrl !== undefined) {
      const result = normalizeContentReference(body.pdfUrl);
      if (!result.ok) return jsonError(result.message, 422);
      data.pdfUrl = result.value;
    }
    for (const [field, max] of [
      ["yarnType", 100],
      ["needleSize", 100],
      ["gauge", 200],
    ] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string" || body[field].length > max) {
          return jsonError("مشخصات الگو معتبر نیست.", 422);
        }
        data[field] = body[field].trim();
      }
    }
    if (body.difficulty !== undefined) {
      if (
        typeof body.difficulty !== "string" ||
        !DIFFICULTIES.includes(body.difficulty as (typeof DIFFICULTIES)[number])
      ) {
        return jsonError("سطح دشواری معتبر نیست.", 422);
      }
      data.difficulty = body.difficulty;
    }
    if (body.price !== undefined) {
      const price = Math.floor(Number(body.price));
      if (!Number.isSafeInteger(price) || price < 0 || price > 2_000_000_000) {
        return jsonError("قیمت معتبر نیست.", 422);
      }
      data.price = price;
    }
    if (body.featured !== undefined) {
      if (typeof body.featured !== "boolean") return jsonError("مقدار ویژه معتبر نیست.", 422);
      data.featured = body.featured;
    }
    if (Object.keys(data).length === 0) {
      return jsonError("فیلدی برای به‌روزرسانی ارسال نشده است.", 400);
    }

    const pattern = await db.pattern.update({ where: { id }, data });
    return jsonOk({ pattern });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Params }) {
  try {
    const admin = await requireAdmin();
    const ip = await getClientIp();
    const limit = await rateLimit(`pattern-delete:${admin.id}:${ip}`, 20, 60 * 60_000);
    if (!limit.success) return rateLimitError(limit);

    const { id } = await params;
    if (!validId(id)) return jsonError("شناسه الگو نامعتبر است.", 400);
    const deleted = await db.pattern.deleteMany({ where: { id } });
    if (deleted.count !== 1) return jsonError("الگو یافت نشد.", 404);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
