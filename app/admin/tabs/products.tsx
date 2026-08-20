"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Product = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  slug?: string;
  price?: number;
  image?: string;
  imageId?: string;
  available?: boolean;
  featured?: boolean;
  spicy?: boolean;
  categoryId?: string;
  category?: { id: string; nameAr?: string; nameEn?: string };
};

type Category = {
  id: string;
  nameAr?: string;
  nameEn?: string;
};

type FormState = {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  price: string;
  categoryId: string;
  image: string;
  available: boolean;
  featured: boolean;
  spicy: boolean;
};

const EMPTY_FORM: FormState = {
  id: "", nameAr: "", nameEn: "", slug: "", price: "", categoryId: "", image: "",
  available: true, featured: false, spicy: false,
};

function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "" : "bg-gray-300"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        style={checked ? { background: "#0a2d1d" } : {}}
        onClick={() => !disabled && onChange(!checked)}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "right-0.5" : "right-5"}`} />
      </div>
      <span className="text-xs font-bold" style={{ color: "#374151" }}>{label}</span>
    </label>
  );
}

function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json();
      if (d.ok) onChange(d.url);
    } catch {}
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) upload(file);
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${dragOver ? "border-[#c9a23b] bg-[#c9a23b]/5" : "border-gray-200 hover:border-gray-300"}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
      }} />
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-20 w-20 object-cover rounded-lg" />
          <button
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
          >✕</button>
        </div>
      ) : (
        <div>
          <p className="text-sm" style={{ color: "#6b7280" }}>{uploading ? "جاري الرفع..." : "اسحب الصورة هنا أو اضغط للتحميل"}</p>
        </div>
      )}
    </div>
  );
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (catFilter) params.set("category", catFilter);
      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?${params}`),
        fetch(`/api/admin/categories?limit=200`),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      if (!mounted.current) return;
      if (prodData.ok) setProducts(prodData.items || []);
      if (catData.ok) setCategories(catData.items || []);
    } catch {}
  }, [search, catFilter]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchProducts().finally(() => { if (mounted.current) setLoading(false); });
    return () => { mounted.current = false; };
  }, [fetchProducts]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(fetchProducts, 350);
  };

  const toggleField = async (productId: string, field: string, value: boolean) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, [field]: value } : p));
    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: productId, [field]: value }),
      });
    } catch {}
  };

  const handleSave = async () => {
    if (!form.nameAr || !form.nameEn || !form.slug || !form.price || !form.categoryId) {
      setNotice("يرجى ملء جميع الحقول المطلوبة");
      setTimeout(() => setNotice(""), 3000);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: form.id || `SKU-${Date.now()}`,
          price: Number(form.price),
        }),
      });
      if (res.ok) {
        setNotice(form.id ? "تم تحديث المنتج" : "تمت إضافة المنتج");
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchProducts();
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

  const startEdit = (p: Product) => {
    setForm({
      id: p.id, nameAr: p.nameAr || "", nameEn: p.nameEn || "", slug: p.slug || "",
      price: String(p.price || ""), categoryId: p.categoryId || "", image: p.image || p.imageId || "",
      available: p.available !== false, featured: !!p.featured, spicy: !!p.spicy,
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

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="بحث عن منتج..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#c9a23b]"
          dir="ltr"
          style={{ textAlign: "right" }}
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#c9a23b]"
        >
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nameAr || c.nameEn}</option>
          ))}
        </select>
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowModal(true); }}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors hover:opacity-90"
          style={{ background: "#c9a23b" }}
        >
          + منتج جديد
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            <h3 className="mb-4 text-base font-bold" style={{ color: "#0a2d1d" }}>
              {form.id ? `تعديل: ${form.nameAr}` : "إضافة منتج جديد"}
            </h3>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>صورة المنتج</label>
              <ImageUpload value={form.image} onChange={(url) => setForm({ ...form, image: url })} />
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
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>المعرّف (SKU) *</label>
                <input dir="ltr" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!!form.id && products.some((p) => p.id === form.id)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b] disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>السعر (ج.م) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold" style={{ color: "#6b7280" }}>الفئة *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c9a23b]">
                  <option value="">اختر فئة...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameAr || c.nameEn}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <Toggle label="متوفر" checked={form.available} onChange={(v) => setForm({ ...form, available: v })} />
              <Toggle label="مميز" checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} />
              <Toggle label="حار" checked={form.spicy} onChange={(v) => setForm({ ...form, spicy: v })} />
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
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm" style={{ color: "#9ca3af" }}>لا توجد منتجات</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>الصورة</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>المعرف</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>الاسم</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>السعر</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>الفئة</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>متوفر</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>مميز</th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>حار</th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                        {(p.image || p.imageId) ? (
                          <img src={p.image || p.imageId || ""} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">—</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" dir="ltr" style={{ color: "#374151" }}>{p.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold" style={{ color: "#0a2d1d" }}>{p.nameAr || p.nameEn || p.id}</p>
                      {p.nameEn && <p className="text-xs" dir="ltr" style={{ color: "#9ca3af" }}>{p.nameEn}</p>}
                    </td>
                    <td className="px-4 py-3 font-bold" style={{ color: "#0a2d1d" }}>{Math.round(Number(p.price) || 0)} ج.م</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{p.category?.nameAr || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleField(p.id, "available", p.available === false)}
                        className={`mx-auto block h-5 w-5 rounded-full transition-colors ${p.available !== false ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleField(p.id, "featured", p.featured === false)}
                        className={`mx-auto block h-5 w-5 rounded-full transition-colors ${p.featured ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleField(p.id, "spicy", p.spicy === false)}
                        className={`mx-auto block h-5 w-5 rounded-full transition-colors ${p.spicy ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(p)} className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-gray-100" style={{ color: "#c9a23b" }}>
                        تعديل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
