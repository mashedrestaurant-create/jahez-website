import { prisma } from "../../lib/prisma";
import {
  calculateOrderSubtotal,
  validateOrderItems,
} from "../../order-validation";
import { normalizeEgyptianMobile } from "../../egypt-phone";
import {
  createPaymobCardPayment,
  getPaymobConfig,
  PaymobError,
  validatePaymobEnv,
} from "../../paymob";
import { loadManagedProducts } from "../../server-catalog";
import { settingEnabled } from "../../checkout-settings";
import { loadSiteSettings } from "../../server-settings";
import { quoteDelivery } from "../../delivery-distance";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function generateRequestId() {
  return crypto.randomUUID().slice(0, 12);
}

function logOrder(requestId: string, step: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({ component: "orders-api", requestId, step, ...data }));
}

function logOrderError(requestId: string, step: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const details: Record<string, unknown> = { component: "orders-api", requestId, step, error: message, ...extra };
  if (stack) details.stack = stack.split("\n").slice(0, 8).join("\n");
  console.error(JSON.stringify(details));
}

type OrderPayload = {
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
    birthday?: string;
    area?: string;
    marketingConsent?: boolean;
  };
  items?: unknown;
  fulfillment?: "delivery" | "pickup";
  paymentMethod?: "cash" | "instapay" | "paymob";
  deliveryZoneId?: string;
  location?: { lat?: unknown; lng?: unknown };
  address?: string;
  notes?: string;
  requestedFor?: string;
  language?: "ar" | "en";
  retryOrderId?: number;
};

type ErrorResponse = {
  success: false;
  code: string;
  message: string;
  orderId?: number;
};

type SuccessResponse = {
  success: true;
  orderId: number;
  orderNumber: number;
  paymentRequired: boolean;
  nextAction: string;
  redirectUrl?: string;
  instapay?: { account: string; paymentLink: string } | null;
  order: Record<string, unknown>;
};

function jsonError(response: ErrorResponse, status: number) {
  return Response.json(response, { status });
}

const toPiasters = (egp: number) => Math.round(egp * 100);
const toEgp = (piasters: number) => Math.round(piasters) / 100;

async function handleRetryPayment(requestId: string, payload: OrderPayload) {
  const retryNumber =
    typeof payload.retryOrderId === "number" && payload.retryOrderId > 0
      ? payload.retryOrderId
      : null;
  if (!retryNumber) return null;

  logOrder(requestId, "retry_path", { retryOrderId: retryNumber });

  const paymobConfig = await getPaymobConfig();
  if (!paymobConfig) {
    return jsonError(
      { success: false, code: "PAYMENT_PROVIDER_UNAVAILABLE", message: "Online card payment is not configured" },
      503,
    );
  }
  const envCheck = validatePaymobEnv();
  if (!envCheck.ok) {
    logOrderError(requestId, "retry_paymob_env_missing", null, { missing: envCheck.missing });
    return jsonError(
      { success: false, code: "PAYMENT_PROVIDER_MISCONFIGURED", message: "Online card payment is not configured" },
      503,
    );
  }

  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: retryNumber },
    select: { id: true, orderNumber: true, total: true, paymentStatus: true, paymentMethodType: true, address: true, notes: true, customerLang: true },
  }).catch((e) => {
    logOrderError(requestId, "retry_fetch_failed", e, { retryOrderNumber: retryNumber });
    return null;
  });

  if (!existingOrder) {
    return jsonError({ success: false, code: "ORDER_NOT_FOUND", message: "Order not found" }, 404);
  }
  if (existingOrder.paymentStatus !== "payment_setup_error" && existingOrder.paymentStatus !== "pending_payment") {
    return jsonError({ success: false, code: "ORDER_NOT_RETRYABLE", message: "This order cannot be retried" }, 409);
  }
  if (existingOrder.paymentMethodType !== "paymob") {
    return jsonError({ success: false, code: "ORDER_NOT_PAYMOB", message: "This order was not created with Paymob" }, 409);
  }

  const billingName = payload.customer?.name?.trim() || "Customer";
  const billingPhone = normalizeEgyptianMobile(payload.customer?.phone || "") || "";
  const billingEmail = payload.customer?.email?.trim().toLowerCase() || "";
  const billingArea = payload.customer?.area?.trim() || "";
  const billingAddress = payload.address?.trim() || existingOrder.address || "";

  logOrder(requestId, "retry_paymob_init", { orderId: existingOrder.orderNumber, total: toEgp(existingOrder.total) });
  try {
    const payment = await createPaymobCardPayment({
      config: paymobConfig,
      localOrderId: existingOrder.orderNumber,
      total: toEgp(existingOrder.total),
      billing: { name: billingName, email: billingEmail, phone: billingPhone, area: billingArea, address: billingAddress },
    });

    try {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: { paymentRef: payment.providerOrderId, paymentStatus: "pending_payment" },
      });
    } catch (dbError) {
      logOrderError(requestId, "retry_db_update_failed", dbError, { orderId: existingOrder.orderNumber });
    }

    logOrder(requestId, "retry_paymob_success", { orderId: existingOrder.orderNumber });
    return Response.json(
      {
        success: true,
        orderId: existingOrder.orderNumber,
        orderNumber: existingOrder.orderNumber,
        paymentRequired: true,
        nextAction: "paymob_redirect",
        redirectUrl: payment.redirectUrl,
        order: { id: existingOrder.orderNumber },
      } satisfies SuccessResponse,
      { status: 200 },
    );
  } catch (error) {
    const errorDetail =
      error instanceof PaymobError
        ? { stage: error.stage, status: error.status, body: error.body.slice(0, 200) }
        : { message: error instanceof Error ? error.message : String(error) };
    logOrderError(requestId, "retry_paymob_failed", error, { orderId: existingOrder.orderNumber, ...errorDetail });
    const stageInfo = error instanceof PaymobError ? ` (${error.stage})` : "";
    return jsonError(
      {
        success: false,
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: `Payment retry failed${stageInfo}. Please try again later.`,
        orderId: existingOrder.orderNumber,
      },
      502,
    );
  }
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  logOrder(requestId, "REQUEST_RECEIVED", {});

  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 64_000) {
      return jsonError({ success: false, code: "PAYLOAD_TOO_LARGE", message: "Order payload is too large" }, 413);
    }

    let payload: OrderPayload;
    try {
      payload = (await request.json()) as OrderPayload;
    } catch {
      logOrderError(requestId, "PAYLOAD_PARSE_FAILED", null);
      return jsonError({ success: false, code: "INVALID_JSON", message: "Invalid request body" }, 400);
    }

    const itemCount = Array.isArray(payload.items) ? payload.items.length : 0;
    logOrder(requestId, "PAYLOAD_VALIDATED", {
      paymentMethod: payload.paymentMethod,
      fulfillment: payload.fulfillment,
      itemCount,
      hasRetry: Boolean(typeof payload.retryOrderId === "number" && payload.retryOrderId > 0),
      hasCustomer: Boolean(payload.customer?.name),
      hasAddress: Boolean(payload.address),
      hasLocation: Boolean(payload.location),
      language: payload.language,
    });

    if (typeof payload.retryOrderId === "number" && payload.retryOrderId > 0) {
      const retryResult = await handleRetryPayment(requestId, payload);
      if (retryResult) return retryResult;
    }

    const name = payload.customer?.name?.trim().slice(0, 90) || "";
    const phone = normalizeEgyptianMobile(payload.customer?.phone || "") || "";
    const email = payload.customer?.email?.trim().toLowerCase().slice(0, 160) || "";
    const area = payload.customer?.area?.trim().slice(0, 100) || "";
    const fulfillment = payload.fulfillment === "pickup" ? "pickup" : "delivery";
    const paymentMethod = payload.paymentMethod;
    if (paymentMethod !== "cash" && paymentMethod !== "instapay" && paymentMethod !== "paymob") {
      return jsonError({ success: false, code: "INVALID_PAYMENT_METHOD", message: "Invalid payment method" }, 400);
    }
    const address = payload.address?.trim().slice(0, 300) || "";
    let notes = payload.notes?.trim().slice(0, 320) || "";
    const requestedForRaw = typeof payload.requestedFor === "string" ? payload.requestedFor.trim() : "";
    const language = payload.language === "en" ? "en" : "ar";
    const birthdayRaw = typeof payload.customer?.birthday === "string" ? payload.customer.birthday.trim().slice(0, 10) : "";

    if (name.length < 2 || !phone || name.length > 90) {
      return jsonError({
        success: false, code: "INVALID_CUSTOMER",
        message: language === "ar" ? "اكتب الاسم ورقم موبايل مصري صحيح" : "Enter your name and a valid Egyptian mobile number.",
      }, 400);
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError({
        success: false, code: "INVALID_EMAIL",
        message: language === "ar" ? "اكتب بريد إلكتروني صحيح" : "Enter a valid email address.",
      }, 400);
    }
    if (fulfillment === "delivery" && address.length < 6) {
      return jsonError({
        success: false, code: "MISSING_ADDRESS",
        message: language === "ar" ? "اكتب عنوان التوصيل بالتفصيل" : "Enter your full delivery address.",
      }, 400);
    }

    logOrder(requestId, "PAYLOAD_CUSTOMER_VALIDATED", {
      fulfillment, paymentMethod, nameLen: name.length, hasPhone: Boolean(phone),
      hasEmail: Boolean(email), hasAddress: Boolean(address), hasLocation: Boolean(payload.location),
    });

    let catalog, settings;
    try {
      [catalog, settings] = await Promise.all([loadManagedProducts(), loadSiteSettings()]);
    } catch (dbError) {
      logOrderError(requestId, "CATALOG_LOAD_FAILED", dbError);
      return jsonError({
        success: false, code: "CATALOG_UNAVAILABLE",
        message: language === "ar" ? "مشكلة في تحميل قائمة الأكل، حاول تاني" : "Could not load the menu. Please try again.",
      }, 500);
    }

    logOrder(requestId, "CATALOG_LOADED", { productCount: catalog.length });

    const requestedFor = new Date(requestedForRaw);
    const orderLeadHours = Math.max(0, Math.min(168, Number(settings.orderLeadHours) || 24));
    const minimumRequestedAt = Date.now() + orderLeadHours * 60 * 60 * 1000;
    if (!requestedForRaw || Number.isNaN(requestedFor.getTime())) {
      return jsonError({
        success: false, code: "INVALID_REQUESTED_TIME",
        message: language === "ar" ? "اختار موعد التوصيل أو الاستلام" : "Choose a delivery or pickup time.",
      }, 400);
    }
    if (requestedFor.getTime() < minimumRequestedAt - 60_000) {
      return jsonError({
        success: false, code: "ORDER_LEAD_TIME_REQUIRED",
        message: language === "ar"
          ? `موعد الطلب لازم يكون بعد ${orderLeadHours} ساعة على الأقل`
          : `The requested time must be at least ${orderLeadHours} hours ahead.`,
      }, 400);
    }
    const requestedForLabel = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo",
    }).format(requestedFor);
    notes = `${language === "ar" ? "موعد الطلب" : "Requested time"}: ${requestedForLabel}${notes ? `\n${notes}` : ""}`.slice(0, 400);

    const items = validateOrderItems(payload.items, catalog, language);
    if (!items) {
      return jsonError({
        success: false, code: "INVALID_ITEMS",
        message: language === "ar" ? "بعض الأصناف مش متاحة تاني، راجع السلة" : "One or more items are no longer available. Please review your cart.",
      }, 400);
    }
    const subtotalEgp = calculateOrderSubtotal(items);
    if (subtotalEgp <= 0) {
      return jsonError({
        success: false, code: "INVALID_TOTAL",
        message: language === "ar" ? "مبلغ الطلب غلط" : "Invalid order total.",
      }, 400);
    }

    // ── Delivery fee: distance-based, computed SERVER-SIDE ──
    let deliveryFeeEgp = 0;
    let lat: number | null = null;
    let lng: number | null = null;
    if (fulfillment === "delivery") {
      const quote = quoteDelivery(settings, payload.location?.lat, payload.location?.lng);
      if (!quote.ok) {
        return jsonError({
          success: false, code: "INVALID_DELIVERY_LOCATION",
          message: language === "ar"
            ? (quote.reasonAr || "اختاري موقعك على الخريطة")
            : (quote.reason || "Pick your location on the map."),
        }, 400);
      }
      lat = quote.distanceKm >= 0 ? Number(payload.location!.lat) : null;
      lng = quote.distanceKm >= 0 ? Number(payload.location!.lng) : null;
      deliveryFeeEgp = quote.fee;
    }

    const minimumOrder = Math.max(0, Number(settings.minimumOrder) || 0);
    if (subtotalEgp < minimumOrder) {
      return jsonError({
        success: false, code: "MINIMUM_ORDER_NOT_MET",
        message: language === "ar" ? `الحد الأدنى للطلب ${minimumOrder}` : `Minimum order is ${minimumOrder}.`,
      }, 400);
    }
    const freeThreshold = Math.max(0, Number(settings.freeDeliveryThreshold) || 0);
    if (freeThreshold > 0 && subtotalEgp >= freeThreshold) deliveryFeeEgp = 0;

    const totalEgp = Math.round((subtotalEgp + deliveryFeeEgp) * 100) / 100;

    logOrder(requestId, "TOTAL_CALCULATED", {
      subtotal: subtotalEgp, deliveryFee: deliveryFeeEgp, total: totalEgp, minimumOrder,
    });

    const methodEnabled =
      (paymentMethod === "cash" && settingEnabled(settings.cashOnDeliveryEnabled)) ||
      (paymentMethod === "instapay" && settingEnabled(settings.instapayEnabled) && Boolean(settings.instapayAccount.trim())) ||
      (paymentMethod === "paymob" && settingEnabled(settings.paymobEnabled));
    if (!methodEnabled) {
      return jsonError({
        success: false, code: "PAYMENT_METHOD_UNAVAILABLE",
        message: language === "ar" ? "طريقة الدفع دي مش شغالة دلوقتي" : "Selected payment method is currently unavailable.",
      }, 400);
    }

    if (paymentMethod === "paymob") {
      const envCheck = validatePaymobEnv();
      if (!envCheck.ok) {
        logOrderError(requestId, "PAYMOB_ENV_MISSING", null, { missing: envCheck.missing });
        return jsonError({
          success: false, code: "PAYMENT_PROVIDER_MISCONFIGURED",
          message: language === "ar" ? "الدفع الإلكتروني مش متاح دلوقتي" : "Online card payment is not configured.",
        }, 503);
      }
    }
    const paymobConfig = paymentMethod === "paymob" ? await getPaymobConfig() : null;
    if (paymentMethod === "paymob" && !paymobConfig) {
      return jsonError({
        success: false, code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: language === "ar" ? "الدفع الإلكتروني مش متاح دلوقتي" : "Online card payment is not configured.",
      }, 503);
    }

    // ── Customer upsert ──
    logOrder(requestId, "DB_UPSERT_CUSTOMER", { phone: phone.slice(0, 5) + "***" });
    let birthdayDate: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdayRaw)) {
      const d = new Date(birthdayRaw + "T00:00:00Z");
      if (!Number.isNaN(d.getTime())) birthdayDate = d;
    }
    const marketingConsent = Boolean(payload.customer?.marketingConsent);
    let customer;
    try {
      const existing = await prisma.customer.findUnique({ where: { normalizedPhone: phone } });
      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name, email: email || null,
            ...(birthdayDate ? { birthday: birthdayDate } : {}),
            marketingConsent, lastSeen: new Date(),
            ordersCount: { increment: 1 },
            totalSpent: { increment: toPiasters(totalEgp) },
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            name, phone, normalizedPhone: phone, email: email || null,
            birthday: birthdayDate, marketingConsent, preferredLang: language,
            ordersCount: 1, totalSpent: toPiasters(totalEgp),
          },
        });
      }
    } catch (error) {
      logOrderError(requestId, "CUSTOMER_UPSERT_FAILED", error, { phone: phone.slice(0, 5) + "***" });
      return jsonError({
        success: false, code: "DATABASE_ERROR",
        message: language === "ar" ? "مشكلة في حفظ بيانات العميل، حاول تاني" : "Could not save customer data. Please try again.",
      }, 500);
    }
    logOrder(requestId, "CUSTOMER_UPSERTED", { customerId: customer.id });

    // ── Order creation ──
    logOrder(requestId, "ORDER_CREATED", { total: totalEgp, paymentMethod, fulfillment, itemCount: items.length });
    let order;
    try {
      // Neon HTTP adapter: no transactions → create order, items and history as separate single statements
      order = await prisma.order.create({
        data: {
          customerId: customer.id,
          customerName: name,
          customerPhone: phone,
          customerPhoneNorm: phone,
          customerEmail: email || null,
          customerBirthday: birthdayDate,
          customerLang: language,
          type: fulfillment,
          status: "new",
          address: fulfillment === "delivery" ? address : null,
          latitude: lat,
          longitude: lng,
          notes,
          marketingConsent,
          subtotal: toPiasters(subtotalEgp),
          deliveryFee: toPiasters(deliveryFeeEgp),
          total: toPiasters(totalEgp),
          paymentMethodType: paymentMethod,
          paymentStatus:
            paymentMethod === "cash" ? "cash_on_delivery"
            : paymentMethod === "instapay" ? "awaiting_transfer"
            : "pending_payment",
          discountAmount: 0,
        },
        select: { id: true, orderNumber: true, createdAt: true },
      });

      for (const item of items) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productNameAr: item.name,
            productNameEn: item.name,
            quantity: item.quantity,
            unitPrice: toPiasters(item.price),
            totalPrice: toPiasters(item.price * item.quantity),
            addOnsJson: item.details ? { details: item.details } : undefined,
          },
        });
      }

      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "new",
          note: language === "ar" ? "طلب جديد من الموقع" : "New website order",
        },
      });
    } catch (error) {
      logOrderError(requestId, "ORDER_INSERT_FAILED", error, { customerId: customer.id, total: totalEgp });
      return jsonError({
        success: false, code: "DATABASE_ERROR",
        message: language === "ar" ? "مشكلة في حفظ الطلب، حاول تاني" : "Could not save your order. Please try again.",
      }, 500);
    }

    logOrder(requestId, "ORDER_SAVED", { orderId: order.orderNumber });

    // ── Paymob flow ──
    if (paymentMethod === "paymob" && paymobConfig) {
      try {
        logOrder(requestId, "PAYMOB_AUTH_STARTED", { orderId: order.orderNumber, amountCents: Math.round(totalEgp * 100) });
        const payment = await createPaymobCardPayment({
          config: paymobConfig,
          localOrderId: order.orderNumber,
          total: totalEgp,
          billing: { name, email, phone, area, address },
        });

        try {
          await prisma.order.update({ where: { id: order.id }, data: { paymentRef: payment.providerOrderId } });
        } catch (dbUpdateError) {
          logOrderError(requestId, "ORDER_UPDATE_PROVIDER_FAILED", dbUpdateError, { orderId: order.orderNumber });
        }

        logOrder(requestId, "RESPONSE_SENT", { orderId: order.orderNumber, status: 201, elapsed: Date.now() - startTime });
        return Response.json(
          {
            success: true,
            orderId: order.orderNumber,
            orderNumber: order.orderNumber,
            paymentRequired: true,
            nextAction: "paymob_redirect",
            redirectUrl: payment.redirectUrl,
            order: {
              id: order.orderNumber, createdAt: order.createdAt,
              subtotal: subtotalEgp, deliveryFee: deliveryFeeEgp, total: totalEgp,
              paymentMethod, paymentStatus: "pending_payment", items,
            },
          } satisfies SuccessResponse,
          { status: 201 },
        );
      } catch (error) {
        const errorDetail =
          error instanceof PaymobError
            ? { stage: error.stage, status: error.status, body: error.body.slice(0, 200) }
            : { message: error instanceof Error ? error.message : String(error), name: error instanceof Error ? error.name : "Unknown" };

        logOrderError(requestId, "PAYMOB_FAILED", error, { orderId: order.orderNumber, ...errorDetail });

        try {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: "payment_setup_error",
              paymentRef: error instanceof PaymobError ? `${error.stage}:${error.status}` : "unknown",
            },
          });
        } catch (dbUpdateError) {
          logOrderError(requestId, "ORDER_MARK_PAYMENT_ERROR_FAILED", dbUpdateError, { orderId: order.orderNumber });
        }

        logOrder(requestId, "RESPONSE_SENT", {
          orderId: order.orderNumber, status: 502, elapsed: Date.now() - startTime,
          paymobStage: error instanceof PaymobError ? error.stage : "unknown",
          paymobStatus: error instanceof PaymobError ? error.status : undefined,
          orderSaved: true,
        });

        const stageHint = error instanceof PaymobError ? ` [stage: ${error.stage}]` : "";
        return Response.json(
          {
            success: false,
            code: "PAYMENT_PROVIDER_UNAVAILABLE",
            message: `Payment could not be initialized${stageHint}. Your order was saved — you can retry payment.`,
            orderId: order.orderNumber,
          } satisfies ErrorResponse,
          { status: 502 },
        );
      }
    }

    logOrder(requestId, "RESPONSE_SENT", {
      orderId: order.orderNumber, status: 201, elapsed: Date.now() - startTime,
      nextAction: paymentMethod === "instapay" ? "instapay_transfer" : "whatsapp",
    });

    return Response.json(
      {
        success: true,
        orderId: order.orderNumber,
        orderNumber: order.orderNumber,
        paymentRequired: false,
        nextAction: paymentMethod === "instapay" ? "instapay_transfer" : "whatsapp",
        instapay:
          paymentMethod === "instapay"
            ? { account: settings.instapayAccount, paymentLink: settings.instapayPaymentLink }
            : null,
        order: {
          id: order.orderNumber, createdAt: order.createdAt,
          subtotal: subtotalEgp, deliveryFee: deliveryFeeEgp, total: totalEgp,
          paymentMethod,
          paymentStatus: paymentMethod === "instapay" ? "awaiting_transfer" : "cash_on_delivery",
          items,
        },
      } satisfies SuccessResponse,
      { status: 201 },
    );
  } catch (error) {
    logOrderError(requestId, "UNHANDLED_ERROR", error, { elapsed: Date.now() - startTime });
    const isDbError =
      error instanceof Error &&
      (error.message.includes("ECONNREFUSED") ||
        error.message.includes("ETIMEDOUT") ||
        error.message.includes("ENOTFOUND") ||
        error.message.includes("DATABASE") ||
        error.message.includes("connection") ||
        error.message.includes("timeout"));

    return jsonError(
      {
        success: false,
        code: isDbError ? "DATABASE_UNAVAILABLE" : "INTERNAL_ERROR",
        message: "Unable to save the order right now. Please try again shortly.",
      },
      500,
    );
  }
}
