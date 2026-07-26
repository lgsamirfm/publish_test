import { destroySession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

// POST /api/auth/logout — clears the session cookie.
export async function POST() {
  try {
    await destroySession();
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
