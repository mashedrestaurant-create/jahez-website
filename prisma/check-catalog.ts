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

const cats = await prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, nameAr: true, active: true } });
const prods = await prisma.product.count();
const activeProds = await prisma.product.count({ where: { active: true, available: true } });
console.log("categories:", cats.length, JSON.stringify(cats.map(c => `${c.slug}(${c.active})`)));
console.log("products total:", prods, "| active+available:", activeProds);

await prisma.$disconnect();
