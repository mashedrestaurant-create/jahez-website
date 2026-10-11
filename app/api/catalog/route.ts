import { loadCatalogPayload } from "../../server-catalog";
import { products as defaultProducts } from "../../data";
import { defaultSettings } from "../../settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await loadCatalogPayload();
    // no-store: the client refetches this after hydration to pick up dashboard
    // edits instantly. Any CDN/browser caching here could serve an older copy
    // that overwrites fresh server-rendered data (old image flashing back).
    return Response.json(payload, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return Response.json(
      {
        settings: defaultSettings,
        products: defaultProducts,
        categoryMedia: {},
      },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
