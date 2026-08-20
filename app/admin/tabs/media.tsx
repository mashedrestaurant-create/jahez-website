"use client";
import { useState, useEffect } from "react";

export function MediaTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/admin/media").then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#0a2d1d" }}>المكتبة</h3>
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4 flex items-center gap-3">
        <label className="px-4 py-2 text-white rounded-lg text-sm cursor-pointer" style={{ background: "#234D3B" }}>
          رفع صورة
          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0]; if (!file) return;
            const fd = new FormData(); fd.append("file", file);
            await fetch("/api/admin/media", { method: "POST", body: fd });
            const d = await fetch("/api/admin/media").then(r => r.json());
            setItems(d.items || []);
          }} />
        </label>
        <span className="text-sm text-gray-500">{items.length} صورة</span>
      </div>
      {items.length === 0 ? <p className="text-gray-400 text-center py-8">لا توجد صور</p> : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="aspect-square bg-gray-50 flex items-center justify-center">
                {item.blobUrl ? <img src={item.blobUrl} alt={item.originalName} className="w-full h-full object-cover" /> : <span className="text-3xl">🖼️</span>}
              </div>
              <div className="p-3">
                <p className="text-xs font-medium truncate">{item.originalName}</p>
                <p className="text-xs text-gray-400">{item.mimeType} · {item.size ? `${Math.round(item.size / 1024)} KB` : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
