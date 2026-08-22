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

      <Section title="الشعار التسويقي">
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

      <BackupsSection />
    </div>
  );
}

type Backup = {
  id: string;
  label: string | null;
  sizeBytes: number;
  counts: { categories?: number; products?: number; orders?: number; customers?: number; settings?: number } | null;
  createdBy: string | null;
  createdAt: string;
};

function BackupsSection() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/backup").then(r => r.json()).then(d => {
      setBackups(d.backups || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(load, []);

  const createBackup = async () => {
    setBusy("create"); setMsg("");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", label: "manual" }) });
      const d = await res.json();
      setMsg(d.ok ? "تم إنشاء نسخة احتياطية ✓" : d.error || "فشل الإنشاء");
      if (d.ok) load();
    } catch { setMsg("فشل الاتصال"); }
    setBusy("");
    setTimeout(() => setMsg(""), 4000);
  };

  const restore = async (b: Backup) => {
    const confirmed = window.confirm(
      `⚠️ استعادة النسخة من ${new Date(b.createdAt).toLocaleString("ar-EG")}؟\n\nهذا هيمسح كل البيانات الحالية ويستبدلها بمحتوى النسخة الاحتياطية.\nمتأكد؟`
    );
    if (!confirmed) return;
    const secondConfirm = window.confirm("تأكيد أخير: متأكد إنك عايز تستعيد هذه النسخة؟");
    if (!secondConfirm) return;

    setBusy(b.id); setMsg("");
    try {
      const res = await fetch("/api/admin/backup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "restore", id: b.id }) });
      const d = await res.json();
      setMsg(d.ok ? `تمت الاستعادة ✓ (${d.restored} جدول)` : d.error || "فشلت الاستعادة");
    } catch { setMsg("فشل الاتصال"); }
    setBusy("");
    setTimeout(() => setMsg(""), 6000);
  };

  const remove = async (b: Backup) => {
    if (!window.confirm("حذف هذه النسخة الاحتياطية؟")) return;
    setBusy(b.id);
    try {
      await fetch(`/api/admin/backup?id=${b.id}`, { method: "DELETE" });
      load();
    } catch {}
    setBusy("");
  };

  const fmtSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
      <div className="flex justify-between items-center mb-1 pb-2 border-b">
        <h4 className="font-semibold" style={{ color: "#0a2d1d", fontFamily: "Cairo, sans-serif" }}>💾 النسخ الاحتياطي التلقائي</h4>
        <button onClick={createBackup} disabled={busy === "create"} className="px-4 py-1.5 text-white rounded-lg text-xs font-bold disabled:opacity-50" style={{ background: "#0a2d1d" }}>
          {busy === "create" ? "جاري النسخ..." : "+ نسخة الآن"}
        </button>
      </div>
      <p className="text-xs mt-2 mb-4" style={{ color: "#9ca3af" }}>
        نسخة تلقائية يومياً الساعة 3 صباحاً — تُحفظ آخر 30 نسخة. تشمل المنتجات والأقسام والطلبات والعملاء والإعدادات.
      </p>

      {msg && <div className="rounded-lg px-3 py-2 text-sm font-bold mb-3" style={{ background: "#f0fdf4", color: "#166534" }}>{msg}</div>}

      {loading ? (
        <p className="text-sm py-4 text-center" style={{ color: "#9ca3af" }}>جاري التحميل...</p>
      ) : backups.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: "#9ca3af" }}>لا توجد نسخ بعد — اضغط "نسخة الآن"</p>
      ) : (
        <div className="space-y-2">
          {backups.map(b => (
            <div key={b.id} className="flex items-center justify-between gap-3 flex-wrap rounded-lg border border-gray-100 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: "#0a2d1d" }}>
                  {new Date(b.createdAt).toLocaleString("ar-EG")}
                  {b.label && <span className="mr-2 rounded-full px-2 py-0.5 text-[10px]" style={{ background: b.label === "auto-daily" ? "#eff6ff" : "#fefce8", color: b.label === "auto-daily" ? "#1d4ed8" : "#a16207" }}>{b.label === "auto-daily" ? "تلقائي" : b.label}</span>}
                </p>
                <p className="text-[11px]" style={{ color: "#9ca3af" }}>
                  {fmtSize(b.sizeBytes)} · {b.counts?.products ?? "?"} منتج · {b.counts?.orders ?? "?"} طلب · {b.createdBy || "-"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <a href={`/api/admin/backup?id=${b.id}`} className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50" style={{ color: "#374151" }}>تحميل</a>
                <button onClick={() => restore(b)} disabled={busy === b.id} className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: "#fff7ed", color: "#c2410c" }}>
                  {busy === b.id ? "..." : "استعادة"}
                </button>
                <button onClick={() => remove(b)} disabled={busy === b.id} className="text-xs font-bold px-2 py-1.5 rounded-lg hover:bg-red-50" style={{ color: "#dc2626" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
