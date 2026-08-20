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
  await prisma.$transaction(
    body.items.map((item: { section: string; key: string; value: string; sortOrder?: number; active?: boolean }) =>
      prisma.siteContent.upsert({
        where: { section_key: { section: item.section, key: item.key } },
        update: {
          value: item.value,
          sortOrder: item.sortOrder ?? 0,
          active: item.active ?? true,
        },
        create: {
          section: item.section,
          key: item.key,
          value: item.value,
          sortOrder: item.sortOrder ?? 0,
          active: item.active ?? true,
        },
      })
    )
  );
  return json({ ok: true, updated: body.items.length });
}
