"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminStore, type Tab } from "../lib/admin-store";

const TABS_AR: { id: Tab; label: string; icon: string; roles?: string[] }[] = [
  { id: "overview", label: "نظرة عامة", icon: "📊" },
  { id: "analytics", label: "التحليلات", icon: "📈" },
  { id: "orders", label: "الطلبات", icon: "📋" },
  { id: "products", label: "المنتجات", icon: "🍽️" },
  { id: "categories", label: "الأقسام", icon: "📂" },
  { id: "drivers", label: "الطيارين", icon: "🛵" },
  { id: "locations", label: "الفروع", icon: "📍" },
  { id: "payments", label: "طرق الدفع", icon: "💳" },
  { id: "settings", label: "الإعدادات", icon: "⚙️" },
  { id: "users", label: "المستخدمين", icon: "👥", roles: ["owner"] },
];

const TABS_EN: { id: Tab; label: string; icon: string; roles?: string[] }[] = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "orders", label: "Orders", icon: "📋" },
  { id: "products", label: "Products", icon: "🍽️" },
  { id: "categories", label: "Categories", icon: "📂" },
  { id: "drivers", label: "Drivers", icon: "🛵" },
  { id: "locations", label: "Locations", icon: "📍" },
  { id: "payments", label: "Payments", icon: "💳" },
  { id: "settings", label: "Settings", icon: "⚙️" },
  { id: "users", label: "Users", icon: "👥", roles: ["owner"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, setAdmin, activeTab, setActiveTab, sidebarOpen, toggleSidebar, logout } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const isLoginPage = pathname === "/admin/login";

  const TABS = lang === "ar" ? TABS_AR : TABS_EN;

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }
    fetch("/api/admin/auth/me")
      .then((r) => { if (!r.ok) throw new Error("unauth"); return r.json(); })
      .then((d) => { setAdmin(d.admin); setAuthed(true); setLoading(false); })
      .catch(() => { window.location.href = "/admin/login"; });
  }, [isLoginPage]);

  const visibleTabs = TABS.filter((t) => !t.roles || (admin?.role && t.roles.includes(admin.role)));

  const handleTabClick = useCallback((tab: Tab) => {
    setActiveTab(tab);
  }, [setActiveTab]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5", fontFamily: "Cairo, sans-serif" }}>
        <div className="text-lg" style={{ color: "#0a2d1d" }}>{lang === "ar" ? "جاري التحميل..." : "Loading..."}</div>
      </div>
    );
  }

  if (!admin || !authed) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fa", fontFamily: "Cairo, sans-serif" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#0a2d1d" }}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold" style={{ color: "#ffffff" }}>{lang === "ar" ? "چاهِز — لوحة التحكم" : "Jahez — Admin"}</h1>
            <button
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="text-xs px-2 py-1 rounded-lg font-bold transition-colors"
              style={{ background: "rgba(255,255,255,0.15)", color: "#c9a23b" }}
            >
              {lang === "ar" ? "EN" : "عربي"}
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            {admin.name || admin.username} · {admin.role === "owner" ? (lang === "ar" ? "مالك" : "Owner") : admin.role === "admin" ? (lang === "ar" ? "مدير" : "Admin") : (lang === "ar" ? "مستقبل طلبات" : "Receiver")}
          </p>
        </div>
        <nav className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${activeTab === tab.id ? "font-semibold" : "hover:bg-white/10"}`}
              style={{
                color: activeTab === tab.id ? "#ffffff" : "rgba(255,255,255,0.85)",
                background: activeTab === tab.id ? "rgba(255,255,255,0.15)" : "transparent",
              }}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <span>🚪</span><span>{lang === "ar" ? "خروج" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={toggleSidebar} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-gray-600 hover:text-gray-900">☰</button>
          <h2 className="text-lg font-semibold" style={{ color: "#0a2d1d", fontFamily: "Cairo, sans-serif" }}>
            {visibleTabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <div className="text-sm" style={{ color: "#6b7280" }}>{admin.username}</div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
