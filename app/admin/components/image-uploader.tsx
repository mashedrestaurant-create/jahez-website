"use client";

import { useRef, useState, useEffect } from "react";

const ACCEPT = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.svg,.heic,.heif,.avif,.ico";

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tif", "tiff", "svg", "heic", "heif", "avif", "ico"].includes(ext);
}

export function ImageUploader({ value, onChange, height = 80, hint }: {
  value: string;
  onChange: (url: string) => void;
  height?: number;
  hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const upload = async (file: File) => {
    setError("");
    if (!isImageFile(file)) {
      setError("الملف مش صورة — الصيغ المدعومة: JPG, PNG, WEBP, HEIC, AVIF, GIF, SVG");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError("الصورة أكبر من 25MB");
      return;
    }
    setUploading(true);
    setProgress(30);
    const fakeTimer = setInterval(() => setProgress(p => Math.min(p + 7, 85)), 300);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.ok) {
        onChange(d.url);
        setProgress(100);
      } else {
        setError(d.error || `فشل الرفع (${res.status})`);
      }
    } catch {
      setError("تعذر الاتصال بالسيرفر");
    }
    clearInterval(fakeTimer);
    setTimeout(() => { setUploading(false); setProgress(0); }, 350);
  };

  // Paste image directly (Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const box = boxRef.current;
      if (!box) return;
      const rect = box.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) { e.preventDefault(); upload(file); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  return (
    <div className="space-y-2" ref={boxRef}>
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${dragOver ? "border-[#c9a23b] bg-[#c9a23b]/10 scale-[1.01]" : uploading ? "border-blue-300 bg-blue-50/50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        onClick={() => { if (!uploading) inputRef.current?.click(); }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
        {value && !uploading ? (
          <div className="flex items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="object-cover rounded-lg shadow-sm" style={{ maxHeight: height * 1.5, maxWidth: 220 }} />
            <div className="text-right">
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="block w-full rounded-lg px-3 py-1.5 text-xs font-bold mb-2 transition-colors hover:bg-gray-100 border border-gray-200"
                style={{ color: "#374151" }}
              >تغيير الصورة</button>
              <button
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="block w-full rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-red-50 border border-red-200"
                style={{ color: "#dc2626" }}
              >إزالة</button>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-2xl mb-1">{uploading ? "⏳" : dragOver ? "📥" : "🖼️"}</p>
            <p className="text-sm font-bold" style={{ color: uploading ? "#2563eb" : "#374151" }}>
              {uploading ? `جاري الرفع والمعالجة... ${progress}%` : dragOver ? "اترك الملف هنا" : "اسحب صورة أو اضغط للاختيار أو الصق بـ Ctrl+V"}
            </p>
            {!uploading && <p className="text-[11px] mt-1" style={{ color: "#9ca3af" }}>{hint || "JPG · PNG · WEBP · HEIC · AVIF · GIF · SVG — حتى 25MB، بتتحول تلقائياً لـ WebP مضغوطة"}</p>}
          </div>
        )}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 overflow-hidden rounded-b-xl">
            <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: "#c9a23b" }} />
          </div>
        )}
      </div>
      {error && (
        <p className="rounded-lg px-3 py-2 text-xs font-bold" style={{ background: "#fef2f2", color: "#dc2626" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
