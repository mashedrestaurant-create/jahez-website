"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STATUS_FLOW = ["new", "confirmed", "preparing", "ready", "out_for_delivery", "completed"] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next?: string }> = {
  new: { label: "جديد", color: "#2563eb", bg: "#eff6ff", next: "confirmed" },
  confirmed: { label: "مؤكد", color: "#ca8a04", bg: "#fefce8", next: "preparing" },
  preparing: { label: "قيد التحضير", color: "#ea580c", bg: "#fff7ed", next: "ready" },
  ready: { label: "جاهز", color: "#16a34a", bg: "#f0fdf4", next: "out_for_delivery" },
  out_for_delivery: { label: "قيد التوصيل", color: "#9333ea", bg: "#faf5ff", next: "completed" },
  completed: { label: "مكتمل", color: "#059669", bg: "#ecfdf5" },
  cancelled: { label: "ملغي", color: "#dc2626", bg: "#fef2f2" },
};

type OrderItem = {
  id: string;
  productNameAr?: string;
  productNameEn?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
};

type Order = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  address?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  notes?: string;
  cancelReason?: string;
  paymentMethodType: string;
  paymentStatus: string;
  createdAt: string;
  driverId?: string;
  driver?: { id: string; name: string; phone: string } | null;
  items: OrderItem[];
  deliveryZone?: { nameAr?: string } | null;
};

type Driver = {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status] || { label: status, color: "#6b7280", bg: "#f3f4f6" };
  return (
    <span
      style={{ color: c.color, backgroundColor: c.bg }}
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
    >
      {c.label}
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

function playBeep() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
    gain.gain.setValueAtTime(0.5, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);
    window.setTimeout(() => ctx.close(), 400);
  } catch {}
}

const STATUSES = [
  { value: "", label: "الكل" },
  { value: "new", label: "جديد", color: "#2563eb" },
  { value: "confirmed", label: "مؤكد", color: "#ca8a04" },
  { value: "preparing", label: "قيد التحضير", color: "#ea580c" },
  { value: "ready", label: "جاهز", color: "#16a34a" },
  { value: "out_for_delivery", label: "قيد التوصيل", color: "#9333ea" },
  { value: "completed", label: "مكتمل", color: "#059669" },
  { value: "cancelled", label: "ملغي", color: "#dc2626" },
];

const DATES = [
  { value: "all", label: "الكل" },
  { value: "today", label: "اليوم" },
  { value: "yesterday", label: "أمس" },
];

export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const mounted = useRef(true);
  const highestOrderId = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (dateFilter !== "all") params.set("date", dateFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "100");
      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!mounted.current) return;
      const items = data.items || [];
      setOrders(items);
      setTotal(data.total || 0);

      const maxId = Math.max(0, ...items.map((o: Order) => o.orderNumber || 0));
      if (maxId > highestOrderId.current && highestOrderId.current > 0) {
        playBeep();
      }
      highestOrderId.current = Math.max(highestOrderId.current, maxId);
    } catch {}
  }, [statusFilter, dateFilter, search]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetch("/api/admin/drivers?limit=200")
      .then((r) => r.json())
      .then((d) => {
        if (mounted.current) setDrivers(d.items || []);
      })
      .catch(() => {});
    fetchOrders().finally(() => {
      if (mounted.current) setLoading(false);
    });
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = window.setInterval(fetchOrders, 8000);
    const onVis = () => { if (document.visibilityState === "visible") fetchOrders(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [fetchOrders]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(fetchOrders, 400);
  };

  const advanceStatus = async (order: Order) => {
    const cfg = STATUS_CONFIG[order.status];
    if (!cfg?.next) return;
    setProcessingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: cfg.next }),
      });
      if (res.ok) fetchOrders();
    } catch {} finally {
      setProcessingId(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) fetchOrders();
    } catch {} finally {
      setProcessingId(null);
      setDeleteConfirmId(null);
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign-driver`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      if (res.ok) fetchOrders();
    } catch {} finally {
      setProcessingId(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    setProcessingId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setExpandedId(null);
        setDeleteConfirmId(null);
      }
    } catch {} finally {
      setProcessingId(null);
    }
  };

  return (
    <div dir="rtl" className="space-y-4 p-1">
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === s.value ? (s.color || "#0a2d1d") : "white",
              color: statusFilter === s.value ? "white" : (s.color || "#374151"),
              borderColor: statusFilter === s.value ? (s.color || "#0a2d1d") : "#e5e7eb",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {DATES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDateFilter(d.value)}
              className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: dateFilter === d.value ? "#0a2d1d" : "transparent",
                color: dateFilter === d.value ? "white" : "#374151",
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="بحث برقم الطلب أو رقم الهاتف..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#c9a23b]"
          dir="ltr"
          style={{ textAlign: "right" }}
        />
        <span className="whitespace-nowrap text-sm text-gray-400">
          {total} طلب
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">جاري تحميل الطلبات...</div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-gray-400">لا يوجد طلبات</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const cfg = STATUS_CONFIG[order.status];
            const nextStatus = cfg?.next;
            const nextLabel = nextStatus ? STATUS_CONFIG[nextStatus]?.label : null;

            return (
              <div
                key={order.id}
                className="rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-bold" style={{ color: "#0a2d1d" }}>
                      #{order.orderNumber}
                    </span>
                    <span className="text-sm text-gray-600">{order.customerName}</span>
                    <span className="text-sm text-gray-400" dir="ltr">{order.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <span className="font-bold" style={{ color: "#0a2d1d" }}>
                      {Number(order.total).toLocaleString("ar-EG")} ج.م
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(order.createdAt)}
                    </span>
                    <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      {order.address && (
                        <div>
                          <span className="text-gray-400">العنوان: </span>
                          <span>{order.address}</span>
                          {order.building && <span> - مبنى {order.building}</span>}
                          {order.floor && <span> - طابق {order.floor}</span>}
                          {order.apartment && <span> - شقة {order.apartment}</span>}
                        </div>
                      )}
                      {order.landmark && (
                        <div>
                          <span className="text-gray-400">علامة مميزة: </span>
                          <span>{order.landmark}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div>
                          <span className="text-gray-400">ملاحظات: </span>
                          <span>{order.notes}</span>
                        </div>
                      )}
                      {order.cancelReason && (
                        <div className="text-red-600">
                          <span>سبب الإلغاء: </span>
                          <span>{order.cancelReason}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">طريقة الدفع: </span>
                        <span>{order.paymentMethodType === "cash" ? "كاش" : order.paymentMethodType}</span>
                        <span className="mx-2">·</span>
                        <span className="text-gray-400">حالة الدفع: </span>
                        <span>{order.paymentStatus === "pending" ? "معلق" : order.paymentStatus === "paid" ? "مدفوع" : order.paymentStatus}</span>
                      </div>
                      {order.deliveryZone && (
                        <div>
                          <span className="text-gray-400">منطقة التوصيل: </span>
                          <span>{order.deliveryZone.nameAr}</span>
                        </div>
                      )}
                    </div>

                    {order.items.length > 0 && (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-2 text-sm font-semibold" style={{ color: "#0a2d1d" }}>الأصناف</div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400">
                              <th className="pb-1 text-right font-medium">الصنف</th>
                              <th className="pb-1 text-center font-medium">الكمية</th>
                              <th className="pb-1 text-center font-medium">السعر</th>
                              <th className="pb-1 text-left font-medium">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200">
                                <td className="py-1.5 text-right">{item.productNameAr || item.productNameEn || "صنف"}</td>
                                <td className="py-1.5 text-center">{item.quantity}</td>
                                <td className="py-1.5 text-center">{Number(item.unitPrice).toLocaleString("ar-EG")}</td>
                                <td className="py-1.5 text-left font-semibold">{Number(item.totalPrice).toLocaleString("ar-EG")} ج.م</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-2 space-y-1 border-t border-gray-200 pt-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">المجموع الفرعي</span>
                            <span>{Number(order.subtotal).toLocaleString("ar-EG")} ج.م</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">رسوم التوصيل</span>
                            <span>{Number(order.deliveryFee).toLocaleString("ar-EG")} ج.م</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>الخصم</span>
                              <span>-{Number(order.discount).toLocaleString("ar-EG")} ج.م</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-gray-200 pt-1 text-lg font-bold" style={{ color: "#0a2d1d" }}>
                            <span>الإجمالي</span>
                            <span>{Number(order.total).toLocaleString("ar-EG")} ج.م</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                      {nextStatus && nextLabel && (
                        <button
                          disabled={processingId === order.id}
                          onClick={(e) => { e.stopPropagation(); advanceStatus(order); }}
                          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: STATUS_CONFIG[nextStatus]?.color || "#0a2d1d" }}
                        >
                          {processingId === order.id ? "جاري..." : `تحويل إلى: ${nextLabel}`}
                        </button>
                      )}
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <button
                          disabled={processingId === order.id}
                          onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          إلغاء الطلب
                        </button>
                      )}

                      <select
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none"
                        value={order.driverId || ""}
                        onChange={(e) => { e.stopPropagation(); assignDriver(order.id, e.target.value); }}
                      >
                        <option value="">تعيين طيار...</option>
                        {drivers.filter((d) => d.isOnline).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.phone}) {d.isOnline ? "🟢" : "⚫"}
                          </option>
                        ))}
                        {drivers.filter((d) => !d.isOnline).map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.phone}) ⚫
                          </option>
                        ))}
                      </select>
                      {order.driver && (
                        <span className="text-sm text-gray-400">
                          الطيار الحالي: {order.driver.name}
                        </span>
                      )}

                      {deleteConfirmId === order.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-red-500">تأكيد الحذف؟</span>
                          <button
                            disabled={processingId === order.id}
                            onClick={(e) => { e.stopPropagation(); deleteOrder(order.id); }}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            احذف
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(order.id); }}
                          className="mr-auto rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-red-200 hover:text-red-500"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
