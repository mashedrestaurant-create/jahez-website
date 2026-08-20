import { prisma } from "./lib/prisma";
import {
  categories,
  products as defaultProducts,
  type CategoryId,
  type Product,
} from "./data";

export type ManagedProduct = Product & {
  active: boolean;
  custom?: boolean;
};

export type CategoryMedia = {
  slug: string;
  image?: string;
  videoUrl?: string;
};

export async function loadCategoryMedia(): Promise<Record<string, CategoryMedia>> {
  try {
    const dbCats = await prisma.category.findMany();
    const map: Record<string, CategoryMedia> = {};
    for (const c of dbCats) {
      map[c.slug] = {
        slug: c.slug,
        image: c.imageId || undefined,
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
        nameEn: p.nameEn,
        description: p.descriptionAr || fallback?.description || "",
        descriptionEn: p.descriptionEn || fallback?.descriptionEn,
        unit: p.shortDescriptionAr || fallback?.unit || "كيلو كامل",
        unitEn: p.shortDescriptionEn || fallback?.unitEn || "Full kg",
        image: p.imageId || fallback?.image,
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
