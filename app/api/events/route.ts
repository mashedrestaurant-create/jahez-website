export const dynamic = "force-dynamic";

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

    const sessionId = body.sessionId?.trim().slice(0, 64) || generateSessionId();

    return Response.json({ ok: true, sessionId });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
