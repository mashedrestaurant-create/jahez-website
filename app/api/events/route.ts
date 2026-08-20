import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../generated/prisma/client";

export const dynamic = "force-dynamic";

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
}

function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  const xr = request.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      page?: string;
      meta?: Record<string, unknown>;
      sessionId?: string;
    };

    const event = body.event?.trim().slice(0, 60);
    if (!event) {
      return Response.json({ ok: false }, { status: 400 });
    }

    const sessionId = body.sessionId?.trim().slice(0, 64) || generateSessionId();
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent")?.slice(0, 256) || null;

    await prisma.siteEvent.create({
      data: {
        sessionId,
        event,
        page: body.page?.slice(0, 200) || null,
        meta: body.meta ? (body.meta as Prisma.InputJsonValue) : undefined,
        ip,
        userAgent,
      },
    });

    return Response.json({ ok: true, sessionId });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
