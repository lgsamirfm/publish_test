import { db } from "@/lib/db";

/**
 * Returns the IDs of patterns a user has purchased.
 * Mirrors the definition used by /api/user/purchased-patterns:
 * a pattern counts as owned only when it appears in a PAID order.
 */
export async function getOwnedPatternIds(userId: string): Promise<string[]> {
  const paidOrders = await db.order.findMany({
    where: {
      userId,
      paymentStatus: "PAID",
      status: { not: "CANCELLED" },
    },
    select: {
      items: {
        select: { itemType: true, itemId: true },
      },
    },
  });

  const ids = new Set<string>();
  for (const order of paidOrders) {
    for (const item of order.items) {
      if (item.itemType === "PATTERN") ids.add(item.itemId);
    }
  }
  return Array.from(ids);
}