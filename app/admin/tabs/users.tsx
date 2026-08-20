"use client";
import { useState, useEffect } from "react";

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", email: "", password: "", role: "admin" });
  const [editId, setEditId] = useState<string | null>(null);

  const load = () => { fetch("/api/admin/users").then(r => r.json()).then(d => { setUsers(d.items || []); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const method = editId ? "PUT" : "POST";
    const body = editId ? { ...form, id: editId, ...(form.password ? {} : { password: undefined }) } : form;
    await fetch("/api/admin/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setShowForm(false); setEditId(null); setForm({ username: "", name: "", email: "", password: "", role: "admin" });
    load();
  };

  const roleLabel = (r: string) => r === "owner" ? "مالك" : r === "admin" ? "مدير" : "مستقبل طلبات";
  const roleColor = (r: string) => r === "owner" ? "bg-purple-100 text-purple-700" : r === "admin" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700";

  if (loading) return <div className="text-center py-8 text-gray-500">جاري التحميل...</div>;

  return (
    <div dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: "#0a2d1d" }}>المستخدمين</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="px-4 py-2 text-white rounded-lg text-sm" style={{ background: "#234D3B" }}>+ مستخدم جديد</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs text-gray-500 mb-1">اسم المستخدم</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!!editId} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">الاسم</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">البريد</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">كلمة المرور {editId && "(اترك فارغ للإبقاء)"}</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">الدور</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm"><option value="owner">مالك</option><option value="admin">مدير</option><option value="order_receiver">مستقبل طلبات</option></select></div>
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
            <th className="px-4 py-3 text-right">الاسم</th><th className="px-4 py-3 text-right">اسم المستخدم</th><th className="px-4 py-3 text-right">الدور</th><th className="px-4 py-3 text-right">آخر دخول</th><th className="px-4 py-3 text-right">إجراءات</th>
          </tr></thead>
          <tbody>
            {users.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">لا يوجد مستخدمين</td></tr> : users.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.name || u.username}</td>
                <td className="px-4 py-3 text-gray-500">{u.username}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${roleColor(u.role)}`}>{roleLabel(u.role)}</span></td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("ar-EG") : "—"}</td>
                <td className="px-4 py-3"><button onClick={() => { setForm({ username: u.username, name: u.name || "", email: u.email || "", password: "", role: u.role }); setEditId(u.id); setShowForm(true); }} className="text-blue-600 text-xs hover:underline">تعديل</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
