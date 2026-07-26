import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    return jsonOk({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
