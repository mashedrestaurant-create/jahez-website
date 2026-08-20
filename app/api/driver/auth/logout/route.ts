import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": "jahez_driver_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
      },
    }
  );
}
