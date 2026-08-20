import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("addOn", {
    search,
    searchFields: ["nameAr", "nameEn"],
    orderBy: { sortOrder: "asc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn) {
    return err("nameAr, nameEn required");
  }
  const item = await createEntity("addOn", body, {
    adminId: auth.adminId,
    entity: "addOn",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
