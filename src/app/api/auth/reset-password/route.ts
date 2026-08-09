import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyResetCode } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import {
  normalizeIranianPhone,
  isValidIranianPhone,
  toEnDigits,
} from "@/lib/format";

const INVALID_CODE_MESSAGE = "کد تأیید نامعتبر است یا مهلت آن به پایان رسیده است.";

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIp();
    const ipLimit = await rateLimit(`reset-password:ip:${ip}`, 10, 15 * 60_000);
    if (!ipLimit.success) return rateLimitError(ipLimit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;

    const phone = normalizeIranianPhone(String(parsed.data?.phone ?? ""));
    const code = toEnDigits(String(parsed.data?.code ?? "").trim());
    const password = parsed.data?.password;

    if (!isValidIranianPhone(phone)) {
      return jsonError("شماره موبایل وارد شده معتبر نیست.", 400);
    }
    if (!/^\d{6}$/.test(code)) {
      return jsonError(INVALID_CODE_MESSAGE, 400);
    }
    if (typeof password !== "string" || password.length < 12) {
      return jsonError("گذرواژه جدید باید حداقل ۱۲ نویسه باشد.", 400);
    }
    if (password.length > 128) {
      return jsonError("گذرواژه جدید خیلی طولانی است.", 400);
    }

    const accountLimit = await rateLimit(
      `reset-password:phone:${phone}`,
      5,
      15 * 60_000
    );
    if (!accountLimit.success) return rateLimitError(accountLimit);

    const user = await db.user.findUnique({
      where: { phone },
      select: { id: true, phone: true, resetToken: true, resetTokenExpiry: true },
    });

    const now = new Date();
    if (
      !user?.resetToken ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry <= now ||
      !verifyResetCode(phone, code, user.resetToken)
    ) {
      return jsonError(INVALID_CODE_MESSAGE, 400);
    }

    const passwordHash = await hashPassword(password);
    const updated = await db.user.updateMany({
      where: {
        id: user.id,
        resetToken: user.resetToken,
        resetTokenExpiry: { gt: now },
      },
      data: {
        password: passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    if (updated.count !== 1) return jsonError(INVALID_CODE_MESSAGE, 400);

    return jsonOk({
      ok: true,
      message: "گذرواژه با موفقیت تغییر یافت. اکنون می‌توانید وارد شوید.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
