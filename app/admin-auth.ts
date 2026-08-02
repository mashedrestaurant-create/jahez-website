import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { adminUsers } from "../db/schema";
import type { AdminRole } from "./admin-roles";

export type { AdminRole } from "./admin-roles";
export { canManageSite, canManageUsers } from "./admin-roles";

const SESSION_COOKIE = "jahez-admin-session";
const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

export type AdminSession = {
  email: string;
  name: string;
  role: AdminRole;
};

type CookieStore = { get(name: string): { value: string } | undefined };

const ownerEmail = (process.env.OWNER_EMAIL || "atefelmahdy8@gmail.com")
  .trim()
  .toLowerCase();

export async function getSessionToken(cookieStore?: CookieStore): Promise<string | null> {
  const store = cookieStore || (await cookies());
  return store.get(SESSION_COOKIE)?.value || null;
}

export async function getAdminSession(cookieStore?: CookieStore): Promise<AdminSession | null> {
  const token = await getSessionToken(cookieStore);
  if (!token) return null;

  let email: string;
  let expiresAt: number;
  try {
    const parsed = await parseSessionToken(token);
    email = parsed.email;
    expiresAt = parsed.expiresAt;
  } catch {
    return null;
  }
  if (Date.now() > expiresAt) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === ownerEmail) {
    return { email: normalizedEmail, name: "Owner", role: "owner" };
  }

  let staff;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);
    staff = rows[0];
  } catch {
    return null;
  }

  if (!staff?.active) return null;
  if (staff.role !== "admin" && staff.role !== "order_receiver") return null;

  return {
    email: normalizedEmail,
    role: staff.role as AdminRole,
    name: staff.name || normalizedEmail,
  };
}

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export async function createSessionCookie(email: string) {
  const cookieStore = await cookies();
  const token = await createSessionToken(email);
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function createSessionToken(email: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = JSON.stringify({ email, expiresAt });
  const encoded = base64urlEncode(new TextEncoder().encode(payload));
  const secret = process.env.ADMIN_SESSION_SECRET || "fallback-dev-secret";
  const signature = await hmacSign(encoded, secret);
  return `${encoded}.${signature}`;
}

async function parseSessionToken(token: string): Promise<{ email: string; expiresAt: number }> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) throw new Error("Invalid session token");

  const secret = process.env.ADMIN_SESSION_SECRET || "fallback-dev-secret";
  const expected = await hmacSign(encoded, secret);
  if (signature !== expected) throw new Error("Session signature mismatch");

  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(encoded)));
  return { email: payload.email, expiresAt: payload.expiresAt };
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return base64urlEncode(new Uint8Array(signature));
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
