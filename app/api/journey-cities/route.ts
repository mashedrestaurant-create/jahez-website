import { loadSiteSettings } from "../../server-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await loadSiteSettings();
    let cities: unknown[] = [];
    try {
      cities = JSON.parse(settings.journeyCities || "[]");
    } catch {
      cities = [];
    }
    return Response.json({ cities });
  } catch {
    return Response.json({ cities: [] });
  }
}
