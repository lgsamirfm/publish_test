import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";

/**
 * GET /api/user/purchased-patterns
 * Returns patterns the authenticated user has purchased (paid orders only).
 * Does NOT include pdfUrl — that is only available via the content endpoint.
 */
export async function GET() {
  try {
    const user = await requireUser();

    // Find all PAID order items of type PATTERN for this user
    const paidOrders = await db.order.findMany({
      where: {
        userId: user.id,
        paymentStatus: "PAID",
      },
      include: { items: true },
    });

    // Collect unique pattern IDs from paid order items
    const patternIds = new Set<string>();
    for (const order of paidOrders) {
      for (const item of order.items) {
        if (item.itemType === "PATTERN") {
          patternIds.add(item.itemId);
        }
      }
    }

    if (patternIds.size === 0) {
      return jsonOk({ patterns: [] });
    }

    // Fetch pattern details (without pdfUrl)
    const patterns = await db.pattern.findMany({
      where: { id: { in: Array.from(patternIds) } },
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
        // pdfUrl intentionally excluded — only accessible via content endpoint
      },
    });

    return jsonOk({ patterns });
  } catch (err) {
    return jsonError("خطا در دریافت الگوهای خریداری شده.", 500);
  }
}