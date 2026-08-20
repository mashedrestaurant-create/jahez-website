import { NextRequest } from "next/server";
import { hash } from "bcryptjs";
import { authenticate, listEntities, createEntity, json, err, getClientIp } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "drivers:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("driver", {
    search,
    searchFields: ["name", "phone", "phoneNorm"],
    orderBy: { createdAt: "desc" },
    page,
  });
  return json({ ok: true, ...data });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "drivers:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.name || !body.phone || !body.password) {
    return err("name, phone, password required");
  }
  const passwordHash = await hash(body.password, 12);
  const { password, ...data } = body;
  data.passwordHash = passwordHash;
  data.phoneNorm = body.phone.replace(/\D/g, "");
  const item = await createEntity("driver", data, {
    adminId: auth.adminId,
    entity: "driver",
    ip: getClientIp(request),
  });
  return json({ ok: true, item }, 201);
}
