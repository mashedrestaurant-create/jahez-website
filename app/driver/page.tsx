"use client";
import { useState, useEffect, useCallback } from "react";

interface DriverInfo { id: string; name: string; phone: string; isActive: boolean; isOnline: boolean; }
interface Order { id: string; orderNumber: number; customerName: string; customerPhone: string; address: string; notes?: string; total: number; status: string; items: any[]; deliveryFee?: number; }

export default function DriverPage() {
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDriver = useCallback(async () => {
    try {
      const r = await fetch("/api/driver/auth/me");
      if (!r.ok) { window.location.href = "/driver/login"; return; }
      const d = await r.json();
      setDriver(d.driver);
    } catch { window.location.href = "/driver/login"; }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const r = await fetch("/api/driver/orders");
      if (r.ok) { const d = await r.json(); setOrders(d.items || d.orders || []); }
    } catch {}
  }, []);

  useEffect(() => { loadDriver().then(() => { setLoading(false); loadOrders(); }); }, []);
  useEffect(() => { const iv = setInterval(loadOrders, 15000); return () => clearInterval(iv); }, [loadOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/admin/orders/${orderId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadOrders();
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { confirmed: "مؤكد", preparing: "قيد التحضير", ready: "چاهِز", out_for_delivery: "قيد التوصيل", delivered: "تم التوصيل", cancelled: "ملغي" };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { confirmed: "bg-yellow-100 text-yellow-700", preparing: "bg-orange-100 text-orange-700", ready: "bg-green-100 text-green-700", out_for_delivery: "bg-purple-100 text-purple-700", delivered: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700" };
    return map[s] || "bg-gray-100 text-gray-600";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">جاري التحميل...</p></div>;
  if (!driver) return null;

  return (
    <div className="min-h-screen" style={{ background: "#f5f5f5" }}>
      {/* Header */}
      <div className="text-white p-4 shadow-md" style={{ background: "#0a2d1d" }}>
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div>
            <h1 className="text-lg font-bold">چاهِز — الطيار</h1>
            <p className="text-xs text-white/60">{driver.name} · {driver.phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${driver.isOnline ? "bg-green-400" : "bg-gray-400"}`}></span>
            <span className="text-xs">{driver.isOnline ? "متصل" : "غير متصل"}</span>
            <button onClick={() => { fetch("/api/driver/auth/logout", { method: "POST" }); window.location.href = "/driver/login"; }} className="text-xs bg-white/10 px-3 py-1 rounded-lg">خروج</button>
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
              await fetch("/api/driver/location", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }) });
            });
          }
        }} className="w-full mb-4 py-2 text-white text-sm rounded-lg" style={{ background: "#234D3B" }}>📍 مشاركة موقعي</button>

        <h2 className="text-lg font-semibold mb-3" style={{ color: "#0a2d1d" }}>الطلبات المعينة ({orders.length})</h2>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border text-gray-400">لا توجد طلبات معينة حالياً</div>
        ) : orders.map(o => (
          <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold" style={{ color: "#0a2d1d" }}>#{o.orderNumber}</span>
                <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
              </div>
              <span className="font-bold text-lg" style={{ color: "#0a2d1d" }}>{o.total} ج.م</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1 mb-3">
              <p>👤 {o.customerName} · {o.customerPhone}</p>
              <p>📍 {o.address}</p>
              {o.notes && <p className="text-gray-400">📝 {o.notes}</p>}
            </div>
            <div className="text-xs text-gray-400 mb-3">
              {o.items?.map((item: any, i: number) => <span key={i}>{item.quantity}× {item.name}{i < (o.items?.length || 0) - 1 ? " · " : ""}</span>)}
            </div>
            {o.status === "ready" && (
              <button onClick={() => updateStatus(o.id, "out_for_delivery")} className="w-full py-2 text-white text-sm rounded-lg bg-purple-600 hover:bg-purple-700">🚗 استلام الطلب والتوجه للتوصيل</button>
            )}
            {o.status === "out_for_delivery" && (
              <button onClick={() => updateStatus(o.id, "delivered")} className="w-full py-2 text-white text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700">✅ تم التوصيل</button>
            )}
            {o.status === "out_for_delivery" && o.customerPhone && (
              <a href={`tel:${o.customerPhone}`} className="block w-full mt-2 py-2 text-center text-sm rounded-lg border border-gray-200 hover:bg-gray-50">📞 اتصال بالعميل</a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
