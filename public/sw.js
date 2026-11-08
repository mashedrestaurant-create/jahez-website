self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {}
  const title = payload.title || "طلب جديد من جاهز";
  const options = {
    body: payload.body || "وصل طلب جديد. افتح لوحة الإدارة للتفاصيل.",
    icon: "/assets/jahez/logo-square.jpg",
    badge: "/assets/jahez/logo-square.jpg",
    tag: payload.tag || "jahez-new-order",
    renotify: true,
    requireInteraction: true,
    data: { url: payload.url || "/admin" },
    vibrate: [250, 100, 250],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        existing.navigate(target);
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
