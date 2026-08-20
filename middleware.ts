import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "jahez_admin_session";
const DRIVER_SESSION_COOKIE = "jahez_driver_session";

function parseCookies(header: string | null): Record<string, string> {
  const map: Record<string, string> = {};
  if (!header) return map;
  for (const pair of header.split(";")) {
    const [key, ...rest] = pair.split("=");
    if (key) map[key.trim()] = rest.join("=").trim();
  }
  return map;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Driver routes
  if (pathname.startsWith("/driver")) {
    if (pathname === "/driver/login" || pathname === "/driver") {
      return NextResponse.next();
    }
    const cookies = parseCookies(request.headers.get("cookie"));
    const sig = cookies[DRIVER_SESSION_COOKIE];
    if (!sig) {
      return NextResponse.redirect(new URL("/driver/login", request.url));
    }
    return NextResponse.next();
  }

  // Admin routes
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const cookies = parseCookies(request.headers.get("cookie"));
    const sig = cookies[SESSION_COOKIE];
    if (!sig) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|assets).*)"],
};
