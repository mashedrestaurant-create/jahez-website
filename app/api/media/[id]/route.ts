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

    // Detect base64 double-encoding: raw column arrived as a pure base64 string
    const looksLikeBase64Text =
      typeof rawData === "string" &&
      /^[A-Za-z0-9+/=\r\n]+$/.test((rawData as string).slice(0, 512));

    let body: Uint8Array;
    if (looksLikeBase64Text) {
      body = new Uint8Array(Buffer.from(rawData as string, "base64"));
    } else {
      const buf = toBinary(rawData);
      if (!buf || buf.length === 0) return new Response("Not found", { status: 404 });
      body = new Uint8Array(buf);
    }

    if (body.byteLength === 0) return new Response("Not found", { status: 404 });

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