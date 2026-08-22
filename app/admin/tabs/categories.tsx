"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Category = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageId?: string;
  videoUrl?: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
};

type FormState = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  imageId: string;
  videoUrl: string;
  icon: string;
  sortOrder: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  id: "", nameAr: "", nameEn: "", slug: "", descriptionAr: "", descriptionEn: "",
  imageId: "", videoUrl: "", icon: "", sortOrder: "0", active: true,
};

import { ImageUploader } from "../components/image-uploader";

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const d = await res.json();
      if (!mounted.current) return;
      if (d.ok) setCategories(d.items || []);
    } catch {}
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchCategories().finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [fetchCategories]);

  const handleSave = async () => {
    if (!form.nameAr || !form.nameEn || !form.slug) {
      setNotice("يرجى ملء جميع الحقول المطلوبة");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id || undefined,
          nameAr: form.nameAr, nameEn: form.nameEn, slug: form.slug,
          descriptionAr: form.descriptionAr || undefined,
          descriptionEn: form.descriptionEn || undefined,
          imageId: form.imageId || undefined,
          videoUrl: form.videoUrl || undefined,
          icon: form.icon || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          active: form.active,
        }),
      });
      if (res.ok) {
        setNotice(form.id ? "تم تحديث القسم" : "تمت إضافة القسم");
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchCategories();
      } else {
        const d = await res.json();
        setNotice(d.error || "حدث خطأ");
      }
    } catch {
      setNotice("تعذر الحفظ");
    }
    setSaving(false);
    setTimeout(() => setNotice(""), 3000);
  };

  const startEdit = (c: Category) => {
    setForm({
      id: c.id, nameAr: c.nameAr || "", nameEn: c.nameEn || "", slug: c.slug || "",
      descriptionAr: c.descriptionAr || "", descriptionEn: c.descriptionEn || "",
      imageId: c.imageId || "", videoUrl: c.videoUrl || "",
      icon: c.icon || "", sortOrder: String(c.sortOrder ?? 0), active: c.active !== false,
    });
    setShowModal(true);
  };

  return (
    <div dir="rtl" className="space-y-4 p-1" style={{ fontFamily: "Cairo, sans-serif" }}>
      {notice && (
        <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 text-sm font-bold shadow-sm" style={{ color: "#0a2d1d" }}>
          {notice}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: "#c9a23b" }}
        >
          + قسم جديد
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold" style={{ color: "#0a2d1d" }}>
              {form.id ? "تعديل القسم" : "إضافة قسم جديد"}
            </h3>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>صورة القسم</label>
              <ImageUploader value={form.imageId} onChange={(url) => setForm({ ...form, imageId: url })} height={96} />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>رابط فيديو (YouTube / MP4) — اختياري</label>
              <input
                dir="ltr"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=... أو https://example.com/video.mp4"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#c9a23b] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الاسم بالعربي *</label>
                <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الاسم بالإنجليزي *</label>
                <input dir="ltr" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>المعرّف (slug) *</label>
                <input dir="ltr" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الأيقونة</label>
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🐔" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الترتيب</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <div className={`relative h-5 w-10 rounded-full transition-colors ${form.active ? "" : "bg-gray-300"}`} style={form.active ? { background: "#0a2d1d" } : {}} onClick={() => setForm({ ...form, active: !form.active })}>
                    <div className={`absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.active ? "right-5" : "right-0.5"}`} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#374151" }}>نشط</span>
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الوصف بالعربي</label>
                <textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الوصف بالإنجليزي</label>
                <textarea dir="ltr" value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={handleSave} disabled={saving} className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ background: "#0a2d1d" }}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "#c9a23b", borderTopColor: "transparent" }} />
            <p className="text-sm font-bold" style={{ color: "#0a2d1d" }}>جاري التحميل...</p>
          </div>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm" style={{ color: "#9ca3af" }}>لا توجد أقسام بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="h-32 relative overflow-hidden" style={{ background: "#f9fafb" }}>
                {c.imageId ? (
                  <img src={c.imageId} alt="" className="w-full h-full object-cover" />
                ) : c.icon ? (
                  <div className="flex h-full items-center justify-center"><span className="text-4xl">{c.icon}</span></div>
                ) : (
                  <div className="flex h-full items-center justify-center"><span className="text-3xl text-gray-200">📁</span></div>
                )}
                {c.videoUrl && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">🎬 فيديو</div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold" style={{ color: "#0a2d1d" }}>{c.nameAr || c.nameEn || c.id}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {c.active !== false ? "نشط" : "معطّل"}
                  </span>
                </div>
                {c.nameEn && <p className="text-xs" dir="ltr" style={{ color: "#9ca3af" }}>{c.nameEn}</p>}
                {c.descriptionAr && <p className="text-xs" style={{ color: "#6b7280" }}>{c.descriptionAr}</p>}
                <button onClick={() => startEdit(c)} className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100" style={{ color: "#c9a23b" }}>
                  تعديل
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
