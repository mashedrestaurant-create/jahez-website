"use client";
import { create } from "zustand";

type Tab = "overview" | "analytics" | "orders" | "products" | "categories" | "locations" | "settings" | "payments" | "drivers" | "users" | "media" | "offers" | "activity";

interface AdminState {
  admin: { id: string; username: string; name?: string; role: string } | null;
  activeTab: Tab;
  sidebarOpen: boolean;
  lang: "ar" | "en";
  setAdmin: (admin: AdminState["admin"]) => void;
  setActiveTab: (tab: Tab) => void;
  setLang: (lang: "ar" | "en") => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  activeTab: "overview",
  sidebarOpen: false,
  lang: "en",
  setAdmin: (admin) => set({ admin }),
  setActiveTab: (activeTab) => set({ activeTab, sidebarOpen: false }),
  setLang: (lang) => set({ lang }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  logout: () => {
    fetch("/api/admin/auth/logout", { method: "POST" });
    set({ admin: null });
    window.location.href = "/admin/login";
  },
}));

export type { Tab };
