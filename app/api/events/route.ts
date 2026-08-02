import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { siteEvents } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

function generateSessionId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 32);
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

    const page = body.page?.trim().slice(0, 200) || "";
    const metaJson = body.meta ? JSON.stringify(body.meta).slice(0, 2000) : "{}";
    const sessionId = body.sessionId?.trim().slice(0, 64) || generateSessionId();

    const db = getDb();
    await db.insert(siteEvents).values({
      sessionId,
      event,
      page,
      metaJson,
    });

    return Response.json({ ok: true, sessionId });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
