import crypto from "node:crypto";
import { createClient } from "@libsql/client";

const errors = [];
const warnings = [];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} is required`);
  return value;
}

const appUrl = required("APP_URL");
if (appUrl) {
  try {
    const parsed = new URL(appUrl);
    if (parsed.protocol !== "https:") errors.push("APP_URL must use HTTPS");
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
      errors.push("APP_URL must be an origin only, for example https://shop.example.com");
    }
  } catch {
    errors.push("APP_URL must be a valid URL");
  }
}

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  errors.push("AUTH_SECRET must be a random value containing at least 32 characters");
}
if (authSecret?.includes("change-me") || authSecret?.includes("dev-secret")) {
  errors.push("AUTH_SECRET appears to be a placeholder");
}

const databaseUrl = required("DATABASE_URL");
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.protocol === "file:") {
      if (!parsed.pathname.startsWith("/") || databaseUrl.startsWith("file:./")) {
        errors.push("A file DATABASE_URL must use an absolute persistent-volume path");
      }
    } else if (!["libsql:", "https:", "wss:"].includes(parsed.protocol)) {
      errors.push("DATABASE_URL must use file:, libsql:, https:, or wss:");
    } else if (!process.env.DATABASE_AUTH_TOKEN) {
      errors.push("DATABASE_AUTH_TOKEN is required for a remote libSQL database");
    }
  } catch {
    errors.push("DATABASE_URL must be a valid file or libSQL URL");
  }
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
if (Boolean(redisUrl) !== Boolean(redisToken)) {
  errors.push("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together");
} else if (!redisUrl && process.env.RATE_LIMIT_ALLOW_MEMORY !== "true") {
  errors.push(
    "Distributed rate limiting is required: configure Upstash, or explicitly set RATE_LIMIT_ALLOW_MEMORY=true for one persistent application instance"
  );
} else if (redisUrl) {
  try {
    if (new URL(redisUrl).protocol !== "https:") {
      errors.push("UPSTASH_REDIS_REST_URL must use HTTPS");
    }
  } catch {
    errors.push("UPSTASH_REDIS_REST_URL must be a valid URL");
  }
}
if (process.env.RATE_LIMIT_ALLOW_MEMORY === "true") {
  warnings.push("Memory rate limiting is enabled; this is safe only for exactly one persistent instance");
}

const smsUrl = process.env.SMS_WEBHOOK_URL?.trim();
if (!smsUrl) {
  errors.push("SMS_WEBHOOK_URL is required for a working password-reset flow");
} else {
  try {
    if (new URL(smsUrl).protocol !== "https:") errors.push("SMS_WEBHOOK_URL must use HTTPS");
  } catch {
    errors.push("SMS_WEBHOOK_URL must be a valid URL");
  }
}
if (!process.env.SMS_WEBHOOK_TOKEN || process.env.SMS_WEBHOOK_TOKEN.length < 20) {
  errors.push("SMS_WEBHOOK_TOKEN must contain at least 20 characters");
}

if (process.env.ENABLE_SIMULATED_PAYMENTS === "true") {
  warnings.push("ENABLE_SIMULATED_PAYMENTS is ignored in production");
}
warnings.push("Online payments are fail-closed until a real PSP callback integration is implemented; COD remains available");

function matchesLegacyPassword(password, stored) {
  const [salt, expectedHex] = String(stored || "").split(":");
  if (!/^[a-f0-9]{32}$/i.test(salt || "") || !/^[a-f0-9]{128}$/i.test(expectedHex || "")) {
    return false;
  }
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

if (
  databaseUrl &&
  !errors.some((error) => /DATABASE_URL|DATABASE_AUTH_TOKEN|database/i.test(error))
) {
  const client = createClient({
    url: databaseUrl,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  try {
    const result = await client.execute({
      sql: 'SELECT "phone", "password" FROM "User" WHERE "phone" IN (?, ?)',
      args: ["09120000000", "09121234567"],
    });
    for (const row of result.rows) {
      const phone = String(row.phone);
      const legacyPassword = phone === "09120000000" ? "admin123" : "test123";
      if (matchesLegacyPassword(legacyPassword, row.password)) {
        errors.push(`Legacy seeded account ${phone} still has its publicly known password`);
      }
    }
  } catch (error) {
    errors.push(
      `Production database safety check failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
  } finally {
    client.close();
  }
}

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error(`Production configuration failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log("Production security configuration passed.");
