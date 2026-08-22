import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Neon HTTP adapter may return BYTEA columns as a base64 string,
 * a {type:"Buffer",data:[...]} object, or a real Uint8Array depending
 * on serialization path. Normalize all shapes into a real binary Buffer.
 */
function toBinary(data: unknown): Buffer | null {
  try {
    if (!data) return null;
    if (Buffer.isBuffer(data)) return data;
    if (typeof data === "string") return Buffer.from(data, "base64");
    if (data instanceof Uint8Array) return Buffer.from(data);
    if (Array.isArray(data)) return Buffer.from(data as number[]);
    const obj = data as { type?: string; data?: unknown };
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
      return Buffer.from(obj.data as number[]);
    }
    return Buffer.from(data as ArrayBuffer);
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 40) return new Response("Not found", { status: 404 });

  try {
    const { prisma } = await import("../../../lib/prisma");
    const media = await prisma.mediaFile.findUnique({ where: { id } });
    if (!media) return new Response("Not found", { status: 404 });

    const rawData: unknown = media.data;
    let buf = toBinary(rawData);
    if (!buf || buf.length === 0) return new Response("Not found", { status: 404 });

    // Sniff real image magic numbers. If absent but content looks like base64
    // text (Neon adapter can return BYTEA that way), decode and re-check.
    const isBinaryImage =
      (buf.length > 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") ||
      (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) || // jpeg
      (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50); // png

    if (!isBinaryImage) {
      const head = buf.subarray(0, 512).toString("latin1");
      const looksLikeBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(head);
      if (looksLikeBase64) {
        try {
          const decoded = Buffer.from(buf.toString("latin1"), "base64");
          const dOk =
            decoded.length > 12 &&
            ((decoded.subarray(0, 4).toString("latin1") === "RIFF" && decoded.subarray(8, 12).toString("latin1") === "WEBP") ||
              (decoded[0] === 0xff && decoded[1] === 0xd8) ||
              (decoded[0] === 0x89 && decoded[1] === 0x50));
          if (dOk) buf = decoded;
        } catch {
          // keep original buffer
        }
      }
    }

    const body = new Uint8Array(buf);
    return new Response(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": media.mime || "application/octet-stream",
        "content-length": String(body.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        etag: `"${media.id}"`,
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}