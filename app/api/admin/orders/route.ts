import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { getAdminSession } from "../../../admin-auth";

export const dynamic = "force-dynamic";

function parseOrderItems(itemsJson: string) {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const [customerRows, orderRows] = await Promise.all([
      db.select().from(customers).orderBy(desc(customers.lastSeenAt)).limit(250),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(250),
    ]);
    return Response.json({
      customers: customerRows,
      orders: orderRows.map((order) => ({
        ...order,
        items: parseOrderItems(order.itemsJson),
      })),
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return Response.json({ error: "Orders are unavailable" }, { status: 500 });
  }
}
