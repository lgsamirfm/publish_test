import { getSession } from "@/lib/auth";
import { jsonOk, handleApiError } from "@/lib/api";

// GET /api/auth/me — returns the current session user (or null).
export async function GET() {
  try {
    const user = await getSession();
    return jsonOk({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
