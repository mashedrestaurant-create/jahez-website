"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "../language-context";
import { formatPrice } from "../data";

const STORAGE_KEY = "jahez-customer";

function loadSaved(): { name: string; phone: string } {
  if (typeof window === "undefined") return { name: "", phone: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { name: "", phone: "" };
    const parsed = JSON.parse(raw);
    return { name: parsed.name || "", phone: parsed.phone || "" };
  } catch {
    return { name: "", phone: "" };
  }
}

type OrderItem = {
  name?: string;
  price?: number;
  quantity?: number;
  details?: string;
};

type Order = {
  id: number;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillment: string;
  deliveryZone: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  address: string;
  notes: string;
  createdAt: string;
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  new: { ar: "طلب جديد", en: "New" },
  confirmed: { ar: "تم التأكيد", en: "Confirmed" },
  preparing: { ar: "جاري التحضير", en: "Preparing" },
  ready: { ar: "جاهز", en: "Ready" },
  out_for_delivery: { ar: "خرج للتوصيل", en: "Out for delivery" },
  completed: { ar: "تم التسليم", en: "Delivered" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

const paymentLabels: Record<string, { ar: string; en: string }> = {
  cash: { ar: "كاش عند الاستلام", en: "Cash on delivery" },
  instapay: { ar: "إنستاباي", en: "InstaPay" },
  paymob: { ar: "فيزا أونلاين", en: "Online card" },
};

const TRACKING_STEPS = [
  { key: "confirmed", iconAr: "✓", iconEn: "✓" },
  { key: "preparing", iconAr: "👨‍🍳", iconEn: "👨‍🍳" },
  { key: "ready", iconAr: "📦", iconEn: "📦" },
  { key: "out_for_delivery", iconAr: "🛵", iconEn: "🛵" },
  { key: "completed", iconAr: "✅", iconEn: "✅" },
];

const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJRwFqOolXW4ARMl7NlDz6DkA";

function getTrackingIndex(status: string): number {
  if (status === "cancelled") return -1;
  const idx = TRACKING_STEPS.findIndex((s) => s.key === status);
  if (idx >= 0) return idx;
  return 0;
}

export default function AccountPage() {
  const { isArabic } = useLanguage();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoLoaded = useRef(false);

  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    const saved = loadSaved();
    if (saved.name && saved.phone) {
      setName(saved.name);
      setPhone(saved.phone);
      setLoading(true);
      const params = new URLSearchParams({ phone: saved.phone, name: saved.name });
      fetch(`/api/customer/orders?${params}`)
        .then((r) => r.ok ? r.json() : Promise.reject())
        .then((data) => {
          setOrders(data.orders || []);
          setSearched(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, []);

  const lookupOrders = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams({ phone, name });
      const response = await fetch(`/api/customer/orders?${params}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "lookup-failed");
      }
      const data = await response.json();
      setOrders(data.orders || []);
      setSearched(true);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, phone }));
      } catch {}
    } catch {
      setError(
        isArabic
          ? "مش لاقيين طلبات بالبيانات دي، تأكد من الاسم ورقم الموبايل"
          : "No orders found with these details. Check your name and phone number.",
      );
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setName("");
    setPhone("");
    setOrders([]);
    setSearched(false);
    setSelectedOrder(null);
  };

  const viewOrderDetail = async (orderId: number) => {
    try {
      const params = new URLSearchParams({ phone });
      const response = await fetch(
        `/api/customer/orders/${orderId}?${params}`,
      );
      if (!response.ok) throw new Error("detail-failed");
      const data = await response.json();
      setSelectedOrder(data.order);
    } catch {
      setError(
        isArabic
          ? "تعذر تحميل تفاصيل الطلب"
          : "Could not load order details",
      );
    }
  };

  useEffect(() => {
    if (!selectedOrder) {
      if (refreshRef.current) clearInterval(refreshRef.current);
      return;
    }
    const refresh = async () => {
      try {
        const params = new URLSearchParams({ phone });
        const response = await fetch(
          `/api/customer/orders/${selectedOrder.id}?${params}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.order) setSelectedOrder(data.order);
        }
      } catch {
        // silent
      }
    };
    refreshRef.current = setInterval(refresh, 8000);
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, [selectedOrder?.id, phone]);

  const reorderItems = (order: Order) => {
    try {
      const reorderData = order.items.map((item) => ({
        id:
          item.name?.toLowerCase().replace(/\s+/g, "-") || "",
        name: item.name || "",
        price: item.price || 0,
        quantity: item.quantity || 1,
      }));
      window.localStorage.setItem(
        "jahez-reorder",
        JSON.stringify(reorderData),
      );
      window.location.href = "/cart";
    } catch {
      // Ignore
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      isArabic ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="kicker light">
            {isArabic ? "طلباتي" : "MY ORDERS"}
          </span>
          <h1>{isArabic ? "سجل الطلبات" : "Order History"}</h1>
        </div>
      </section>
      <section className="content-section">
        <div className="container">
          {!searched ? (
            <form
              className="checkout-form"
              onSubmit={(e) => {
                e.preventDefault();
                lookupOrders();
              }}
              style={{ maxWidth: 480 }}
            >
              <h2>{isArabic ? "ادخل بياناتك" : "Enter your details"}</h2>
              <label>
                <span>
                  {isArabic ? "الاسم بالكامل" : "Full name"}
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isArabic ? "اسمك" : "Your name"}
                />
              </label>
              <label>
                <span>
                  {isArabic ? "رقم الموبايل" : "Mobile number"}
                </span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  dir="ltr"
                />
              </label>
              {error && <p className="form-error">{error}</p>}
              <button
                type="submit"
                className="button button-primary"
                disabled={loading}
              >
                {loading
                  ? isArabic
                    ? "جاري البحث..."
                    : "Searching..."
                  : isArabic
                    ? "بحث"
                    : "Find my orders"}
              </button>
            </form>
          ) : selectedOrder ? (
            <div className="order-detail">
              <button
                className="text-link"
                onClick={() => setSelectedOrder(null)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    verticalAlign: "middle",
                    marginInlineEnd: 6,
                  }}
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                {isArabic ? "العودة للقائمة" : "Back to list"}
              </button>

              {selectedOrder.orderStatus !== "cancelled" && (
                <div className="order-tracker">
                  <div className="tracker-steps">
                    {TRACKING_STEPS.map((step, i) => {
                      const currentIdx = getTrackingIndex(selectedOrder.orderStatus);
                      const isCompleted = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div
                          key={step.key}
                          className={`tracker-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                        >
                          <div className="tracker-dot">
                            {isCompleted ? "✓" : i + 1}
                          </div>
                          <span className="tracker-label">
                            {statusLabels[step.key]?.[isArabic ? "ar" : "en"]}
                          </span>
                          {i < TRACKING_STEPS.length - 1 && (
                            <div className={`tracker-line ${isCompleted && !isCurrent ? "filled" : ""}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="order-detail-card">
                <div className="order-detail-header">
                  <h2>#{selectedOrder.id}</h2>
                  <span
                    className={`status-badge status-${selectedOrder.orderStatus}`}
                  >
                    {statusLabels[selectedOrder.orderStatus]?.[
                      isArabic ? "ar" : "en"
                    ] || selectedOrder.orderStatus}
                  </span>
                </div>
                <p className="order-date">
                  {formatDate(selectedOrder.createdAt)}
                </p>
                <div className="order-detail-items">
                  {selectedOrder.items.map((item, i) => (
                    <div className="order-detail-line" key={i}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <b>
                        {formatPrice(
                          (item.price || 0) * (item.quantity || 1),
                        )}
                      </b>
                    </div>
                  ))}
                </div>
                <div className="order-detail-totals">
                  <div>
                    <span>
                      {isArabic ? "إجمالي الأصناف" : "Subtotal"}
                    </span>
                    <b>{formatPrice(selectedOrder.subtotal)}</b>
                  </div>
                  <div>
                    <span>
                      {isArabic ? "رسوم التوصيل" : "Delivery"}
                    </span>
                    <b>{formatPrice(selectedOrder.deliveryFee)}</b>
                  </div>
                  <div className="cart-grand-total">
                    <span>{isArabic ? "الإجمالي" : "Total"}</span>
                    <b>{formatPrice(selectedOrder.total)}</b>
                  </div>
                </div>
                <div className="order-detail-meta">
                  <p>
                    <b>
                      {isArabic ? "طريقة الدفع" : "Payment"}:
                    </b>{" "}
                    {paymentLabels[selectedOrder.paymentMethod]?.[
                      isArabic ? "ar" : "en"
                    ] || selectedOrder.paymentMethod}
                  </p>
                  {selectedOrder.address && (
                    <p>
                      <b>{isArabic ? "العنوان" : "Address"}:</b>{" "}
                      {selectedOrder.address}
                    </p>
                  )}
                  {selectedOrder.deliveryZone && (
                    <p>
                      <b>
                        {isArabic ? "منطقة التوصيل" : "Zone"}:
                      </b>{" "}
                      {selectedOrder.deliveryZone}
                    </p>
                  )}
                </div>
                {selectedOrder.orderStatus === "completed" && (
                  <a
                    href={GOOGLE_REVIEW_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="button google-review-btn"
                  >
                    {isArabic
                      ? "⭐ قيّم تجربتك على جوجل"
                      : "⭐ Rate us on Google"}
                  </a>
                )}
                {selectedOrder.orderStatus !== "cancelled" && (
                  <button
                    className="button button-primary"
                    onClick={() => reorderItems(selectedOrder)}
                  >
                    {isArabic
                      ? "اطلب مرة أخرى"
                      : "Order again"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="order-history">
              {error && <p className="form-error">{error}</p>}
              {orders.length === 0 ? (
                <div className="empty-state">
                  <div>
                    <h2>
                      {isArabic ? "مفيش طلبات" : "No orders found"}
                    </h2>
                    <p>
                      {isArabic
                        ? "مفيش طلبات مرتبطة بالبيانات دي"
                        : "No orders linked to these details"}
                    </p>
                    <Link
                      href="/menu"
                      className="button button-primary"
                    >
                      {isArabic
                        ? "ابدأ طلب جديد"
                        : "Start a new order"}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="order-list">
                  <div className="order-list-head">
                    <h2>
                      {isArabic
                        ? `${orders.length} طلب`
                        : `${orders.length} orders`}
                    </h2>
                    <button className="text-link" onClick={logout}>
                      {isArabic ? "تسجيل خروج" : "Sign out"}
                    </button>
                  </div>
                  {orders
                    .sort((a, b) => b.id - a.id)
                    .map((order) => (
                      <article className="order-card" key={order.id}>
                        <div className="order-card-header">
                          <div>
                            <b>#{order.id}</b>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <span
                            className={`status-badge status-${order.orderStatus}`}
                          >
                            {statusLabels[order.orderStatus]?.[
                              isArabic ? "ar" : "en"
                            ] || order.orderStatus}
                          </span>
                        </div>
                        <div className="order-card-items">
                          {order.items
                            .slice(0, 3)
                            .map((item, i) => (
                              <span key={i}>
                                {item.name} × {item.quantity}
                                {i <
                                Math.min(order.items.length, 3) - 1
                                  ? ", "
                                  : ""}
                              </span>
                            ))}
                          {order.items.length > 3 && (
                            <span>
                              {" "}
                              +{order.items.length - 3}
                            </span>
                          )}
                        </div>
                        <div className="order-card-footer">
                          <b>{formatPrice(order.total)}</b>
                          <div className="order-card-actions">
                            <button
                              className="text-link"
                              onClick={() =>
                                viewOrderDetail(order.id)
                              }
                            >
                              {isArabic ? "التفاصيل" : "Details"}
                            </button>
                            {order.orderStatus !== "cancelled" && (
                              <button
                                className="text-link"
                                onClick={() =>
                                  reorderItems(order)
                                }
                              >
                                {isArabic
                                  ? "اطلب مرة أخرى"
                                  : "Reorder"}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
