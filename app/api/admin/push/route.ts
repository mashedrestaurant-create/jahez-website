import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth";
import { saveAdminPushSubscription, removeAdminPushSubscription, type AdminPushSubscription } from "../../../lib/admin-push";

export const runtime = "nodejs";

function validSubscription(value: unknown): value is AdminPushSubscription {
  if (!value || typeof value !== "object") return false;
  const subscription = value as Partial<AdminPushSubscription>;
  if (typeof subscription.endpoint !== "string" || subscription.endpoint.length > 2048) return false;
  try {
    const endpoint = new URL(subscription.endpoint);
    if (endpoint.protocol !== "https:") return false;
  } catch {
    return false;
  }
  return Boolean(
    subscription.keys &&
    typeof subscription.keys.p256dh === "string" &&
    typeof subscription.keys.auth === "string"
  );
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  if (!publicKey) return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  return NextResponse.json({ publicKey });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  let subscription: unknown;
  try {
    subscription = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  if (!validSubscription(subscription)) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  await saveAdminPushSubscription(auth.adminId, subscription);
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  let body: { endpoint?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.endpoint !== "string") {
    return NextResponse.json({ error: "Invalid endpoint" }, { status: 400 });
  }
  await removeAdminPushSubscription(auth.adminId, body.endpoint);
  return NextResponse.json({ ok: true });
}
