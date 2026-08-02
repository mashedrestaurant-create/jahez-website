"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  birthday?: string;
  area: string;
  ordersCount: number;
  totalSpent: number;
  lastSeenAt: string;
  marketingConsent: boolean;
};

type SegmentCounts = {
  total: number;
  withBirthday: number;
  firstTimers: number;
  repeat: number;
  vip: number;
};

type SegmentData = {
  counts: SegmentCounts;
  segments: {
    upcomingBirthdays: Customer[];
    firstTimers: Customer[];
    repeatCustomers: Customer[];
    vipCustomers: Customer[];
  };
};

type SegmentType = "all" | "birthdays" | "first-timers" | "repeat" | "vip";

function getUpcomingBirthdayLabel(birthday: string): string {
  if (!birthday) return "";
  const now = new Date();
  const thisYear = now.getFullYear();
  const bday = new Date(`${thisYear}-${birthday.slice(5)}`);
  if (bday < now) bday.setFullYear(thisYear + 1);
  const diff = Math.ceil((bday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "اليوم!";
  if (diff === 1) return "بكرة!";
  if (diff <= 30) return `خلال ${diff} يوم`;
  return birthday.slice(5);
}

function whatsappUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/^\+?20/, "20");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

export default function CustomerSegments({
  customers,
  formatPrice,
}: {
  customers: Customer[];
  formatPrice: (n: number) => string;
}) {
  const [segment, setSegment] = useState<SegmentType>("all");
  const [data, setData] = useState<SegmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/segments")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const segments: Array<{ id: SegmentType; label: string; icon: string; count: number }> = [
    { id: "all", label: "الكل", icon: "◉", count: customers.length },
    { id: "birthdays", label: "أعياد ميلاد", icon: "🎂", count: data?.counts?.withBirthday || 0 },
    { id: "first-timers", label: "أول مرة", icon: "🆕", count: data?.counts?.firstTimers || 0 },
    { id: "repeat", label: "متكررين", icon: "🔄", count: data?.counts?.repeat || 0 },
    { id: "vip", label: "VIP", icon: "💎", count: data?.counts?.vip || 0 },
  ];

  let displayedCustomers: Customer[] = customers;
  if (segment === "birthdays" && data) {
    displayedCustomers = data.segments.upcomingBirthdays;
  } else if (segment === "first-timers" && data) {
    displayedCustomers = data.segments.firstTimers;
  } else if (segment === "repeat" && data) {
    displayedCustomers = data.segments.repeatCustomers;
  } else if (segment === "vip" && data) {
    displayedCustomers = data.segments.vipCustomers;
  }

  const birthdayMessage = (name: string) =>
    `كل سنة وإنتِ طيبة يا ${name} 🎂 جاهز بيتمنالك سنة جميلة وأيام أسهل وألذ 🎉`;

  return (
    <section className="admin-panel">
      <div className="admin-section-head">
        <div>
          <span>CUSTOMER SEGMENTS</span>
          <h2>العملاء والسيجمنتات</h2>
        </div>
        <p>{customers.length} عميل</p>
      </div>

      <div className="segment-cards">
        {segments.map((s) => (
          <button
            key={s.id}
            className={`segment-card ${segment === s.id ? "active" : ""}`}
            onClick={() => setSegment(s.id)}
          >
            <span className="segment-icon">{s.icon}</span>
            <span className="segment-label">{s.label}</span>
            <strong className="segment-count">{s.count}</strong>
          </button>
        ))}
      </div>

      {segment === "birthdays" && data && data.segments.upcomingBirthdays.length > 0 && (
        <div className="segment-banner birthday-banner">
          🎂 عندك {data.segments.upcomingBirthdays.length} عميل عندهم عيد ميلاد قريب — تقدر تبعتلهم رسالة واتساب بخصم خاص!
        </div>
      )}

      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>العميل</th>
              <th>الموبايل</th>
              <th>المنطقة</th>
              <th>الطلبات</th>
              <th>إجمالي الإنفاق</th>
              {segment === "birthdays" && <th>عيد الميلاد</th>}
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {displayedCustomers.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                  <small>{c.email || "بدون بريد"}</small>
                </td>
                <td dir="ltr">{c.phone}</td>
                <td>{c.area || "—"}</td>
                <td>{c.ordersCount}</td>
                <td>{formatPrice(c.totalSpent)}</td>
                {segment === "birthdays" && (
                  <td>
                    <span className="segment-birthday-badge">
                      {c.birthday ? getUpcomingBirthdayLabel(c.birthday) : "—"}
                    </span>
                  </td>
                )}
                <td>
                  <a
                    href={whatsappUrl(
                      c.phone,
                      segment === "birthdays"
                        ? birthdayMessage(c.name)
                        : `أهلاً ${c.name}! Jahez بيفكرك بطلبك الجاي ❤️`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="segment-wa-btn"
                  >
                    واتساب
                  </a>
                </td>
              </tr>
            ))}
            {displayedCustomers.length === 0 && (
              <tr>
                <td colSpan={segment === "birthdays" ? 7 : 6} className="admin-empty-state">
                  لا يوجد عملاء في السيجمنت ده
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
