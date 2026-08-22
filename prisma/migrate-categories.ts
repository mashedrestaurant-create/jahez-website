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

// Move bolognese to beef
const beefRows = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id FROM "Category" WHERE slug = 'beef' LIMIT 1`);
if (beefRows[0]) {
  const r = await prisma.$executeRawUnsafe(`UPDATE "Product" SET "categoryId" = $1, "updatedAt" = NOW() WHERE slug = 'beef-bolognese'`, beefRows[0].id);
  console.log("bolognese moved to beef:", r);
} else {
  console.log("beef category NOT found");
}

// Delete cooked-meals only if empty
const cnt = await prisma.$queryRawUnsafe<{ c: bigint | number }[]>(`SELECT COUNT(*)::int AS c FROM "Product" p JOIN "Category" c ON p."categoryId" = c.id WHERE c.slug = 'cooked-meals'`);
const productCount = Number(cnt[0]?.c ?? 0);
if (productCount > 0) {
  console.error(`cooked-meals still has ${productCount} products — NOT deleting`);
} else {
  const d = await prisma.$executeRawUnsafe(`DELETE FROM "Category" WHERE slug = 'cooked-meals' AND id NOT IN (SELECT "categoryId" FROM "Product")`);
  console.log("cooked-meals deleted:", d);
}

// Store location settings
for (const [key, value] of Object.entries({ storeLat: "29.9602", storeLng: "31.2569", storeAddressAr: "المعادي، القاهرة" })) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SiteSetting" ("key", "value") VALUES ($1, $2::jsonb) ON CONFLICT ("key") DO NOTHING`,
    key, JSON.stringify(value),
  );
}
console.log("store location settings ensured");

const cats = await prisma.$queryRawUnsafe<{ slug: string; n: number }[]>(`
  SELECT c.slug, COUNT(p.id)::int AS n
  FROM "Category" c LEFT JOIN "Product" p ON p."categoryId" = c.id
  GROUP BY c.slug ORDER BY MIN(c."sortOrder")
`);
console.log("categories now:", cats.map(c => `${c.slug}(${c.n})`).join(", "));
await prisma.$disconnect();
