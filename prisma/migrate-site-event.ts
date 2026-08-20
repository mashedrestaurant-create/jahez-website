import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const envContent = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const stmts = [
  'CREATE TABLE IF NOT EXISTS "SiteEvent" ("id" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "event" TEXT NOT NULL, "page" TEXT, "meta" JSONB, "ip" TEXT, "userAgent" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SiteEvent_pkey" PRIMARY KEY ("id"))',
  'CREATE INDEX IF NOT EXISTS "SiteEvent_sessionId_idx" ON "SiteEvent"("sessionId")',
  'CREATE INDEX IF NOT EXISTS "SiteEvent_event_idx" ON "SiteEvent"("event")',
  'CREATE INDEX IF NOT EXISTS "SiteEvent_createdAt_idx" ON "SiteEvent"("createdAt")',
];

for (const stmt of stmts) {
  await prisma.$executeRawUnsafe(stmt);
}
console.log("SiteEvent table + indexes created");
await prisma.$disconnect();
