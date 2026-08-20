import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../../lib/prisma";
import { validateSession } from "../../../../lib/auth";

const DRIVER_SESSION_COOKIE = "jahez_driver_session";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DRIVER_SESSION_COOKIE);
  if (!sessionCookie?.value) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const session = await prisma.driverSession.findUnique({
    where: { token: sessionCookie.value },
    include: { driver: true },
  });

  if (!session || session.expiresAt < new Date() || !session.driver.isActive) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    driver: {
      id: session.driver.id,
      name: session.driver.name,
      phone: session.driver.phone,
      rating: session.driver.rating,
      trips: session.driver.trips,
      isOnline: session.driver.isOnline,
    },
  });
}
