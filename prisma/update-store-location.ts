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

const updates = {
  storeLat: "30.005137",
  storeLng: "31.477191",
  storeAddressAr: "التجمع الخامس، القاهرة الجديدة",
  storeMapsUrl: "https://maps.app.goo.gl/PiqQRLCs3oQ9m7178",
  mapsUrl: "https://maps.app.goo.gl/PiqQRLCs3oQ9m7178",
};

for (const [key, value] of Object.entries(updates)) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SiteSetting" ("key", "value") VALUES ($1, $2::jsonb)
     ON CONFLICT ("key") DO UPDATE SET "value" = $2::jsonb`,
    key, JSON.stringify(value),
  );
  console.log("✓", key, "=", value);
}

const rows = await prisma.$queryRawUnsafe<{ key: string; value: unknown }[]>(`SELECT key, value FROM "SiteSetting" WHERE key IN ('storeLat','storeLng')`);
console.log("verified:", rows.map(r => `${r.key}=${String(r.value)}`).join(", "));
await prisma.$disconnect();
