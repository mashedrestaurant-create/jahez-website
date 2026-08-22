import { prisma } from "../../../../lib/prisma";
import { normalizeEgyptianMobile } from "../../../../egypt-phone";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const phone = normalizeEgyptianMobile(url.searchParams.get("phone") || "") || "";

    if (!phone) {
      return Response.json({ error: "Phone is required" }, { status: 400 });
    }

    const orderNumber = Number(id);
    if (!Number.isInteger(orderNumber) || orderNumber <= 0) {
      return Response.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.customerPhoneNorm !== phone) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    return Response.json({
      order: {
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
      },
    });
  } catch (error) {
    console.error("Order detail fetch failed", error);
    return Response.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
