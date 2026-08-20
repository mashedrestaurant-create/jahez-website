import { NextRequest } from "next/server";
import { requireAdmin } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { json, listEntities, createEntity, err, getClientIp } from "../../../lib/crud";
import { hash } from "bcryptjs";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("adminUser", {
    search,
    searchFields: ["username", "name", "email"],
    orderBy: { createdAt: "desc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  if (auth.role !== "owner") {
    return json({ error: "Forbidden" }, 403);
  }
  const body = await request.json();
  if (!body.username || !body.password || !body.role) {
    return err("username, password, role required");
  }
  const passwordHash = await hash(body.password, 12);
  const { password, ...data } = body;
  data.passwordHash = passwordHash;
  const item = await createEntity("adminUser", data, {
    adminId: auth.adminId,
    entity: "adminUser",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
