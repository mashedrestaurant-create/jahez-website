import test from "node:test";
import assert from "node:assert/strict";
import { formatWhatsAppOrder } from "../app/whatsapp-message.ts";

const base = {
  items: [
    {
      id: "chicken-fajita",
      name: "فاهيتا دجاج",
      price: 450,
      quantity: 2,
      details: "وحدة البيع: كيلو كامل",
    },
  ],
  subtotal: 900,
  deliveryFee: 0,
  total: 900,
  orderId: 17,
  paymentMethod: "cash",
  fulfillment: "delivery",
  customerName: "عميلة جاهز",
  customerPhone: "01000000000",
  deliveryZoneName: "التجمع",
  address: "التجمع الخامس",
  language: "ar",
};

test("Arabic message uses JAHEZ branding and full-kilogram unit", () => {
  const message = formatWhatsAppOrder(base);
  assert.match(message, /طلب جديد.*جاهز/);
  assert.match(message, /2× فاهيتا دجاج/);
  assert.match(message, /وحدة البيع: كيلو كامل/);
  assert.match(message, /900 ج\.م/);
  assert.match(message, /كاش عند الاستلام/);
  assert.match(message, /التجمع/);
  assert.doesNotMatch(message, /التوصيل.*0 ج\.م/);
});

test("Pickup message omits delivery charge line", () => {
  const message = formatWhatsAppOrder({
    ...base,
    fulfillment: "pickup",
    deliveryZoneName: undefined,
    address: undefined,
  });
  assert.match(message, /استلام من الفرع/);
  assert.doesNotMatch(message, /التوصيل/);
});

test("Delivery with fee shows delivery line", () => {
  const message = formatWhatsAppOrder({
    ...base,
    deliveryFee: 50,
    total: 950,
  });
  assert.match(message, /التوصيل.*50 ج\.م/);
  assert.match(message, /الإجمالي.*950 ج\.م/);
});

test("English message renders EGP and payment labels", () => {
  const message = formatWhatsAppOrder({
    ...base,
    items: [{
      id: "lasagna",
      name: "Lasagna",
      price: 600,
      quantity: 1,
      details: "Unit: Tray",
    }],
    subtotal: 600,
    total: 600,
    customerName: "Jahez Customer",
    language: "en",
  });
  assert.match(message, /New Order.*JAHEZ/);
  assert.match(message, /Unit: Tray/);
  assert.match(message, /600 EGP/);
  assert.match(message, /Cash on receipt/);
});
