import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "./prisma";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 min
const SESSION_COOKIE = "jahez_admin_session";
const CSRF_HEADER = "x-csrf-token";

function hmacSign(data: string, secret: string): string {
  return createHmac("sha512", secret).update(data).digest("hex");
}

function hmacVerify(data: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha512", secret).update(data).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("ADMIN_SESSION_SECRET not set");
  return s;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function signToken(token: string): string {
  return hmacSign(token, getSecret());
}

export function verifyTokenSignature(token: string, signature: string): boolean {
  return hmacVerify(token, signature, getSecret());
}

// ─── RBAC ────────────────────────────────────────────
type Role = "owner" | "admin" | "order_receiver";

const PERMISSIONS: Record<string, Role[]> = {
  "orders:read": ["owner", "admin", "order_receiver"],
  "orders:write": ["owner", "admin", "order_receiver"],
  "orders:status": ["owner", "admin", "order_receiver"],
  "drivers:read": ["owner", "admin", "order_receiver"],
  "drivers:write": ["owner", "admin", "order_receiver"],
  "stats:read": ["owner", "admin", "order_receiver"],
  "products:read": ["owner", "admin", "order_receiver"],
  "products:write": ["owner", "admin"],
  "categories:read": ["owner", "admin", "order_receiver"],
  "categories:write": ["owner", "admin"],
  "customers:read": ["owner", "admin"],
  "customers:write": ["owner", "admin"],
  "offers:read": ["owner", "admin"],
  "offers:write": ["owner", "admin"],
  "promo_codes:read": ["owner", "admin"],
  "promo_codes:write": ["owner", "admin"],
  "locations:read": ["owner", "admin"],
  "locations:write": ["owner"],
  "zones:read": ["owner", "admin"],
  "zones:write": ["owner"],
  "payments:read": ["owner", "admin"],
  "payments:write": ["owner"],
  "media:read": ["owner", "admin"],
  "media:write": ["owner", "admin"],
  "settings:read": ["owner", "admin"],
  "settings:write": ["owner"],
  "users:read": ["owner"],
  "users:write": ["owner"],
  "activity:read": ["owner"],
  "reports:read": ["owner"],
  "content:read": ["owner", "admin"],
  "content:write": ["owner"],
  "testimonials:read": ["owner", "admin"],
  "testimonials:write": ["owner", "admin"],
};

export function hasPermission(role: Role, permission: string): boolean {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function hasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// ─── Session Management ──────────────────────────────
export async function createSession(adminId: string) {
  const token = generateToken();
  const signature = signToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: { adminId, token: signature, expiresAt },
  });

  return { token, signature, expiresAt };
}

export async function validateSession(
  signature: string
): Promise<{ adminId: string; role: Role } | null> {
  const session = await prisma.adminSession.findUnique({
    where: { token: signature },
    include: { admin: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.admin.isActive) return null;

  return { adminId: session.adminId, role: session.admin.role as Role };
}

export async function destroySession(signature: string) {
  await prisma.adminSession.deleteMany({ where: { token: signature } });
}

export async function destroyAllSessions(adminId: string) {
  await prisma.adminSession.deleteMany({ where: { adminId } });
}

// ─── Login Rate Limiting ─────────────────────────────
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterMs?: number } {
  const record = loginAttempts.get(identifier);
  if (!record) return { allowed: true };

  if (record.lockedUntil > Date.now()) {
    return { allowed: false, retryAfterMs: record.lockedUntil - Date.now() };
  }

  if (record.lockedUntil > 0 && record.lockedUntil <= Date.now()) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordLoginAttempt(identifier: string, success: boolean) {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const record = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    record.count = 0;
  }

  loginAttempts.set(identifier, record);
}

export function resetLoginAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

// ─── CSRF ────────────────────────────────────────────
export function generateCsrfToken(): string {
  return randomBytes(16).toString("hex");
}

export function verifyCsrf(request: NextRequest): boolean {
  const header = request.headers.get(CSRF_HEADER);
  if (!header) return false;
  const cookieStore = request.headers.get("cookie") || "";
  const match = cookieStore.match(/csrf_token=([^;]+)/);
  if (!match) return false;
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(match[1]));
  } catch {
    return false;
  }
}

// ─── Auth Helper for API Routes ──────────────────────
export async function requireAdmin(request: NextRequest): Promise<
  | { ok: true; adminId: string; role: Role }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const session = await validateSession(sessionCookie.value);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid session" }, { status: 401 }),
    };
  }

  return { ok: true, adminId: session.adminId, role: session.role };
}

export function requirePermission(
  role: Role,
  permission: string
): { ok: boolean; response?: NextResponse } {
  if (!hasPermission(role, permission)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true };
}

export function adminSessionCookie(signature: string, expiresAt: Date): string {
  const isProd = process.env.NODE_ENV === "production";
  return [
    `${SESSION_COOKIE}=${signature}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    isProd ? "Secure" : "",
    `Expires=${expiresAt.toUTCString()}`,
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

// ─── Activity Log ────────────────────────────────────
export async function logActivity(opts: {
  adminId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId: opts.adminId,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        details: opts.details ? JSON.parse(JSON.stringify(opts.details)) : undefined,
        ip: opts.ip,
      },
    });
  } catch {
    // don't let logging failures break requests
  }
}

export type { Role };
