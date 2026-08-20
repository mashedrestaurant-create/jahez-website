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
      (d.settings ? Object.entries(d.settings) : d.items || []).forEach(([key, value]: [string, any]) => {
        map[key] = typeof value === "string" ? value.replace(/^"|"$/g, "") : String(value);
      });
      setSettings(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    const d = await res.json();
    setSaving(false);
    setMsg(d.ok ? "تم الحفظ — يظهر في الموقع فوراً" : "حدث خطأ");
    setTimeout(() => setMsg(""), 4000);
  };

  const set = (key: string, val: string) => setSettings(prev => ({ ...prev, [key]: val }));

  if (loading) return <div className="text-center py-8" style={{ color: "#9ca3af" }}>جاري التحميل...</div>;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <h4 className="font-semibold mb-4 pb-2 border-b" style={{ color: "#0a2d1d", fontFamily: "Cairo, sans-serif" }}>{title}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );

  const Field = ({ label, keyName, type = "text", span = false }: { label: string; keyName: string; type?: string; span?: boolean }) => (
    <div className={span ? "md:col-span-2" : ""}>
      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>{label}</label>
      <input type={type} value={settings[keyName] || ""} onChange={e => set(keyName, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a23b] focus:border-transparent" />
    </div>
  );

  const Textarea = ({ label, keyName, rows = 3 }: { label: string; keyName: string; rows?: number }) => (
    <div className="md:col-span-2">
      <label className="block text-xs mb-1" style={{ color: "#6b7280" }}>{label}</label>
      <textarea value={settings[keyName] || ""} onChange={e => set(keyName, e.target.value)} rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a23b] focus:border-transparent" />
    </div>
  );

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d", fontFamily: "Cairo, sans-serif" }}>الإعدادات</h3>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm font-bold" style={{ color: "#234D3B" }}>{msg}</span>}
          <button onClick={save} disabled={saving} className="px-5 py-2 text-white rounded-lg text-sm disabled:opacity-50 font-bold" style={{ background: "#0a2d1d" }}>
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>

      <Section title="معلومات التواصل">
        <Field label="الهاتف" keyName="phone" />
        <Field label="البريد الإلكتروني" keyName="email" />
        <Field label="واتساب" keyName="whatsapp" />
        <Field label="رقم واتساب" keyName="whatsappNumber" />
        <Field label="العنوان" keyName="address" span />
      </Section>

      <Section title="البرانديング">
        <Field label="اسم الموقع (عربي)" keyName="siteNameAr" />
        <Field label="اسم الموقع (إنجليزي)" keyName="siteNameEn" />
        <Field label="الشعار (رابط صورة)" keyName="logo" span />
      </Section>

      <Section title="الهيرو — الصفحة الرئيسية">
        <Field label="العنوان الرئيسي (عربي)" keyName="heroTitleAr" />
        <Field label="العنوان الرئيسي (إنجليزي)" keyName="heroTitleEn" />
        <Field label="نص الوصف (عربي)" keyName="heroSubtitleAr" />
        <Field label="نص الوصف (إنجليزي)" keyName="heroSubtitleEn" />
      </Section>

      <Section title="الenenو للعربية">
        <Field label="شعار الموقع (عربي)" keyName="taglineAr" />
        <Field label="شعار الموقع (إنجليزي)" keyName="taglineEn" />
      </Section>

      <Section title="ساعات العمل">
        <Field label="من ساعة" keyName="openTime" type="time" />
        <Field label="لحد ساعة" keyName="closeTime" type="time" />
        <Textarea label="ساعات العمل التفصيلية" keyName="openingHours" />
      </Section>

      <Section title="التوصيل">
        <Field label="رسوم التوصيل" keyName="deliveryFee" type="number" />
        <Field label="الحد الأدنى للطلب" keyName="minimumOrder" type="number" />
        <Field label="توصيل مجاني فوق" keyName="freeDeliveryThreshold" type="number" />
        <Field label="مدة الطلب (ساعات)" keyName="orderLeadHours" type="number" />
      </Section>

      <Section title="الدفع">
        <Field label="الدفع عند الاستلام" keyName="cashOnDeliveryEnabled" />
        <Field label="انستاباي" keyName="instapayEnabled" />
        <Field label="حساب الانستاباي" keyName="instapayAccount" />
        <Field label="رابط الدفع" keyName="instapayPaymentLink" />
      </Section>
    </div>
  );
}
