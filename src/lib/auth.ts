import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";

const SESSION_COOKIE = "baf_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// In production, AUTH_SECRET MUST be set. The fallback is only for local development.
// We use a getter so the error is thrown at runtime (when auth is used), not at
// module-import time (which would break `next build`).
const DEV_SECRET = "bafkhaneh-dev-secret-change-me-please-9876543210";

function getSecret(): string {
  const envSecret =
    process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (envSecret) return envSecret;
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  throw new Error(
    "AUTH_SECRET environment variable is required in production. Set it to a random 32+ character string."
  );
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
};

/* ---------- Password hashing (Node scrypt) ---------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

/* ---------- Session token (HMAC-signed) ---------- */

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString("base64url");
}

function sign(payload: Record<string, unknown>) {
  const body = b64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const sig = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token: string): Record<string, unknown> | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(body).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- Cookie helpers ---------- */

export async function createSession(userId: string, role: string) {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const token = sign({ uid: userId, role, exp });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.uid as string },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) return null;
  return user as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    const err = new Error("UNAUTHORIZED");
    (err as unknown as { status: number }).status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const err = new Error("FORBIDDEN");
    (err as unknown as { status: number }).status = 403;
    throw err;
  }
  return user;
}

/* ---------- Payment gateway signature ---------- */

/**
 * Signs a payment result so the verify endpoint can trust it.
 * The simulated gateway generates this signature server-side;
 * an external attacker cannot forge it without knowing the SECRET.
 */
export function signPaymentResult(
  transactionId: string,
  orderId: string,
  success: boolean
): string {
  const payload = `${transactionId}:${orderId}:${success ? "1" : "0"}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

/**
 * Verifies a payment result signature. Returns true if valid.
 */
export function verifyPaymentSignature(
  transactionId: string,
  orderId: string,
  success: boolean,
  signature: string
): boolean {
  const expected = signPaymentResult(transactionId, orderId, success);
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
