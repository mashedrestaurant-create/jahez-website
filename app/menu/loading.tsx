export default function MenuLoading() {
  return (
    <section className="menu-page">
      <div className="menu-skeleton">
        <div className="skeleton-line-xshort" style={{ width: 120, height: 28, margin: "0 auto 20px" }} />
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-badge" style={{ width: 80, height: 36, borderRadius: 999 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="offer-card-skeleton">
              <div className="skeleton-image" style={{ height: 180 }} />
              <div className="skeleton-body">
                <div className="skeleton-line" />
                <div className="skeleton-line-short" />
                <div className="skeleton-button" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
