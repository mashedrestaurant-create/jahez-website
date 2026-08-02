#!/usr/bin/env node

/**
 * Verifies that all product images referenced in the codebase exist locally,
 * contain no Google Drive links, and are valid files.
 *
 * Usage: node scripts/verify-product-images.mjs
 * Exit code 0 = all checks pass, 1 = failures found.
 */

import { readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SRC_FILE = resolve(ROOT, "app", "data.ts");
const PUBLIC_DIR = resolve(ROOT, "public");

let failures = 0;

function fail(msg) {
  console.error(`  FAIL: ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  OK: ${msg}`);
}

/* ── 1. Parse data.ts for image references ───────────────────────────── */

const dataSrc = readFileSync(SRC_FILE, "utf-8");

// Check for Google Drive links
const drivePatterns = dataSrc.match(/drive\.google\.com/g);
if (drivePatterns) {
  fail(`Found ${drivePatterns.length} Google Drive link(s) in data.ts`);
} else {
  pass("No Google Drive links in data.ts");
}

const lh3Patterns = dataSrc.match(/lh3\.googleusercontent\.com/g);
if (lh3Patterns) {
  fail(`Found ${lh3Patterns.length} lh3.googleusercontent.com link(s) in data.ts`);
} else {
  pass("No lh3.googleusercontent.com links in data.ts");
}

// Extract all local image paths from productImages and productFallbacks
const localImagePaths = new Set();

// Match quoted paths starting with /assets/
const pathRegex = /["'`](\/assets\/[^"'`]+)["'`]/g;
let match;
while ((match = pathRegex.exec(dataSrc)) !== null) {
  localImagePaths.add(match[1]);
}

console.log(`\nFound ${localImagePaths.size} local image paths in data.ts\n`);

/* ── 2. Verify each local image exists and is valid ──────────────────── */

console.log("Checking local image files:");

for (const imgPath of localImagePaths) {
  const fullPath = resolve(PUBLIC_DIR, imgPath.slice(1)); // strip leading /

  try {
    const stat = statSync(fullPath);
    if (stat.size === 0) {
      fail(`${imgPath} — file is empty (0 bytes)`);
      continue;
    }
    const ext = extname(fullPath).toLowerCase();
    const validExts = [".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif"];
    if (!validExts.includes(ext)) {
      fail(`${imgPath} — unexpected extension "${ext}"`);
      continue;
    }
    pass(`${imgPath} (${(stat.size / 1024).toFixed(1)} KB)`);
  } catch {
    fail(`${imgPath} — file not found at ${fullPath}`);
  }
}

/* ── 3. Scan other source files for lingering Google Drive refs ──────── */

console.log("\nScanning source files for lingering Google Drive references:");

const srcPatterns = ["lh3.googleusercontent.com", "drive.google.com"];
const filesToScan = [
  resolve(ROOT, "app", "data.ts"),
  resolve(ROOT, "app", "plain-image.tsx"),
  resolve(ROOT, "app", "menu", "page.tsx"),
  resolve(ROOT, "app", "page.tsx"),
  resolve(ROOT, "app", "server-catalog.ts"),
  resolve(ROOT, "next.config.ts"),
];

for (const filePath of filesToScan) {
  try {
    const content = readFileSync(filePath, "utf-8");
    for (const pattern of srcPatterns) {
      if (content.includes(pattern)) {
        fail(`${filePath.split(ROOT + "\\")[1]} contains "${pattern}"`);
      }
    }
  } catch {
    // file doesn't exist, skip
  }
}

if (failures === 0) {
  pass("No lingering Google Drive references in scanned source files");
}

/* ── 4. Summary ─────────────────────────────────────────────────────── */

console.log(`\n${"=".repeat(50)}`);
if (failures > 0) {
  console.error(`FAILED: ${failures} issue(s) found`);
  process.exit(1);
} else {
  console.log("ALL CHECKS PASSED");
  process.exit(0);
}
