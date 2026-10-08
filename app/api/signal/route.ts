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

// Events the site actually sends (see event-tracker.tsx + lib/analytics.ts +
// cart/page.tsx, and the admin analytics dashboard which reads these names).
// Anything else is dropped before touching the DB,
// so bots/crawlers can't inflate the SiteEvent table with junk.
const ALLOWED_EVENTS = new Set([
  "pageview",
  "page_exit",
  "add_to_cart",
  "checkout_start",
  "order_placed",
  "payment_attempt",
  "payment_success",
  "payment_failed",
  "payment_cancelled",
]);

// Light per-instance throttle: max N events per IP per window.
// (Best-effort in serverless — each instance keeps its own counters.)
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
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
    if (!event || !ALLOWED_EVENTS.has(event)) {
      // Unknown events are acknowledged but never stored.
      return Response.json({ ok: true, dropped: true });
    }

    const ip = getClientIp(request);
    if (throttled(ip)) {
      return Response.json({ ok: true, dropped: true }, { status: 429 });
    }

    const sessionId = body.sessionId?.trim().slice(0, 64) || generateSessionId();
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
