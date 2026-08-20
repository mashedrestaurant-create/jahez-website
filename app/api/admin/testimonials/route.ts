import { NextRequest } from "next/server";
import { authenticate, listEntities, createEntity, updateEntity, deleteEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "testimonials:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("testimonial", {
    search,
    searchFields: ["nameAr", "nameEn", "textAr", "textEn", "source"],
    orderBy: { sortOrder: "asc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "testimonials:write");
  if (!auth) return response!;
  const body = await request.json();
  const item = await createEntity("testimonial", body, {
    adminId: auth.adminId,
    entity: "testimonial",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await authenticate(request, "testimonials:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.id) return err("id required");
  const { id, ...data } = body;
  const item = await updateEntity("testimonial", id, data, {
    adminId: auth.adminId,
    entity: "testimonial",
    ip: getClientIp(request),
  });
  return json({ ok: true, item });
}

export async function DELETE(request: NextRequest) {
  const { auth, response } = await authenticate(request, "testimonials:write");
  if (!auth) return response!;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return err("id query param required");
  await deleteEntity("testimonial", id, {
    adminId: auth.adminId,
    entity: "testimonial",
    ip: getClientIp(request),
  });
  return json({ ok: true });
}
