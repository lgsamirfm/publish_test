const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Sends an SMS through a small provider-agnostic webhook owned by the operator.
 * Expected request: POST { to, message }, optional Bearer token.
 * Expected response: any 2xx status.
 */
export async function sendPasswordResetCode(
  phone: string,
  code: string
): Promise<boolean> {
  const endpoint = process.env.SMS_WEBHOOK_URL;
  if (!endpoint) return false;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    console.error("[sms] SMS_WEBHOOK_URL is invalid");
    return false;
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    console.error("[sms] SMS_WEBHOOK_URL must use HTTPS in production");
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const token = process.env.SMS_WEBHOOK_TOKEN;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        to: phone,
        message: `کد بازیابی رمز عبور بافخانه: ${code}\nاعتبار: ۲ دقیقه`,
      }),
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[sms] Webhook returned HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[sms] Password reset message failed", error);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
