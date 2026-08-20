import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "offers:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("offer", {
    search,
    searchFields: ["nameAr", "nameEn", "promoCode"],
    orderBy: { createdAt: "desc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "offers:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn || body.originalPrice === undefined || body.offerPrice === undefined || !body.startDate) {
    return err("nameAr, nameEn, originalPrice, offerPrice, startDate required");
  }
  const item = await createEntity("offer", body, {
    adminId: auth.adminId,
    entity: "offer",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
