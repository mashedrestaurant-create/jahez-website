"use client";
import { useEffect } from "react";
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

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/admin/auth/me")
      .then((r) => { if (!r.ok) throw new Error("unauth"); return r.json(); })
      .then((d) => setAdmin(d.admin))
      .catch(() => { window.location.href = "/admin/login"; });
  }, [isLoginPage, setAdmin]);

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
          <div className="jahez-workspace-pill"><span />{english ? "Admin workspace" : "مساحة الإدارة"}</div>
        </header>
        <main className="jahez-admin-content">
          {activeTab === "overview" && <h1 className="jahez-page-title">{english ? "Overview" : "نظرة عامة"}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}
