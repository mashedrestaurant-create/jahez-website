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
  select: { id: true, nameAr: true, slug: true, imageId: true },
  orderBy: { sortOrder: "asc" },
});
for (const p of prods) {
  console.log(`${p.slug.padEnd(22)} imageId=${p.imageId ?? "(null)"}`);
}

// Check MediaFile rows
const media = await prisma.mediaFile.findMany({ select: { id: true, mime: true, sizeBytes: true, originalName: true }, orderBy: { createdAt: "desc" }, take: 10 });
console.log("\nLatest media files:");
for (const m of media) console.log(`${m.id} ${m.mime} ${m.sizeBytes}B "${m.originalName}"`);

await prisma.$disconnect();
