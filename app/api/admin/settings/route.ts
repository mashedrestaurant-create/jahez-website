import { NextRequest } from "next/server";
import { authenticate, json, err } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "settings:read");
  if (!auth) return response!;
  const settings = await prisma.siteSetting.findMany();
  const obj: Record<string, unknown> = {};
  for (const s of settings) {
    obj[s.key] = s.value;
  }
  return json({ ok: true, settings: obj });
}

export async function PUT(request: NextRequest) {
  const { auth, response } = await authenticate(request, "settings:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.settings || typeof body.settings !== "object") {
    return err("settings object required");
  }
  const entries = Object.entries(body.settings) as [string, unknown][];
  await prisma.$transaction(
    entries.map(([key, value]) => {
      const jsonValue = JSON.stringify(value);
      return prisma.siteSetting.upsert({
        where: { key },
        update: { value: jsonValue },
        create: { key, value: jsonValue },
      });
    })
  );
  return json({ ok: true, updated: entries.length });
}
