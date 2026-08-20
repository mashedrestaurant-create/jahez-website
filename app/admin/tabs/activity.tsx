"use client";
import { useState, useEffect } from "react";

export function ActivityTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = (p: number) => {
    fetch(`/api/admin/activity?page=${p}&limit=50`).then(r => r.json()).then(d => {
      const newItems = d.items || [];
      setItems(prev => p === 1 ? newItems : [...prev, ...newItems]);
      setHasMore(newItems.length === 50);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const actionLabel = (a: string) => {
    const map: Record<string, string> = { create: "إنشاء", update: "تعديل", delete: "حذف", login_success: "دخول ناجح", login_failed: "دخول فاشل", logout: "خروج", view: "عرض", export: "تصدير" };
    return map[a] || a;
  };

  const actionColor = (a: string) => {
    if (a.includes("failed") || a === "delete") return "bg-red-100 text-red-700";
    if (a.includes("success") || a === "create") return "bg-green-100 text-green-700";
    if (a === "update") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <h3 className="text-lg font-semibold mb-4" style={{ color: "#0a2d1d" }}>سجل الحركات</h3>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-right">التاريخ</th><th className="px-4 py-3 text-right">الإجراء</th><th className="px-4 py-3 text-right">الكيان</th><th className="px-4 py-3 text-right">معرف الكيان</th><th className="px-4 py-3 text-right">المستخدم</th><th className="px-4 py-3 text-right">IP</th><th className="px-4 py-3 text-right">التفاصيل</th>
          </tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">لا توجد حركات</td></tr> : items.map(i => (
              <tr key={i.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 text-xs whitespace-nowrap">{new Date(i.createdAt).toLocaleString("ar-EG")}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${actionColor(i.action)}`}>{actionLabel(i.action)}</span></td>
                <td className="px-4 py-3 text-gray-500">{i.entityType || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{i.entityId || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{i.adminUser?.username || i.adminUserId || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{i.ipAddress || "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">{i.details || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="text-center mt-4">
          <button onClick={() => { const next = page + 1; setPage(next); load(next); }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">تحميل المزيد</button>
        </div>
      )}
    </div>
  );
}
