import { getPaymobConfig } from "../../paymob";
import { loadManagedProducts, loadCategoryMedia } from "../../server-catalog";
import { products as defaultProducts } from "../../data";
import { defaultSettings } from "../../settings";
import { loadSiteSettings } from "../../server-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [settings, products, paymobConfig, categoryMedia] = await Promise.all([
      loadSiteSettings(),
      loadManagedProducts(),
      getPaymobConfig(),
      loadCategoryMedia(),
    ]);
    return Response.json(
      {
        settings: {
          ...settings,
          paymobEnabled:
            settings.paymobEnabled === "true" && paymobConfig
              ? "true"
              : "false",
        },
        products,
        categoryMedia,
      },
      {
        headers: {
          "cache-control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return Response.json(
      {
        settings: defaultSettings,
        products: defaultProducts,
        categoryMedia: {},
      },
      {
        headers: {
          "cache-control":
            "public, max-age=30, s-maxage=30, stale-while-revalidate=300",
        },
      },
    );
  }
}
