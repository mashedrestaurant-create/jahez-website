import { NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticate, json, err } from "../../../lib/crud";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const KEEP_LAST = 30;

async function buildSnapshot() {
  const [
    admins, categories, products, addOns, optionGroups, options,
    builderSteps, builderOptions, offers, promoCodes, deliveryZones,
    paymentMethods, locations, siteSettings, siteContent, testimonials,
    customers, drivers, orders, orderItems, orderStatusHistory, paymentAttempts,
  ] = await Promise.all([
    prisma.adminUser.findMany(),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.addOn.findMany(),
    prisma.optionGroup.findMany(),
    prisma.option.findMany(),
    prisma.builderStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.builderOption.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.offer.findMany(),
    prisma.promoCode.findMany(),
    prisma.deliveryZone.findMany(),
    prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.location.findMany(),
    prisma.siteSetting.findMany(),
    prisma.siteContent.findMany(),
    prisma.testimonial.findMany(),
    prisma.customer.findMany(),
    prisma.driver.findMany(),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.orderItem.findMany({ take: 20000 }),
    prisma.orderStatusHistory.findMany({ take: 20000 }),
    prisma.paymentAttempt.findMany({ take: 20000 }),
  ]);

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    adminUsers: admins,
    categories,
    products,
    addOns,
    productAddOns: await prisma.productAddOn.findMany(),
    optionGroups,
    options,
    productOptionGroups: await prisma.productOptionGroup.findMany(),
    builderSteps,
    builderOptions,
    offers,
    promoCodes,
    deliveryZones,
    paymentMethods,
    locations,
    siteSettings,
    siteContent,
    testimonials,
    customers,
    drivers,
    orders,
    orderItems,
    orderStatusHistory,
    paymentAttempts,
  };
}

export async function GET(request: NextRequest) {
  const auth = await authenticate(request, "settings:read");
  if (auth.response) return auth.response;

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const snap = await prisma.backupSnapshot.findUnique({ where: { id } });
      if (!snap) return err("Backup not found", 404);
      return new Response(JSON.stringify(snap.data), {
        headers: {
          "content-type": "application/json",
          "content-disposition": `attachment; filename="jahez-backup-${snap.createdAt.toISOString().slice(0, 10)}-${snap.id}.json"`,
        },
      });
    }

    const backups = await prisma.backupSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, label: true, sizeBytes: true, counts: true, createdBy: true, createdAt: true },
    });
    return json({ ok: true, backups });
  } catch {
    return err("Failed to list backups", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request, "settings:read");
  if (auth.response) return auth.response;
  const { role, adminId } = auth.auth;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "create";

    if (action === "restore") {
      if (role !== "owner") return err("Only the owner can restore backups", 403);
      const snapId = String(body.id || "");
      const snap = await prisma.backupSnapshot.findUnique({ where: { id: snapId } });
      if (!snap) return err("Backup not found", 404);

      const d = snap.data as any;
      let restored = 0;

      // Wipe in FK-safe order
      await prisma.paymentAttempt.deleteMany({});
      await prisma.orderStatusHistory.deleteMany({});
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.driverSession.deleteMany({});
      await prisma.adminSession.deleteMany({});
      await prisma.builderOption.deleteMany({});
      await prisma.builderStep.deleteMany({});
      await prisma.productOptionGroup.deleteMany({});
      await prisma.option.deleteMany({});
      await prisma.optionGroup.deleteMany({});
      await prisma.productAddOn.deleteMany({});
      await prisma.addOn.deleteMany({});
      await prisma.product.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.offer.deleteMany({});
      await prisma.promoCode.deleteMany({});
      await prisma.deliveryZone.deleteMany({});
      await prisma.location.deleteMany({});
      await prisma.testimonial.deleteMany({});
      await prisma.siteContent.deleteMany({});
      await prisma.siteSetting.deleteMany({});
      await prisma.paymentMethod.deleteMany({});
      await prisma.customer.deleteMany({});
      await prisma.driver.deleteMany({});
      restored += 26;

      const put = async (model: string, rows: any[] | undefined, transform?: (r: any) => any) => {
        if (!Array.isArray(rows)) return;
        for (const row of rows) {
          try {
            await (prisma as any)[model].create({ data: transform ? transform(row) : row });
          } catch { /* skip bad rows */ }
        }
        restored++;
      };

      const stripRel = (row: any) => {
        const c = { ...row };
        for (const k of Object.keys(c)) {
          if (c[k] !== null && typeof c[k] === "object" && !Array.isArray(c[k]) && !(c[k] instanceof Date)) delete c[k];
        }
        return c;
      };

      await put("adminUser", d.adminUsers, stripRel);
      await put("category", d.categories, stripRel);
      await put("addOn", d.addOns, stripRel);
      await put("productAddOn", d.productAddOns, stripRel);
      await put("optionGroup", d.optionGroups, stripRel);
      await put("option", d.options, stripRel);
      await put("productOptionGroup", d.productOptionGroups, stripRel);
      await put("builderStep", d.builderSteps, stripRel);
      await put("builderOption", d.builderOptions, stripRel);
      await put("product", d.products, stripRel);
      await put("offer", d.offers, stripRel);
      await put("promoCode", d.promoCodes, stripRel);
      await put("deliveryZone", d.deliveryZones, stripRel);
      await put("paymentMethod", d.paymentMethods, stripRel);
      await put("location", d.locations, stripRel);
      await put("siteSetting", d.siteSettings);
      await put("siteContent", d.siteContent, stripRel);
      await put("testimonial", d.testimonials, stripRel);
      await put("customer", d.customers, stripRel);
      await put("driver", d.drivers, stripRel);
      await put("order", d.orders, stripRel);
      await put("orderItem", d.orderItems, stripRel);
      await put("orderStatusHistory", d.orderStatusHistory, stripRel);
      await put("paymentAttempt", d.paymentAttempts, stripRel);

      await prisma.activityLog.create({
        data: { adminId, action: "backup.restore", entity: "BackupSnapshot", entityId: snapId },
      }).catch(() => {});

      return json({ ok: true, restored });
    }

    // Default: create a fresh snapshot
    const data = await buildSnapshot();
    const counts = {
      categories: data.categories.length,
      products: data.products.length,
      orders: data.orders.length,
      customers: data.customers.length,
      settings: data.siteSettings.length,
    };
    const sizeBytes = Buffer.byteLength(JSON.stringify(data));
    const created = await prisma.backupSnapshot.create({
      data: {
        label: body.label ? String(body.label).slice(0, 100) : null,
        sizeBytes,
        counts,
        createdBy: adminId.slice(-6),
        data: data as any,
      },
    });

    // Prune old snapshots beyond KEEP_LAST
    const all = await prisma.backupSnapshot.findMany({ orderBy: { createdAt: "desc" }, select: { id: true } });
    if (all.length > KEEP_LAST) {
      const stale = all.slice(KEEP_LAST).map(b => b.id);
      for (const sid of stale) {
        await prisma.backupSnapshot.delete({ where: { id: sid } }).catch(() => {});
      }
    }

    return json({ ok: true, id: created.id, sizeBytes, counts });
  } catch (e: any) {
    return err(e?.message || "Backup failed", 500);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await authenticate(request, "settings:read");
  if (auth.response) return auth.response;
  if (auth.auth.role !== "owner") return err("Owner only", 403);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return err("Missing id");
    await prisma.backupSnapshot.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return err("Delete failed", 500);
  }
}
