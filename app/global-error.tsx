"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0A2D1D", color: "#F7F0DF", textAlign: "center", padding: 24 }}>
          <div>
            <h1>چاهِز</h1>
            <p>حصلت مشكلة مؤقتة. حاولي مرة تانية.</p>
            <button onClick={reset} style={{ padding: "12px 22px", border: 0, borderRadius: 999, background: "#C9A23B", color: "#0A2D1D", fontWeight: 800 }}>إعادة المحاولة</button>
          </div>
        </main>
      </body>
    </html>
  );
}
