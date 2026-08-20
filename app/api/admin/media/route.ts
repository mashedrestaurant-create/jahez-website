import { NextRequest } from "next/server";
import { authenticate, json, err } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "media:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.mediaAsset.count(),
  ]);

  return json({ ok: true, items, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "media:write");
  if (!auth) return response!;
  const body = await request.json();
  if (!body.blobUrl || !body.originalName || !body.mimeType || body.sizeBytes === undefined) {
    return err("blobUrl, originalName, mimeType, sizeBytes required");
  }
  const item = await prisma.mediaAsset.create({ data: body });
  return json({ ok: true, item }, 201);
}
