import type { ManagedProduct } from "./server-catalog";

export type ValidatedOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: string;
};

type SubmittedOrderItem = {
  id?: unknown;
  quantity?: unknown;
};

export function validateOrderItems(
  submitted: unknown,
  products: ManagedProduct[],
  language: "ar" | "en",
) {
  if (!Array.isArray(submitted) || submitted.length === 0 || submitted.length > 30) {
    return null;
  }

  const catalog = new Map(products.map((product) => [product.id, product]));
  const items: ValidatedOrderItem[] = [];
  let totalQuantity = 0;

  for (const unknownItem of submitted) {
    if (!unknownItem || typeof unknownItem !== "object") return null;
    const item = unknownItem as SubmittedOrderItem;
    const id = typeof item.id === "string" ? item.id : "";
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 25) return null;
    totalQuantity += quantity;
    if (totalQuantity > 50) return null;

    const product = catalog.get(id);
    if (!product || product.active === false) return null;
    items.push({
      id,
      name: language === "ar" ? product.name : product.nameEn,
      price: product.price,
      quantity,
      details: `${language === "ar" ? "وحدة البيع" : "Unit"}: ${language === "ar" ? product.unit : product.unitEn}`,
    });
  }

  return items;
}

export function calculateOrderSubtotal(items: ValidatedOrderItem[]) {
  return Math.round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
  ) / 100;
}
