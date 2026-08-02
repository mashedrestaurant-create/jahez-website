import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders } from "@/db/schema";
import {
  getPaymobConfig,
  queryToPaymobObject,
  verifyPaymobHmac,
} from "../../../../paymob";

export const dynamic = "force-dynamic";

type CallbackObject = Record<string, unknown> & {
  id?: unknown;
  order?: unknown;
  pending?: unknown;
  success?: unknown;
  error_occured?: unknown;
  amount_cents?: unknown;
};

function providerOrderId(object: CallbackObject) {
  const value =
    object.order && typeof object.order === "object"
      ? (object.order as Record<string, unknown>).id
      : object.order;
  return value === undefined || value === null ? "" : String(value);
}

function isTrue(value: unknown) {
  return value === true || value === "true";
}

async function applyCallback(object: CallbackObject, hmac: string) {
  const config = await getPaymobConfig();
  if (!config || !(await verifyPaymobHmac(object, hmac, config.hmacSecret))) {
    return { ok: false as const, status: 401, localOrderId: null };
  }
  const paymobOrderId = providerOrderId(object);
  if (!paymobOrderId) {
    return { ok: false as const, status: 400, localOrderId: null };
  }

  const db = getDb();
  const [existingOrder] = await db
    .select({
      id: orders.id,
      total: orders.total,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.providerOrderId, paymobOrderId))
    .limit(1);

  if (!existingOrder) {
    return { ok: false as const, status: 404, localOrderId: null };
  }

  if (existingOrder.paymentStatus === "paid") {
    return { ok: true as const, status: 200, paid: true, localOrderId: existingOrder.id, idempotent: true };
  }

  const paid =
    isTrue(object.success) &&
    !isTrue(object.pending) &&
    !isTrue(object.error_occured);

  if (paid) {
    const callbackAmountCents = Number(object.amount_cents || 0);
    const expectedAmountCents = Math.round(existingOrder.total * 100);
    if (callbackAmountCents > 0 && callbackAmountCents !== expectedAmountCents) {
      console.error(
        `Paymob amount mismatch for order ${existingOrder.id}: expected ${expectedAmountCents}, got ${callbackAmountCents}`,
      );
      return { ok: false as const, status: 400, localOrderId: null };
    }
  }

  const paymentFailed = !paid && isTrue(object.error_occured);
  const paymentStatus = paid ? "paid" : paymentFailed ? "payment_failed" : "payment_cancelled";
  const orderStatus = paid ? "confirmed" : undefined;

  const updateData: {
    paymentStatus: string;
    providerTransactionId: string;
    updatedAt: Date;
    orderStatus?: string;
  } = {
    paymentStatus,
    providerTransactionId:
      object.id === undefined || object.id === null ? "" : String(object.id),
    updatedAt: new Date(),
  };
  if (orderStatus) {
    updateData.orderStatus = orderStatus;
  }

  const [updated] = await db
    .update(orders)
    .set(updateData)
    .where(eq(orders.providerOrderId, paymobOrderId))
    .returning({ id: orders.id });

  return {
    ok: true as const,
    status: 200,
    paid,
    cancelled: !paid && !paymentFailed,
    localOrderId: updated?.id ?? existingOrder.id,
  };
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const body = (await request.json()) as {
      obj?: CallbackObject;
      hmac?: string;
    };
    const result = await applyCallback(
      body.obj || {},
      body.hmac || url.searchParams.get("hmac") || "",
    );
    return Response.json(
      result.ok ? { received: true } : { error: "Invalid callback" },
      { status: result.status },
    );
  } catch {
    return Response.json({ error: "Invalid callback" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const object = queryToPaymobObject(url.searchParams);
  const result = await applyCallback(
    object,
    url.searchParams.get("hmac") || "",
  );
  if (!result.ok) {
    return new Response(null, {
      status: 302,
      headers: { location: "/payment/result?status=invalid" },
    });
  }
  const status = result.paid ? "success" : result.cancelled ? "cancelled" : "failed";
  const order = result.localOrderId ? `&order=${result.localOrderId}` : "";
  return new Response(null, {
    status: 302,
    headers: { location: `/payment/result?status=${status}${order}` },
  });
}
