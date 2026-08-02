import { getDb } from "../db";
import { productOverrides } from "../db/schema";
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

const categoryIds = new Set<CategoryId>(categories.map((category) => category.id));
const defaultProductIds = new Set(defaultProducts.map((product) => product.id));

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && categoryIds.has(value as CategoryId);
}

function parseStoredProduct(
  id: string,
  value: unknown,
  fallback?: Product,
): ManagedProduct | null {
  if (!value || typeof value !== "object") return fallback
    ? { ...fallback, active: true }
    : null;

  const record = value as Record<string, unknown>;
  const category = isCategoryId(record.category)
    ? record.category
    : fallback?.category;
  const name = cleanText(record.name, 90) || fallback?.name || "";
  const nameEn = cleanText(record.nameEn, 90) || fallback?.nameEn || "";
  const description =
    cleanText(record.description, 240) || fallback?.description || "";
  const descriptionEn =
    cleanText(record.descriptionEn, 240) || fallback?.descriptionEn || "";
  const unit = cleanText(record.unit, 60) || fallback?.unit || "قطعة";
  const unitEn = cleanText(record.unitEn, 60) || fallback?.unitEn || "Item";
  const price = Number(record.price ?? fallback?.price);

  if (
    !/^[a-z0-9][a-z0-9-]{2,79}$/.test(id) ||
    !category ||
    !name ||
    !nameEn ||
    !description ||
    !descriptionEn ||
    !unit ||
    !unitEn ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 100000
  ) {
    return fallback ? { ...fallback, active: true } : null;
  }

  return {
    id,
    category,
    name,
    nameEn,
    description,
    descriptionEn,
    unit,
    unitEn,
    image: cleanText(record.image, 1000) || fallback?.image,
    price: Math.round(price * 100) / 100,
    featured: record.featured === true,
    spicy: record.spicy === true || fallback?.spicy === true,
    active: record.active !== false,
    custom: record.custom === true || !defaultProductIds.has(id),
  };
}

export function sanitizeManagedProduct(value: unknown): ManagedProduct | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const id = cleanText(record.id, 80).toLowerCase();
  const fallback = defaultProducts.find((product) => product.id === id);
  return parseStoredProduct(id, record, fallback);
}

export async function loadManagedProducts(includeInactive = false) {
  const db = getDb();
  const rows = await db.select().from(productOverrides);
  const overrides = new Map<string, unknown>();

  for (const row of rows) {
    try {
      overrides.set(row.id, JSON.parse(row.dataJson));
    } catch {
      // Ignore malformed legacy overrides and keep the safe default product.
    }
  }

  const products: ManagedProduct[] = defaultProducts.map((product) =>
    parseStoredProduct(product.id, overrides.get(product.id), product) ??
    ({ ...product, active: true } satisfies ManagedProduct),
  );

  for (const [id, value] of overrides) {
    if (defaultProductIds.has(id)) continue;
    const customProduct = parseStoredProduct(id, value);
    if (customProduct) products.push(customProduct);
  }

  return includeInactive
    ? products
    : products.filter((product) => product.active !== false);
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
    custom: product.custom === true || !defaultProductIds.has(product.id),
  };
}
