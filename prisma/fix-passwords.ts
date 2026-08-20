import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import bcryptjs from "bcryptjs";
const { hashSync } = bcryptjs;
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

async function main() {
  console.log("Fixing plaintext passwords to bcrypt hashes...");

  const adminPassword = hashSync("Admin@123456", 10);
  const driverPassword = hashSync("Driver@123", 10);

  const admins = await prisma.adminUser.findMany();
  for (const admin of admins) {
    if (!admin.passwordHash.startsWith("$2")) {
      await prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: adminPassword } });
      console.log(`  Fixed admin: ${admin.username}`);
    } else {
      console.log(`  Already hashed: ${admin.username}`);
    }
  }

  const drivers = await prisma.driver.findMany();
  for (const driver of drivers) {
    if (!driver.passwordHash.startsWith("$2")) {
      await prisma.driver.update({ where: { id: driver.id }, data: { passwordHash: driverPassword } });
      console.log(`  Fixed driver: ${driver.name}`);
    } else {
      console.log(`  Already hashed: ${driver.name}`);
    }
  }

  console.log("Done!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
