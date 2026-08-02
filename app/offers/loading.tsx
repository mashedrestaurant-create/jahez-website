export default function OffersLoading() {
  return (
    <section style={{ padding: "70px 20px", minHeight: "60vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="skeleton-line" style={{ width: 180, height: 32, margin: "0 auto 32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="offer-card-skeleton">
              <div className="skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton-badge" />
                <div className="skeleton-line" />
                <div className="skeleton-line-short" />
                <div className="skeleton-line-xshort" />
                <div className="skeleton-button" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
