import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "promo_codes:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("promoCode", {
    search,
    searchFields: ["code"],
    orderBy: { createdAt: "desc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "promo_codes:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.code || !body.type || body.value === undefined || !body.validFrom) {
    return err("code, type, value, validFrom required");
  }
  const item = await createEntity("promoCode", body, {
    adminId: auth.adminId,
    entity: "promoCode",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
