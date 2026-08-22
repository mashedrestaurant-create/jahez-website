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

async function main() {
  console.log("=== Cleaning test data ===");

  const del = async (label: string, fn: () => Promise<unknown>) => {
    try { const r = await fn(); console.log(`✓ ${label}:`, (r as any)?.count ?? "ok"); }
    catch (e: any) { console.log(`⚠ ${label}: ${e.message}`); }
  };

  await del("OrderStatusHistory", () => prisma.orderStatusHistory.deleteMany({}));
  await del("PaymentAttempt", () => prisma.paymentAttempt.deleteMany({}));
  await del("OrderItem", () => prisma.orderItem.deleteMany({}));
  await del("Orders", () => prisma.order.deleteMany({}));
  await del("DriverSessions", () => prisma.driverSession.deleteMany({}));
  await del("Drivers", () => prisma.driver.deleteMany({}));
  await del("AdminSessions (keep active none)", () => prisma.adminSession.deleteMany({}));
  await del("Customers", () => prisma.customer.deleteMany({}));
  await del("SiteEvents", () => prisma.siteEvent.deleteMany({}));
  await del("ActivityLogs", () => prisma.activityLog.deleteMany({}));

  // Verify what remains
  const [admins, cats, prods, pm, settings] = await Promise.all([
    prisma.adminUser.findMany({ select: { username: true } }),
    prisma.category.count(),
    prisma.product.count(),
    prisma.paymentMethod.count(),
    prisma.siteSetting.count(),
  ]);
  console.log("\n=== Remaining ===");
  console.log("Admins:", admins.map(a => a.username).join(", "));
  console.log("Categories:", cats, "| Products:", prods, "| PaymentMethods:", pm, "| Settings:", settings);

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
