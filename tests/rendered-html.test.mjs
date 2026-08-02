import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { categories, products } from "../app/data.ts";
import { defaultSettings } from "../app/settings.ts";
import { validateOrderItems, calculateOrderSubtotal } from "../app/order-validation.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const managedProducts = products.map((product) => ({ ...product, active: true }));

test("catalog includes the 26 products from the supplied Jahez menu", () => {
  assert.equal(products.length, 26);
  assert.equal(new Set(products.map((product) => product.id)).size, 26);
  assert.equal(categories.length, 5);
  assert.equal(products.filter((product) => product.category === "poultry").length, 8);
  assert.equal(products.filter((product) => product.category === "beef").length, 8);
  assert.equal(products.filter((product) => product.category === "cooked-meals").length, 1);
  assert.equal(products.filter((product) => product.category === "ready-meals").length, 4);
  assert.equal(products.filter((product) => product.category === "appetizers").length, 5);
});

test("product names and prices match the supplied approved price sheet", () => {
  const expected = new Map([
    ["فاهيتا دجاج", 450],
    ["دجاج بالكاري", 450],
    ["فيليه دجاج أوريجانو", 450],
    ["تشيكن بانيه", 500],
    ["دجاج تندوري", 450],
    ["كريسبي دجاج", 450],
    ["شيش طاووق", 440],
    ["هوت ناشفيل تشيكن", 450],
    ["شاورما لحم", 750],
    ["كفتة", 680],
    ["برجر لحم", 630],
    ["ميني برجر", 630],
    ["لحم صويا وجنزبيل", 750],
    ["بيف ترياكي", 750],
    ["بيف كاجن حار", 750],
    ["بيف سويت تشيلي", 750],
    ["صوص بولونيز باللحم", 550],
    ["ورق عنب محشي", 260],
    ["جلاش باللحم", 470],
    ["لازانيا", 600],
    ["مكرونة بشاميل", 600],
    ["سبرينج رول خضار", 180],
    ["سبرينج رول دجاج", 200],
    ["سمبوسك لحم", 200],
    ["سمبوسك جبنة", 150],
    ["سمبوسك دجاج", 200],
  ]);
  assert.equal(expected.size, products.length);
  for (const product of products) {
    assert.equal(expected.get(product.name), product.price, `${product.name} price mismatch`);
  }
});

test("all kilogram products are sold as full kilograms", () => {
  const kiloProducts = products.filter((product) =>
    ["poultry", "beef", "cooked-meals"].includes(product.category) || product.id === "stuffed-vine-leaves"
  );
  assert.ok(kiloProducts.length > 0);
  for (const product of kiloProducts) {
    assert.equal(product.unit, "كيلو كامل");
    assert.equal(product.unitEn, "Full kg");
  }
});

test("tray and appetizer units match the source menu", () => {
  for (const id of ["beef-goulash", "lasagna", "bechamel-pasta"]) {
    const product = products.find((entry) => entry.id === id);
    assert.equal(product?.unit, "صينية");
    assert.equal(product?.unitEn, "Tray");
  }
  for (const product of products.filter((entry) => entry.category === "appetizers")) {
    assert.equal(product.unit, "عبوة 15 قطعة");
    assert.equal(product.unitEn, "Pack of 15 pcs");
  }
});

test("default commerce settings match the requested launch rules", () => {
  assert.equal(defaultSettings.orderLeadHours, "24");
  assert.equal(defaultSettings.minimumOrder, "0");
  assert.equal(defaultSettings.cashOnDeliveryEnabled, "true");
  assert.equal(defaultSettings.instapayEnabled, "false");
  assert.equal(defaultSettings.paymobEnabled, "false");
  assert.equal(defaultSettings.whatsappNumber, "");
  const zones = JSON.parse(defaultSettings.deliveryZones);
  assert.deepEqual(zones.map((zone) => zone.id), ["new-cairo", "rehab"]);
  assert.ok(zones.every((zone) => zone.minimumOrder === 0));
});

test("catalog image references resolve to local files", async () => {
  const paths = new Set([
    ...categories.map((category) => category.image),
    ...products.map((product) => product.image).filter(Boolean),
  ]);
  for (const path of paths) {
    assert.match(path, /^\/assets\/jahez\//);
    await access(resolve(root, "public", path.slice(1)));
  }
});

test("server-side validation ignores forged prices and adds the unit", () => {
  const submitted = [{ id: "chicken-fajita", quantity: 2, price: 1 }];
  const items = validateOrderItems(submitted, managedProducts, "ar");
  assert.ok(items);
  assert.equal(items[0].price, 450);
  assert.equal(items[0].details, "وحدة البيع: كيلو كامل");
  assert.equal(calculateOrderSubtotal(items), 900);
});

test("server-side validation rejects partial or invalid quantities", () => {
  assert.equal(validateOrderItems([{ id: "chicken-fajita", quantity: 0.5 }], managedProducts, "ar"), null);
  assert.equal(validateOrderItems([{ id: "chicken-fajita", quantity: 0 }], managedProducts, "ar"), null);
  assert.equal(validateOrderItems([{ id: "not-a-product", quantity: 1 }], managedProducts, "ar"), null);
});
