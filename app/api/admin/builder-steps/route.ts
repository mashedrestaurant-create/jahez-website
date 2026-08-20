import { NextRequest } from "next/server";
import { authenticate, listEntities, json, err, getClientIp } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";
import { logActivity } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("builderStep", {
    search,
    searchFields: ["nameAr", "nameEn"],
    orderBy: { stepNumber: "asc" },
    include: { options: true },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.stepNumber || !body.nameAr || !body.nameEn) {
    return err("stepNumber, nameAr, nameEn required");
  }
  const { options, ...stepData } = body;
  const item = await prisma.builderStep.create({
    data: {
      ...stepData,
      options: options
        ? { createMany: { data: options } }
        : undefined,
    },
    include: { options: true },
  });
  await logActivity({
    adminId: auth.adminId,
    action: "create",
    entity: "builderStep",
    entityId: item.id,
    details: { created: true },
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
