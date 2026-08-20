import { NextRequest } from "next/server";
import { requireAdmin, requirePermission } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { json } from "../../../../lib/crud";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const p = requirePermission(auth.role, "orders:read");
  if (!p.ok) return p.response!;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, deliveryZone: true, branch: true, driver: true, statusHistory: { orderBy: { createdAt: "desc" } }, paymentAttempts: true },
  });
  if (!order) return json({ error: "Order not found" }, 404);
  return json({ ok: true, order });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const p = requirePermission(auth.role, "orders:write");
  if (!p.ok) return p.response!;

  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return json({ ok: true });
}
