import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./app/lib/prisma";

const SESSION_COOKIE = "jahez_admin_session";
const DRIVER_SESSION_COOKIE = "jahez_driver_session";

async function isAdminSessionValid(signature: string): Promise<boolean> {
  const session = await prisma.adminSession.findUnique({
    where: { token: signature },
    include: { admin: true },
  });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return false;
  }
  return session.admin.isActive;
}

async function isDriverSessionValid(signature: string): Promise<boolean> {
  const session = await prisma.driverSession.findUnique({
    where: { token: signature },
    include: { driver: true },
  });
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await prisma.driverSession.delete({ where: { id: session.id } });
    return false;
  }
  return session.driver.isActive;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Driver routes
  if (pathname.startsWith("/driver")) {
    if (pathname === "/driver/login" || pathname === "/driver") {
      return NextResponse.next();
    }
    const sig = request.cookies.get(DRIVER_SESSION_COOKIE)?.value;
    if (!sig || !(await isDriverSessionValid(sig))) {
      return NextResponse.redirect(new URL("/driver/login", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const sig = request.cookies.get(SESSION_COOKIE)?.value;
    if (!sig || !(await isAdminSessionValid(sig))) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|assets).*)"],
};
