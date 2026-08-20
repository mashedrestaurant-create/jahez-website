import { prisma } from "./lib/prisma";
import { defaultSettings, type SiteSettings } from "./settings";

export async function loadSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.siteSetting.findMany();
    const saved: Record<string, string> = {};
    for (const row of rows) {
      const raw = String(row.value ?? "");
      try {
        const parsed = JSON.parse(raw);
        saved[row.key] = typeof parsed === "string" ? parsed : raw;
      } catch {
        saved[row.key] = raw;
      }
    }
    return { ...defaultSettings, ...saved };
  } catch {
    return defaultSettings;
  }
}
