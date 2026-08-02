import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
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
import {
  calculateCheckoutTotals,
  settingEnabled,
} from "../../checkout-settings";
import { loadSiteSettings } from "../../server-settings";
import { activeDeliveryZones } from "../../delivery-zones";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function generateRequestId() {
  return crypto.randomUUID().slice(0, 12);
}

function logOrder(
  requestId: string,
  step: string,
  data: Record<string, unknown>,
) {
  console.log(
    JSON.stringify({ component: "orders-api", requestId, step, ...data }),
  );
}

function logOrderError(
  requestId: string,
  step: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const details: Record<string, unknown> = {
    component: "orders-api",
    requestId,
    step,
    error: message,
    ...extra,
  };
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
  address?: string;
  notes?: string;
  requestedFor?: string;
  discountAmount?: number;
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

async function handleRetryPayment(requestId: string, payload: OrderPayload) {
  const retryId =
    typeof payload.retryOrderId === "number" && payload.retryOrderId > 0
      ? payload.retryOrderId
      : null;
  if (!retryId) return null;

  logOrder(requestId, "retry_path", { retryOrderId: retryId });

  const paymobConfig = await getPaymobConfig();
  if (!paymobConfig) {
    return jsonError(
      {
        success: false,
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: "Online card payment is not configured",
      },
      503,
    );
  }

  const envCheck = validatePaymobEnv();
  if (!envCheck.ok) {
    logOrderError(requestId, "retry_paymob_env_missing", null, {
      missing: envCheck.missing,
    });
    return jsonError(
      {
        success: false,
        code: "PAYMENT_PROVIDER_MISCONFIGURED",
        message: "Online card payment is not configured",
      },
      503,
    );
  }

  const db = getDb();
  logOrder(requestId, "retry_fetch_order", { retryOrderId: retryId });
  const [existingOrder] = await db
    .select({
      id: orders.id,
      total: orders.total,
      paymentStatus: orders.paymentStatus,
      paymentMethod: orders.paymentMethod,
      address: orders.address,
      notes: orders.notes,
      language: orders.language,
    })
    .from(orders)
    .where(eq(orders.id, retryId))
    .limit(1);

  if (!existingOrder) {
    return jsonError(
      { success: false, code: "ORDER_NOT_FOUND", message: "Order not found" },
      404,
    );
  }
  if (
    existingOrder.paymentStatus !== "payment_setup_error" &&
    existingOrder.paymentStatus !== "pending_payment"
  ) {
    return jsonError(
      {
        success: false,
        code: "ORDER_NOT_RETRYABLE",
        message: "This order cannot be retried",
      },
      409,
    );
  }
  if (existingOrder.paymentMethod !== "paymob") {
    return jsonError(
      {
        success: false,
        code: "ORDER_NOT_PAYMOB",
        message: "This order was not created with Paymob",
      },
      409,
    );
  }

  const billingName = payload.customer?.name?.trim() || "Customer";
  const billingPhone =
    normalizeEgyptianMobile(payload.customer?.phone || "") || "";
  const billingEmail = payload.customer?.email?.trim().toLowerCase() || "";
  const billingArea = payload.customer?.area?.trim() || "";
  const billingAddress = payload.address?.trim() || existingOrder.address;

  logOrder(requestId, "retry_paymob_init", {
    orderId: existingOrder.id,
    total: existingOrder.total,
  });
  try {
    const payment = await createPaymobCardPayment({
      config: paymobConfig,
      localOrderId: existingOrder.id,
      total: existingOrder.total,
      billing: {
        name: billingName,
        email: billingEmail,
        phone: billingPhone,
        area: billingArea,
        address: billingAddress,
      },
    });

    try {
      await db
        .update(orders)
        .set({
          providerOrderId: payment.providerOrderId,
          paymentStatus: "pending_payment",
          updatedAt: new Date(),
        })
        .where(eq(orders.id, existingOrder.id));
    } catch (dbError) {
      logOrderError(requestId, "retry_db_update_failed", dbError, {
        orderId: existingOrder.id,
      });
    }

    logOrder(requestId, "retry_paymob_success", { orderId: existingOrder.id });

    return Response.json(
      {
        success: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.id,
        paymentRequired: true,
        nextAction: "paymob_redirect",
        redirectUrl: payment.redirectUrl,
        order: { id: existingOrder.id },
      },
      { status: 200 },
    );
  } catch (error) {
    const errorDetail =
      error instanceof PaymobError
        ? {
            stage: error.stage,
            status: error.status,
            body: error.body.slice(0, 200),
          }
        : { message: error instanceof Error ? error.message : String(error) };
    logOrderError(requestId, "retry_paymob_failed", error, {
      orderId: existingOrder.id,
      ...errorDetail,
    });

    const stageInfo =
      error instanceof PaymobError ? ` (${error.stage})` : "";
    return jsonError(
      {
        success: false,
        code: "PAYMENT_PROVIDER_UNAVAILABLE",
        message: `Payment retry failed${stageInfo}. Please try again later.`,
        orderId: existingOrder.id,
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
      return jsonError(
        {
          success: false,
          code: "PAYLOAD_TOO_LARGE",
          message: "Order payload is too large",
        },
        413,
      );
    }

    let payload: OrderPayload;
    try {
      payload = (await request.json()) as OrderPayload;
    } catch {
      logOrderError(requestId, "PAYLOAD_PARSE_FAILED", null);
      return jsonError(
        {
          success: false,
          code: "INVALID_JSON",
          message: "Invalid request body",
        },
        400,
      );
    }

    const itemCount = Array.isArray(payload.items) ? payload.items.length : 0;
    logOrder(requestId, "PAYLOAD_VALIDATED", {
      paymentMethod: payload.paymentMethod,
      fulfillment: payload.fulfillment,
      itemCount,
      hasRetry: Boolean(
        typeof payload.retryOrderId === "number" && payload.retryOrderId > 0,
      ),
      hasCustomer: Boolean(payload.customer?.name),
      hasAddress: Boolean(payload.address),
      language: payload.language,
    });

    if (typeof payload.retryOrderId === "number" && payload.retryOrderId > 0) {
      const retryResult = await handleRetryPayment(requestId, payload);
      if (retryResult) return retryResult;
    }

    const name = payload.customer?.name?.trim().slice(0, 90) || "";
    const phone =
      normalizeEgyptianMobile(payload.customer?.phone || "") || "";
    const email =
      payload.customer?.email?.trim().toLowerCase().slice(0, 160) || "";
    const area = payload.customer?.area?.trim().slice(0, 100) || "";
    const fulfillment =
      payload.fulfillment === "pickup" ? "pickup" : "delivery";
    const paymentMethod = payload.paymentMethod;
    if (
      paymentMethod !== "cash" &&
      paymentMethod !== "instapay" &&
      paymentMethod !== "paymob"
    ) {
      return jsonError(
        {
          success: false,
          code: "INVALID_PAYMENT_METHOD",
          message: "Invalid payment method",
        },
        400,
      );
    }
    const address = payload.address?.trim().slice(0, 300) || "";
    let notes = payload.notes?.trim().slice(0, 320) || "";
    const requestedForRaw = typeof payload.requestedFor === "string" ? payload.requestedFor.trim() : "";
    const language = payload.language === "en" ? "en" : "ar";
    const deliveryZoneId =
      typeof payload.deliveryZoneId === "string"
        ? payload.deliveryZoneId.trim().slice(0, 80)
        : "";

    if (name.length < 2 || !phone || name.length > 90) {
      return jsonError(
        {
          success: false,
          code: "INVALID_CUSTOMER",
          message:
            language === "ar"
              ? "اكتب الاسم ورقم موبايل مصري صحيح"
              : "Enter your name and a valid Egyptian mobile number.",
        },
        400,
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError(
        {
          success: false,
          code: "INVALID_EMAIL",
          message:
            language === "ar"
              ? "اكتب بريد إلكتروني صحيح"
              : "Enter a valid email address.",
        },
        400,
      );
    }
    if (fulfillment === "delivery" && address.length < 6) {
      return jsonError(
        {
          success: false,
          code: "MISSING_ADDRESS",
          message:
            language === "ar"
              ? "اكتب عنوان التوصيل بالتفصيل"
              : "Enter your full delivery address.",
        },
        400,
      );
    }

    logOrder(requestId, "PAYLOAD_CUSTOMER_VALIDATED", {
      fulfillment,
      paymentMethod,
      nameLen: name.length,
      hasPhone: Boolean(phone),
      hasEmail: Boolean(email),
      hasAddress: Boolean(address),
      deliveryZoneId: deliveryZoneId || "(none)",
    });

    logOrder(requestId, "CART_VALIDATED", {
      itemCount,
    });

    let catalog, settings;
    try {
      [catalog, settings] = await Promise.all([
        loadManagedProducts(),
        loadSiteSettings(),
      ]);
    } catch (dbError) {
      logOrderError(requestId, "CATALOG_LOAD_FAILED", dbError);
      return jsonError(
        {
          success: false,
          code: "CATALOG_UNAVAILABLE",
          message:
            language === "ar"
              ? "مشكلة في تحميل قائمة الأكل، حاول تاني"
              : "Could not load the menu. Please try again.",
        },
        500,
      );
    }

    logOrder(requestId, "CATALOG_LOADED", {
      productCount: catalog.length,
    });

    const requestedFor = new Date(requestedForRaw);
    const orderLeadHours = Math.max(0, Math.min(168, Number(settings.orderLeadHours) || 24));
    const minimumRequestedAt = Date.now() + orderLeadHours * 60 * 60 * 1000;
    if (!requestedForRaw || Number.isNaN(requestedFor.getTime())) {
      return jsonError(
        {
          success: false,
          code: "INVALID_REQUESTED_TIME",
          message: language === "ar" ? "اختار موعد التوصيل أو الاستلام" : "Choose a delivery or pickup time.",
        },
        400,
      );
    }
    if (requestedFor.getTime() < minimumRequestedAt - 60_000) {
      return jsonError(
        {
          success: false,
          code: "ORDER_LEAD_TIME_REQUIRED",
          message: language === "ar"
            ? `موعد الطلب لازم يكون بعد ${orderLeadHours} ساعة على الأقل`
            : `The requested time must be at least ${orderLeadHours} hours ahead.`,
        },
        400,
      );
    }
    const requestedForLabel = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Cairo",
    }).format(requestedFor);
    notes = `${language === "ar" ? "موعد الطلب" : "Requested time"}: ${requestedForLabel}${notes ? `\n${notes}` : ""}`.slice(0, 400);

    const items = validateOrderItems(payload.items, catalog, language);
    if (!items) {
      return jsonError(
        {
          success: false,
          code: "INVALID_ITEMS",
          message:
            language === "ar"
              ? "بعض الأصناف مش متاحة تاني، راجع السلة"
              : "One or more items are no longer available. Please review your cart.",
        },
        400,
      );
    }
    const subtotal = calculateOrderSubtotal(items);
    if (subtotal <= 0) {
      return jsonError(
        {
          success: false,
          code: "INVALID_TOTAL",
          message:
            language === "ar"
              ? "مبلغ الطلب غلط"
              : "Invalid order total.",
        },
        400,
      );
    }
    const totals = calculateCheckoutTotals(
      subtotal,
      fulfillment,
      settings,
      deliveryZoneId,
    );
    if (!totals.deliveryZoneValid) {
      return jsonError(
        {
          success: false,
          code: "INVALID_DELIVERY_ZONE",
          message:
            language === "ar"
              ? "اختار زون التوصيل علشان نحسب الرسوم بدقة"
              : "Select your delivery zone so we can calculate the correct fee.",
        },
        400,
      );
    }
    if (!totals.meetsMinimumOrder) {
      return jsonError(
        {
          success: false,
          code: "MINIMUM_ORDER_NOT_MET",
          message:
            language === "ar"
              ? `الحد الأدنى للطلب ${totals.minimumOrder}`
              : `Minimum order is ${totals.minimumOrder}.`,
        },
        400,
      );
    }

    logOrder(requestId, "TOTAL_CALCULATED", {
      subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      minimumOrder: totals.minimumOrder,
      deliveryZone: totals.deliveryZone?.nameEn || "(none)",
    });

    const promoCode = "";
    const discountAmount = 0;
    const finalTotal = totals.total;

    const methodEnabled =
      (paymentMethod === "cash" &&
        settingEnabled(settings.cashOnDeliveryEnabled)) ||
      (paymentMethod === "instapay" &&
        settingEnabled(settings.instapayEnabled) &&
        Boolean(settings.instapayAccount.trim())) ||
      (paymentMethod === "paymob" && settingEnabled(settings.paymobEnabled));
    if (!methodEnabled) {
      return jsonError(
        {
          success: false,
          code: "PAYMENT_METHOD_UNAVAILABLE",
          message:
            language === "ar"
              ? "طريقة الدفع دي مش شغالة دلوقتي"
              : "Selected payment method is currently unavailable.",
        },
        400,
      );
    }

    if (paymentMethod === "paymob") {
      const envCheck = validatePaymobEnv();
      if (!envCheck.ok) {
        logOrderError(requestId, "PAYMOB_ENV_MISSING", null, {
          missing: envCheck.missing,
        });
        return jsonError(
          {
            success: false,
            code: "PAYMENT_PROVIDER_MISCONFIGURED",
            message:
              language === "ar"
                ? "الدفع الإلكتروني مش متاح دلوقتي"
                : "Online card payment is not configured.",
          },
          503,
        );
      }
    }

    const paymobConfig =
      paymentMethod === "paymob" ? await getPaymobConfig() : null;
    if (paymentMethod === "paymob" && !paymobConfig) {
      return jsonError(
        {
          success: false,
          code: "PAYMENT_PROVIDER_UNAVAILABLE",
          message:
            language === "ar"
              ? "الدفع الإلكتروني مش متاح دلوقتي"
              : "Online card payment is not configured.",
        },
        503,
      );
    }

    const deliveryZoneName =
      totals.deliveryZone?.[language === "ar" ? "nameAr" : "nameEn"] || area;
    const customerArea =
      fulfillment === "delivery" && activeDeliveryZones(settings).length > 0
        ? deliveryZoneName
        : area;

    let db;
    try {
      db = getDb();
    } catch (error) {
      logOrderError(requestId, "DB_INIT_FAILED", error);
      return jsonError(
        {
          success: false,
          code: "DATABASE_UNAVAILABLE",
          message:
            language === "ar"
              ? "مشكلة في السيرفر، حاول تاني بعد قليل"
              : "Service temporarily unavailable. Please try again.",
        },
        500,
      );
    }

    logOrder(requestId, "DB_TRANSACTION_STARTED", {});

    logOrder(requestId, "DB_UPSERT_CUSTOMER", {
      phone: phone.slice(0, 5) + "***",
    });
    const birthday = payload.customer?.birthday?.trim().slice(0, 10) || "";
    let customer;
    try {
      [customer] = await db
        .insert(customers)
        .values({
          name,
          phone,
          email,
          birthday,
          area: customerArea,
          marketingConsent: Boolean(payload.customer?.marketingConsent),
          ordersCount: 1,
          totalSpent: totals.total,
        })
        .onConflictDoUpdate({
          target: customers.phone,
          set: {
            name,
            email,
            ...(birthday ? { birthday } : {}),
            area: customerArea,
            marketingConsent: Boolean(payload.customer?.marketingConsent),
            lastSeenAt: new Date(),
            ordersCount: sql`COALESCE(${customers.ordersCount}, 0) + 1`,
            totalSpent: sql`COALESCE(${customers.totalSpent}, 0) + ${totals.total}`,
          },
        })
        .returning();
    } catch (error) {
      logOrderError(requestId, "CUSTOMER_UPSERT_FAILED", error, {
        phone: phone.slice(0, 5) + "***",
      });
      return jsonError(
        {
          success: false,
          code: "DATABASE_ERROR",
          message:
            language === "ar"
              ? "مشكلة في حفظ بيانات العميل، حاول تاني"
              : "Could not save customer data. Please try again.",
        },
        500,
      );
    }

    logOrder(requestId, "CUSTOMER_UPSERTED", {
      customerId: customer?.id,
    });

    logOrder(requestId, "ORDER_CREATED", {
      total: finalTotal,
      discountAmount,
      paymentMethod,
      fulfillment,
      itemCount: items.length,
    });

    let order;
    try {
      [order] = await db
        .insert(orders)
        .values({
          customerId: customer!.id,
          itemsJson: JSON.stringify(items),
          subtotal,
          deliveryFee: totals.deliveryFee,
          total: finalTotal,
          fulfillment,
          deliveryZone: fulfillment === "delivery" ? deliveryZoneName : "",
          paymentMethod,
          paymentStatus:
            paymentMethod === "cash"
              ? "cash_on_delivery"
              : paymentMethod === "instapay"
                ? "awaiting_transfer"
                : "pending_payment",
          address,
          notes,
          language,
          promoCode,
          discountAmount,
        })
        .returning({ id: orders.id, createdAt: orders.createdAt });
    } catch (error) {
      logOrderError(requestId, "ORDER_INSERT_FAILED", error, {
        customerId: customer?.id,
        total: totals.total,
      });
      return jsonError(
        {
          success: false,
          code: "DATABASE_ERROR",
          message:
            language === "ar"
              ? "مشكلة في حفظ الطلب، حاول تاني"
              : "Could not save your order. Please try again.",
        },
        500,
      );
    }

    logOrder(requestId, "ORDER_SAVED", {
      orderId: order!.id,
      orderNumber: order!.id,
    });

    if (paymentMethod === "paymob" && paymobConfig) {
      try {
        logOrder(requestId, "PAYMOB_AUTH_STARTED", {
          orderId: order!.id,
          amountCents: Math.round(totals.total * 100),
        });
        const payment = await createPaymobCardPayment({
          config: paymobConfig,
          localOrderId: order!.id,
          total: totals.total,
          billing: { name, email, phone, area: customerArea, address },
        });

        try {
          await db
            .update(orders)
            .set({
              providerOrderId: payment.providerOrderId,
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order!.id));
        } catch (dbUpdateError) {
          logOrderError(requestId, "ORDER_UPDATE_PROVIDER_FAILED", dbUpdateError, {
            orderId: order!.id,
          });
        }

        logOrder(requestId, "PAYMENT_KEY_STARTED", {
          orderId: order!.id,
          providerOrderId: payment.providerOrderId,
        });
        logOrder(requestId, "RESPONSE_SENT", {
          orderId: order!.id,
          status: 201,
          elapsed: Date.now() - startTime,
        });

        return Response.json(
          {
            success: true,
            orderId: order!.id,
            orderNumber: order!.id,
            paymentRequired: true,
            nextAction: "paymob_redirect",
            redirectUrl: payment.redirectUrl,
            order: {
              id: order!.id,
              createdAt: order!.createdAt,
              subtotal,
              deliveryFee: totals.deliveryFee,
              total: totals.total,
              paymentMethod,
              paymentStatus: "pending_payment",
              items,
            },
          } satisfies SuccessResponse,
          { status: 201 },
        );
      } catch (error) {
        const errorDetail =
          error instanceof PaymobError
            ? {
                stage: error.stage,
                status: error.status,
                body: error.body.slice(0, 200),
              }
            : {
                message:
                  error instanceof Error ? error.message : String(error),
                name: error instanceof Error ? error.name : "Unknown",
              };

        logOrderError(requestId, "PAYMOB_FAILED", error, {
          orderId: order!.id,
          ...errorDetail,
        });

        try {
          await db
            .update(orders)
            .set({
              paymentStatus: "payment_setup_error",
              paymentReference:
                error instanceof PaymobError
                  ? `${error.stage}:${error.status}`
                  : "unknown",
              updatedAt: new Date(),
            })
            .where(eq(orders.id, order!.id));
        } catch (dbUpdateError) {
          logOrderError(
            requestId,
            "ORDER_MARK_PAYMENT_ERROR_FAILED",
            dbUpdateError,
            { orderId: order!.id },
          );
        }

        logOrder(requestId, "RESPONSE_SENT", {
          orderId: order!.id,
          status: 502,
          elapsed: Date.now() - startTime,
          paymobStage: error instanceof PaymobError ? error.stage : "unknown",
          paymobStatus:
            error instanceof PaymobError ? error.status : undefined,
          orderSaved: true,
        });

        const stageHint =
          error instanceof PaymobError ? ` [stage: ${error.stage}]` : "";
        return Response.json(
          {
            success: false,
            code: "PAYMENT_PROVIDER_UNAVAILABLE",
            message: `Payment could not be initialized${stageHint}. Your order was saved — you can retry payment.`,
            orderId: order!.id,
          } satisfies ErrorResponse,
          { status: 502 },
        );
      }
    }

    logOrder(requestId, "RESPONSE_SENT", {
      orderId: order!.id,
      status: 201,
      elapsed: Date.now() - startTime,
      nextAction: paymentMethod === "instapay" ? "instapay_transfer" : "whatsapp",
    });

    return Response.json(
      {
        success: true,
        orderId: order!.id,
        orderNumber: order!.id,
        paymentRequired: false,
        nextAction:
          paymentMethod === "instapay" ? "instapay_transfer" : "whatsapp",
        instapay:
          paymentMethod === "instapay"
            ? {
                account: settings.instapayAccount,
                paymentLink: settings.instapayPaymentLink,
              }
            : null,
        order: {
          id: order!.id,
          createdAt: order!.createdAt,
          subtotal,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentMethod,
          paymentStatus:
            paymentMethod === "instapay"
              ? "awaiting_transfer"
              : "cash_on_delivery",
          items,
        },
      } satisfies SuccessResponse,
      { status: 201 },
    );
  } catch (error) {
    logOrderError(requestId, "UNHANDLED_ERROR", error, {
      elapsed: Date.now() - startTime,
    });

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
        message:
          "Unable to save the order right now. Please try again shortly.",
      },
      isDbError ? 500 : 500,
    );
  }
}
