"use client";
import { useState, useEffect } from "react";

export function OffersTab() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nameAr: "", nameEn: "", originalPrice: 0, offerPrice: 0, discountPercentage: 0, startDate: "", endDate: "", countdownEnabled: false, active: true, featured: false, promoCode: "", minimumOrder: 0, usageLimit: 0, perCustomerLimit: 1 });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => { fetch("/api/admin/offers").then(r => r.json()).then(d => { setOffers(d.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, id: editId } : form;
    await fetch("/api/admin/offers", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false); setEditId(null); setForm({ nameAr: "", nameEn: "", originalPrice: 0, offerPrice: 0, discountPercentage: 0, startDate: "", endDate: "", countdownEnabled: false, active: true, featured: false, promoCode: "", minimumOrder: 0, usageLimit: 0, perCustomerLimit: 1 });
    load();
  };

  const edit = (o: any) => { setForm({ nameAr: o.nameAr, nameEn: o.nameEn, originalPrice: o.originalPrice, offerPrice: o.offerPrice, discountPercentage: o.discountPercentage || 0, startDate: o.startDate?.slice(0, 10) || "", endDate: o.endDate?.slice(0, 10) || "", countdownEnabled: o.countdownEnabled, active: o.active, featured: o.featured, promoCode: o.promoCode || "", minimumOrder: o.minimumOrder, usageLimit: o.usageLimit || 0, perCustomerLimit: o.perCustomerLimit }); setEditId(o.id); setShowForm(true); };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>العروض</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="px-4 py-2 text-white rounded-lg text-sm" style={{ background: "#234D3B" }}>+ عرض جديد</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">الاسم بالعربي</label><input value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">الاسم بالإنجليزي</label><input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">السعر الأصلي</label><input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: +e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">سعر العرض</label><input type="number" value={form.offerPrice} onChange={e => setForm({ ...form, offerPrice: +e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">كود الخصم</label><input value={form.promoCode} onChange={e => setForm({ ...form, promoCode: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">الحد الأدنى للطلب</label><input type="number" value={form.minimumOrder} onChange={e => setForm({ ...form, minimumOrder: +e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">تاريخ البداية</label><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">تاريخ النهاية</label><input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />نشط</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />مميز</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.countdownEnabled} onChange={e => setForm({ ...form, countdownEnabled: e.target.checked })} />عداد تنازلي</label>
            </div>
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
            <th className="px-4 py-3 text-right">الاسم</th><th className="px-4 py-3 text-right">الأصلي</th><th className="px-4 py-3 text-right">العرض</th><th className="px-4 py-3 text-right">الخصم%</th><th className="px-4 py-3 text-right">نشط</th><th className="px-4 py-3 text-right">مميز</th><th className="px-4 py-3 text-right">إجراءات</th>
          </tr></thead>
          <tbody>
            {offers.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">لا يوجد عروض</td></tr> : offers.map(o => (
              <tr key={o.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{o.nameAr}</td>
                <td className="px-4 py-3">{o.originalPrice} ج.م</td>
                <td className="px-4 py-3 text-green-700 font-bold">{o.offerPrice} ج.م</td>
                <td className="px-4 py-3">{o.discountPercentage || Math.round((1 - o.offerPrice / o.originalPrice) * 100)}%</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${o.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{o.active ? "نشط" : "غير نشط"}</span></td>
                <td className="px-4 py-3">{o.featured ? "⭐" : ""}</td>
                <td className="px-4 py-3"><button onClick={() => edit(o)} className="text-blue-600 text-xs hover:underline">تعديل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
