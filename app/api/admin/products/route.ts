import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const where: Record<string, unknown> = {};
  if (category) where.categoryId = category;
  const data = await listEntities("product", {
    where, search, searchFields: ["nameAr", "nameEn", "slug", "id"],
    include: { category: true }, orderBy: { sortOrder: "asc" }, page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.id || !body.nameAr || !body.nameEn || !body.slug || !body.categoryId || body.price === undefined) {
    return err("id, nameAr, nameEn, slug, categoryId, price required");
  }
  const item = await createEntity("product", body, { adminId: auth.adminId, entity: "product", ip: getClientIp(request) });
  return json({ ok: true, item }, 201);
}
