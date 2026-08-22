import { NextRequest } from "next/server";
import { authenticate, listEntities, json, err } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

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

const NUMERIC_FIELDS = new Set(["price", "compareAtPrice", "sortOrder", "preparationMinutes", "stock"]);
const BOOLEAN_FIELDS = new Set(["active", "available", "featured", "spicy", "vegetarian", "bestSeller", "newProduct", "taxIncluded"]);
const STRING_FIELDS = new Set([
  "slug", "nameAr", "nameEn", "descriptionAr", "descriptionEn",
  "shortDescriptionAr", "shortDescriptionEn", "categoryId",
]);

/** Frontend sends `image`; Prisma column is `imageId`. Whitelist + coerce everything. */
function sanitizeProductInput(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "image") {
      if (typeof value === "string") out.imageId = value.trim().slice(0, 400) || null;
      continue;
    }
    if (key === "imageId") {
      if (typeof value === "string") out.imageId = value.trim().slice(0, 400) || null;
      continue;
    }
    if (NUMERIC_FIELDS.has(key)) {
      const n = Number(value);
      if (Number.isFinite(n)) out[key] = Math.round(n);
      continue;
    }
    if (BOOLEAN_FIELDS.has(key)) {
      out[key] = value === true || value === "true";
      continue;
    }
    if (STRING_FIELDS.has(key)) {
      out[key] = String(value ?? "").trim().slice(0, 500) || null;
      continue;
    }
    // ignore anything else (createdAt, category object, etc.)
  }
  return out;
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;
  const body = await request.json();
  const sku = String(body.id || "").trim();
  if (!sku || !body.nameAr || !body.nameEn || !body.slug || !body.categoryId || body.price === undefined) {
    return err("id, nameAr, nameEn, slug, categoryId, price required");
  }

  const data = sanitizeProductInput(body);

  try {
    // Neon HTTP adapter has no upsert — check existence explicitly.
    const existing = await prisma.product.findUnique({ where: { id: sku } });
    let item;
    if (existing) {
      item = await prisma.product.update({ where: { id: sku }, data });
    } else {
      item = await prisma.product.create({ data: { ...data, id: sku } as any });
    }
    return json({ ok: true, item }, existing ? 200 : 201);
  } catch (e: any) {
    // Unique slug collision on create
    if (e?.code === "P2002") {
      return err("الـ slug أو الـ SKU مستخدم بالفعل لمنتج تاني", 409);
    }
    return err(e?.message || "Save failed", 500);
  }
}

export async function PATCH(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;
  try {
    const body = await request.json();
    const sku = String(body.id || "").trim();
    if (!sku) return err("id required");
    const data = sanitizeProductInput(body);
    delete (data as any).id;
    if (Object.keys(data).length === 0) return err("nothing to update");
    const item = await prisma.product.update({ where: { id: sku }, data });
    return json({ ok: true, item });
  } catch (e: any) {
    if (e?.code === "P2025") return err("Product not found", 404);
    return err(e?.message || "Update failed", 500);
  }
}
