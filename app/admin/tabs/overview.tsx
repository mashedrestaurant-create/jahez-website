"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminStore } from "../../lib/admin-store";

type StatsData = {
  todayRevenue: number;
  monthRevenue: number;
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

const STATUS_MAP: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  new: { en: "New", ar: "جديد", color: "#2563eb", bg: "#eff6ff" },
  confirmed: { en: "Confirmed", ar: "مؤكد", color: "#7c3aed", bg: "#f3e8ff" },
  preparing: { en: "Preparing", ar: "قيد التحضير", color: "#ea580c", bg: "#fff7ed" },
  ready: { en: "Ready", ar: "جاهز", color: "#a16207", bg: "#fef9c3" },
  out_for_delivery: { en: "Out for delivery", ar: "قيد التوصيل", color: "#9333ea", bg: "#faf5ff" },
  completed: { en: "Completed", ar: "مكتمل", color: "#059669", bg: "#ecfdf5" },
  cancelled: { en: "Cancelled", ar: "ملغي", color: "#dc2626", bg: "#fef2f2" },
};

function money(value: number, lang: "ar" | "en") {
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value) || 0);
  return lang === "ar" ? formatted + " ج.م" : "EGP " + formatted;
}

export function OverviewTab() {
  const lang = useAdminStore((s) => s.lang);
  const english = lang === "en";
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    fetch("/api/admin/stats")
      .then((r) => { if (!r.ok) throw new Error("fetch"); return r.json(); })
      .then((data) => {
        if (!mounted.current) return;
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted.current) return;
        setError(english ? "Could not load dashboard data." : "تعذر تحميل بيانات لوحة الإدارة.");
        setLoading(false);
      });
    return () => { mounted.current = false; };
  }, [english]);

  if (loading) return <div className="jahez-dashboard-message">{english ? "Loading dashboard..." : "جاري تحميل لوحة الإدارة..."}</div>;
  if (error || !stats) return <div className="jahez-dashboard-message is-error">{error || (english ? "Something went wrong." : "حدث خطأ غير متوقع.")}</div>;

  const cards = [
    { label: english ? "Today's Revenue" : "إيرادات اليوم", value: money(stats.todayRevenue, lang), tone: "green" },
    { label: english ? "Month's Revenue" : "إيرادات الشهر", value: money(stats.monthRevenue, lang), tone: "blue" },
    { label: english ? "Today's Orders" : "طلبات اليوم", value: Number(stats.todayOrders || 0).toLocaleString(english ? "en-EG" : "ar-EG"), tone: "orange" },
    { label: english ? "New Orders" : "طلبات جديدة", value: Number(stats.newOrders || 0).toLocaleString(english ? "en-EG" : "ar-EG"), tone: "purple" },
  ];

  return (
    <section className="jahez-dashboard" dir={english ? "ltr" : "rtl"}>
      <div className="jahez-stat-grid">
        {cards.map((card) => (
          <article key={card.label} className={"jahez-stat-card tone-" + card.tone}>
            <span>{card.label}</span>
            <strong dir="ltr">{card.value}</strong>
          </article>
        ))}
      </div>

      <section className="jahez-recent-orders">
        <h2>{english ? "Recent Orders" : "أحدث الطلبات"}</h2>
        <div className="jahez-orders-table-wrap">
          <table className="jahez-orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{english ? "Customer" : "العميل"}</th>
                <th>{english ? "Amount" : "المبلغ"}</th>
                <th>{english ? "Status" : "الحالة"}</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="jahez-empty-orders">{english ? "No orders yet" : "لا توجد طلبات بعد"}</td></tr>
              ) : stats.recentOrders.slice(0, 5).map((order) => {
                const status = STATUS_MAP[order.status];
                return (
                  <tr key={order.id}>
                    <td className="jahez-order-number"><bdi dir="ltr">JH-{String(order.orderNumber).padStart(6, "0")}</bdi></td>
                    <td>{order.customerName || (english ? "Guest" : "عميل")}</td>
                    <td><bdi dir="ltr">{money(order.total, lang)}</bdi></td>
                    <td><span className="jahez-status-badge" style={{ color: status?.color || "#6b7280", background: status?.bg || "#f3f4f6" }}>{status ? (english ? status.en : status.ar) : order.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
