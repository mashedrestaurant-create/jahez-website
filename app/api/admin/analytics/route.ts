import { sql, eq, and, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { siteEvents, orders, customers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
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

    const db = getDb();

    const [eventCounts] = await db
      .select({
        pageview: sql<number>`count(*) filter (where ${siteEvents.event} = 'pageview')`.as("pageview"),
        addToCart: sql<number>`count(*) filter (where ${siteEvents.event} = 'add_to_cart')`.as("add_to_cart"),
        checkoutStart: sql<number>`count(*) filter (where ${siteEvents.event} = 'checkout_start')`.as("checkout_start"),
        paymentAttempt: sql<number>`count(*) filter (where ${siteEvents.event} = 'payment_attempt')`.as("payment_attempt"),
        paymentSuccess: sql<number>`count(*) filter (where ${siteEvents.event} = 'payment_success')`.as("payment_success"),
        paymentFailed: sql<number>`count(*) filter (where ${siteEvents.event} = 'payment_failed')`.as("payment_failed"),
        paymentCancelled: sql<number>`count(*) filter (where ${siteEvents.event} = 'payment_cancelled')`.as("payment_cancelled"),
      })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, since));

    const [orderStats] = await db
      .select({
        totalOrders: sql<number>`count(*)`.as("total"),
        totalRevenue: sql<number>`coalesce(sum(${orders.total}), 0)`.as("revenue"),
        paidOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} = 'paid')`.as("paid"),
        cashOrders: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'cash')`.as("cash"),
        instapayOrders: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'instapay')`.as("instapay"),
        paymobOrders: sql<number>`count(*) filter (where ${orders.paymentMethod} = 'paymob')`.as("paymob"),
        deliveryOrders: sql<number>`count(*) filter (where ${orders.fulfillment} = 'delivery')`.as("delivery"),
        pickupOrders: sql<number>`count(*) filter (where ${orders.fulfillment} = 'pickup')`.as("pickup"),
      })
      .from(orders)
      .where(gte(orders.createdAt, since));

    const dailyOrders = await db
      .select({
        date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`.as("date"),
        count: sql<number>`count(*)`.as("count"),
        revenue: sql<number>`coalesce(sum(${orders.total}), 0)`.as("revenue"),
      })
      .from(orders)
      .where(gte(orders.createdAt, since))
      .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

    const dailyEvents = await db
      .select({
        date: sql<string>`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD')`.as("date"),
        event: siteEvents.event,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, since))
      .groupBy(sql`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD'), ${siteEvents.event}`)
      .orderBy(sql`to_char(${siteEvents.createdAt}, 'YYYY-MM-DD')`);

    const recentEvents = await db
      .select({
        id: siteEvents.id,
        sessionId: siteEvents.sessionId,
        event: siteEvents.event,
        page: siteEvents.page,
        metaJson: siteEvents.metaJson,
        createdAt: siteEvents.createdAt,
      })
      .from(siteEvents)
      .where(gte(siteEvents.createdAt, since))
      .orderBy(sql`${siteEvents.createdAt} desc`)
      .limit(200);

    const uniqueVisitors = await db
      .select({
        count: sql<number>`count(distinct ${siteEvents.sessionId})`.as("count"),
      })
      .from(siteEvents)
      .where(
        and(
          gte(siteEvents.createdAt, since),
          eq(siteEvents.event, "pageview"),
        ),
      );

    const totalCustomers = await db.select({ count: sql<number>`count(*)` }).from(customers);

    const topPages = await db
      .select({
        page: siteEvents.page,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(siteEvents)
      .where(
        and(
          gte(siteEvents.createdAt, since),
          eq(siteEvents.event, "pageview"),
        ),
      )
      .groupBy(siteEvents.page)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const hourlyDistribution = await db
      .select({
        hour: sql<number>`extract(hour from ${siteEvents.createdAt})`.as("hour"),
        count: sql<number>`count(*)`.as("count"),
      })
      .from(siteEvents)
      .where(
        and(
          gte(siteEvents.createdAt, since),
          eq(siteEvents.event, "pageview"),
        ),
      )
      .groupBy(sql`extract(hour from ${siteEvents.createdAt})`)
      .orderBy(sql`extract(hour from ${siteEvents.createdAt})`);

    return Response.json({
      funnel: {
        pageviews: eventCounts?.pageview || 0,
        addToCart: eventCounts?.addToCart || 0,
        checkoutStart: eventCounts?.checkoutStart || 0,
        paymentAttempt: eventCounts?.paymentAttempt || 0,
        paymentSuccess: eventCounts?.paymentSuccess || 0,
        paymentFailed: eventCounts?.paymentFailed || 0,
        paymentCancelled: eventCounts?.paymentCancelled || 0,
      },
      orders: {
        total: orderStats?.totalOrders || 0,
        revenue: orderStats?.totalRevenue || 0,
        paid: orderStats?.paidOrders || 0,
        cash: orderStats?.cashOrders || 0,
        instapay: orderStats?.instapayOrders || 0,
        paymob: orderStats?.paymobOrders || 0,
        delivery: orderStats?.deliveryOrders || 0,
        pickup: orderStats?.pickupOrders || 0,
      },
      visitors: {
        unique: uniqueVisitors?.[0]?.count || 0,
        totalCustomers: totalCustomers?.[0]?.count || 0,
      },
      dailyOrders,
      dailyEvents,
      recentEvents,
      topPages,
      hourlyDistribution,
      range,
    });
  } catch {
    return Response.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
