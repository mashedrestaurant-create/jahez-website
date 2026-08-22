import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envContent = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch {}

const prisma = new PrismaClient({ adapter: new PrismaNeonHttp(process.env.DATABASE_URL!) });

await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "MediaFile" ("id" TEXT NOT NULL, "mime" TEXT NOT NULL DEFAULT 'image/webp', "width" INTEGER, "height" INTEGER, "sizeBytes" INTEGER NOT NULL DEFAULT 0, "originalName" TEXT, "data" BYTEA NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id"))`);
console.log("✓ MediaFile table");

await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "BackupSnapshot" ("id" TEXT NOT NULL, "label" TEXT, "sizeBytes" INTEGER NOT NULL DEFAULT 0, "counts" JSONB, "createdBy" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "data" JSONB NOT NULL, CONSTRAINT "BackupSnapshot_pkey" PRIMARY KEY ("id"))`);
console.log("✓ BackupSnapshot table");

await prisma.$generateClient();
console.log("done");
