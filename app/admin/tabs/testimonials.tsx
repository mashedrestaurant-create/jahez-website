"use client";
import { useState, useEffect } from "react";

export function TestimonialsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerLocation: "", text: "", rating: 5, source: "", active: true });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => { fetch("/api/admin/testimonials").then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, id: editId } : form;
    await fetch("/api/admin/testimonials", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false); setEditId(null); setForm({ customerName: "", customerLocation: "", text: "", rating: 5, source: "", active: true });
    load();
  };

  const del = async (id: string) => {
    if (!confirm("هل تريد حذف هذا التقييم؟")) return;
    await fetch("/api/admin/testimonials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>التقييمات</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="px-4 py-2 text-white rounded-lg text-sm" style={{ background: "#234D3B" }}>+ تقييم جديد</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">اسم العميل</label><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">الموقع</label><input value={form.customerLocation} onChange={e => setForm({ ...form, customerLocation: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="md:col-span-2"><label className="block text-xs text-gray-500 mb-1">النص</label><textarea value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">المصدر</label><input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Google, Facebook..." /></div>
            <div><label className="block text-xs text-gray-500 mb-1">التقييم</label><select value={form.rating} onChange={e => setForm({ ...form, rating: +e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="px-4 py-2 text-white rounded-lg text-sm" style={{ background: "#234D3B" }}>حفظ</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 border rounded-lg text-sm">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-right">الاسم</th><th className="px-4 py-3 text-right">التقييم</th><th className="px-4 py-3 text-right">النص</th><th className="px-4 py-3 text-right">المصدر</th><th className="px-4 py-3 text-right">نشط</th><th className="px-4 py-3 text-right">إجراءات</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد تقييمات</td></tr> : items.map(t => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.customerName}</td>
                <td className="px-4 py-3">{"⭐".repeat(t.rating)}</td>
                <td className="px-4 py-3 max-w-[200px] truncate">{t.text}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{t.source}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${t.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{t.active ? "نشط" : "غير نشط"}</span></td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => { setForm({ customerName: t.customerName, customerLocation: t.customerLocation || "", text: t.text, rating: t.rating, source: t.source || "", active: t.active }); setEditId(t.id); setShowForm(true); }} className="text-blue-600 text-xs hover:underline">تعديل</button>
                  <button onClick={() => del(t.id)} className="text-red-600 text-xs hover:underline">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
