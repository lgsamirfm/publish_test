import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const paidOrders = await db.order.findMany({
      where: {
        userId: user.id,
        paymentStatus: "PAID",
        status: { not: "CANCELLED" },
      },
      select: {
        items: {
          where: { itemType: "PATTERN" },
          select: { itemId: true },
        },
      },
      take: 500,
    });

    const patternIds = Array.from(
      new Set(paidOrders.flatMap((order) => order.items.map((item) => item.itemId)))
    );
    if (patternIds.length === 0) return jsonOk({ patterns: [] });

    const patterns = await db.pattern.findMany({
      where: { id: { in: patternIds } },
      take: 500,
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
