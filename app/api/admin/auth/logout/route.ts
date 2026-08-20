import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, clearSessionCookie, logActivity } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("jahez_admin_session");

  if (sessionCookie?.value) {
    await logActivity({
      action: "logout",
      entity: "admin",
    });
    await destroySession(sessionCookie.value);
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { "Set-Cookie": clearSessionCookie() },
    }
  );
}
