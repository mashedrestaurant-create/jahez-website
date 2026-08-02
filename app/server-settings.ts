import { getDb } from "../db";
import { siteSettings } from "../db/schema";
import { defaultSettings, type SiteSettings } from "./settings";

export async function loadSiteSettings(): Promise<SiteSettings> {
  const db = getDb();
  const rows = await db.select().from(siteSettings);
  const saved = rows.reduce<Record<string, string>>((values, row) => {
    values[row.key] = row.value;
    return values;
  }, {});
  return { ...defaultSettings, ...saved };
}
