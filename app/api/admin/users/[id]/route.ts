import { NextRequest } from "next/server";
import { requireAdmin, logActivity } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { json, getClientIp } from "../../../../lib/crud";
import { hash } from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return json({ error: "User not found" }, 404);

  if (body.username && body.username !== existing.username) {
    const dup = await prisma.adminUser.findUnique({ where: { username: body.username } });
    if (dup) return json({ error: "Username already taken" }, 409);
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.username) updateData.username = body.username;
  if (body.role) updateData.role = body.role;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.password) updateData.passwordHash = await hash(body.password, 12);

  const item = await prisma.adminUser.update({
    where: { id },
    data: updateData,
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
  });

  await logActivity({
    adminId: auth.adminId,
    action: "user_updated",
    entity: "adminUser",
    entityId: id,
    details: { fields: Object.keys(updateData) },
    ip: getClientIp(request),
  });

  return json({ ok: true, item });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }

  const { id } = await params;

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) return json({ error: "User not found" }, 404);
  if (existing.role === "owner") {
    return json({ error: "Cannot delete owner account" }, 400);
  }
  if (existing.id === auth.adminId) {
    return json({ error: "Cannot delete your own account" }, 400);
  }

  await prisma.adminSession.deleteMany({ where: { adminId: id } });
  await prisma.adminUser.delete({ where: { id } });

  await logActivity({
    adminId: auth.adminId,
    action: "user_deleted",
    entity: "adminUser",
    entityId: id,
    details: { username: existing.username },
    ip: getClientIp(request),
  });

  return json({ ok: true });
}
