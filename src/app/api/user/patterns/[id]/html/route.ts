import { readFile, realpath, stat } from "fs/promises";
import { resolve, sep } from "path";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  rateLimitError,
} from "@/lib/api";
import { normalizeContentReference } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };
const MAX_CONTENT_BYTES = 5 * 1024 * 1024;

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const ip = await getClientIp();
    const limit = await rateLimit(`pattern-html:${user.id}:${ip}`, 60, 5 * 60_000);
    if (!limit.success) return rateLimitError(limit);

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
      select: { pdfUrl: true },
    });
    if (!pattern?.pdfUrl) return jsonError("فایل محتوا ثبت نشده است.", 404);

    const reference = normalizeContentReference(pattern.pdfUrl);
    if (!reference.ok) return jsonError("مسیر فایل محتوا نامعتبر است.", 500);

    const dataRoot = resolve(process.cwd(), "data");
    const candidate = resolve(dataRoot, reference.value);
    if (!candidate.startsWith(`${dataRoot}${sep}`)) {
      return jsonError("مسیر فایل محتوا نامعتبر است.", 500);
    }

    const [canonicalRoot, canonicalFile] = await Promise.all([
      realpath(dataRoot),
      realpath(candidate),
    ]);
    if (!canonicalFile.startsWith(`${canonicalRoot}${sep}`)) {
      return jsonError("مسیر فایل محتوا نامعتبر است.", 500);
    }

    const fileStat = await stat(canonicalFile);
    if (!fileStat.isFile() || fileStat.size > MAX_CONTENT_BYTES) {
      return jsonError("فایل محتوا معتبر نیست.", 413);
    }

    const html = await readFile(canonicalFile, "utf8");
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": "inline; filename=pattern.html",
        "Cache-Control": "private, no-store",
        "Content-Security-Policy":
          "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'; sandbox",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return jsonError("فایل محتوا یافت نشد.", 404);
    }
    return handleApiError(error);
  }
}
