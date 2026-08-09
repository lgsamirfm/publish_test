import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "file:./prisma/build-only.db";
  }
  if (process.env.NODE_ENV !== "production") return "file:./prisma/dev.db";
  throw new Error("DATABASE_URL is required in production.");
}

const adapter = new PrismaLibSQL({
  url: databaseUrl(),
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
