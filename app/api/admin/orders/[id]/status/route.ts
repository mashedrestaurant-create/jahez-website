import { NextRequest } from "next/server";
import { requireAdmin, requirePermission, logActivity } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { json, getClientIp } from "../../../../../lib/crud";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const p = requirePermission(auth.role, "orders:status");
  if (!p.ok) return p.response!;

  const { id } = await params;
  const { status, note } = await request.json();
  const validStatuses = ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];
  if (!validStatuses.includes(status)) return json({ error: "Invalid status" }, 400);

  const order = await prisma.order.update({
    where: { id },
    data: { status, cancelReason: status === "cancelled" ? note : undefined },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: id, status, note, changedBy: auth.adminId },
  });

  await logActivity({ adminId: auth.adminId, action: "order_status", entity: "order", entityId: id, details: { status }, ip: getClientIp(request) });
  return json({ ok: true, order });
}
