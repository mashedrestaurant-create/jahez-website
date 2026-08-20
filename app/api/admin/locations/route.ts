import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "locations:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("location", {
    search,
    searchFields: ["nameAr", "nameEn", "addressAr", "addressEn"],
    orderBy: { sortOrder: "asc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "locations:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn || !body.addressAr || !body.addressEn) {
    return err("nameAr, nameEn, addressAr, addressEn required");
  }
  const item = await createEntity("location", body, {
    adminId: auth.adminId,
    entity: "location",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
