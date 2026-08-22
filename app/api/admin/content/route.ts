import { NextRequest } from "next/server";
import { authenticate, json, err } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "content:read");
  if (!auth) return response!;
  const items = await prisma.siteContent.findMany({
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });
  return json({ ok: true, items });
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await authenticate(request, "content:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.items || !Array.isArray(body.items)) {
    return err("items array required");
  }
  // Neon HTTP adapter: no transactions/upserts — single-statement SQL per row
  for (const item of body.items as { section: string; key: string; value: string; sortOrder?: number; active?: boolean }[]) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "SiteContent" ("id", "section", "key", "value", "sortOrder", "active")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
       ON CONFLICT ("section", "key")
       DO UPDATE SET "value" = $3, "sortOrder" = $4, "active" = $5`,
      String(item.section || "").slice(0, 60),
      String(item.key || "").slice(0, 120),
      String(item.value ?? ""),
      Number.isFinite(Number(item.sortOrder)) ? Math.trunc(Number(item.sortOrder)) : 0,
      item.active !== false,
    );
  }
  return json({ ok: true, updated: body.items.length });
}
