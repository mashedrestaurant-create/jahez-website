"use client";
import { useState, useEffect } from "react";

export function SettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(d => {
      const map: Record<string, string> = {};
      (d.items || []).forEach((s: any) => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings }) });
    setSaving(false); setMsg("تم الحفظ بنجاح");
    setTimeout(() => setMsg(""), 3000);
  };

  const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h4 className="font-semibold mb-4 pb-2 border-b" style={{ color: "#0a2d1d" }}>{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Field = ({ label, keyName, type = "text" }: { label: string; keyName: string; type?: string }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type={type} value={settings[keyName] || ""} onChange={e => set(keyName, e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none" />
    </div>
  );

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>الإعدادات</h3>
        <div className="flex items-center gap-3">
          {msg && <span className="text-green-600 text-sm">{msg}</span>}
          <button onClick={save} disabled={saving} className="px-5 py-2 text-white rounded-lg text-sm disabled:opacity-50" style={{ background: "#234D3B" }}>{saving ? "جاري الحفظ..." : "حفظ"}</button>
        </div>
      </div>

      <Section title="معلومات التواصل">
        <Field label="الهاتف" keyName="phone" />
        <Field label="البريد الإلكتروني" keyName="email" />
        <Field label="واتساب" keyName="whatsapp" />
        <Field label="العنوان" keyName="address" />
      </Section>

      <Section title="البرانديング">
        <Field label="اسم الموقع (عربي)" keyName="siteNameAr" />
        <Field label="اسم الموقع (إنجليزي)" keyName="siteNameEn" />
        <Field label="الشعار (رابط)" keyName="logo" />
      </Section>

      <Section title="إعدادات الهيرو">
        <Field label="العنوان الرئيسي (عربي)" keyName="heroTitleAr" />
        <Field label="العنوان الرئيسي (إنجليزي)" keyName="heroTitleEn" />
        <Field label="نص الوصف (عربي)" keyName="heroSubtitleAr" />
        <Field label="نص الوصف (إنجليزي)" keyName="heroSubtitleEn" />
      </Section>

      <Section title="واتساب">
        <Field label="رقم واتساب" keyName="whatsappNumber" />
      </Section>

      <Section title="ساعات العمل">
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">ساعات العمل</label>
          <textarea value={settings["openingHours"] || ""} onChange={e => set("openingHours", e.target.value)} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none" />
        </div>
      </Section>

      <Section title="الدفع">
        <Field label="مفتاح Paymob Public" keyName="PAYMOB_PUBLIC_KEY" />
        <Field label="مفتاح Paymob Integration" keyName="PAYMOB_INTEGRATION_ID" />
        <Field label="مفتاح Paymob Frames" keyName="PAYMOB_FRAMES_ID" />
      </Section>
    </div>
  );
}
