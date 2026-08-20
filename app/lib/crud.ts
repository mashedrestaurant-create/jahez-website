import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";
import { requireAdmin, requirePermission, logActivity, type Role } from "./auth";

type PrismaModel = keyof typeof prisma;

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function authenticate(request: NextRequest, permission: string) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return { auth: null, response: auth.response };
  const perm = requirePermission(auth.role, permission);
  if (!perm.ok) return { auth: null, response: perm.response! };
  return { auth, response: null };
}

export async function listEntities(
  model: string,
  opts: {
    where?: Record<string, unknown>;
    include?: Record<string, unknown>;
    orderBy?: Record<string, string>;
    search?: string;
    searchFields?: string[];
    page?: number;
    limit?: number;
  } = {}
) {
  const { where = {}, include, orderBy = { createdAt: "desc" }, search, searchFields = [], page = 1, limit = 50 } = opts;
  const finalWhere = { ...where };

  if (search && searchFields.length > 0) {
    finalWhere.OR = searchFields.map((f) => ({ [f]: { contains: search, mode: "insensitive" } }));
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    (prisma as any)[model].findMany({ where: finalWhere, include, orderBy, skip, take: limit }),
    (prisma as any)[model].count({ where: finalWhere }),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function createEntity(
  model: string,
  data: Record<string, unknown>,
  logOpts?: { adminId: string; entity: string; ip?: string }
) {
  const item = await (prisma as any)[model].create({ data });
  if (logOpts) {
    await logActivity({
      adminId: logOpts.adminId,
      action: "create",
      entity: logOpts.entity,
      entityId: item.id,
      details: { created: true },
      ip: logOpts.ip,
    });
  }
  return item;
}

export async function updateEntity(
  model: string,
  id: string,
  data: Record<string, unknown>,
  logOpts?: { adminId: string; entity: string; ip?: string }
) {
  const item = await (prisma as any)[model].update({ where: { id }, data });
  if (logOpts) {
    await logActivity({
      adminId: logOpts.adminId,
      action: "update",
      entity: logOpts.entity,
      entityId: id,
      ip: logOpts.ip,
    });
  }
  return item;
}

export async function deleteEntity(
  model: string,
  id: string,
  logOpts?: { adminId: string; entity: string; ip?: string }
) {
  await (prisma as any)[model].delete({ where: { id } });
  if (logOpts) {
    await logActivity({
      adminId: logOpts.adminId,
      action: "delete",
      entity: logOpts.entity,
      entityId: id,
      ip: logOpts.ip,
    });
  }
}

export function getClientIp(request: NextRequest): string {
  return (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
}
