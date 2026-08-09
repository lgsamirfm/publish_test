import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    if (!id || id.length > 128) return jsonError("شناسه الگو نامعتبر است.", 400);

    const purchased = await db.order.findFirst({
      where: {
        userId: user.id,
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
        items: { some: { itemType: "PATTERN", itemId: id } },
      },
      select: { id: true },
    });
    if (!purchased) return jsonError("شما این الگو را خریداری نکرده‌اید.", 403);

    const pattern = await db.pattern.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        images: true,
        difficulty: true,
        yarnType: true,
        needleSize: true,
        gauge: true,
        pdfUrl: true,
      },
    });
    if (!pattern) return jsonError("الگو یافت نشد.", 404);

    return jsonOk({
      pattern: {
        id: pattern.id,
        title: pattern.title,
        description: pattern.description,
        images: pattern.images,
        difficulty: pattern.difficulty,
        yarnType: pattern.yarnType,
        needleSize: pattern.needleSize,
        gauge: pattern.gauge,
        hasContent: Boolean(pattern.pdfUrl.trim()),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
