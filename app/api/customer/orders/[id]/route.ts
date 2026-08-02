import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { normalizeEgyptianMobile } from "../../../../egypt-phone";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const phone =
      normalizeEgyptianMobile(url.searchParams.get("phone") || "") || "";

    if (!phone) {
      return Response.json(
        { error: "Phone is required" },
        { status: 400 },
      );
    }

    const orderId = Number(id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return Response.json(
        { error: "Invalid order ID" },
        { status: 400 },
      );
    }

    const db = getDb();

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 },
      );
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    if (!customer || customer.phone !== phone) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    return Response.json({
      order: {
        ...order,
        items: (() => {
          try {
            return JSON.parse(order.itemsJson);
          } catch {
            return [];
          }
        })(),
      },
    });
  } catch (error) {
    console.error("Order detail fetch failed", error);
    return Response.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
}
