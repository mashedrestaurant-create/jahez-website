"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Driver = {
  id: string;
  name: string;
  phone: string;
  isActive?: boolean;
  isOnline?: boolean;
  rating?: number;
  trips?: number;
  totalTrips?: number;
};

type FormState = {
  name: string;
  phone: string;
  password: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = { name: "", phone: "", password: "", isActive: true };

function Stars({ rating }: { rating?: number }) {
  const r = rating ?? 5;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else if (i === full && half) stars.push("★");
    else stars.push("☆");
  }
  return (
    <span className="text-sm" style={{ color: "#c9a23b" }}>
      {stars.join("")} <span className="text-xs" style={{ color: "#9ca3af" }}>{r.toFixed(1)}</span>
    </span>
  );
}

export function DriversTab() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/drivers?limit=500");
      const d = await res.json();
      if (!mounted.current) return;
      if (d.ok) setDrivers(d.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchDrivers().finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [fetchDrivers]);

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.password) {
      setNotice("الاسم والهاتف وكلمة المرور مطلوبة");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setNotice("تمت إضافة الطيار");
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchDrivers();
      } else {
        const d = await res.json();
        setNotice(d.error || "حدث خطأ");
      }
    } catch {
      setNotice("تعذر الحفظ");
    }
    setSaving(false);
    setTimeout(() => setNotice(""), 3000);
  };

  const toggleActive = async (driver: Driver) => {
    const newVal = driver.isActive === false;
    setDrivers((prev) => prev.map((d) => d.id === driver.id ? { ...d, isActive: newVal } : d));
    try {
      await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: driver.id, isActive: newVal }),
      });
    } catch {}
  };

  return (
    <div dir="rtl" className="space-y-4 p-1">
      {notice && (
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold shadow-sm" style={{ color: "#0a2d1d" }}>
          {notice}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowForm(!showForm); }}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: "#c9a23b" }}
        >
          {showForm ? "إلغاء" : "+ طيار جديد"}
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold" style={{ color: "#0a2d1d" }}>إضافة طيار جديد</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الاسم *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الهاتف *</label>
              <input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>كلمة المرور *</label>
              <input type="password" dir="ltr" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
            </div>
            <div className="flex items-end">
              <label className="flex cursor-pointer items-center gap-2">
                <div
                  className={`relative h-5 w-10 rounded-full transition-colors ${form.isActive ? "" : "bg-gray-300"}`}
                  style={form.isActive ? { background: "#0a2d1d" } : {}}
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                >
                  <div className={`absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "right-5" : "right-0.5"}`} />
                </div>
                <span className="text-xs font-bold" style={{ color: "#374151" }}>نشط</span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleSave} disabled={saving} className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ background: "#0a2d1d" }}>
              {saving ? "جاري الحفظ..." : "إضافة"}
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#c9a23b", borderTopColor: "transparent" }} />
            <p className="text-sm font-bold" style={{ color: "#0a2d1d" }}>جاري التحميل...</p>
          </div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm" style={{ color: "#9ca3af" }}>لا يوجد طيارين بعد</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>الاسم</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>الهاتف</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>نشط</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>متصل</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>التقييم</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>الرحلات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drivers.map((d) => (
                  <tr key={d.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold" style={{ color: "#0a2d1d" }}>{d.name}</td>
                    <td className="px-4 py-3" dir="ltr" style={{ color: "#374151" }}>{d.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(d)}
                        className={`mx-auto block h-5 w-5 rounded-full transition-colors ${d.isActive !== false ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center gap-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${d.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="text-xs" style={{ color: d.isOnline ? "#16a34a" : "#9ca3af" }}>
                          {d.isOnline ? "متصل" : "غير متصل"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Stars rating={d.rating} />
                    </td>
                    <td className="px-4 py-3 text-center font-bold" style={{ color: "#374151" }}>
                      {d.trips ?? d.totalTrips ?? 0}
                    </td>
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
