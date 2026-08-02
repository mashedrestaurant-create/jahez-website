import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adminUsers,
  customers,
  orders,
  productOverrides,
  siteSettings,
} from "@/db/schema";
import {
  canManageSite,
  canManageUsers,
  getAdminSession,
  type AdminRole,
} from "../../admin-auth";
import { getPaymobCredentialStatus } from "../../paymob";
import {
  loadManagedProducts,
  sanitizeManagedProduct,
  serializeManagedProduct,
} from "../../server-catalog";
import { defaultSettings } from "../../settings";
import { loadSiteSettings } from "../../server-settings";

export const dynamic = "force-dynamic";

const allowedRoles = new Set<AdminRole>(["admin", "order_receiver"]);
const allowedOrderStatuses = new Set([
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
]);
const allowedPaymentStatuses = new Set([
  "paid",
  "cash_on_delivery",
  "awaiting_transfer",
  "cancelled",
  "payment_failed",
]);

function parseOrderItems(itemsJson: string) {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const [customerRows, orderRows] = await Promise.all([
      db.select().from(customers).orderBy(desc(customers.lastSeenAt)).limit(250),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(250),
    ]);
    const orderData = orderRows.map((order) => ({
      ...order,
      items: parseOrderItems(order.itemsJson),
    }));

    if (!canManageSite(session.role)) {
      return Response.json({
        currentUser: {
          email: session.email,
          name: session.name,
          role: session.role,
        },
        customers: customerRows,
        orders: orderData,
      });
    }

    const [settings, products, paymobStatus, staffRows] = await Promise.all([
      loadSiteSettings(),
      loadManagedProducts(true),
      getPaymobCredentialStatus(),
      canManageUsers(session.role)
        ? db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt))
        : Promise.resolve([]),
    ]);

    return Response.json({
      currentUser: {
        email: session.email,
        name: session.name,
        role: session.role,
      },
      settings,
      products,
      customers: customerRows,
      orders: orderData,
      staff: staffRows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        active: row.active,
      })),
      paymobConfigured: paymobStatus.configured,
      paymobStatus,
    });
  } catch {
    return Response.json(
      { error: "Dashboard data is unavailable" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session || !canManageSite(session.role)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      settings?: Record<string, unknown>;
      products?: Array<Record<string, unknown> & { id?: string }>;
      staff?: Array<Record<string, unknown> & { id?: number }>;
    };
    const db = getDb();
    const allowedSettings = new Set(Object.keys(defaultSettings));

    for (const [key, value] of Object.entries(payload.settings || {})) {
      if (!allowedSettings.has(key) || typeof value !== "string") continue;
      await db
        .insert(siteSettings)
        .values({ key, value })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value },
        });
    }

    for (const product of payload.products || []) {
      const allowed = sanitizeManagedProduct(product);
      if (!allowed) continue;
      await db
        .insert(productOverrides)
        .values({
          id: allowed.id,
          dataJson: JSON.stringify(serializeManagedProduct(allowed)),
        })
        .onConflictDoUpdate({
          target: productOverrides.id,
          set: { dataJson: JSON.stringify(serializeManagedProduct(allowed)) },
        });
    }

    if (canManageUsers(session.role)) {
      for (const member of payload.staff || []) {
        const email =
          typeof member.email === "string"
            ? member.email.trim().toLowerCase().slice(0, 160)
            : "";
        const name =
          typeof member.name === "string" ? member.name.trim().slice(0, 90) : "";
        const role =
          typeof member.role === "string" && allowedRoles.has(member.role as AdminRole)
            ? (member.role as "admin" | "order_receiver")
            : null;
        if (!email || !name || !role || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          continue;
        }
        await db
          .insert(adminUsers)
          .values({
            email,
            name,
            role,
            active: member.active !== false,
            passwordHash: "",
          })
          .onConflictDoUpdate({
            target: adminUsers.email,
            set: {
              name,
              role,
              active: member.active !== false,
              updatedAt: new Date(),
            },
          });
      }
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Unable to save dashboard changes" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as {
      orderId?: unknown;
      orderStatus?: unknown;
      paymentStatus?: unknown;
    };
    const orderId = Number(payload.orderId);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return Response.json({ error: "Invalid order update" }, { status: 400 });
    }

    const changes: {
      orderStatus?: string;
      paymentStatus?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };
    if (
      typeof payload.orderStatus === "string" &&
      allowedOrderStatuses.has(payload.orderStatus)
    ) {
      changes.orderStatus = payload.orderStatus;
    }
    if (
      canManageSite(session.role) &&
      typeof payload.paymentStatus === "string" &&
      allowedPaymentStatuses.has(payload.paymentStatus)
    ) {
      changes.paymentStatus = payload.paymentStatus;
    }
    if (!changes.orderStatus && !changes.paymentStatus) {
      return Response.json({ error: "Invalid order update" }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(orders)
      .set(changes)
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        orderStatus: orders.orderStatus,
        paymentStatus: orders.paymentStatus,
      });
    if (!updated) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }
    return Response.json({ ok: true, order: updated });
  } catch {
    return Response.json(
      { error: "Unable to update the order" },
      { status: 500 },
    );
  }
}
