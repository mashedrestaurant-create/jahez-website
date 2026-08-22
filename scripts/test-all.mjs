const BASE = process.argv[2] || "http://localhost:3000";
let pass = 0, fail = 0;
const failures = [];

function log(ok, name, extra = "") {
  const mark = ok ? "✓" : "✗";
  console.log(`${mark} ${name}${extra ? ` — ${extra}` : ""}`);
  if (ok) pass++; else { fail++; failures.push(name); }
}

async function checkPage(path, name) {
  try {
    const res = await fetch(BASE + path, { redirect: "manual" });
    const ok = res.status === 200 || res.status === 307 || res.status === 308;
    log(ok, `${name} [${path}]`, `status=${res.status}`);
  } catch (e) {
    log(false, `${name} [${path}]`, e.message);
  }
}

async function checkApiStatus(path, expected, name) {
  try {
    const res = await fetch(BASE + path);
    log(res.status === expected, `${name} [${path}]`, `status=${res.status} expected=${expected}`);
    return res;
  } catch (e) {
    log(false, `${name} [${path}]`, e.message);
    return null;
  }
}

async function main() {
  console.log(`\n=== Testing ${BASE} ===\n`);

  // ---------- Public pages ----------
  console.log("--- Pages ---");
  await checkPage("/", "Home");
  await checkPage("/menu", "Menu");
  await checkPage("/about", "About");
  await checkPage("/contact", "Contact");
  await checkPage("/faq", "FAQ");
  await checkPage("/locations", "Locations");
  await checkPage("/offers", "Offers");
  await checkPage("/cart", "Cart");
  await checkPage("/privacy", "Privacy");
  await checkPage("/account", "Account");
  await checkPage("/admin/login", "Admin Login");
  await checkPage("/driver/login", "Driver Login");

  // ---------- Public APIs ----------
  console.log("\n--- Public APIs ---");
  const cat = await checkApiStatus("/api/catalog", 200, "Catalog API");
  let productCount = -1;
  if (cat && cat.ok) {
    const data = await cat.json().catch(() => null);
    productCount = data?.products?.length ?? -1;
    log(productCount > 0, "Catalog has products", `count=${productCount}`);
    log(data?.settings && Object.keys(data.settings).length > 0, "Catalog has settings");
  }

  // Events endpoint persists
  try {
    const res = await fetch(BASE + "/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "test_event", page: "/__test__", sessionId: "test-session-123" }),
    });
    const d = await res.json();
    log(res.ok && d.ok, "Events API accepts events", JSON.stringify(d));
  } catch (e) {
    log(false, "Events API", e.message);
  }

  // Events rejects empty
  try {
    const res = await fetch(BASE + "/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event: "" }),
    });
    log(res.status === 400, "Events API rejects empty event", `status=${res.status}`);
  } catch (e) {
    log(false, "Events API rejection", e.message);
  }

  // ---------- Protected APIs must NOT leak ----------
  console.log("\n--- Auth protection (expect 401/403) ---");
  for (const p of ["/api/admin/stats", "/api/admin/products", "/api/admin/analytics", "/api/admin/backup", "/api/admin/orders", "/api/admin/settings"]) {
    try {
      const res = await fetch(BASE + p);
      const blocked = res.status === 401 || res.status === 403;
      log(blocked, `Protected ${p}`, `status=${res.status}`);
    } catch (e) {
      log(false, `Protected ${p}`, e.message);
    }
  }

  // ---------- Admin auth flow ----------
  console.log("\n--- Admin auth flow ---");
  let cookie = "";
  try {
    const res = await fetch(BASE + "/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: "owner", password: "Admin@123456" }),
    });
    const setCookie = res.headers.get("set-cookie") || "";
    cookie = setCookie.split(";")[0];
    const d = await res.json();
    log(res.ok && d.ok !== false && !!cookie, "Admin login (owner)", `status=${res.status} cookie=${cookie ? "yes" : "no"}`);
  } catch (e) {
    log(false, "Admin login", e.message);
  }

  if (!cookie) {
    console.log("\n⚠ No session — skipping authenticated tests");
  } else {
    for (const p of ["/api/admin/auth/me", "/api/admin/stats", "/api/admin/products", "/api/admin/categories", "/api/admin/settings", "/api/admin/analytics?range=7d", "/api/admin/backup"]) {
      try {
        const res = await fetch(BASE + p, { headers: { cookie } });
        log(res.ok, `Authed GET ${p}`, `status=${res.status}`);
        if (p.includes("analytics")) {
          const d = await res.json();
          log(d.funnel !== undefined && d.orders !== undefined, "Analytics payload shape", `funnel.pageviews=${d.funnel?.pageviews}`);
        }
        if (p.endsWith("/backup")) {
          const d = await res.json();
          log(Array.isArray(d.backups), "Backups list shape", `count=${d.backups?.length}`);
        }
      } catch (e) {
        log(false, `Authed GET ${p}`, e.message);
      }
    }

    // Wrong password rejected
    try {
      const res = await fetch(BASE + "/api/admin/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "owner", password: "wrong" }),
      });
      log(res.status === 401 || res.status === 403 || res.ok === false, "Wrong password rejected", `status=${res.status}`);
    } catch (e) {
      log(false, "Wrong password test", e.message);
    }

    // ---------- Image upload E2E ----------
    console.log("\n--- Image upload E2E ---");

    async function makePng() {
      // Minimal valid 8x8 red PNG
      const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8Dwn4EIwESMolGFlCsEAE1qAreu3blLAAAAAElFTkSuQmCC";
      return Buffer.from(b64, "base64");
    }

    try {
      const png = await makePng();
      const fd = new FormData();
      fd.append("file", new Blob([png], { type: "image/png" }), "test.png");
      let res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
      let d = await res.json();
      log(res.ok && d.ok, "Upload PNG → webp conversion", `url=${d.url} size=${d.sizeBytes}B (${d.originalSize}B orig)`);

      if (d.url) {
        const imgRes = await fetch(BASE + d.url);
        const isWebp = (imgRes.headers.get("content-type") || "").includes("webp");
        log(imgRes.ok && isWebp, "Media serving works", `status=${imgRes.status} type=${imgRes.headers.get("content-type")} cache=${imgRes.headers.get("cache-control")}`);
      }

      // Upload garbage file → should be rejected cleanly
      const fd2 = new FormData();
      fd2.append("file", new Blob(["not an image at all"], { type: "text/plain" }), "fake.png");
      res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd2 });
      d = await res.json();
      log(!d.ok, "Corrupt file rejected", `status=${res.status} error=${d.error}`);

      // Upload without auth → rejected
      const fd3 = new FormData();
      fd3.append("file", new Blob([png], { type: "image/png" }), "x.png");
      res = await fetch(BASE + "/api/admin/upload", { method: "POST", body: fd3 });
      log(res.status === 401 || res.status === 403, "Upload requires auth", `status=${res.status}`);
    } catch (e) {
      log(false, "Image upload E2E", e.message);
    }

    // Backup create
    try {
      const res = await fetch(BASE + "/api/admin/backup", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ action: "create", label: "post-deploy-test" }),
      });
      const d = await res.json();
      log(res.ok && d.ok, "Manual backup creation", `size=${(d.sizeBytes / 1024).toFixed(1)}KB products=${d.counts?.products}`);
    } catch (e) {
      log(false, "Backup creation", e.message);
    }

    // Logout
    try {
      const res = await fetch(BASE + "/api/admin/auth/logout", { method: "POST", headers: { cookie } });
      log(res.ok || res.status === 200, "Logout", `status=${res.status}`);
    } catch (e) {
      log(false, "Logout", e.message);
    }
  }

  // ---------- Summary ----------
  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
  if (failures.length) {
    console.log("\nFailed:");
    failures.forEach(f => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
