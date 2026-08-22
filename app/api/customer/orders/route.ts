import { prisma } from "../../../lib/prisma";
import { normalizeEgyptianMobile } from "../../../egypt-phone";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phone = normalizeEgyptianMobile(url.searchParams.get("phone") || "") || "";
    const name = url.searchParams.get("name")?.trim().slice(0, 90) || "";

    if (!phone || name.length < 2) {
      return Response.json({ error: "Phone and name are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { normalizedPhone: phone },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { items: true },
        },
      },
    });

    if (!customer) {
      return Response.json({ orders: [] });
    }

    if (customer.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return Response.json({ error: "Name does not match" }, { status: 403 });
    }

    const parsedOrders = customer.orders.map((order) => ({
      id: order.orderNumber,
      status: order.status,
      subtotal: Math.round(order.subtotal) / 100,
      deliveryFee: Math.round(order.deliveryFee) / 100,
      discountAmount: Math.round(order.discountAmount) / 100,
      total: Math.round(order.total) / 100,
      fulfillment: order.type,
      address: order.address,
      notes: order.notes,
      paymentMethod: order.paymentMethodType,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        name: item.productNameAr || item.productNameEn || "منتج",
        price: Math.round(item.unitPrice) / 100,
        quantity: item.quantity,
      })),
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
