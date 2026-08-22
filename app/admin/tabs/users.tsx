"use client";
import { useState, useEffect, useCallback } from "react";

const ROLES = [
  { value: "owner", label: "مالك", labelEn: "Owner", color: "bg-purple-100 text-purple-700", icon: "👑", perms: "كل الصلاحيات" },
  { value: "admin", label: "مدير", labelEn: "Admin", color: "bg-blue-100 text-blue-700", icon: "🔧", perms: "إدارة المنتجات والأقسام والطلبات" },
  { value: "order_receiver", label: "مستقبل طلبات", labelEn: "Order Receiver", color: "bg-orange-100 text-orange-700", icon: "📋", perms: "عرض وإدارة الطلبات فقط" },
];

type User = {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type FormData = {
  username: string;
  name: string;
  email: string;
  password: string;
  role: string;
};

const defaultForm: FormData = { username: "", name: "", email: "", password: "", role: "admin" };

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);
    fetch("/api/admin/users?" + params.toString())
      .then((r) => r.json())
      .then((d) => { setUsers(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter, search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError("");
    if (!form.username.trim()) { setError("اسم المستخدم مطلوب"); return; }
    if (!editId && !form.password) { setError("كلمة المرور مطلوبة"); return; }
    if (!form.role) { setError("الدور مطلوب"); return; }

    setProcessing(true);
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? "/api/admin/users/" + editId : "/api/admin/users";
      const body: Record<string, unknown> = { ...form };
      if (editId && !body.password) delete body.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "حدث خطأ"); return; }

      setShowForm(false);
      setEditId(null);
      setForm(defaultForm);
      load();
    } catch { setError("حدث خطأ في الاتصال"); }
    finally { setProcessing(false); }
  };

  const toggleActive = async (user: User) => {
    await fetch("/api/admin/users/" + user.id, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    load();
  };

  const deleteUser = async (id: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/users/" + id, { method: "DELETE" });
      if (res.ok) { setDeleteConfirmId(null); load(); }
    } catch {} finally { setProcessing(false); }
  };

  const startEdit = (user: User) => {
    setForm({ username: user.username, name: user.name || "", email: user.email || "", password: "", role: user.role });
    setEditId(user.id);
    setShowForm(true);
    setError("");
  };

  const roleInfo = (r: string) => ROLES.find((x) => x.value === r) || ROLES[1];

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold" style={{ color: "#0a2d1d" }}>المستخدمين والموظفين</h3>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm); setError(""); }} className="px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: "#234D3B" }}>
          + مستخدم جديد
        </button>
      </div>

      {/* Role filter */}
      <div className="flex flex-wrap items-center gap-2">
        {[{ value: "", label: "الكل" }, ...ROLES.map((r) => ({ value: r.value, label: r.icon + " " + r.label }))].map((r) => (
          <button key={r.value} onClick={() => setRoleFilter(r.value)} className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors" style={{ backgroundColor: roleFilter === r.value ? "#0a2d1d" : "white", color: roleFilter === r.value ? "white" : "#374151", borderColor: roleFilter === r.value ? "#0a2d1d" : "#e5e7eb" }}>
            {r.label}
          </button>
        ))}
        <input type="text" placeholder="بحث بالاسم أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-[#c9a23b]" style={{ textAlign: "right" }} />
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold" style={{ color: "#0a2d1d" }}>{editId ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h4>
            <button onClick={() => { setShowForm(false); setEditId(null); setError(""); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">{error}</div>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">اسم المستخدم *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="admin123" disabled={!!editId} />
              {editId && <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير اسم المستخدم</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">الاسم الكامل</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="أحمد محمد" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">البريد الإلكتروني</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="user@jahez.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">كلمة المرور {editId ? "(اترك فارغ للإبقاء)" : "*"}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="••••••••" />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">الدور الوظيفي *</label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {ROLES.map((r) => (
                <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })} className={`rounded-xl border-2 p-4 text-right transition-all ${form.role === r.value ? "border-[#0a2d1d] bg-[#0a2d1d]/5" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{r.icon}</span>
                    <span className="font-semibold text-sm">{r.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.perms}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={processing} className="px-6 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "#234D3B" }}>
              {processing ? "جاري الحفظ..." : editId ? "تحديث" : "إضافة"}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); setError(""); }} className="px-4 py-2 border rounded-lg text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">جاري التحميل...</div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-gray-400">لا يوجد مستخدمين</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right font-medium text-gray-500">المستخدم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">اسم المستخدم</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">البريد</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">الدور</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">الحالة</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">آخر دخول</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const ri = roleInfo(u.role);
                return (
                  <tr key={u.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: "#0a2d1d", color: "white" }}>
                          {(u.name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.name || u.username}</div>
                          {u.name && <div className="text-xs text-gray-400">@{u.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr" style={{ textAlign: "right" }}>{u.username}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${ri.color}`}>
                        {ri.icon} {ri.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActive(u)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${u.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                        {u.isActive ? "نشط" : "معطل"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "لم يسجل دخول بعد"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(u)} className="text-blue-600 text-xs hover:underline font-medium">تعديل</button>
                        {ri.value !== "owner" && (
                          deleteConfirmId === u.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => deleteUser(u.id)} disabled={processing} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700 disabled:opacity-50">حذف</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="text-xs bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200">إلغاء</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(u.id)} className="text-red-400 text-xs hover:text-red-600">حذف</button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}