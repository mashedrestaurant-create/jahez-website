"use client";
import { create } from "zustand";

type Tab = "overview" | "analytics" | "orders" | "products" | "categories" | "locations" | "settings" | "payments" | "drivers";

interface AdminState {
  admin: { id: string; username: string; name?: string; role: string } | null;
  activeTab: Tab;
  sidebarOpen: boolean;
  setAdmin: (admin: AdminState["admin"]) => void;
  setActiveTab: (tab: Tab) => void;
  toggleSidebar: () => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  activeTab: "overview",
  sidebarOpen: false,
  setAdmin: (admin) => set({ admin }),
  setActiveTab: (activeTab) => set({ activeTab, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  logout: () => {
    fetch("/api/admin/auth/logout", { method: "POST" });
    set({ admin: null });
    window.location.href = "/admin/login";
  },
}));

export type { Tab };
