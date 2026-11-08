"use client";
import "./admin.css";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAdminStore, type Tab } from "../lib/admin-store";

const NAV: { id: Tab; en: string; ar: string; icon: string; roles?: string[] }[] = [
  { id: "overview", en: "Overview", ar: "نظرة عامة", icon: "overview" },
  { id: "analytics", en: "Reports", ar: "التقارير", icon: "reports" },
  { id: "orders", en: "Orders", ar: "الطلبات", icon: "orders" },
  { id: "categories", en: "Categories", ar: "الأقسام", icon: "categories" },
  { id: "locations", en: "Locations", ar: "مناطق التوصيل", icon: "locations" },
  { id: "settings", en: "Settings", ar: "الإعدادات", icon: "settings" },
  { id: "media", en: "Media", ar: "الوسائط", icon: "media" },
  { id: "products", en: "Products", ar: "المنتجات", icon: "products" },
  { id: "payments", en: "Payments", ar: "المدفوعات", icon: "payments" },
  { id: "offers", en: "Promo Codes", ar: "أكواد الخصم", icon: "offers" },
  { id: "drivers", en: "Drivers", ar: "السائقون", icon: "drivers" },
  { id: "users", en: "Users & Roles", ar: "المستخدمون والصلاحيات", icon: "users", roles: ["owner"] },
  { id: "activity", en: "Activity Log", ar: "سجل النشاط", icon: "activity", roles: ["owner"] },
];

type NewOrderNotice = { orderNumber: number; customerName: string; count: number };

function readLastSeenOrderNumber() {
  try { return Number(window.localStorage.getItem("jahez-admin-last-seen-order") || 0); } catch { return 0; }
}

function storeLastSeenOrderNumber(orderNumber: number) {
  try { window.localStorage.setItem("jahez-admin-last-seen-order", String(orderNumber)); } catch {}
}

function playAdminOrderTone(context: AudioContext | null) {
  try {
    if (!context || context.state !== "running") return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.setValueAtTime(660, context.currentTime + 0.22);
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
    gain.gain.setValueAtTime(0.001, context.currentTime + 0.24);
    gain.gain.exponentialRampToValueAtTime(0.32, context.currentTime + 0.26);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.48);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
  } catch {}
}

function NavIcon({ name }: { name: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" {...common}>
      {name === "overview" && <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>}
      {name === "reports" && <><path d="M5 20V11M12 20V5M19 20v-7" /><path d="M3 20h18" /></>}
      {name === "orders" && <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>}
      {name === "categories" && <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="7" cy="6" r="1" fill="currentColor" /><circle cx="7" cy="12" r="1" fill="currentColor" /><circle cx="7" cy="18" r="1" fill="currentColor" /></>}
      {name === "locations" && <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>}
      {name === "settings" && <><circle cx="12" cy="12" r="3" /><path d="m19 13.5 1.4 1.1-1.4 2.4-1.7-.6a7.8 7.8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a7.8 7.8 0 0 1-1.7-1l-1.7.6-1.4-2.4L7 13.5a7.6 7.6 0 0 1 0-2l-1.4-1.1L7 8l1.7.6a7.8 7.8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a7.8 7.8 0 0 1 1.7 1l1.7-.6 1.4 2.4L19 11.5a7.6 7.6 0 0 1 0 2Z" /></>}
      {name === "media" && <><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="9" cy="9" r="1.5" /><path d="m20 15-5-5L6 19" /></>}
      {name === "products" && <><path d="M5 7h14l-1 13H6L5 7Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /><path d="M9 12h.01M15 12h.01" /></>}
      {name === "payments" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h4" /></>}
      {name === "offers" && <><path d="m20 13-7 7-10-10V4h6l11 9Z" /><circle cx="7.5" cy="7.5" r="1" /></>}
      {name === "drivers" && <><circle cx="6" cy="17" r="2" /><circle cx="18" cy="17" r="2" /><path d="m8 17 3-8h4l3 8M10 13h7M11 9l-2-3H6" /></>}
      {name === "users" && <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 15a5 5 0 0 1 3.5 5" /></>}
      {name === "activity" && <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5" /><path d="M4 4v4.5h4.5M12 8v4l3 2" /></>}
      {name === "arrow" && <><path d="M5 12h14M13 6l6 6-6 6" /></>}
      {name === "menu" && <><path d="M4 7h16M4 12h16M4 17h16" /></>}
    </svg>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, setAdmin, activeTab, setActiveTab, sidebarOpen, toggleSidebar, logout, lang, setLang } = useAdminStore();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [newOrderNotice, setNewOrderNotice] = useState<NewOrderNotice | null>(null);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const lastSeenOrderNumber = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if ("Notification" in window) setNotificationPermission(Notification.permission);
    else setNotificationPermission("unsupported");
    const unlockAudio = () => {
      try {
        if (!audioContextRef.current) audioContextRef.current = new window.AudioContext();
        void audioContextRef.current.resume();
      } catch {}
    };
    window.addEventListener("pointerdown", unlockAudio);
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, []);

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/admin/auth/me")
      .then((r) => { if (!r.ok) throw new Error("unauth"); return r.json(); })
      .then((d) => setAdmin(d.admin))
      .catch(() => { window.location.href = "/admin/login"; });
  }, [isLoginPage, setAdmin]);

  useEffect(() => {
    if (isLoginPage || !admin) return;
    let stopped = false;
    const pollOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders?limit=100", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (stopped) return;
        const orders = Array.isArray(data.items) ? data.items : [];
        setNewOrderCount(orders.filter((order: { status?: string }) => order.status === "new").length);
        const highest = orders.reduce((max: number, order: { orderNumber?: number }) => Math.max(max, Number(order.orderNumber) || 0), 0);
        if (lastSeenOrderNumber.current === null) {
          const stored = readLastSeenOrderNumber();
          const initialLastSeen = stored > 0 ? stored : highest;
          lastSeenOrderNumber.current = initialLastSeen;
          if (highest <= initialLastSeen) {
            storeLastSeenOrderNumber(highest);
            return;
          }
        }
        const lastSeen = lastSeenOrderNumber.current;
        const freshOrders = orders
          .filter((order: { orderNumber?: number }) => (Number(order.orderNumber) || 0) > lastSeen)
          .sort((a: { orderNumber?: number }, b: { orderNumber?: number }) => (Number(a.orderNumber) || 0) - (Number(b.orderNumber) || 0));
        if (highest > lastSeen) {
          lastSeenOrderNumber.current = highest;
          storeLastSeenOrderNumber(highest);
        }
        if (!freshOrders.length) return;
        const newest = freshOrders[freshOrders.length - 1];
        const notice: NewOrderNotice = {
          orderNumber: Number(newest.orderNumber) || 0,
          customerName: newest.customerName || (lang === "ar" ? "عميل جديد" : "New customer"),
          count: freshOrders.length,
        };
        setNewOrderNotice(notice);
        playAdminOrderTone(audioContextRef.current);
        if ("vibrate" in navigator) navigator.vibrate([220, 90, 220]);
        if ("Notification" in window && Notification.permission === "granted") {
          const desktopNotice = new Notification(lang === "ar" ? "طلب جديد من جاهز" : "New JAHEZ order", {
            body: "#" + notice.orderNumber + " · " + notice.customerName,
            tag: "jahez-order-" + notice.orderNumber,
          });
          desktopNotice.onclick = () => {
            window.focus();
            setActiveTab("orders");
            desktopNotice.close();
          };
        }
      } catch {}
    };
    void pollOrders();
    const timer = window.setInterval(() => { void pollOrders(); }, 8000);
    const onVisibility = () => { if (document.visibilityState === "visible") void pollOrders(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [admin?.id, isLoginPage, lang, setActiveTab]);

  if (isLoginPage) return <>{children}</>;

  const visibleTabs = NAV.filter((t) => !t.roles || (admin?.role && t.roles.includes(admin.role)));
  const title = visibleTabs.find((t) => t.id === activeTab);
  const english = lang === "en";

  if (!admin) {
    return <div className="jahez-admin-loading">{english ? "Loading your workspace..." : "جاري تحميل لوحة الإدارة..."}</div>;
  }

  return (
    <div className={"jahez-admin-shell" + (english ? " is-english" : " is-arabic")} dir={english ? "ltr" : "rtl"}>
      <aside className={"jahez-sidebar" + (sidebarOpen ? " is-open" : "")}>
        <div className="jahez-brand-card">
          <div className="jahez-brand-mark">
            <img src="/assets/jahez/logo-square.jpg" alt="" />
          </div>
          <div className="jahez-brand-copy">
            <strong>{english ? "Jahez" : "جاهز"}</strong>
            <span>{english ? "ADMIN WORKSPACE" : "مساحة الإدارة"}</span>
          </div>
          <button className="jahez-language-button" onClick={() => setLang(english ? "ar" : "en")} aria-label={english ? "Switch to Arabic" : "Switch to English"}>
            {english ? "AR" : "EN"}
          </button>
        </div>

        <div className="jahez-nav-label">{english ? "STORE MANAGEMENT" : "إدارة المتجر"}</div>
        <nav className="jahez-nav" aria-label={english ? "Store management" : "إدارة المتجر"}>
          {visibleTabs.map((tab) => (
            <button key={tab.id} className={"jahez-nav-item" + (activeTab === tab.id ? " is-active" : "")} onClick={() => setActiveTab(tab.id)}>
              <span className="jahez-nav-icon"><NavIcon name={tab.icon} /></span>
              <span>{english ? tab.en : tab.ar}</span>
            </button>
          ))}
        </nav>

        <a href="/" className="jahez-back-link">
          <NavIcon name="arrow" />
          <span>{english ? "Back to site" : "العودة للموقع"}</span>
        </a>
      </aside>

      {sidebarOpen && <button className="jahez-sidebar-overlay" aria-label="Close navigation" onClick={toggleSidebar} />}
      <div className="jahez-admin-main">
        <header className="jahez-admin-header">
          <button className="jahez-menu-button" onClick={toggleSidebar} aria-label={english ? "Open navigation" : "فتح القائمة"}><NavIcon name="menu" /></button>
          <div className="jahez-page-crumb">
            <span>{english ? "JAHEZ / OPERATIONS" : "جاهز / الإدارة"}</span>
            <strong>{title ? (english ? title.en : title.ar) : "Overview"}</strong>
          </div>
          {notificationPermission === "default" && (
            <button className="jahez-enable-alerts" onClick={async () => {
              if ("Notification" in window) setNotificationPermission(await Notification.requestPermission());
            }}>{english ? "Enable alerts" : "تفعيل إشعارات الجهاز"}</button>
          )}
          <div className="jahez-workspace-pill"><span />{english ? "Admin workspace" : "مساحة الإدارة"}{newOrderCount > 0 && <b className="jahez-order-count">{newOrderCount}</b>}</div>
        </header>
        <main className="jahez-admin-content">
          {activeTab === "overview" && <h1 className="jahez-page-title">{english ? "Overview" : "نظرة عامة"}</h1>}
          {newOrderNotice && (
            <div className="jahez-order-toast" role="alert" aria-live="assertive" dir={english ? "ltr" : "rtl"}>
              <button className="jahez-toast-close" onClick={() => setNewOrderNotice(null)} aria-label={english ? "Dismiss notification" : "إغلاق التنبيه"}>×</button>
              <strong>{english ? (newOrderNotice.count > 1 ? newOrderNotice.count + " new orders" : "New order received") : (newOrderNotice.count > 1 ? newOrderNotice.count + " طلبات جديدة" : "وصلك طلب جديد")}</strong>
              <span>#{newOrderNotice.orderNumber} · {newOrderNotice.customerName}</span>
              <button className="jahez-toast-action" onClick={() => { setNewOrderNotice(null); setActiveTab("orders"); }}>
                {english ? "View orders" : "عرض الطلبات"}
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
