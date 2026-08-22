const BASE = process.argv[2] || "http://localhost:3210";

// Login
const login = await fetch(BASE + "/api/admin/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ username: "owner", password: "Admin@123456" }),
});
const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
console.log("login:", login.ok ? "ok" : "FAIL");
if (!cookie) process.exit(1);

// Get latest backup id
const list = await (await fetch(BASE + "/api/admin/backup", { headers: { cookie } })).json();
const target = list.backups[0];
console.log("latest backup:", target.id, new Date(target.createdAt).toISOString(), `${(target.sizeBytes / 1024).toFixed(1)}KB`);

// RESTORE from it (safe: current state == backup state)
const t0 = Date.now();
const restore = await fetch(BASE + "/api/admin/backup", {
  method: "POST",
  headers: { cookie, "content-type": "application/json" },
  body: JSON.stringify({ action: "restore", id: target.id }),
});
const rd = await restore.json();
console.log("restore:", restore.ok && rd.ok ? `OK (${rd.restored} tables in ${Date.now() - t0}ms)` : "FAIL " + JSON.stringify(rd));

// Verify data survived round-trip
const cat = await (await fetch(BASE + "/api/catalog")).json();
console.log("products after restore:", cat.products?.length);
console.log(cat.products?.length === 26 ? "✓ Round-trip OK" : "✗ DATA MISMATCH");

// Real JPEG upload test (solid 100x100 image built via canvas-free raw JPEG)
// Generate minimal valid JPEG using sharp instead
const { default: sharp } = await import("sharp");
const jpegBuf = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#226644" } }).jpeg({ quality: 90 }).toBuffer();
const fd = new FormData();
fd.append("file", new Blob([jpegBuf], { type: "image/jpeg" }), "big-photo.jpg");
let res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
let d = await res.json();
console.log(`JPEG 3000x2000 upload: ${d.ok ? `✓ ${d.width}x${d.height} ${(d.originalSize/1024).toFixed(0)}KB→${(d.sizeBytes/1024).toFixed(1)}KB webp` : "✗ " + d.error}`);

// WEBP input test
const webpBuf = await sharp({ create: { width: 500, height: 500, channels: 4, background: { r: 200, g: 150, b: 50, alpha: 1 } } }).webp().toBuffer();
fd.delete("file"); fd.append("file", new Blob([webpBuf], { type: "image/webp" }), "input.webp");
res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
d = await res.json();
console.log(`WEBP input: ${d.ok ? "✓ converted" : "✗ " + d.error}`);

// GIF input test
const gifBuf = await sharp({ create: { width: 200, height: 200, channels: 3, background: "#3355aa" } }).gif().toBuffer();
fd.delete("file"); fd.append("file", new Blob([gifBuf], { type: "image/gif" }), "anim.gif");
res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
d = await res.json();
console.log(`GIF input: ${d.ok ? "✓ converted" : "✗ " + d.error}`);

// AVIF input test
try {
  const avifBuf = await sharp({ create: { width: 400, height: 400, channels: 3, background: "#aa3322" } }).avif().toBuffer();
  fd.delete("file"); fd.append("file", new Blob([avifBuf], { type: "image/avif" }), "modern.avif");
  res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
  d = await res.json();
  console.log(`AVIF input: ${d.ok ? "✓ converted" : "✗ " + d.error}`);
} catch (e) { console.log("AVIF gen skipped locally:", e.message.slice(0, 60)); }

// TIFF input
const tiffBuf = await sharp({ create: { width: 600, height: 600, channels: 3, background: "#116688" } }).tiff().toBuffer();
fd.delete("file"); fd.append("file", new Blob([tiffBuf], { type: "image/tiff" }), "scan.tiff");
res = await fetch(BASE + "/api/admin/upload", { method: "POST", headers: { cookie }, body: fd });
d = await res.json();
console.log(`TIFF input: ${d.ok ? "✓ converted" : "✗ " + d.error}`);

// Logout
await fetch(BASE + "/api/admin/auth/logout", { method: "POST", headers: { cookie } });
console.log("\ndone");
