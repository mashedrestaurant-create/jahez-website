import { prisma } from "../../../lib/prisma";

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
    categories, products,
    addOns, productAddOns: await prisma.productAddOn.findMany(),
    optionGroups, options, productOptionGroups: await prisma.productOptionGroup.findMany(),
    builderSteps, builderOptions, offers, promoCodes, deliveryZones,
    paymentMethods, locations, siteSettings, siteContent, testimonials,
    customers, drivers, orders, orderItems, orderStatusHistory, paymentAttempts,
  };
}

export async function GET(request: Request) {
  // Vercel Cron sends: Authorization: Bearer $CRON_SECRET
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  try {
    const data = await buildSnapshot();
    const counts = {
      categories: data.categories.length,
      products: data.products.length,
      orders: data.orders.length,
      customers: data.customers.length,
      settings: data.siteSettings.length,
    };
    const sizeBytes = Buffer.byteLength(JSON.stringify(data));
    await prisma.backupSnapshot.create({
      data: { label: "auto-daily", sizeBytes, counts, createdBy: "cron", data: data as any },
    });

    const all = await prisma.backupSnapshot.findMany({ orderBy: { createdAt: "desc" }, select: { id: true } });
    if (all.length > KEEP_LAST) {
      for (const b of all.slice(KEEP_LAST)) {
        await prisma.backupSnapshot.delete({ where: { id: b.id } }).catch(() => {});
      }
    }

    return Response.json({ ok: true, sizeBytes, counts, kept: Math.min(all.length + 1, KEEP_LAST) });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
