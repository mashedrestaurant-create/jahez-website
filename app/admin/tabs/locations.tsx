"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Location = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  addressAr?: string;
  addressEn?: string;
  phone?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  active?: boolean;
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
};

type FormState = {
  id: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  whatsapp: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  active: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
};

const EMPTY_FORM: FormState = {
  id: "", nameAr: "", nameEn: "", addressAr: "", addressEn: "",
  phone: "", whatsapp: "", latitude: "", longitude: "", googleMapsUrl: "",
  active: true, deliveryEnabled: true, pickupEnabled: true,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 select-none">
      <div
        className={`relative h-5 w-10 rounded-full transition-colors ${checked ? "" : "bg-gray-300"}`}
        style={checked ? { background: "#0a2d1d" } : {}}
        onClick={() => onChange(!checked)}
      >
        <div className={`absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "right-5" : "right-0.5"}`} />
      </div>
      <span className="text-xs font-bold" style={{ color: "#374151" }}>{label}</span>
    </label>
  );
}

export function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/locations");
      const d = await res.json();
      if (!mounted.current) return;
      if (d.ok) setLocations(d.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchLocations().finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [fetchLocations]);

  const handleSave = async () => {
    if (!form.nameAr || !form.nameEn || !form.addressAr || !form.addressEn) {
      setNotice("يرجى ملء جميع الحقول المطلوبة");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/locations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          nameAr: form.nameAr,
          nameEn: form.nameEn,
          addressAr: form.addressAr,
          addressEn: form.addressEn,
          phone: form.phone || undefined,
          whatsapp: form.whatsapp || undefined,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
          googleMapsUrl: form.googleMapsUrl || undefined,
          active: form.active,
          deliveryEnabled: form.deliveryEnabled,
          pickupEnabled: form.pickupEnabled,
        }),
      });
      if (res.ok) {
        setNotice(form.id ? "تم تحديث الفرع" : "تمت إضافة الفرع");
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchLocations();
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

  const startEdit = (loc: Location) => {
    setForm({
      id: loc.id, nameAr: loc.nameAr || "", nameEn: loc.nameEn || "",
      addressAr: loc.addressAr || "", addressEn: loc.addressEn || "",
      phone: loc.phone || "", whatsapp: loc.whatsapp || "",
      latitude: String(loc.latitude ?? ""), longitude: String(loc.longitude ?? ""),
      googleMapsUrl: loc.googleMapsUrl || "",
      active: loc.active !== false, deliveryEnabled: loc.deliveryEnabled !== false, pickupEnabled: loc.pickupEnabled !== false,
    });
    setShowModal(true);
  };

  const mapsLink = (loc: Location) => {
    if (loc.googleMapsUrl) return loc.googleMapsUrl;
    if (loc.latitude && loc.longitude) return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    return null;
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
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: "#c9a23b" }}
        >
          + فرع جديد
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-base font-bold" style={{ color: "#0a2d1d" }}>
              {form.id ? "تعديل الفرع" : "إضافة فرع جديد"}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الاسم بالعربي *</label>
                <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الاسم بالإنجليزي *</label>
                <input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>العنوان بالعربي *</label>
                <input value={form.addressAr} onChange={(e) => setForm({ ...form, addressAr: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>العنوان بالإنجليزي *</label>
                <input dir="ltr" value={form.addressEn} onChange={(e) => setForm({ ...form, addressEn: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الهاتف</label>
                <input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>واتساب</label>
                <input dir="ltr" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>خط العرض (latitude)</label>
                <input dir="ltr" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>خط الطول (longitude)</label>
                <input dir="ltr" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>رابط خرطة جوجل</label>
                <input dir="ltr" value={form.googleMapsUrl} onChange={(e) => setForm({ ...form, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/..." className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Toggle label="نشط" checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
              <Toggle label="التوصيل" checked={form.deliveryEnabled} onChange={(v) => setForm({ ...form, deliveryEnabled: v })} />
              <Toggle label="الاستلام" checked={form.pickupEnabled} onChange={(v) => setForm({ ...form, pickupEnabled: v })} />
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={handleSave} disabled={saving} className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ background: "#0a2d1d" }}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50">
                إلغاء
              </button>
            </div>
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
      ) : locations.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm" style={{ color: "#9ca3af" }}>لا توجد فروع بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const link = mapsLink(loc);
            return (
              <div key={loc.id} className="rounded-xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold" style={{ color: "#0a2d1d" }}>{loc.nameAr || loc.nameEn}</p>
                    {loc.nameEn && <p className="text-xs" dir="ltr" style={{ color: "#9ca3af" }}>{loc.nameEn}</p>}
                    <p className="text-xs" style={{ color: "#6b7280" }}>{loc.addressAr}</p>
                    {loc.addressEn && <p className="text-xs" dir="ltr" style={{ color: "#9ca3af" }}>{loc.addressEn}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {loc.phone && <span className="text-xs" dir="ltr" style={{ color: "#6b7280" }}>📞 {loc.phone}</span>}
                      {loc.whatsapp && <span className="text-xs" dir="ltr" style={{ color: "#6b7280" }}>💬 {loc.whatsapp}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${loc.active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {loc.active !== false ? "نشط" : "معطّل"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${loc.deliveryEnabled !== false ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                        توصيل {loc.deliveryEnabled !== false ? "✓" : "✗"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${loc.pickupEnabled !== false ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                        استلام {loc.pickupEnabled !== false ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-50"
                        style={{ color: "#c9a23b" }}
                      >
                        خريطة 📍
                      </a>
                    )}
                    <button onClick={() => startEdit(loc)} className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100" style={{ color: "#c9a23b" }}>
                      تعديل
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
