export default function CartLoading() {
  return (
    <section className="cart-page" style={{ minHeight: "60vh", padding: "70px 20px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="skeleton-line" style={{ width: 200, height: 32, margin: "0 auto 32px" }} />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 16,
              padding: "20px 0",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div className="skeleton-image" style={{ width: 80, height: 80, borderRadius: 14, flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="skeleton-line" style={{ width: "60%" }} />
              <div className="skeleton-line-short" style={{ width: "40%" }} />
              <div className="skeleton-line-xshort" style={{ width: 80 }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
