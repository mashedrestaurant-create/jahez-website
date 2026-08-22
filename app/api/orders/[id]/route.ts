import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orderNumber = Number(id);
    if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: { select: { name: true, phone: true, email: true } },
        items: true,
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    const lang = order.customerLang === "en" ? "en" : "ar";
    const items = order.items.map((item) => ({
      name: (lang === "en" ? item.productNameEn || item.productNameAr : item.productNameAr || item.productNameEn) || "منتج",
      price: Math.round(item.unitPrice) / 100,
      quantity: item.quantity,
      details: (() => {
        try {
          const meta = item.addOnsJson as { details?: string } | null;
          return meta?.details || undefined;
        } catch {
          return undefined;
        }
      })(),
    }));

    return Response.json({
      id: order.orderNumber,
      subtotal: Math.round(order.subtotal) / 100,
      deliveryFee: Math.round(order.deliveryFee) / 100,
      total: Math.round(order.total) / 100,
      paymentMethod: order.paymentMethodType,
      paymentStatus: order.paymentStatus,
      fulfillment: order.type,
      address: order.address,
      notes: order.notes,
      language: order.customerLang,
      deliveryZone: "",
      items,
      createdAt: order.createdAt,
      customer: order.customer
        ? { name: order.customer.name, phone: order.customer.phone, email: order.customer.email }
        : null,
    });
  } catch {
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
