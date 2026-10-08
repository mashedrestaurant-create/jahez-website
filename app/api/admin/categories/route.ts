import { NextRequest } from "next/server";
import { authenticate, listEntities, json, err, getClientIp } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";
import { logActivity } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "categories:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("category", { search, searchFields: ["nameAr", "nameEn", "slug"], orderBy: { sortOrder: "asc" }, page });
  return json({ ok: true, ...data });
}

const NUMERIC_FIELDS = new Set(["sortOrder"]);
const BOOLEAN_FIELDS = new Set(["active"]);
const STRING_FIELDS = new Set([
  "nameAr", "nameEn", "slug", "descriptionAr", "descriptionEn",
  "imageId", "videoUrl", "icon",
]);

/** Whitelist + coerce everything the dashboard sends. */
function sanitizeCategoryInput(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id") continue;
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
      const s = String(value ?? "").trim();
      out[key] = s.slice(0, 500) || null;
      continue;
    }
    // ignore anything else (createdAt, products, etc.)
  }
  return out;
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "categories:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn || !body.slug) return err("nameAr, nameEn, slug required");
  const data = sanitizeCategoryInput(body);
  const id = String(body.id || "").trim();

  try {
    // Neon HTTP adapter has no upsert — check existence explicitly.
    const existing = id ? await prisma.category.findUnique({ where: { id } }) : null;
    let item;
    if (existing) {
      item = await prisma.category.update({ where: { id }, data });
      await logActivity({ adminId: auth.adminId, action: "update", entity: "category", entityId: id, ip: getClientIp(request) });
    } else {
      item = await prisma.category.create({ data: { ...data, ...(id ? { id } : {}) } as any });
      await logActivity({ adminId: auth.adminId, action: "create", entity: "category", entityId: item.id, details: { created: true }, ip: getClientIp(request) });
    }
    return json({ ok: true, item }, existing ? 200 : 201);
  } catch (e: any) {
    // Unique slug collision
    if (e?.code === "P2002") {
      return err("المعرّف (slug) مستخدم بالفعل لقسم تاني", 409);
    }
    return err(e?.message || "Save failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await authenticate(request, "categories:write");
  if (!auth) return response!;
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return err("id required");
    const data = sanitizeCategoryInput(body);
    if (Object.keys(data).length === 0) return err("nothing to update");
    const item = await prisma.category.update({ where: { id }, data });
    await logActivity({ adminId: auth.adminId, action: "update", entity: "category", entityId: id, ip: getClientIp(request) });
    return json({ ok: true, item });
  } catch (e: any) {
    if (e?.code === "P2025") return err("القسم غير موجود", 404);
    if (e?.code === "P2002") return err("المعرّف (slug) مستخدم بالفعل لقسم تاني", 409);
    return err(e?.message || "Update failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await authenticate(request, "categories:write");
  if (!auth) return response!;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") || "").trim();
    if (!id) return err("id query param required");
    const usedBy = await prisma.product.count({ where: { categoryId: id } });
    if (usedBy > 0) {
      return err(`لا يمكن حذف القسم — عليه ${usedBy} منتج. انقل المنتجات لقسم تاني الأول أو عطّل القسم بدل الحذف.`, 409);
    }
    await prisma.category.delete({ where: { id } });
    await logActivity({ adminId: auth.adminId, action: "delete", entity: "category", entityId: id, ip: getClientIp(request) });
    return json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return err("القسم غير موجود", 404);
    return err(e?.message || "Delete failed", 500);
  }
}
