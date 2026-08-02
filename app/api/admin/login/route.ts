import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { createSessionCookie } from "../../../admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, normalizedEmail))
      .limit(1);
    const staff = rows[0];

    if (!staff || !staff.active) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!staff.passwordHash) {
      return Response.json(
        { error: "This account has no password set. Contact the owner." },
        { status: 403 },
      );
    }

    const valid = await bcrypt.compare(password, staff.passwordHash);
    if (!valid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    await createSessionCookie(normalizedEmail);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Login error", error);
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
