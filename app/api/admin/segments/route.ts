import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { json, authenticate } from "../../../lib/crud";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticate(request, "customers:read");
  if (auth.response) return auth.response;

  try {
    const now = Date.now();
    const [total, new30, vip, dormant] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { firstSeen: { gte: new Date(now - 30 * 864e5) } } }),
      prisma.customer.count({ where: { totalSpent: { gte: 500000 } } }),
      prisma.customer.count({ where: { lastSeen: { lt: new Date(now - 90 * 864e5) } } }),
    ]);
    return json({
      ok: true,
      segments: [
        { id: "all", nameAr: "كل العملاء", nameEn: "All customers", count: total },
        { id: "new30", nameAr: "جديد آخر 30 يوم", nameEn: "New (30d)", count: new30 },
        { id: "vip", nameAr: "عملاء VIP (5000ج+)", nameEn: "VIP (5000+ EGP)", count: vip },
        { id: "dormant", nameAr: "خامل +90 يوم", nameEn: "Dormant (90d+)", count: dormant },
      ],
    });
  } catch {
    return json({ error: "Failed to load segments" }, 500);
  }
}
