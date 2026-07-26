import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [products, patterns, orders, users, recentOrdersRaw, lowStockRaw] =
      await Promise.all([
        db.product.count(),
        db.pattern.count(),
        db.order.count(),
        db.user.count(),
        db.order.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            items: true,
          },
        }),
        db.product.findMany({
          where: { stock: { lte: 5 } },
          orderBy: { stock: "asc" },
          take: 10,
        }),
      ]);

    // Revenue: sum of all orders total
    const revenueAgg = await db.order.aggregate({
      _sum: { total: true },
    });
    const revenue = revenueAgg._sum.total ?? 0;

    // Orders by status
    const statusGroups = await db.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const ordersByStatus: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const g of statusGroups) {
      ordersByStatus[g.status] = g._count._all;
    }

    // Orders last 7 days (group in JS)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const recentOrders7d = await db.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    });

    const dayMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of recentOrders7d) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
    }
    const ordersLast7Days = Array.from(dayMap.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse(); // oldest first for chart

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      user: o.user,
      itemsCount: o.items.reduce((n, i) => n + i.quantity, 0),
    }));

    return jsonOk({
      counts: {
        products,
        patterns,
        orders,
        users,
      },
      revenue,
      recentOrders,
      lowStock: lowStockRaw,
      ordersByStatus,
      ordersLast7Days,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
