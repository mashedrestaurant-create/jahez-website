import { NextRequest } from "next/server";
import { authenticate, json } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "stats:read");
  if (!auth) return response!;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todayRevenueResult,
    monthRevenueResult,
    todayOrders,
    newOrders,
    totalCustomers,
    onlineDrivers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: todayStart },
        status: { not: "cancelled" },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        createdAt: { gte: monthStart },
        status: { not: "cancelled" },
      },
    }),
    prisma.order.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.order.count({
      where: { status: "new" },
    }),
    prisma.customer.count(),
    prisma.driver.count({
      where: { isOnline: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { items: true },
    }),
  ]);

  return json({
    ok: true,
    todayRevenue: todayRevenueResult._sum.total || 0,
    monthRevenue: monthRevenueResult._sum.total || 0,
    todayOrders,
    newOrders,
    totalCustomers,
    onlineDrivers,
    recentOrders,
  });
}
