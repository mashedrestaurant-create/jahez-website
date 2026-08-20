import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import { generateToken, signToken } from "../../../../lib/auth";

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12h
const DRIVER_SESSION_COOKIE = "jahez_driver_session";

export async function POST(request: NextRequest) {
  const { phone, password } = await request.json();

  if (!phone || !password) {
    return NextResponse.json(
      { error: "Phone and password required" },
      { status: 400 }
    );
  }

  const normalized = phone.replace(/\s+/g, "").replace(/^0020/, "0").replace(/^\+20/, "0");

  const driver = await prisma.driver.findFirst({
    where: {
      OR: [{ phoneNorm: normalized }, { phone: phone }],
      isActive: true,
    },
  });

  if (!driver) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await compare(password, driver.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken();
  const signature = signToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.driverSession.create({
    data: { driverId: driver.id, token: signature, expiresAt },
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookie = [
    `${DRIVER_SESSION_COOKIE}=${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : "",
    `Expires=${expiresAt.toUTCString()}`,
  ]
    .filter(Boolean)
    .join("; ");

  return NextResponse.json(
    {
      ok: true,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        rating: driver.rating,
        trips: driver.trips,
      },
    },
    { status: 200, headers: { "Set-Cookie": cookie } }
  );
}
