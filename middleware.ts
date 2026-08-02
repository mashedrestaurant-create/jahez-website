import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "./app/admin-auth";

const configuredAdminHostname = process.env.ADMIN_HOSTNAME?.trim().toLowerCase();
const ADMIN_HOSTNAMES = new Set([
  "admin.localhost",
  ...(configuredAdminHostname ? [configuredAdminHostname] : []),
]);

function isAdminHost(host: string | null): boolean {
  if (!host) return false;
  const hostname = host.split(":")[0];
  return ADMIN_HOSTNAMES.has(hostname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");

  if (isAdminHost(host)) {
    return handleAdminSubdomain(request, pathname);
  }

  return handleMainSite(request, pathname);
}

async function handleAdminSubdomain(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse> {
  // Pass through API routes (they handle their own auth internally)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Pass through Next.js internals
  if (pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Pass through static files (paths with a file extension)
  if (/\/[^/]+\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  // Admin login page — allow without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // All other /admin routes — require session
  if (pathname.startsWith("/admin")) {
    const session = await getAdminSession(request.cookies);
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Any other path (public pages like /, /menu, /about, etc.)
  // → internal rewrite to /admin/login while preserving the configured admin hostname
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = "/admin/login";
  return NextResponse.rewrite(rewriteUrl);
}

async function handleMainSite(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse> {
  // Allow login page, login API, and logout API without auth
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  // Protect /admin and /api/admin* routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const session = await getAdminSession(request.cookies);
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
