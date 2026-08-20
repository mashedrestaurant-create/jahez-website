import { NextRequest } from "next/server";
import { authenticate, listEntities, json } from "../../../lib/crud";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "customers:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const page = parseInt(url.searchParams.get("page") || "1");
  const data = await listEntities("customer", {
    search,
    searchFields: ["name", "phone", "email"],
    orderBy: { createdAt: "desc" },
    page,
  });
  return json({ ok: true, ...data });
}
