import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateResetCode, hashResetCode } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  getClientIp,
  handleApiError,
  jsonError,
  jsonOk,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";
import { sendPasswordResetCode } from "@/lib/sms";

const GENERIC_RESPONSE = {
  ok: true,
  message: "اگر این شماره در سیستم ثبت شده باشد، کد بازیابی ارسال می‌شود.",
  expiresInSeconds: 120,
};

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIp();
    const ipLimit = await rateLimit(`forgot-password:ip:${ip}`, 10, 15 * 60_000);
    if (!ipLimit.success) return rateLimitError(ipLimit);

    const parsed = await readJsonBody<Record<string, unknown>>(req, 4 * 1024);
    if (!parsed.ok) return parsed.response;

    const phone = normalizeIranianPhone(String(parsed.data?.phone ?? ""));
    if (!isValidIranianPhone(phone)) {
      return jsonError("شماره موبایل وارد شده معتبر نیست.", 400);
    }

    const phoneLimit = await rateLimit(
      `forgot-password:phone:${phone}`,
      3,
      15 * 60_000
    );
    if (!phoneLimit.success) return rateLimitError(phoneLimit);

    const user = await db.user.findUnique({
      where: { phone },
      select: { id: true, phone: true },
    });

    if (!user) {
      // Reduce the obvious timing difference without making the endpoint costly.
      await new Promise((resolve) => setTimeout(resolve, 150));
      return jsonOk(GENERIC_RESPONSE);
    }

    const code = generateResetCode();
    const exposeInDevelopment =
      process.env.NODE_ENV !== "production" &&
      process.env.DEV_EXPOSE_RESET_CODE === "true";
    const sent = await sendPasswordResetCode(user.phone, code);

    if (sent || exposeInDevelopment) {
      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: hashResetCode(user.phone, code),
          resetTokenExpiry: new Date(Date.now() + 2 * 60_000),
        },
      });
    } else {
      // Never leave an undelivered code usable.
      await db.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null },
      });
    }

    return jsonOk({
      ...GENERIC_RESPONSE,
      ...(exposeInDevelopment ? { code } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
