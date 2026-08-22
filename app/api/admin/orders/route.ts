import { NextRequest } from "next/server";
import { requireAdmin, requirePermission, logActivity } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { json, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const p = requirePermission(auth.role, "orders:read");
  if (!p.ok) return p.response!;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const date = url.searchParams.get("date") || "all";
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (date === "today") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.createdAt = { gte: start };
  } else if (date === "yesterday") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    where.createdAt = { gte: start, lt: end };
  } else if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const end = new Date(y, m - 1, d + 1);
    where.createdAt = { gte: start, lt: end };
  }
  if (search) {
    where.OR = [
      { orderNumber: parseInt(search) || -1 },
      { customerPhone: { contains: search } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where, include: { items: true, deliveryZone: true, branch: true, driver: true },
      orderBy: { createdAt: "desc" }, skip, take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return json({ ok: true, items, total, page, limit, pages: Math.ceil(total / limit) });
}
