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
  const { driverId } = await request.json();
  if (!driverId) return json({ error: "driverId required" }, 400);

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) return json({ error: "Driver not found" }, 404);

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return json({ error: "Order not found" }, 404);

  const newStatus = ["new", "confirmed", "preparing"].includes(order.status) ? "ready" : order.status;

  const updated = await prisma.order.update({
    where: { id },
    data: { driverId, driverAssignedAt: new Date(), status: newStatus },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: id, status: newStatus, note: `Assigned to driver ${driver.name}`, changedBy: auth.adminId },
  });

  await logActivity({ adminId: auth.adminId, action: "assign_driver", entity: "order", entityId: id, details: { driverId, driverName: driver.name }, ip: getClientIp(request) });
  return json({ ok: true, order: updated });
}
