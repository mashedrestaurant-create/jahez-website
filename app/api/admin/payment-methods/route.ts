import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "payments:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("paymentMethod", {
    search,
    searchFields: ["type", "labelAr", "labelEn"],
    orderBy: { sortOrder: "asc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "payments:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.type || !body.labelAr || !body.labelEn) {
    return err("type, labelAr, labelEn required");
  }
  const item = await createEntity("paymentMethod", body, {
    adminId: auth.adminId,
    entity: "paymentMethod",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
