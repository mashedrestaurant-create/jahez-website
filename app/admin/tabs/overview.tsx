"use client";

import { useEffect, useRef, useState } from "react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "جديد", color: "#2563eb", bg: "#eff6ff" },
  confirmed: { label: "مؤكد", color: "#ca8a04", bg: "#fefce8" },
  preparing: { label: "قيد التحضير", color: "#ea580c", bg: "#fff7ed" },
  ready: { label: "چاهِز", color: "#16a34a", bg: "#f0fdf4" },
  out_for_delivery: { label: "قيد التوصيل", color: "#9333ea", bg: "#faf5ff" },
  completed: { label: "مكتمل", color: "#059669", bg: "#ecfdf5" },
  cancelled: { label: "ملغي", color: "#dc2626", bg: "#fef2f2" },
};

type StatsData = {
  todayRevenue: number;
  todayOrders: number;
  newOrders: number;
  totalCustomers: number;
  onlineDrivers: number;
  recentOrders: Array<{
    id: string;
    orderNumber: number;
    customerName: string;
    customerPhone: string;
    status: string;
    total: number;
    createdAt: string;
  }>;
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span
      style={{ color: s.color, backgroundColor: s.bg }}
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    >
      {s.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OverviewTab() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("fetch");
        return r.json();
      })
      .then((data) => {
        if (!mounted.current) return;
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted.current) return;
        setError("تعذر تحميل البيانات");
        setLoading(false);
      });
    return () => { mounted.current = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-gray-400">جاري تحميل الإحصائيات...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-lg text-red-500">{error || "خطأ غير معروف"}</div>
      </div>
    );
  }

  const statCards = [
    {
      label: "إيرادات اليوم",
      value: `${stats.todayRevenue.toLocaleString("ar-EG")} ج.م`,
      icon: "💰",
    },
    {
      label: "طلبات اليوم",
      value: stats.todayOrders.toLocaleString("ar-EG"),
      icon: "📦",
    },
    {
      label: "طلبات جديدة",
      value: stats.newOrders.toLocaleString("ar-EG"),
      icon: "🆕",
      pulse: stats.newOrders > 0,
    },
    {
      label: "إجمالي العملاء",
      value: stats.totalCustomers.toLocaleString("ar-EG"),
      icon: "👥",
    },
    {
      label: "الطيارين المتصلين",
      value: stats.onlineDrivers.toLocaleString("ar-EG"),
      icon: "🏍️",
    },
  ];

  return (
    <div dir="rtl" className="space-y-6 p-1">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="relative rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-2 text-sm text-gray-500">{card.label}</div>
            <div
              className="text-2xl font-bold"
              style={{ color: "#0a2d1d" }}
            >
              {card.value}
            </div>
            {card.pulse && (
              <span className="absolute left-3 top-3 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: "#ef4444" }} />
                <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
              </span>
            )}
            <div className="mt-1 text-xl">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-lg font-bold" style={{ color: "#0a2d1d" }}>
            آخر الطلبات
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="px-5 py-3 font-medium">رقم الطلب</th>
                <th className="px-5 py-3 font-medium">العميل</th>
                <th className="px-5 py-3 font-medium">الهاتف</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">الإجمالي</th>
                <th className="px-5 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    لا يوجد طلبات بعد
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-5 py-3 font-mono font-semibold" style={{ color: "#0a2d1d" }}>
                      #{order.orderNumber}
                    </td>
                    <td className="px-5 py-3">{order.customerName}</td>
                    <td className="px-5 py-3" dir="ltr">
                      {order.customerPhone}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 font-semibold" style={{ color: "#0a2d1d" }}>
                      {Number(order.total).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
