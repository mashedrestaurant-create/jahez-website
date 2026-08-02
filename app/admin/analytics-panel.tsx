"use client";

import { useEffect, useState } from "react";

type FunnelData = {
  pageviews: number;
  addToCart: number;
  checkoutStart: number;
  paymentAttempt: number;
  paymentSuccess: number;
  paymentFailed: number;
  paymentCancelled: number;
};

type OrderStats = {
  total: number;
  revenue: number;
  paid: number;
  cash: number;
  instapay: number;
  paymob: number;
  delivery: number;
  pickup: number;
};

type DailyRow = { date: string; count: number; revenue: number };
type DailyEventRow = { date: string; event: string; count: number };
type TopPage = { page: string; count: number };
type HourlyRow = { hour: number; count: number };
type RecentEvent = {
  id: number;
  sessionId: string;
  event: string;
  page: string;
  metaJson: string;
  createdAt: string;
};

type AnalyticsData = {
  funnel: FunnelData;
  orders: OrderStats;
  visitors: { unique: number; totalCustomers: number };
  dailyOrders: DailyRow[];
  dailyEvents: DailyEventRow[];
  recentEvents: RecentEvent[];
  topPages: TopPage[];
  hourlyDistribution: HourlyRow[];
  range: string;
};

const eventLabels: Record<string, string> = {
  pageview: "زيارة صفحة",
  page_exit: "خروج من صفحة",
  add_to_cart: "إضافة للسلة",
  checkout_start: "بدء Checkout",
  payment_attempt: "محاولة دفع",
  payment_success: "دفع ناجح",
  payment_failed: "دفع فاشل",
  payment_cancelled: "إلغاء الدفع",
  order_placed: "طلب مسجل",
};

function miniBar(value: number, max: number) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="analytics-mini-bar">
      <div className="analytics-mini-bar-fill" style={{ width: `${pct}%` }} />
      <span>{pct}%</span>
    </div>
  );
}

export default function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) {
    return <div className="admin-loading">جاري تحميل التحليلات...</div>;
  }

  if (!data) {
    return <div className="admin-loading">تعذر تحميل البيانات</div>;
  }

  const funnelMax = data.funnel.pageviews || 1;
  const convRate = data.funnel.pageviews > 0
    ? Math.round((data.funnel.paymentSuccess / data.funnel.pageviews) * 100)
    : 0;
  const cartRate = data.funnel.pageviews > 0
    ? Math.round((data.funnel.addToCart / data.funnel.pageviews) * 100)
    : 0;
  const checkoutRate = data.funnel.addToCart > 0
    ? Math.round((data.funnel.checkoutStart / data.funnel.addToCart) * 100)
    : 0;
  const payRate = data.funnel.paymentAttempt > 0
    ? Math.round((data.funnel.paymentSuccess / data.funnel.paymentAttempt) * 100)
    : 0;

  return (
    <section className="admin-analytics">
      <div className="admin-analytics-header">
        <div>
          <span>ANALYTICS</span>
          <h2>تحليلات الموقع والطلبات</h2>
        </div>
        <div className="admin-range-selector">
          {[
            { value: "24h", label: "24 ساعة" },
            { value: "7d", label: "7 أيام" },
            { value: "30d", label: "30 يوم" },
            { value: "90d", label: "90 يوم" },
          ].map((opt) => (
            <button
              key={opt.value}
              className={range === opt.value ? "active" : ""}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="admin-metrics">
        <article>
          <span>الزوار</span>
          <strong>{data.visitors.unique.toLocaleString()}</strong>
          <small>زائر فريد</small>
        </article>
        <article>
          <span>الطلبات</span>
          <strong>{data.orders.total}</strong>
          <small>{data.orders.paid} مدفوعة</small>
        </article>
        <article>
          <span>الإيرادات</span>
          <strong>{data.orders.revenue.toLocaleString()} ج.م</strong>
          <small>إجمالي المبيعات</small>
        </article>
        <article>
          <span>معدل التحويل</span>
          <strong>{convRate}%</strong>
          <small>زائر ← دفع</small>
        </article>
      </div>

      {/* Funnel */}
      <div className="admin-panel">
        <div className="admin-section-head">
          <div>
            <span>FUNNEL</span>
            <h2>مُحلل رحلة العميل</h2>
          </div>
        </div>
        <div className="analytics-funnel">
          {[
            { label: "زيارة الصفحة", value: data.funnel.pageviews, rate: "100%" },
            { label: "إضافة للسلة", value: data.funnel.addToCart, rate: `${cartRate}%` },
            { label: "بدء Checkout", value: data.funnel.checkoutStart, rate: `${checkoutRate}%` },
            { label: "محاولة دفع", value: data.funnel.paymentAttempt, rate: data.funnel.addToCart > 0 ? `${Math.round((data.funnel.paymentAttempt / data.funnel.addToCart) * 100)}%` : "0%" },
            { label: "دفع ناجح", value: data.funnel.paymentSuccess, rate: `${payRate}%` },
          ].map((step, i) => (
            <div key={i} className="analytics-funnel-step">
              <div className="analytics-funnel-label">{step.label}</div>
              <div className="analytics-funnel-bar">
                <div
                  className="analytics-funnel-fill"
                  style={{ width: `${funnelMax > 0 ? (step.value / funnelMax) * 100 : 0}%` }}
                />
              </div>
              <div className="analytics-funnel-value">
                <strong>{step.value.toLocaleString()}</strong>
                <small>{step.rate}</small>
              </div>
            </div>
          ))}
          {data.funnel.paymentFailed > 0 && (
            <div className="analytics-funnel-step analytics-funnel-fail">
              <div className="analytics-funnel-label">دفع فاشل</div>
              <div className="analytics-funnel-bar">
                <div
                  className="analytics-funnel-fill fail"
                  style={{ width: `${funnelMax > 0 ? (data.funnel.paymentFailed / funnelMax) * 100 : 0}%` }}
                />
              </div>
              <div className="analytics-funnel-value">
                <strong>{data.funnel.paymentFailed}</strong>
              </div>
            </div>
          )}
          {data.funnel.paymentCancelled > 0 && (
            <div className="analytics-funnel-step analytics-funnel-cancel">
              <div className="analytics-funnel-label">إلغاء الدفع</div>
              <div className="analytics-funnel-bar">
                <div
                  className="analytics-funnel-fill cancel"
                  style={{ width: `${funnelMax > 0 ? (data.funnel.paymentCancelled / funnelMax) * 100 : 0}%` }}
                />
              </div>
              <div className="analytics-funnel-value">
                <strong>{data.funnel.paymentCancelled}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Breakdown */}
      <div className="admin-metrics">
        <article>
          <span>كاش</span>
          <strong>{data.orders.cash}</strong>
          <small>طلبات</small>
        </article>
        <article>
          <span>InstaPay</span>
          <strong>{data.orders.instapay}</strong>
          <small>طلبات</small>
        </article>
        <article>
          <span>أونلاين</span>
          <strong>{data.orders.paymob}</strong>
          <small>طلبات</small>
        </article>
        <article>
          <span>توصيل</span>
          <strong>{data.orders.delivery}</strong>
          <small>طلبات</small>
        </article>
        <article>
          <span>استلام</span>
          <strong>{data.orders.pickup}</strong>
          <small>طلبات</small>
        </article>
      </div>

      {/* Top Pages */}
      <div className="admin-panel">
        <div className="admin-section-head">
          <div>
            <span>PAGES</span>
            <h2>ال الصفحات الأكتر زيارة</h2>
          </div>
        </div>
        <div className="analytics-top-pages">
          {data.topPages.map((page, i) => (
            <div key={i} className="analytics-page-row">
              <span className="analytics-page-path">{page.page || "/"}</span>
              <span className="analytics-page-count">{page.count.toLocaleString()}</span>
              {miniBar(page.count, data.topPages[0]?.count || 1)}
            </div>
          ))}
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="admin-panel">
        <div className="admin-section-head">
          <div>
            <span>HOURS</span>
            <h2>التوزيع بالساعات</h2>
          </div>
        </div>
        <div className="analytics-hourly">
          {Array.from({ length: 24 }, (_, h) => {
            const found = data.hourlyDistribution.find((r) => r.hour === h);
            const count = found?.count || 0;
            const maxHourly = Math.max(...data.hourlyDistribution.map((r) => r.count), 1);
            const pct = (count / maxHourly) * 100;
            return (
              <div key={h} className="analytics-hour-col" title={`${h}:00 — ${count}`}>
                <div className="analytics-hour-bar" style={{ height: `${pct}%` }} />
                <span>{h}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Log */}
      <div className="admin-panel">
        <div className="admin-section-head">
          <div>
            <span>ACTIVITY LOG</span>
            <h2>سجل حركات الموقع</h2>
          </div>
        </div>
        <div className="analytics-log">
          <table className="analytics-log-table">
            <thead>
              <tr>
                <th>الوقت</th>
                <th>الحدث</th>
                <th>الصفحة</th>
                <th>المعرف</th>
              </tr>
            </thead>
            <tbody>
              {data.recentEvents.map((ev) => {
                const d = new Date(ev.createdAt);
                const timeStr = d.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });
                const dateStr = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
                return (
                  <tr key={ev.id}>
                    <td className="analytics-log-time">
                      {dateStr} {timeStr}
                    </td>
                    <td>
                      <span className={`analytics-event-badge analytics-event-${ev.event.replace(/_/g, "-")}`}>
                        {eventLabels[ev.event] || ev.event}
                      </span>
                    </td>
                    <td className="analytics-log-page">{ev.page}</td>
                    <td className="analytics-log-session">{ev.sessionId.slice(0, 8)}...</td>
                  </tr>
                );
              })}
              {data.recentEvents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "24px", color: "var(--muted)" }}>
                    لا توجد أحداث مسجلة في الفترة دي
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
