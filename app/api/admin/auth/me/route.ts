import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const { prisma } = await import("../../../../lib/prisma");
  const admin = await prisma.adminUser.findUnique({
    where: { id: auth.adminId },
    select: { id: true, username: true, name: true, email: true, role: true, lastLoginAt: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, admin });
}
