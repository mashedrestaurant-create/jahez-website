"use client";
import { useState, useEffect } from "react";

export function PaymentsTab() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => { fetch("/api/admin/payment-methods").then(r => r.json()).then(d => { setMethods(d.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, field: string, value: boolean) => {
    await fetch("/api/admin/payment-methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, [field]: !value }) });
    load();
  };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#0a2d1d" }}>طرق الدفع</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.length === 0 ? <p className="text-gray-400 col-span-full text-center py-8">لا توجد طرق دفع</p> : methods.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold" style={{ color: "#0a2d1d" }}>{m.labelAr}</h4>
                <p className="text-xs text-gray-400">{m.labelEn} · {m.type}</p>
              </div>
              <button onClick={() => toggle(m.id, "active", m.active)} className={`w-12 h-6 rounded-full transition ${m.active ? "bg-green-500" : "bg-gray-300"}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${m.active ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span>ظاهر للعملاء</span><span>{m.publicVisible ? "✅" : "❌"}</span></div>
              <div className="flex justify-between"><span>متاح للتوصيل</span><span>{m.deliveryEnabled ? "✅" : "❌"}</span></div>
              <div className="flex justify-between"><span>متاح للاستلام</span><span>{m.pickupEnabled ? "✅" : "❌"}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
