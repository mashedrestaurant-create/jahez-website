import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { json, authenticate } from "../../../lib/crud";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const auth = await authenticate(request, "stats:read");
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "7d";

    const now = new Date();
    let since: Date;
    switch (range) {
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const sinceIso = since.toISOString();

    const [
      pageviewCount,
      addToCartCount,
      checkoutCount,
      paymentAttemptCount,
      paymentSuccessCount,
      paymentFailedCount,
      paymentCancelledCount,
      orderStats,
      dailyOrders,
      dailyEvents,
      recentEvents,
      uniqueVisitors,
      totalCustomers,
      topPages,
      hourlyDistribution,
    ] = await Promise.all([
      prisma.siteEvent.count({ where: { event: "pageview", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "add_to_cart", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "checkout_start", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "payment_attempt", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "payment_success", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "payment_failed", createdAt: { gte: since } } }),
      prisma.siteEvent.count({ where: { event: "payment_cancelled", createdAt: { gte: since } } }),

      prisma.order.aggregate({
        where: { createdAt: { gte: since } },
        _count: true,
        _sum: { total: true },
      }),

      prisma.$queryRawUnsafe(`
        SELECT
          to_char("createdAt", 'YYYY-MM-DD') as date,
          count(*)::int as count,
          coalesce(sum("total"), 0)::float as revenue
        FROM "Order"
        WHERE "createdAt" >= $1
        GROUP BY to_char("createdAt", 'YYYY-MM-DD')
        ORDER BY to_char("createdAt", 'YYYY-MM-DD')
      `, sinceIso),

      prisma.$queryRawUnsafe(`
        SELECT
          to_char("createdAt", 'YYYY-MM-DD') as date,
          event,
          count(*)::int as count
        FROM "SiteEvent"
        WHERE "createdAt" >= $1
        GROUP BY to_char("createdAt", 'YYYY-MM-DD'), event
        ORDER BY to_char("createdAt", 'YYYY-MM-DD')
      `, sinceIso),

      prisma.siteEvent.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, sessionId: true, event: true, page: true, meta: true, createdAt: true },
      }),

      prisma.siteEvent.groupBy({
        by: ["sessionId"],
        where: { event: "pageview", createdAt: { gte: since } },
      }).then(r => r.length),

      prisma.customer.count(),

      prisma.$queryRawUnsafe(`
        SELECT page, count(*)::int as count
        FROM "SiteEvent"
        WHERE event = 'pageview' AND "createdAt" >= $1
        GROUP BY page
        ORDER BY count(*) DESC
        LIMIT 10
      `, sinceIso),

      prisma.$queryRawUnsafe(`
        SELECT
          extract(hour from "createdAt")::int as hour,
          count(*)::int as count
        FROM "SiteEvent"
        WHERE event = 'pageview' AND "createdAt" >= $1
        GROUP BY extract(hour from "createdAt")
        ORDER BY extract(hour from "createdAt")
      `, sinceIso),
    ]);

    const paidOrders = await prisma.order.count({
      where: { paymentStatus: "paid", createdAt: { gte: since } },
    });
    const cashOrders = await prisma.order.count({
      where: { paymentMethodType: "cash", createdAt: { gte: since } },
    });
    const instapayOrders = await prisma.order.count({
      where: { paymentMethodType: "instapay", createdAt: { gte: since } },
    });
    const paymobOrders = await prisma.order.count({
      where: { paymentMethodType: "paymob", createdAt: { gte: since } },
    });
    const deliveryOrders = await prisma.order.count({
      where: { type: "delivery", createdAt: { gte: since } },
    });
    const pickupOrders = await prisma.order.count({
      where: { type: "pickup", createdAt: { gte: since } },
    });

    const topPagesTyped = (topPages as { page: string; count: number }[]).map(p => ({
      page: p.page || "/",
      count: Number(p.count),
    }));

    const hourlyTyped = (hourlyDistribution as { hour: number; count: number }[]).map(h => ({
      hour: Number(h.hour),
      count: Number(h.count),
    }));

    return json({
      funnel: {
        pageviews: pageviewCount,
        addToCart: addToCartCount,
        checkoutStart: checkoutCount,
        paymentAttempt: paymentAttemptCount,
        paymentSuccess: paymentSuccessCount,
        paymentFailed: paymentFailedCount,
        paymentCancelled: paymentCancelledCount,
      },
      orders: {
        total: orderStats._count,
        revenue: orderStats._sum.total || 0,
        paid: paidOrders,
        cash: cashOrders,
        instapay: instapayOrders,
        paymob: paymobOrders,
        delivery: deliveryOrders,
        pickup: pickupOrders,
      },
      visitors: {
        unique: uniqueVisitors,
        totalCustomers,
      },
      dailyOrders,
      dailyEvents,
      recentEvents,
      topPages: topPagesTyped,
      hourlyDistribution: hourlyTyped,
      range,
    });
  } catch (e) {
    return json({ error: "Failed to load analytics: " + (e as Error).message }, 500);
  }
}
