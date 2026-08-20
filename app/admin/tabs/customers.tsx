"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orderCount: number;
  totalSpent: number;
  firstVisit: string;
};

export function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const mounted = useRef(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const d = await res.json();
      if (!mounted.current) return;
      if (d.ok) setCustomers(d.items || []);
    } catch {}
  }, [search]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchCustomers().finally(() => {
      if (mounted.current) setLoading(false);
    });
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(fetchCustomers, 400);
  };

  return (
    <div dir="rtl" className="space-y-4 p-1">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="بحث بالاسم أو رقم الهاتف أو البريد..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none transition-colors focus:border-[#c9a23b]"
          style={{ textAlign: "right" }}
        />
        <span className="whitespace-nowrap text-sm text-gray-400">
          {customers.length} عميل
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <div
              className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
              style={{
                borderColor: "#c9a23b",
                borderTopColor: "transparent",
              }}
            />
            <p className="text-sm font-bold" style={{ color: "#0a2d1d" }}>
              جاري التحميل...
            </p>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-sm" style={{ color: "#9ca3af" }}>
            لا يوجد عملاء بعد
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>
                    الاسم
                  </th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>
                    الهاتف
                  </th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>
                    البريد
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>
                    عدد الطلبات
                  </th>
                  <th className="px-4 py-3 text-center font-bold" style={{ color: "#6b7280" }}>
                    إجمالي المشتريات
                  </th>
                  <th className="px-4 py-3 text-right font-bold" style={{ color: "#6b7280" }}>
                    تاريخ أول زيارة
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-bold" style={{ color: "#0a2d1d" }}>
                      {c.name || "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr" style={{ color: "#374151" }}>
                      {c.phone || "—"}
                    </td>
                    <td className="px-4 py-3" dir="ltr" style={{ color: "#374151" }}>
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: "#0a2d1d" }}>
                      {c.orderCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold" style={{ color: "#0a2d1d" }}>
                      {Number(c.totalSpent || 0).toLocaleString("ar-EG")} ج.م
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {c.firstVisit
                        ? new Date(c.firstVisit).toLocaleDateString("ar-EG")
                        : "—"}
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
