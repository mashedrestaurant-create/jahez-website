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

const socials = {
  socialInstagram: "https://www.instagram.com/jahezkitchen",
  socialFacebook: "https://www.facebook.com/share/1BfGbhLjw9/",
  socialTiktok: "https://www.tiktok.com/@jahez.kitchen",
};

for (const [key, value] of Object.entries(socials)) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SiteSetting" ("key", "value") VALUES ($1, $2::jsonb)
     ON CONFLICT ("key") DO UPDATE SET "value" = $2::jsonb`,
    key, JSON.stringify(value),
  );
  console.log("✓", key);
}
await prisma.$disconnect();
