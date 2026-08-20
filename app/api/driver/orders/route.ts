import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";

const DRIVER_SESSION_COOKIE = "jahez_driver_session";

async function getDriverId(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DRIVER_SESSION_COOKIE);
  if (!sessionCookie?.value) return null;
  const session = await prisma.driverSession.findUnique({
    where: { token: sessionCookie.value },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.driverId;
}

export async function GET(request: NextRequest) {
  const driverId = await getDriverId();
  if (!driverId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { driverId };
  if (status === "active") {
    where.status = { in: ["confirmed", "preparing", "ready", "out_for_delivery"] };
  } else if (status === "completed") {
    where.status = "completed";
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      deliveryZone: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ ok: true, orders });
}
