import { NextRequest } from "next/server";
import { authenticate, json, err } from "../../../lib/crud";
import { prisma } from "../../../lib/prisma";

export const maxDuration = 60;

const MAX_INPUT_BYTES = 25 * 1024 * 1024; // 25MB

async function loadSharp() {
  try {
    // createRequire bypasses bundler transforms entirely — resolves real node_modules at runtime
    const { createRequire } = await import("module");
    const req = createRequire(import.meta.url);
    const mod = req("sharp");
    return mod?.default ?? mod ?? null;
  } catch (e: any) {
    console.error("[upload] sharp load failed:", e?.message || e);
    // Fallback: normal dynamic import
    try {
      const mod = await import("sharp");
      return mod?.default ?? mod ?? null;
    } catch (e2: any) {
      console.error("[upload] sharp import fallback failed:", e2?.message || e2);
      return null;
    }
  }
}

const SUPPORTED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif",
  "image/tiff", "image/bmp", "image/heic", "image/heif", "image/svg+xml",
  "image/x-icon", "image/vnd.microsoft.icon", "image/jp2", "image/jxl",
]);

export async function POST(request: NextRequest) {
  const { auth, response } = await authenticate(request, "products:write");
  if (!auth) return response!;

  try {
    const formData = await request.formData();
    const entry = formData.get("file") ?? formData.get("image");
    if (!(entry instanceof File)) return err("No file provided", 400);
    if (entry.size === 0) return err("Empty file", 400);
    if (entry.size > MAX_INPUT_BYTES) return err("File too large (max 25MB)", 413);

    const inputBuffer = Buffer.from(await entry.arrayBuffer());

    const sharp = await loadSharp();

    // Fallback: store original bytes if sharp is unavailable
    if (!sharp) {
      const mime = entry.type && entry.type.startsWith("image/") ? entry.type : "application/octet-stream";
      const created = await prisma.mediaFile.create({
        data: {
          mime,
          sizeBytes: inputBuffer.length,
          originalName: (entry.name || "image").slice(0, 200),
          data: inputBuffer,
        },
      });
      return json({ ok: true, url: `/api/media/${created.id}`, id: created.id, width: null, height: null, sizeBytes: inputBuffer.length, originalSize: inputBuffer.length });
    }

    let pipeline = sharp(inputBuffer, { animated: false, failOn: "none" });
    let meta;
    try {
      meta = await pipeline.metadata();
    } catch {
      return err("Unsupported or corrupted image file", 400);
    }
    if (!meta || !meta.format) return err("Unsupported or corrupted image file", 400);

    // SVG passes through untouched (vector)
    if (meta.format === "svg") {
      const svg = inputBuffer.subarray(0, 4096).toString("utf8").toLowerCase();
      if (!svg.includes("<svg")) return err("Invalid SVG file", 400);
      const created = await prisma.mediaFile.create({
        data: {
          mime: "image/svg+xml",
          sizeBytes: inputBuffer.length,
          originalName: (entry.name || "image.svg").slice(0, 200),
          data: inputBuffer,
        },
      });
      return json({ ok: true, url: `/api/media/${created.id}`, id: created.id, width: null, height: null, sizeBytes: inputBuffer.length });
    }

    if (!SUPPORTED.has(`image/${meta.format}`) && meta.format !== "heif" && meta.format !== "magick") {
      // sharp already parsed it — trust the decoder over the declared mime
    }

    // Process: auto-rotate by EXIF, resize to fit 1600px, convert to webp
    const processed = await pipeline
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    const out = processed.data;
    if (out.length > 8 * 1024 * 1024) {
      // Extremely rare after resize; re-compress harder as a safeguard
      const smaller = await sharp(inputBuffer, { failOn: "none" })
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 68 })
        .toBuffer({ resolveWithObject: true });
      Object.assign(processed, smaller);
    }

    const created = await prisma.mediaFile.create({
      data: {
        mime: "image/webp",
        width: processed.info.width,
        height: processed.info.height,
        sizeBytes: processed.data.length,
        originalName: (entry.name || "image").slice(0, 200),
        data: processed.data,
      },
    });

    return json({
      ok: true,
      url: `/api/media/${created.id}`,
      id: created.id,
      width: processed.info.width,
      height: processed.info.height,
      sizeBytes: processed.data.length,
      originalSize: inputBuffer.length,
    });
  } catch (e: any) {
    return err(e?.message || "Upload failed", 500);
  }
}
