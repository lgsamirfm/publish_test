import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/user/patterns/[id]/content
 * Returns pattern details for the viewer modal.
 * Only accessible if the user has purchased this pattern in a PAID order.
 * Returns hasContent boolean (whether an HTML file exists), but never exposes the URL.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify the user has purchased this pattern in a paid order
    const paidOrders = await db.order.findMany({
      where: {
        userId: user.id,
        paymentStatus: "PAID",
        items: {
          some: {
            itemType: "PATTERN",
            itemId: id,
          },
        },
      },
    });

    if (paidOrders.length === 0) {
      return jsonError("شما این الگو را خریداری نکرده‌اید.", 403);
    }

    // Fetch pattern details — pdfUrl is selected but NOT returned to client
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

    if (!pattern) {
      return jsonError("الگو یافت نشد.", 404);
    }

    // Return pattern data WITHOUT pdfUrl — only hasContent boolean
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
        hasContent: !!pattern.pdfUrl && pattern.pdfUrl.trim().length > 0,
      },
    });
  } catch (err) {
    return jsonError("خطا در دریافت محتوای الگو.", 500);
  }
}