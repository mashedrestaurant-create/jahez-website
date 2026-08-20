import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "zones:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("deliveryZone", {
    search,
    searchFields: ["nameAr", "nameEn"],
    orderBy: { sortOrder: "asc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "zones:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn) {
    return err("nameAr, nameEn required");
  }
  const item = await createEntity("deliveryZone", body, {
    adminId: auth.adminId,
    entity: "deliveryZone",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
