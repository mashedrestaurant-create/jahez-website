import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { normalizeEgyptianMobile } from "../../../egypt-phone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone =
      normalizeEgyptianMobile(url.searchParams.get("phone") || "") || "";
    const name =
      url.searchParams.get("name")?.trim().slice(0, 90) || "";

    if (!phone || name.length < 2) {
      return Response.json(
        { error: "Phone and name are required" },
        { status: 400 },
      );
    }

    const db = getDb();

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);

    if (!customer) {
      return Response.json({ orders: [] });
    }

    if (
      customer.name.trim().toLowerCase() !== name.trim().toLowerCase()
    ) {
      return Response.json(
        { error: "Name does not match" },
        { status: 403 },
      );
    }

    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customer.id))
      .orderBy(orders.createdAt)
      .limit(50);

    const parsedOrders = customerOrders.map((order) => ({
      ...order,
      items: (() => {
        try {
          return JSON.parse(order.itemsJson);
        } catch {
          return [];
        }
      })(),
    }));

    return Response.json({
      customer: { name: customer.name, phone: customer.phone },
      orders: parsedOrders,
    });
  } catch (error) {
    console.error("Order lookup failed", error);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }
}
