import webpush from "web-push";
import { prisma } from "./prisma";

const SUBSCRIPTION_SETTING = "adminPushSubscriptions";

export type AdminPushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

type StoredSubscription = {
  adminId: string;
  subscription: AdminPushSubscription;
  createdAt: string;
};

function subscriptionsFrom(value: unknown): StoredSubscription[] {
  if (!value || typeof value !== "object" || !("subscriptions" in value)) return [];
  const subscriptions = (value as { subscriptions?: unknown }).subscriptions;
  return Array.isArray(subscriptions) ? subscriptions as StoredSubscription[] : [];
}

async function readSubscriptions() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: SUBSCRIPTION_SETTING } });
  return subscriptionsFrom(setting?.value);
}

async function writeSubscriptions(subscriptions: StoredSubscription[]) {
  const value = { subscriptions };
  await prisma.siteSetting.upsert({
    where: { key: SUBSCRIPTION_SETTING },
    create: { key: SUBSCRIPTION_SETTING, value },
    update: { value },
  });
}

export async function saveAdminPushSubscription(adminId: string, subscription: AdminPushSubscription) {
  const subscriptions = await readSubscriptions();
  const next = subscriptions.filter((item) => item.subscription.endpoint !== subscription.endpoint);
  next.push({ adminId, subscription, createdAt: new Date().toISOString() });
  await writeSubscriptions(next);
}

export async function removeAdminPushSubscription(adminId: string, endpoint: string) {
  const subscriptions = await readSubscriptions();
  await writeSubscriptions(subscriptions.filter((item) =>
    !(item.adminId === adminId && item.subscription.endpoint === endpoint)
  ));
}

export async function sendAdminOrderPush(orderNumber: number) {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    console.warn("Admin push notifications are not configured.");
    return;
  }

  const subscriptions = await readSubscriptions();
  if (!subscriptions.length) return;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const payload = JSON.stringify({
    title: "طلب جديد من جاهز",
    body: `وصل طلب جديد رقم #${orderNumber}`,
    url: "/admin",
    tag: `jahez-order-${orderNumber}`,
  });

  const results = await Promise.all(subscriptions.map(async (item) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await webpush.sendNotification(item.subscription, payload, { TTL: 300, urgency: "high", timeout: 10000 });
        return null;
      } catch (error) {
        const statusCode = typeof error === "object" && error !== null && "statusCode" in error
          ? Number((error as { statusCode: unknown }).statusCode)
          : 0;
        if (statusCode === 404 || statusCode === 410) return item.subscription.endpoint;
        if (statusCode >= 400 && statusCode < 500) {
          console.error("Admin push rejected", { statusCode, orderNumber });
          return null;
        }
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        else console.error("Admin push delivery failed after retries", { statusCode, orderNumber });
      }
    }
    return null;
  }));

  const expired = new Set(results.filter((endpoint): endpoint is string => Boolean(endpoint)));
  if (expired.size > 0) {
    await writeSubscriptions(subscriptions.filter((item) => !expired.has(item.subscription.endpoint)));
  }
}
