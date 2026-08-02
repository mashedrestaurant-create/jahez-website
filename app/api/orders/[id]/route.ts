import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, customers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    if (!orderId || orderId <= 0) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const db = getDb();
    const [order] = await db
      .select({
        id: orders.id,
        subtotal: orders.subtotal,
        deliveryFee: orders.deliveryFee,
        total: orders.total,
        paymentMethod: orders.paymentMethod,
        paymentStatus: orders.paymentStatus,
        fulfillment: orders.fulfillment,
        address: orders.address,
        notes: orders.notes,
        language: orders.language,
        deliveryZone: orders.deliveryZone,
        itemsJson: orders.itemsJson,
        createdAt: orders.createdAt,
        customerId: orders.customerId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const [customer] = await db
      .select({
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.id, order.customerId))
      .limit(1);

    let items: Array<{ name: string; price: number; quantity: number; details?: string }> = [];
    try {
      items = JSON.parse(order.itemsJson || "[]");
    } catch {
      items = [];
    }

    return Response.json({
      id: order.id,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      fulfillment: order.fulfillment,
      address: order.address,
      notes: order.notes,
      language: order.language,
      deliveryZone: order.deliveryZone,
      items,
      createdAt: order.createdAt,
      customer: customer
        ? {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
          }
        : null,
    });
  } catch {
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
