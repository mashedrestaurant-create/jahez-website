"use client";
import { useState, useEffect } from "react";

export function ContentTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch("/api/admin/content").then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const updateValue = (id: string, value: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, value } : i));
  };

  const saveAll = async () => {
    setSaving(true);
    await fetch("/api/admin/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
    setSaving(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  const sections = items.reduce((acc: Record<string, any[]>, item) => {
    (acc[item.section] = acc[item.section] || []).push(item);
    return acc;
  }, {});

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>المحتوى</h3>
        <button onClick={saveAll} disabled={saving} className="px-4 py-2 text-white rounded-lg text-sm disabled:opacity-50" style={{ background: "#234D3B" }}>{saving ? "جاري الحفظ..." : "حفظ الكل"}</button>
      </div>
      {Object.keys(sections).length === 0 ? <p className="text-gray-400 text-center py-8">لا يوجد محتوى</p> : Object.entries(sections).map(([section, fields]) => (
        <div key={section} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h4 className="font-semibold mb-3 pb-2 border-b" style={{ color: "#0a2d1d" }}>{section}</h4>
          <div className="space-y-3">
            {fields.map((f: any) => (
              <div key={f.id}>
                <label className="block text-xs text-gray-500 mb-1">{f.key}</label>
                <textarea value={f.value || ""} onChange={e => updateValue(f.id, e.target.value)} rows={f.value?.length > 100 ? 4 : 2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 outline-none" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
