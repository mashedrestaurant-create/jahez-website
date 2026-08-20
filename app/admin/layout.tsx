"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminStore, type Tab } from "../lib/admin-store";

const TABS: { id: Tab; label: string; icon: string; roles?: string[] }[] = [
  { id: "overview", label: "نظرة عامة", icon: "📊" },
  { id: "orders", label: "الطلبات", icon: "📋" },
  { id: "products", label: "المنتجات", icon: "🍽️" },
  { id: "categories", label: "الأقسام", icon: "📂" },
  { id: "locations", label: "الفروع", icon: "📍" },
  { id: "drivers", label: "الطيارين", icon: "🛵" },
  { id: "customers", label: "العملاء", icon: "👥" },
  { id: "offers", label: "العروض", icon: "🏷️" },
  { id: "payments", label: "طرق الدفع", icon: "💳" },
  { id: "media", label: "المكتبة", icon: "🖼️" },
  { id: "settings", label: "الإعدادات", icon: "⚙️" },
  { id: "content", label: "المحتوى", icon: "📝" },
  { id: "testimonials", label: "التقييمات", icon: "⭐" },
  { id: "users", label: "المستخدمين", icon: "🔑", roles: ["owner"] },
  { id: "activity", label: "سجل الحركات", icon: "📜", roles: ["owner"] },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, setAdmin, activeTab, setActiveTab, sidebarOpen, toggleSidebar, logout } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  const isLoginPage = pathname === "/admin/login";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f5f5" }}>
        <div className="text-lg" style={{ color: "#0a2d1d" }}>جاري التحميل...</div>
      </div>
    );
  }

  if (!admin || !authed) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fa" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "#0a2d1d" }}
      >
        <div className="p-5 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">جاهز — لوحة التحكم</h1>
          <p className="text-xs text-white/50 mt-1">{admin.name || admin.username} · {admin.role === "owner" ? "مالك" : admin.role === "admin" ? "مدير" : "مستقبل طلبات"}</p>
        </div>
        <nav className="p-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${activeTab === tab.id ? "text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              style={activeTab === tab.id ? { background: "rgba(255,255,255,0.1)" } : {}}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-3 border-t border-white/10">
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-white/50 hover:text-white text-sm rounded-lg hover:bg-white/5 transition">
            <span>🚪</span><span>خروج</span>
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
          <h2 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>
            {visibleTabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <div className="text-sm text-gray-500">{admin.username}</div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
