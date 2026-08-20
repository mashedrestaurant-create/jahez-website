"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type AnalyticsData = {
  funnel: {
    pageviews: number;
    addToCart: number;
    checkoutStart: number;
    paymentAttempt: number;
    paymentSuccess: number;
    paymentFailed: number;
    paymentCancelled: number;
  };
  orders: {
    total: number;
    revenue: number;
    paid: number;
    cash: number;
    instapay: number;
    paymob: number;
    delivery: number;
    pickup: number;
  };
  visitors: { unique: number; totalCustomers: number };
  dailyOrders: { date: string; count: number; revenue: number }[];
  dailyEvents: { date: string; event: string; count: number }[];
  recentEvents: { id: string; sessionId: string; event: string; page: string | null; meta: unknown; createdAt: string }[];
  topPages: { page: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  range: string;
};

const RANGE_OPTIONS = [
  { value: "24h", labelAr: "آخر 24 ساعة", labelEn: "Last 24h" },
  { value: "7d", labelAr: "آخر 7 أيام", labelEn: "Last 7 days" },
  { value: "30d", labelAr: "آخر 30 يوم", labelEn: "Last 30 days" },
  { value: "90d", labelAr: "آخر 90 يوم", labelEn: "Last 90 days" },
];

const EVENT_LABELS_AR: Record<string, string> = {
  pageview: "زيارات صفحة",
  add_to_cart: "أضف للسلة",
  checkout_start: "بدء الطلب",
  payment_attempt: "محاولة الدفع",
  payment_success: "دفع ناجح",
  payment_failed: "دفع فاشل",
  payment_cancelled: "إلغاء الدفع",
};

const STATUS_COLORS: Record<string, string> = {
  pageview: "#3b82f6",
  add_to_cart: "#f59e0b",
  checkout_start: "#8b5cf6",
  payment_attempt: "#6366f1",
  payment_success: "#10b981",
  payment_failed: "#ef4444",
  payment_cancelled: "#9ca3af",
};

function BarChart({ data, maxVal }: { data: { label: string; value: number; color?: string }[]; maxVal?: number }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs w-28 text-left shrink-0" dir="ltr" style={{ color: "#6b7280" }}>{d.label}</span>
          <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(d.value / max) * 100}%`, background: d.color || "#0a2d1d" }} />
          </div>
          <span className="text-xs font-bold w-12 text-left" style={{ color: "#374151" }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(d.value / max) * 100}%`, background: color, minHeight: d.value > 0 ? 2 : 0 }} />
          <span className="text-[9px]" style={{ color: "#9ca3af" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function FunnelBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span style={{ color: "#374151" }}>{label}</span>
        <span className="font-bold" style={{ color: "#0a2d1d" }}>{value} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "#f3f4f6" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function AnalyticsTab({ lang = "ar" }: { lang?: "ar" | "en" }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  const isAr = lang === "ar";

  const fetchAnalytics = useCallback(async (r: string) => {
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`, { credentials: "include" });
      if (!res.ok) {
        const d = await res.json();
        setNotice(d.error || "Error");
        return;
      }
      const d = await res.json();
      if (!mounted.current) return;
      setData(d);
    } catch {
      setNotice("تعذر تحميل البيانات");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchAnalytics(range).finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [range, fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#c9a23b", borderTopColor: "transparent" }} />
          <p className="text-sm font-bold" style={{ color: "#0a2d1d" }}>{isAr ? "جاري تحميل التحليلات..." : "Loading analytics..."}</p>
        </div>
      </div>
    );
  }

  if (notice && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{notice}</p>
        <button onClick={() => { setNotice(""); fetchAnalytics(range); }} className="mt-3 text-sm font-bold" style={{ color: "#c9a23b" }}>{isAr ? "إعادة المحاولة" : "Retry"}</button>
      </div>
    );
  }

  if (!data) return null;

  const funnelTotal = data.funnel.pageviews || 1;

  const paymentBreakdown = [
    { label: isAr ? "كاش" : "Cash", value: data.orders.cash, color: "#10b981" },
    { label: isAr ? "إنستاباي" : "Instapay", value: data.orders.instapay, color: "#3b82f6" },
    { label: "Paymob", value: data.orders.paymob, color: "#8b5cf6" },
  ];

  const fulfillmentBreakdown = [
    { label: isAr ? "توصيل" : "Delivery", value: data.orders.delivery, color: "#0a2d1d" },
    { label: isAr ? "استلام" : "Pickup", value: data.orders.pickup, color: "#c9a23b" },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = data.hourlyDistribution.find(h => h.hour === i);
    return { label: `${i}`, value: found?.count || 0 };
  });

  const dailyRevenueMap = new Map<string, number>();
  const dailyCountMap = new Map<string, number>();
  for (const d of data.dailyOrders) {
    dailyRevenueMap.set(d.date, d.revenue);
    dailyCountMap.set(d.date, d.count);
  }
  const allDates = [...new Set([...dailyRevenueMap.keys(), ...dailyCountMap.keys()])].sort();
  const revenueChartData = allDates.map(d => ({
    label: d.slice(5),
    value: dailyRevenueMap.get(d) || 0,
  }));
  const orderChartData = allDates.map(d => ({
    label: d.slice(5),
    value: dailyCountMap.get(d) || 0,
  }));

  const eventTypes = ["pageview", "add_to_cart", "checkout_start", "payment_attempt", "payment_success", "payment_failed"];
  const dailyEventMap = new Map<string, Map<string, number>>();
  for (const de of data.dailyEvents) {
    if (!dailyEventMap.has(de.date)) dailyEventMap.set(de.date, new Map());
    dailyEventMap.get(de.date)!.set(de.event, de.count);
  }

  return (
    <div dir="rtl" className="space-y-5 p-1" style={{ fontFamily: "Cairo, sans-serif" }}>
      {notice && (
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold shadow-sm" style={{ color: "#0a2d1d" }}>
          {notice}
          <button onClick={() => setNotice("")} className="mr-2 text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Range selector */}
      <div className="flex justify-end gap-2">
        {RANGE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setRange(opt.value); setLoading(true); fetchAnalytics(opt.value).finally(() => setLoading(false)); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${range === opt.value ? "text-white" : "bg-white border border-gray-200 hover:bg-gray-50"}`}
            style={range === opt.value ? { background: "#0a2d1d" } : { color: "#374151" }}
          >
            {isAr ? opt.labelAr : opt.labelEn}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: isAr ? "الزوار الفريدون" : "Unique Visitors", value: data.visitors.unique, icon: "👥" },
          { label: isAr ? "إجمالي الطلبات" : "Total Orders", value: data.orders.total, icon: "📦" },
          { label: isAr ? "الإيرادات" : "Revenue", value: `${data.orders.revenue.toLocaleString()} ج.م`, icon: "💰" },
          { label: isAr ? "العملاء" : "Customers", value: data.visitors.totalCustomers, icon: "👤" },
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: "#0a2d1d" }}>{kpi.value}</p>
            <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "قمع التحويل" : "Conversion Funnel"}</h3>
        <div className="space-y-3">
          <FunnelBar label={isAr ? "الزيارات" : "Pageviews"} value={data.funnel.pageviews} total={funnelTotal} color="#3b82f6" />
          <FunnelBar label={isAr ? "أضف للسلة" : "Add to Cart"} value={data.funnel.addToCart} total={funnelTotal} color="#f59e0b" />
          <FunnelBar label={isAr ? "بدء الطلب" : "Checkout Start"} value={data.funnel.checkoutStart} total={funnelTotal} color="#8b5cf6" />
          <FunnelBar label={isAr ? "محاولة الدفع" : "Payment Attempt"} value={data.funnel.paymentAttempt} total={funnelTotal} color="#6366f1" />
          <FunnelBar label={isAr ? "دفع ناجح" : "Payment Success"} value={data.funnel.paymentSuccess} total={funnelTotal} color="#10b981" />
          <FunnelBar label={isAr ? "دفع فاشل" : "Payment Failed"} value={data.funnel.paymentFailed} total={funnelTotal} color="#ef4444" />
        </div>
      </div>

      {/* Daily Revenue Chart */}
      {revenueChartData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "الإيرادات اليومية (ج.م)" : "Daily Revenue (EGP)"}</h3>
          <MiniBarChart data={revenueChartData} color="#0a2d1d" />
        </div>
      )}

      {/* Daily Orders Chart */}
      {orderChartData.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "الطلبات اليومية" : "Daily Orders"}</h3>
          <MiniBarChart data={orderChartData} color="#c9a23b" />
        </div>
      )}

      {/* Hourly Distribution */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "التوزيع بالساعات" : "Hourly Distribution"}</h3>
        <MiniBarChart data={hourlyData} color="#8b5cf6" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Payment Breakdown */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "طرق الدفع" : "Payment Methods"}</h3>
          <BarChart data={paymentBreakdown} />
        </div>

        {/* Fulfillment */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "نوع الطلب" : "Order Type"}</h3>
          <BarChart data={fulfillmentBreakdown} />
        </div>
      </div>

      {/* Top Pages */}
      {data.topPages.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "الصفحات الأكثر زيارة" : "Top Pages"}</h3>
          <BarChart data={data.topPages.map(p => ({ label: p.page, value: p.count, color: "#0a2d1d" }))} />
        </div>
      )}

      {/* Recent Events Table */}
      {data.recentEvents.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0a2d1d" }}>{isAr ? "آخر الأحداث" : "Recent Events"}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "#9ca3af" }}>
                  <th className="px-3 py-2 text-right">{isAr ? "الحدث" : "Event"}</th>
                  <th className="px-3 py-2 text-right">{isAr ? "الصفحة" : "Page"}</th>
                  <th className="px-3 py-2 text-right">Session</th>
                  <th className="px-3 py-2 text-right">{isAr ? "الوقت" : "Time"}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.slice(0, 50).map((e) => (
                  <tr key={e.id} className="border-t border-gray-50">
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: STATUS_COLORS[e.event] || "#6b7280" }}>
                        {isAr ? (EVENT_LABELS_AR[e.event] || e.event) : e.event}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color: "#374151" }}>{e.page || "-"}</td>
                    <td className="px-3 py-2" style={{ color: "#9ca3af" }}>{e.sessionId.slice(0, 12)}...</td>
                    <td className="px-3 py-2" style={{ color: "#9ca3af" }}>{new Date(e.createdAt).toLocaleString(isAr ? "ar-EG" : "en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
