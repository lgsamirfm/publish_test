import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  jsonOk,
  jsonError,
  handleApiError,
  getClientIp,
  rateLimitError,
  readJsonBody,
} from "@/lib/api";
import { normalizeIranianPhone, isValidIranianPhone } from "@/lib/format";

export async function POST(req: NextRequest) {
  try {
    const ip = await getClientIp();
    const ipLimit = await rateLimit(`signup:ip:${ip}`, 5, 60 * 60_000);
    if (!ipLimit.success) {
      return rateLimitError(ipLimit, "تلاش‌های بیش از حد. بعداً تلاش کنید.");
    }

    const parsed = await readJsonBody<Record<string, unknown>>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;

    const name = String(parsed.data?.name ?? "").trim();
    const phone = normalizeIranianPhone(String(parsed.data?.phone ?? "").trim());
    const password = String(parsed.data?.password ?? "");

    if (!name) return jsonError("نام را وارد کنید.", 422);
    if (name.length > 100) return jsonError("نام بسیار طولانی است.", 422);
    if (!isValidIranianPhone(phone)) {
      return jsonError("شماره موبایل وارد شده معتبر نیست.", 422);
    }
    if (password.length < 12) {
      return jsonError("گذرواژه باید حداقل ۱۲ نویسه باشد.", 422);
    }
    if (password.length > 128) {
      return jsonError("گذرواژه نباید بیشتر از ۱۲۸ نویسه باشد.", 422);
    }

    const phoneLimit = await rateLimit(`signup:phone:${phone}`, 3, 24 * 60 * 60_000);
    if (!phoneLimit.success) return rateLimitError(phoneLimit);

    const existing = await db.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existing) {
      return jsonError(
        "حسابی با این شماره موبایل قبلاً ثبت شده است. اگر حساب دارید، وارد شوید.",
        409
      );
    }

    const passwordHash = await hashPassword(password);
    let user;
    try {
      user = await db.user.create({
        data: {
          name,
          phone,
          email: "",
          password: passwordHash,
          role: "CUSTOMER",
        },
        select: { id: true, name: true, phone: true, email: true, role: true },
      });
    } catch (error) {
      if ((error as { code?: string })?.code === "P2002") {
        return jsonError("حسابی با این شماره موبایل قبلاً ثبت شده است.", 409);
      }
      throw error;
    }

    await createSession(user.id);
    return jsonOk({ user }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
