import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id || id.length > 40) return new Response("Not found", { status: 404 });

  try {
    const { prisma } = await import("../../../lib/prisma");
    const media = await prisma.mediaFile.findUnique({ where: { id } });
    if (!media) return new Response("Not found", { status: 404 });

    const body = new Uint8Array(media.data);
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": media.mime,
        "content-length": String(body.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        etag: `"${media.id}"`,
      },
    });
  } catch {
    return new Response("Error", { status: 500 });
  }
}
