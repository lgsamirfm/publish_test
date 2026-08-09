import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";

const SESSION_COOKIE = "baf_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const DEV_SECRET = "bafkhaneh-dev-secret-change-me-please-9876543210";
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (secret) {
    if (process.env.NODE_ENV === "production" && secret.length < 32) {
      throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
    }
    return secret;
  }
  if (process.env.NODE_ENV !== "production") return DEV_SECRET;
  throw new Error("AUTH_SECRET is required in production.");
}

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "ADMIN" | "CUSTOMER";
};

/* ---------- Password hashing (Node scrypt) ---------- */

function derivePassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await derivePassword(password, salt);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hashHex, ...extra] = stored.split(":");
  if (
    extra.length > 0 ||
    !/^[a-f0-9]{32}$/i.test(salt || "") ||
    !/^[a-f0-9]{128}$/i.test(hashHex || "")
  ) {
    return false;
  }

  const expected = Buffer.from(hashHex, "hex");
  const actual = await derivePassword(password, salt);
  return (
    expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  );
}

/* ---------- Session token (HMAC-signed and password-revocable) ---------- */

function b64url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function safeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function currentSessionVersion(userId: string, passwordHash: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`session:${userId}:${passwordHash}`)
    .digest("base64url");
}

function sign(payload: Record<string, unknown>) {
  const body = b64url(JSON.stringify({ ...payload, iat: Date.now() }));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verify(token: string): Record<string, unknown> | null {
  if (token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  if (
    !body ||
    !signature ||
    body.length > 2048 ||
    !/^[A-Za-z0-9_-]+$/.test(body) ||
    !/^[A-Za-z0-9_-]{43}$/.test(signature)
  ) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");
  if (!safeEqualText(signature, expected)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as Record<string, unknown>;
    if (
      typeof payload.uid !== "string" ||
      payload.uid.length > 128 ||
      typeof payload.exp !== "number" ||
      typeof payload.iat !== "number" ||
      typeof payload.sv !== "string" ||
      Date.now() >= payload.exp ||
      payload.exp - payload.iat > (SESSION_MAX_AGE + 60) * 1000 ||
      payload.iat > Date.now() + 60_000
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw new Error("UNAUTHORIZED");

  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const token = sign({
    uid: userId,
    exp,
    sv: currentSessionVersion(userId, user.password),
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    priority: "high",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.uid as string },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      password: true,
    },
  });
  if (!user) return null;

  const expectedVersion = currentSessionVersion(user.id, user.password);
  if (!safeEqualText(payload.sv as string, expectedVersion)) return null;

  const { password: _password, ...sessionUser } = user;
  return sessionUser as SessionUser;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    const error = new Error("UNAUTHORIZED");
    (error as Error & { status: number }).status = 401;
    throw error;
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const error = new Error("FORBIDDEN");
    (error as Error & { status: number }).status = 403;
    throw error;
  }
  return user;
}

/* ---------- One-time password reset codes ---------- */

export function generateResetCode(): string {
  return crypto.randomInt(100_000, 1_000_000).toString();
}

export function hashResetCode(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`password-reset:${phone}:${code}`)
    .digest("base64url");
}

export function verifyResetCode(
  phone: string,
  code: string,
  storedHash: string
): boolean {
  return safeEqualText(hashResetCode(phone, code), storedHash);
}

/* ---------- Development-only simulated payment signature ---------- */

export function signPaymentResult(
  transactionId: string,
  orderId: string,
  success: boolean
): string {
  const payload = `${transactionId}:${orderId}:${success ? "1" : "0"}`;
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function verifyPaymentSignature(
  transactionId: string,
  orderId: string,
  success: boolean,
  signature: string
): boolean {
  const expected = signPaymentResult(transactionId, orderId, success);
  return safeEqualText(signature, expected);
}
