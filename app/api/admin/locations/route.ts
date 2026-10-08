import { NextRequest } from "next/server";
import { authenticate, listEntities, json, err, getClientIp } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";
import { logActivity } from "../../../lib/auth";

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

const NUMERIC_FIELDS = new Set(["latitude", "longitude", "sortOrder"]);
const BOOLEAN_FIELDS = new Set(["active", "deliveryEnabled", "pickupEnabled"]);
const STRING_FIELDS = new Set([
  "nameAr", "nameEn", "addressAr", "addressEn",
  "phone", "whatsapp", "googleMapsUrl", "googleMapsEmbed", "imageId",
]);

/** Whitelist + coerce everything the dashboard sends. */
function sanitizeLocationInput(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "id") continue;
    if (NUMERIC_FIELDS.has(key)) {
      if (value === "" || value === null || value === undefined) {
        out[key] = null;
        continue;
      }
      const n = Number(value);
      if (Number.isFinite(n)) out[key] = n;
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
    // ignore anything else (createdAt, orders, etc.)
  }
  return out;
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "locations:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.nameAr || !body.nameEn || !body.addressAr || !body.addressEn) {
    return err("nameAr, nameEn, addressAr, addressEn required");
  }
  const data = sanitizeLocationInput(body);
  const id = String(body.id || "").trim();

  try {
    // Neon HTTP adapter has no upsert — check existence explicitly.
    const existing = id ? await prisma.location.findUnique({ where: { id } }) : null;
    let item;
    if (existing) {
      item = await prisma.location.update({ where: { id }, data });
      await logActivity({ adminId: auth.adminId, action: "update", entity: "location", entityId: id, ip: getClientIp(request) });
    } else {
      item = await prisma.location.create({ data: { ...data, ...(id ? { id } : {}) } as any });
      await logActivity({ adminId: auth.adminId, action: "create", entity: "location", entityId: item.id, details: { created: true }, ip: getClientIp(request) });
    }
    return json({ ok: true, item }, existing ? 200 : 201);
  } catch (e: any) {
    return err(e?.message || "Save failed", 500);
  }
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await authenticate(request, "locations:write");
  if (!auth) return response!;
  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return err("id required");
    const data = sanitizeLocationInput(body);
    if (Object.keys(data).length === 0) return err("nothing to update");
    const item = await prisma.location.update({ where: { id }, data });
    await logActivity({ adminId: auth.adminId, action: "update", entity: "location", entityId: id, ip: getClientIp(request) });
    return json({ ok: true, item });
  } catch (e: any) {
    if (e?.code === "P2025") return err("الفرع غير موجود", 404);
    return err(e?.message || "Update failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await authenticate(request, "locations:write");
  if (!auth) return response!;
  try {
    const url = new URL(request.url);
    const id = (url.searchParams.get("id") || "").trim();
    if (!id) return err("id query param required");
    const usedBy = await prisma.order.count({ where: { branchId: id } });
    if (usedBy > 0) {
      return err(`لا يمكن حذف الفرع — مرتبط بـ ${usedBy} طلب. عطّل الفرع بدل الحذف.`, 409);
    }
    await prisma.location.delete({ where: { id } });
    await logActivity({ adminId: auth.adminId, action: "delete", entity: "location", entityId: id, ip: getClientIp(request) });
    return json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return err("الفرع غير موجود", 404);
    return err(e?.message || "Delete failed", 500);
  }
}
