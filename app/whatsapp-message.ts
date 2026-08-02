export type WhatsAppOrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: string;
};

export type WhatsAppOrderInput = {
  items: WhatsAppOrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderId: number;
  paymentMethod: string;
  paymentStatus?: string;
  fulfillment: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address?: string;
  notes?: string;
  deliveryZoneName?: string;
  promoCode?: string;
  discountAmount?: number;
  language: "ar" | "en";
  createdAt?: string;
};

const DIVIDER = "───────────────────";

function formatCurrency(value: number, lang: "ar" | "en") {
  const formatted = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
  return lang === "ar" ? `${formatted} ج.م` : `${formatted} EGP`;
}

function formatDate(isoString: string, lang: "ar" | "en") {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
    }).format(date);
  } catch {
    return null;
  }
}

function paymentLabel(method: string, lang: "ar" | "en") {
  const labels: Record<string, [string, string]> = {
    cash: ["كاش عند الاستلام", "Cash on receipt"],
    instapay: ["إنستاباي", "InstaPay"],
    paymob: ["دفع إلكتروني", "Online payment"],
  };
  const pair = labels[method];
  return pair ? (lang === "ar" ? pair[0] : pair[1]) : method;
}

function fulfillmentLabel(fulfillment: string, lang: "ar" | "en") {
  if (fulfillment === "pickup") return lang === "ar" ? "استلام من الفرع" : "Branch pickup";
  return lang === "ar" ? "توصيل" : "Delivery";
}

export function formatWhatsAppOrder(input: WhatsAppOrderInput) {
  const ar = input.language === "ar";
  const lines: string[] = [];

  lines.push(ar ? "🛒 *طلب جديد — جاهز*" : "🛒 *New Order — JAHEZ*");
  lines.push(ar ? `رقم الطلب: #${input.orderId}` : `Order: #${input.orderId}`);
  if (input.createdAt) {
    const created = formatDate(input.createdAt, input.language);
    if (created) lines.push(created);
  }

  lines.push("");
  lines.push(DIVIDER);
  for (const item of input.items) {
    lines.push(`${item.quantity}× ${item.name}  ·  ${formatCurrency(item.price * item.quantity, input.language)}`);
    if (item.details) lines.push(`  ${item.details}`);
  }

  lines.push("");
  lines.push(DIVIDER);
  if ((input.discountAmount || 0) > 0) {
    lines.push(`${ar ? "الخصم" : "Discount"}: -${formatCurrency(input.discountAmount || 0, input.language)}`);
  }
  if (input.fulfillment === "delivery" && input.deliveryFee > 0) {
    lines.push(`${ar ? "التوصيل" : "Delivery"}: ${formatCurrency(input.deliveryFee, input.language)}`);
  }
  lines.push(`${ar ? "الإجمالي" : "Total"}: *${formatCurrency(input.total, input.language)}*`);

  lines.push("");
  lines.push(DIVIDER);
  lines.push(`${input.customerName}  ·  ${input.customerPhone}`);
  if (input.customerEmail) lines.push(input.customerEmail);
  lines.push(fulfillmentLabel(input.fulfillment, input.language));
  if (input.deliveryZoneName) lines.push(input.deliveryZoneName);
  if (input.address) lines.push(input.address);
  lines.push(paymentLabel(input.paymentMethod, input.language));
  if (input.notes) lines.push(input.notes);

  return lines.join("\n");
}
