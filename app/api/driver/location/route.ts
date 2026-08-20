import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";

const DRIVER_SESSION_COOKIE = "jahez_driver_session";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DRIVER_SESSION_COOKIE);
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await prisma.driverSession.findUnique({
    where: { token: sessionCookie.value },
  });
  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { lat, lng } = await request.json();
  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  await prisma.driver.update({
    where: { id: session.driverId },
    data: { lastLat: lat, lastLng: lng, lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
