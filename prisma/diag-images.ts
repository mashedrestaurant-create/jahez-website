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

const prods = await prisma.product.findMany({
  select: { id: true, slug: true, nameAr: true, imageId: true, active: true, available: true, updatedAt: true },
  orderBy: { updatedAt: "desc" },
  take: 30,
});
console.log(JSON.stringify(prods.map(p => ({ id: p.id, slug: p.slug, imageId: p.imageId, active: p.active, available: p.available })), null, 2));

const media = await prisma.mediaFile.findMany({
  select: { id: true, mime: true, sizeBytes: true, originalName: true, createdAt: true },
  orderBy: { createdAt: "desc" }, take: 12,
});
console.log("\n--- MediaFile latest 12 ---");
console.log(JSON.stringify(media, null, 2));

await prisma.$disconnect();
