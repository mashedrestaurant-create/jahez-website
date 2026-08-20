import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "../../../../lib/prisma";
import {
  createSession,
  adminSessionCookie,
  checkLoginRateLimit,
  recordLoginAttempt,
  logActivity,
} from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password required" },
      { status: 400 }
    );
  }

  const identifier = username.toLowerCase().trim();

  const rateLimit = checkLoginRateLimit(identifier);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Too many attempts. Try again later.",
        retryAfterMs: rateLimit.retryAfterMs,
      },
      { status: 429 }
    );
  }

  const admin = await prisma.adminUser.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
      isActive: true,
    },
  });

  if (!admin) {
    recordLoginAttempt(identifier, false);
    await logActivity({
      action: "login_failed",
      entity: "admin",
      details: { username: identifier, reason: "not_found" },
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const valid = await compare(password, admin.passwordHash);
  if (!valid) {
    recordLoginAttempt(identifier, false);
    await logActivity({
      adminId: admin.id,
      action: "login_failed",
      entity: "admin",
      details: { reason: "wrong_password" },
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
    });
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  recordLoginAttempt(identifier, true);

  const session = await createSession(admin.id);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  await logActivity({
    adminId: admin.id,
    action: "login_success",
    entity: "admin",
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
  });

  const cookie = adminSessionCookie(session.signature, session.expiresAt);

  return NextResponse.json(
    {
      ok: true,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    },
    { status: 200, headers: { "Set-Cookie": cookie } }
  );
}
