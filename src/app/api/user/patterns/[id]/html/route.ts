import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api";
import { readFile } from "fs/promises";
import { join } from "path";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/user/patterns/[id]/html
 * Serves the HTML content file for in-page viewing only (not downloadable).
 * Only accessible if the user has purchased this pattern in a PAID order.
 * The real file URL (pdfUrl) is never exposed to the client.
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

    // Get the pattern's pdfUrl (which now points to an HTML file)
    const pattern = await db.pattern.findUnique({
      where: { id },
      select: { pdfUrl: true },
    });

    if (!pattern || !pattern.pdfUrl) {
      return jsonError("فایل محتوا برای این الگو ثبت نشده است.", 404);
    }

    // Resolve the HTML file path (stored outside public/ to prevent direct access)
    const contentUrl = pattern.pdfUrl.trim();
    const relativePath = contentUrl.startsWith("/")
      ? contentUrl.slice(1)
      : contentUrl.replace(/^\.\//, "");
    // Prevent path traversal — strip any ../ sequences
    const safePath = relativePath.replace(/\.\.\//g, "");
    const filePath = join(process.cwd(), "data", safePath);

    // Read and serve the HTML file
    const htmlContent = await readFile(filePath, "utf-8");

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (err) {
    console.error("[HTML Route] Error serving content:", err);
    return jsonError("خطا در دریافت فایل محتوا.", 500);
  }
}