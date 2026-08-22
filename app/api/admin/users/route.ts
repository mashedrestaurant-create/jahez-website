import { NextRequest } from "next/server";
import { requireAdmin, logActivity } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { json, getClientIp } from "../../../lib/crud";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const role = url.searchParams.get("role") || undefined;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;

  const items = await prisma.adminUser.findMany({
    where,
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return json({ ok: true, items });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }

  const body = await request.json();
  if (!body.username || !body.password || !body.role) {
    return json({ error: "username, password, and role are required" }, 400);
  }

  const allowedRoles = ["owner", "admin", "order_receiver"];
  if (!allowedRoles.includes(body.role)) {
    return json({ error: "Invalid role" }, 400);
  }

  const existing = await prisma.adminUser.findUnique({
    where: { username: body.username },
  });
  if (existing) {
    return json({ error: "Username already exists" }, 409);
  }

  const passwordHash = await hash(body.password, 12);
  const item = await prisma.adminUser.create({
    data: {
      username: body.username,
      name: body.name || null,
      email: body.email || null,
      passwordHash,
      role: body.role,
      isActive: body.isActive !== false,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await logActivity({
    adminId: auth.adminId,
    action: "user_created",
    entity: "adminUser",
    entityId: item.id,
    details: { username: item.username, role: item.role },
    ip: getClientIp(request),
  });

  return json({ ok: true, item }, 201);
}
