import { NextRequest } from "next/server";
import { authenticate, json } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { auth, response } = await authenticate(request, "activity:read");
  if (!auth) return response!;
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        admin: {
          select: { name: true, username: true },
        },
      },
    }),
    prisma.activityLog.count(),
  ]);

  return json({ ok: true, items, total, page, limit, pages: Math.ceil(total / limit) });
}
