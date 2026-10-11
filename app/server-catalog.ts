import { prisma } from "./lib/prisma";
import {
  categories,
  products as defaultProducts,
  type CategoryId,
  type Product,
} from "./data";
import { getPaymobConfig } from "./paymob";
import type { SiteSettings } from "./settings";
import { loadSiteSettings } from "./server-settings";

export type ManagedProduct = Product & {
  active: boolean;
  custom?: boolean;
};

export type CategoryMedia = {
  slug: string;
  image?: string;
  videoUrl?: string;
};

/**
 * Bump when media-serving behavior changes: appended as ?v=N to /api/media/*
 * URLs so browsers fetch fresh bytes instead of using poisoned caches.
 */
const MEDIA_CACHE_VERSION = "2";

function withMediaVersion(url?: string | null): string | undefined {
  if (!url || !url.startsWith("/api/media/")) return url || undefined;
  if (url.includes("?v=")) return url;
  return `${url}?v=${MEDIA_CACHE_VERSION}`;
}

const ARABIC_TEXT = /[\u0600-\u06FF]/;

/**
 * English fields occasionally get Arabic text typed into them by mistake.
 * Treat such a value as empty so the caller falls back to a real English one,
 * otherwise Arabic would leak into the English version of the site.
 */
function pickEnglish(value?: string | null): string {
  return value && !ARABIC_TEXT.test(value) ? value : "";
}

export async function loadCategoryMedia(): Promise<Record<string, CategoryMedia>> {
  try {
    const dbCats = await prisma.category.findMany();
    const map: Record<string, CategoryMedia> = {};
    for (const c of dbCats) {
      map[c.slug] = {
        slug: c.slug,
        image: withMediaVersion(c.imageId),
        videoUrl: c.videoUrl || undefined,
      };
    }
    return map;
  } catch {
    return {};
  }
}

export async function loadManagedProducts(includeInactive = false): Promise<ManagedProduct[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      where: includeInactive ? {} : { active: true, available: true },
      include: { category: true },
      orderBy: { sortOrder: "asc" },
    });

    if (dbProducts.length === 0) return defaultProducts.map(p => ({ ...p, active: true }));

    const catSlugToId: Record<string, CategoryId> = {};
    for (const cat of categories) {
      catSlugToId[cat.id] = cat.id;
    }

    const catIdToSlug: Record<string, string> = {};
    const dbCats = await prisma.category.findMany();
    for (const c of dbCats) {
      catIdToSlug[c.id] = c.slug;
    }

    return dbProducts.map((p) => {
      const slug = catIdToSlug[p.categoryId] || "poultry";
      const catId: CategoryId = (catSlugToId[slug] || "poultry") as CategoryId;
      const fallback = defaultProducts.find((d) => d.id.toLowerCase() === p.slug);

      return {
        id: p.slug,
        category: catId,
        name: p.nameAr,
        nameEn: pickEnglish(p.nameEn) || fallback?.nameEn || p.nameAr,
        description: p.descriptionAr || fallback?.description || "",
        descriptionEn: pickEnglish(p.descriptionEn) || fallback?.descriptionEn,
        unit: p.shortDescriptionAr || fallback?.unit || "كيلو كامل",
        unitEn: pickEnglish(p.shortDescriptionEn) || fallback?.unitEn || "Full kg",
        image: withMediaVersion(p.imageId) || fallback?.image,
        price: p.price,
        featured: p.featured,
        spicy: p.spicy,
        active: p.active,
      };
    });
  } catch {
    return defaultProducts.map(p => ({ ...p, active: true }));
  }
}

export function serializeManagedProduct(product: ManagedProduct) {
  return {
    category: product.category,
    name: product.name,
    nameEn: product.nameEn,
    description: product.description,
    descriptionEn: product.descriptionEn || "",
    unit: product.unit,
    unitEn: product.unitEn,
    image: product.image || "",
    price: product.price,
    active: product.active !== false,
    featured: product.featured === true,
    spicy: product.spicy === true,
    custom: product.custom === true,
  };
}

export type CatalogPayload = {
  settings: SiteSettings;
  products: ManagedProduct[];
  categoryMedia: Record<string, CategoryMedia>;
};

/**
 * Single source of truth for the full catalog payload.
 * Used both by GET /api/catalog and by the root layout for server-side
 * rendering, so the first paint already contains the real data (no flash
 * of default/old images before the client fetch resolves).
 */
export async function loadCatalogPayload(): Promise<CatalogPayload> {
  const [settings, products, paymobConfig, categoryMedia] = await Promise.all([
    loadSiteSettings(),
    loadManagedProducts(),
    getPaymobConfig(),
    loadCategoryMedia(),
  ]);

  return {
    settings: {
      ...settings,
      // Version media-backed settings URLs the same way as category/product
      // images, so a poisoned/immutable browser cache can never pin an old file.
      heroImageUrl: withMediaVersion(settings.heroImageUrl) || settings.heroImageUrl,
      storyImageUrl: withMediaVersion(settings.storyImageUrl) || settings.storyImageUrl,
      paymobEnabled:
        settings.paymobEnabled === "true" && paymobConfig ? "true" : "false",
    },
    products,
    categoryMedia,
  };
}
