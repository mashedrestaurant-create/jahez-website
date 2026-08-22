"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { CartItem } from "../cart-context";
import { useCatalog } from "../catalog-context";
import { useCart } from "../cart-context";
import { formatPrice } from "../data";
import { formatWhatsAppOrder } from "../whatsapp-message";
import { normalizeEgyptianMobile } from "../egypt-phone";
import { trackEvent } from "../event-tracker";
import { useLanguage } from "../language-context";
import { LocationPicker } from "./location-picker";
import {
  getStoreLocation,
  quoteDelivery,
} from "../delivery-distance";

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clear, saveLastOrder, lastOrder } = useCart();
  const { settings } = useCatalog();
  const { isArabic, language, t } = useLanguage();
  const submissionRef = useRef(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    birthday: "",
    area: "",
    location: null as { lat: number; lng: number } | null,
    address: "",
    notes: "",
    fulfillment: "delivery",
    paymentMethod: "",
    marketingConsent: false,
    requestedFor: "",
  });
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [failedOrderId, setFailedOrderId] = useState<number | null>(null);
  const [instapayConfirmation, setInstapayConfirmation] = useState<{
    orderId: number;
    total: number;
    account: string;
    paymentLink: string;
    message: string;
  } | null>(null);
  const store = getStoreLocation(settings);
  const deliveryQuote =
    form.fulfillment === "delivery" && form.location
      ? quoteDelivery(settings, form.location.lat, form.location.lng)
      : null;
  const locationValid = deliveryQuote?.ok === true;
  const freeDeliveryThreshold = Math.max(0, Number(settings.freeDeliveryThreshold) || 0);
  const baseFee = deliveryQuote?.fee ?? 0;
  const deliveryFee =
    form.fulfillment === "delivery" && locationValid &&
    !(freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold)
      ? baseFee
      : 0;
  const estimatedTotal = subtotal + deliveryFee;
  const discountAmount = 0;
  const totalWithDiscount = Math.max(0, estimatedTotal - discountAmount);
  const minimumOrder = Math.max(0, Number(settings.minimumOrder) || 0);
  const cashEnabled = settings.cashOnDeliveryEnabled === "true";
  const instapayEnabled =
    settings.instapayEnabled === "true" && Boolean(settings.instapayAccount);
  const paymobEnabled = settings.paymobEnabled === "true";
  const availablePaymentMethods = [
    cashEnabled ? "cash" : "",
    instapayEnabled ? "instapay" : "",
    paymobEnabled ? "paymob" : "",
  ].filter(Boolean);
  const selectedPaymentMethod = form.paymentMethod || (availablePaymentMethods.length === 1 ? availablePaymentMethods[0] : "");
  const orderLeadHours = Math.max(0, Number(settings.orderLeadHours) || 24);
  const earliestRequestedFor = toLocalDateTimeInput(
    new Date(Date.now() + orderLeadHours * 60 * 60 * 1000),
  );

  const createOrderMessage = (
    confirmedItems: Pick<CartItem, "name" | "price" | "quantity" | "details">[],
    confirmedSubtotal: number,
    confirmedDeliveryFee: number,
    confirmedTotal: number,
    orderId: number,
    paymentMethod: string,
    confirmedPhone: string,
    confirmedCreatedAt?: string,
    paymentStatus?: string,
  ) => {
    return formatWhatsAppOrder({
      items: confirmedItems.map((item) => ({
        id: "",
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        details: item.details,
      })),
      subtotal: confirmedSubtotal,
      deliveryFee: confirmedDeliveryFee,
      total: confirmedTotal,
      orderId,
      paymentMethod,
      paymentStatus: paymentStatus || (paymentMethod === "cash" ? "cash_on_delivery" : paymentMethod === "instapay" ? "awaiting_transfer" : undefined),
      fulfillment: form.fulfillment,
      customerName: form.name,
      customerPhone: confirmedPhone,
      customerEmail: form.email || undefined,
      address: form.fulfillment === "delivery" ? form.address : undefined,
      notes: `${isArabic ? "موعد الطلب" : "Requested time"}: ${form.requestedFor}${form.notes ? `\n${form.notes}` : ""}`,
      deliveryZoneName: undefined,
      promoCode: undefined,
      discountAmount,
      language,
      createdAt: confirmedCreatedAt,
    });
  };

  const submitOrder = async (event: FormEvent) => {
    event.preventDefault();
    if (submissionRef.current) return;
    submissionRef.current = true;
    setError("");
    setFailedOrderId(null);
    trackEvent("checkout_start", undefined, { paymentMethod: selectedPaymentMethod, itemCount: items.length });
    const normalizedPhone = normalizeEgyptianMobile(form.phone);
    if (!form.name.trim() || !normalizedPhone) {
      setError(
        isArabic
          ? "اكتب الاسم ورقم موبايل مصري صحيح"
          : "Enter your name and a valid Egyptian mobile number.",
      );
      submissionRef.current = false;
      return;
    }
    if (!selectedPaymentMethod) {
      setError(
        isArabic
          ? "اختار طريقة الدفع"
          : "Please select a payment method.",
      );
      submissionRef.current = false;
      return;
    }
    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError(
        isArabic ? "اكتب بريد إلكتروني صحيح" : "Enter a valid email address.",
      );
      submissionRef.current = false;
      return;
    }
    const requestedDate = new Date(form.requestedFor);
    const minimumDate = new Date(Date.now() + orderLeadHours * 60 * 60 * 1000);
    if (!form.requestedFor || Number.isNaN(requestedDate.getTime())) {
      setError(isArabic ? "اختاري موعد التوصيل أو الاستلام" : "Choose a delivery or pickup time.");
      submissionRef.current = false;
      return;
    }
    if (requestedDate.getTime() < minimumDate.getTime() - 60_000) {
      setError(
        isArabic
          ? `موعد الطلب لازم يكون بعد ${orderLeadHours} ساعة على الأقل`
          : `The requested time must be at least ${orderLeadHours} hours ahead.`,
      );
      submissionRef.current = false;
      return;
    }
    if (form.fulfillment === "delivery" && !form.address.trim()) {
      setError(
        isArabic
          ? "اكتب عنوان التوصيل بالتفصيل"
          : "Enter your full delivery address.",
      );
      submissionRef.current = false;
      return;
    }
    if (form.fulfillment === "delivery" && !form.location) {
      setError(
        isArabic
          ? "اختاري موقعك على الخريطة علشان نحسب رسوم التوصيل"
          : "Pick your location on the map so we can calculate delivery.",
      );
      submissionRef.current = false;
      return;
    }
    if (form.fulfillment === "delivery" && form.location && !locationValid) {
      setError(
        isArabic
          ? deliveryQuote?.reasonAr || "المنطقة دي بره نطاق التوصيل"
          : deliveryQuote?.reason || "This location is outside our delivery range.",
      );
      submissionRef.current = false;
      return;
    }
    if (subtotal < minimumOrder) {
      setError(
        isArabic
          ? `الحد الأدنى للطلب ${formatPrice(minimumOrder)}`
          : `Minimum order is ${formatPrice(minimumOrder)}.`,
      );
      submissionRef.current = false;
      return;
    }
    if (items.length === 0) {
      setError(
        isArabic
          ? "السلة فاضية"
          : "Your cart is empty.",
      );
      submissionRef.current = false;
      return;
    }
    setSending(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: form.name,
            phone: normalizedPhone,
            email: form.email,
            birthday: form.birthday,
            area: form.area,
            marketingConsent: form.marketingConsent,
          },
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          fulfillment: form.fulfillment,
          location: form.location || undefined,
          paymentMethod: selectedPaymentMethod,
          address: form.address,
          notes: form.notes,
          requestedFor: new Date(form.requestedFor).toISOString(),
          discountAmount,
          language,
        }),
      });

      let payload: Record<string, unknown> | null = null;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      }

      if (!response.ok || !payload) {
        const serverMessage =
          typeof payload?.message === "string" ? payload.message : "";
        const serverCode =
          typeof payload?.code === "string" ? payload.code : "";

        if (serverCode === "PAYMENT_PROVIDER_UNAVAILABLE" && payload?.orderId) {
          const retryOrderId = Number(payload.orderId);
          setFailedOrderId(retryOrderId);
          setError(
            isArabic
              ? "تعذر تهيئة الدفع الإلكتروني. تم حفظ طلبك — يمكنك إعادة المحاولة من الزر أدناه."
              : "Could not initialize online payment. Your order was saved — you can retry below.",
          );
          return;
        }

        if (serverCode === "INVALID_ITEMS") {
          setError(
            isArabic
              ? "بعض الأصناف مش متاحة تاني، راجع السلة"
              : "One or more items are no longer available. Please review your cart.",
          );
          return;
        }

        if (response.status === 400) {
          setError(
            serverMessage ||
              (isArabic
                ? "في تفاصيل في الطلب غلط، راجع البيانات"
                : "Please review the highlighted checkout details."),
          );
          return;
        }

        if (response.status >= 500 && response.status < 600) {
          setError(
            isArabic
              ? "مشكلة في السيرفر، حاول تاني بعد قليل"
              : "We could not save your order. Please try again shortly.",
          );
          return;
        }

        const fallbackArabic =
          "تعذر حفظ بيانات الطلب الآن، حاول مرة أخرى بعد قليل";
        const fallbackEnglish =
          "We could not save your order details. Please try again shortly.";
        setError(
          serverMessage ||
            (isArabic ? fallbackArabic : fallbackEnglish),
        );
        return;
      }

      type OrderResponse = {
        success?: boolean;
        orderId?: number;
        nextAction?: string;
        redirectUrl?: string;
        instapay?: { account: string; paymentLink: string };
        order?: {
          id?: number;
          items?: Pick<CartItem, "name" | "price" | "quantity" | "details">[];
          subtotal?: number;
          deliveryFee?: number;
          total?: number;
          createdAt?: string;
        };
      };
      const p = payload as OrderResponse;
      const confirmedItems: Pick<CartItem, "name" | "price" | "quantity" | "details">[] = Array.isArray(p.order?.items)
        ? p.order!.items!
        : items;
      const confirmedSubtotal = Number(p.order?.subtotal);
      const confirmedDeliveryFee = Number(p.order?.deliveryFee);
      const confirmedTotal = Number(p.order?.total);
      const confirmedCreatedAt = p.order?.createdAt
        ? String(p.order.createdAt)
        : undefined;
      const orderMessage = createOrderMessage(
        confirmedItems,
        Number.isFinite(confirmedSubtotal) ? confirmedSubtotal : subtotal,
        Number.isFinite(confirmedDeliveryFee)
          ? confirmedDeliveryFee
          : deliveryFee,
        Number.isFinite(confirmedTotal) ? confirmedTotal : estimatedTotal,
        Number(p.orderId),
        selectedPaymentMethod,
        normalizedPhone,
        confirmedCreatedAt,
      );
      if (
        p.nextAction === "paymob_redirect" &&
        typeof p.redirectUrl === "string"
      ) {
        trackEvent("payment_attempt", undefined, { orderId: p.orderId, method: "paymob", total: confirmedTotal });
        window.location.assign(p.redirectUrl);
        return;
      }
      if (p.nextAction === "instapay_transfer") {
        setInstapayConfirmation({
          orderId: Number(p.orderId),
          total: Number.isFinite(confirmedTotal)
            ? confirmedTotal
            : estimatedTotal,
          account: String(p.instapay?.account || ""),
          paymentLink: String(p.instapay?.paymentLink || ""),
          message: orderMessage,
        });
        return;
      }
      trackEvent("order_placed", undefined, { orderId: p.orderId, method: selectedPaymentMethod, total: confirmedTotal });
      trackEvent("payment_success", undefined, { method: selectedPaymentMethod, total: confirmedTotal, orderId: p.orderId });
      if (settings.whatsappNumber.trim()) {
        window.open(
          `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(orderMessage)}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
      saveLastOrder({
        orderId: Number(p.orderId),
        items: confirmedItems.map((item) => ({
          name: item.name || "",
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          details: item.details,
        })),
        total: Number.isFinite(confirmedTotal) ? confirmedTotal : estimatedTotal,
        createdAt: new Date().toISOString(),
        paymentMethod: selectedPaymentMethod,
      });
      clear();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
        setError(
          isArabic
            ? "مشكلة في الاتصال بالسيرفر، تأكد من الإنترنت وحاول تاني"
            : "Could not reach the server. Check your connection and try again.",
        );
      } else {
        setError(
          isArabic
            ? "تعذر حفظ بيانات الطلب الآن، حاول مرة أخرى بعد قليل"
            : "We could not save your order details. Please try again shortly.",
        );
      }
    } finally {
      setSending(false);
      submissionRef.current = false;
    }
  };

  const retryPayment = async () => {
    if (submissionRef.current) return;
    submissionRef.current = true;
    setError("");
    setSending(true);
    try {
      const resp = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          retryOrderId: failedOrderId,
          paymentMethod: "paymob",
          language,
          customer: {
            name: form.name,
            phone: normalizeEgyptianMobile(form.phone),
            email: form.email,
            area: form.area,
          },
          address: form.address,
        }),
      });
      let respPayload: Record<string, unknown> | null = null;
      const ct = resp.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        try { respPayload = await resp.json(); } catch { respPayload = null; }
      }
      if (!resp.ok || !respPayload) {
        const msg = typeof respPayload?.message === "string" ? respPayload.message : "";
        setError(msg || (isArabic ? "إعادة المحاولة فشلت، حاول مرة أخرى" : "Retry failed. Please try again."));
        return;
      }
      if (respPayload.redirectUrl) {
        window.location.assign(String(respPayload.redirectUrl));
        return;
      }
    } catch {
      setError(isArabic ? "مشكلة في الاتصال" : "Connection error. Please try again.");
    } finally {
      setSending(false);
      submissionRef.current = false;
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="kicker light">YOUR ORDER</span>
          <h1>{t("cart")}</h1>
          <p>
            {isArabic
              ? "راجع الأصناف وسجّل بياناتك وحدد موعد التوصيل أو الاستلام"
              : "Review your items, enter your details and select a delivery or pickup time."}
          </p>
        </div>
      </section>
      <section className="cart-page content-section">
        <div className="container">
          {items.length === 0 && !instapayConfirmation ? (
            <div className="empty-state">
              <div>
                <h2>{isArabic ? "السلة لسه فاضية" : "Your cart is empty"}</h2>
                <p>
                  {isArabic
                    ? "اختاري الأصناف من المنيو وارجعي هنا نكمّل الطلب"
                    : "Choose your items from the menu, then come back to complete the order."}
                </p>
                <Link href="/menu" className="button button-primary">
                  {t("menu")}
                </Link>
              </div>
              {lastOrder && (
                <div className="last-order-recap">
                  <h3>{isArabic ? "آخر طلب لك" : "Your last order"}</h3>
                  <span className="last-order-id">#{lastOrder.orderId}</span>
                  <div className="last-order-items">
                    {lastOrder.items.map((item, i) => (
                      <div className="last-order-line" key={i}>
                        <span>{item.name} × {item.quantity}</span>
                        <b>{formatPrice(item.price * item.quantity)}</b>
                      </div>
                    ))}
                  </div>
                  <div className="last-order-total">
                    <span>{isArabic ? "الإجمالي" : "Total"}</span>
                    <b>{formatPrice(lastOrder.total)}</b>
                  </div>
                  <p className="last-order-date">
                    {isArabic ? "بتاريخ" : "Placed on"} {new Date(lastOrder.createdAt).toLocaleDateString(isArabic ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <Link href="/menu" className="button button-primary">
                    {isArabic ? "اعمل طلب جديد" : "Order again"}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="checkout-grid">
              <div className="cart-list">
                <div className="cart-list-head">
                  <h2>{isArabic ? "طلبك" : "Your order"}</h2>
                  <button type="button" onClick={clear}>
                    {isArabic ? "امسح الكل" : "Clear all"}
                  </button>
                </div>
                {items.map((item) => (
                  <article className="cart-line" key={item.key}>
                    <div className="cart-line-copy">
                      <span>JAHEZ</span>
                      <h3>{item.name}</h3>
                      {item.details && <p>{item.details}</p>}
                      <b>{formatPrice(item.price)}</b>
                    </div>
                    <div className="cart-line-controls">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.key, item.quantity - 1)
                        }
                        aria-label={isArabic ? "تقليل الكمية" : "Decrease quantity"}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.key, item.quantity + 1)
                        }
                        aria-label={isArabic ? "زيادة الكمية" : "Increase quantity"}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="remove-line"
                      onClick={() => removeItem(item.key)}
                    >
                      {isArabic ? "حذف" : "Remove"}
                    </button>
                  </article>
                ))}
                <div className="cart-total">
                  <div>
                    <span>{isArabic ? "إجمالي الأصناف" : "Subtotal"}</span>
                    <b>{formatPrice(subtotal)}</b>
                  </div>
                  <div>
                    <span>{isArabic ? "رسوم التوصيل" : "Delivery fee"}</span>
                    <b>{formatPrice(deliveryFee)}</b>
                  </div>
                  <div className="cart-grand-total">
                    <span>{isArabic ? "الإجمالي النهائي" : "Total"}</span>
                    <b>{formatPrice(totalWithDiscount)}</b>
                  </div>
                  <p>
                    {freeDeliveryThreshold > 0
                      ? isArabic
                        ? `التوصيل مجاني للطلبات من ${formatPrice(freeDeliveryThreshold)}`
                        : `Free delivery from ${formatPrice(freeDeliveryThreshold)}`
                      : isArabic
                        ? "رسوم التوصيل محسوبة ومضافة قبل تأكيد الطلب"
                        : "Delivery is calculated before you confirm the order."}
                  </p>
                </div>
              </div>

              {instapayConfirmation ? (
                <section className="checkout-form instapay-confirmation">
                  <span className="kicker">INSTAPAY</span>
                  <h2>
                    {isArabic
                      ? `طلبك #${instapayConfirmation.orderId} چاهِز`
                      : `Order #${instapayConfirmation.orderId} is ready`}
                  </h2>
                  <p>
                    {isArabic
                      ? "حوّل الإجمالي على حساب إنستاباي ثم ابعت إثبات التحويل على واتساب مع رقم الطلب."
                      : "Transfer the total to the InstaPay account, then send the receipt on WhatsApp with your order number."}
                  </p>
                  <div className="instapay-account">
                    <span>{isArabic ? "الحساب" : "Account"}</span>
                    <strong dir="ltr">{instapayConfirmation.account}</strong>
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(instapayConfirmation.account)
                      }
                    >
                      {isArabic ? "نسخ" : "Copy"}
                    </button>
                  </div>
                  <div className="instapay-total">
                    <span>{isArabic ? "المبلغ المطلوب" : "Amount due"}</span>
                    <b>{formatPrice(instapayConfirmation.total)}</b>
                  </div>
                  {instapayConfirmation.paymentLink && (
                    <a
                      className="button button-primary"
                      href={instapayConfirmation.paymentLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {isArabic ? "افتح إنستاباي للتحويل" : "Open InstaPay"}
                    </a>
                  )}
                  <a
                    className="button whatsapp-submit"
                    href={settings.whatsappNumber.trim() ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(instapayConfirmation.message)}` : "/contact"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={clear}
                  >
                    {isArabic ? "ابعت إثبات التحويل" : "Send transfer receipt"}
                  </a>
                </section>
              ) : (
              <form className="checkout-form" onSubmit={submitOrder}>
                <span className="kicker">DELIVERY DETAILS</span>
                <h2>{isArabic ? "بيانات الطلب" : "Order details"}</h2>
                <div className="fulfillment-switch">
                  <button
                    type="button"
                    className={
                      form.fulfillment === "delivery" ? "active" : ""
                    }
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        fulfillment: "delivery",
                      }))
                    }
                  >
                    {isArabic ? "توصيل" : "Delivery"}
                  </button>
                  <button
                    type="button"
                    className={form.fulfillment === "pickup" ? "active" : ""}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        fulfillment: "pickup",
                      }))
                    }
                  >
                    {isArabic ? "استلام" : "Pickup"}
                  </button>
                </div>
                <fieldset className="payment-methods">
                  <legend>{isArabic ? "طريقة الدفع" : "Payment method"} <span className="required-star">*</span></legend>
                  {cashEnabled && (
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="payment-method"
                        value="cash"
                        checked={selectedPaymentMethod === "cash"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            paymentMethod: "cash",
                          }))
                        }
                      />
                      <span>
                        <b>{isArabic ? "كاش عند الاستلام" : "Cash on delivery"}</b>
                        <small>
                          {isArabic
                            ? "ادفعي كاش وقت استلام الطلب"
                            : "Pay cash when you receive your order"}
                        </small>
                      </span>
                    </label>
                  )}
                  {instapayEnabled && (
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="payment-method"
                        value="instapay"
                        checked={selectedPaymentMethod === "instapay"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            paymentMethod: "instapay",
                          }))
                        }
                      />
                      <span>
                        <b>InstaPay</b>
                        <small>
                          {isArabic
                            ? "حوّل مباشرة وأرسل إثبات التحويل"
                            : "Transfer directly and send the receipt"}
                        </small>
                      </span>
                    </label>
                  )}
                  {paymobEnabled && (
                    <label className="payment-option">
                      <input
                        type="radio"
                        name="payment-method"
                        value="paymob"
                        checked={selectedPaymentMethod === "paymob"}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            paymentMethod: "paymob",
                          }))
                        }
                      />
                      <span>
                        <b>{isArabic ? "فيزا أونلاين" : "Pay online"}</b>
                        <small>
                          {isArabic
                            ? "دفع آمن بالبطاقة عبر Paymob"
                            : "Secure card payment powered by Paymob"}
                        </small>
                      </span>
                    </label>
                  )}
                </fieldset>
                <label>
                  <span>{isArabic ? "الاسم بالكامل" : "Full name"} <span className="required-star">*</span></span>
                  <input
                    required
                    autoComplete="name"
                    maxLength={90}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder={isArabic ? "اسمك" : "Your name"}
                  />
                </label>
                <label>
                  <span>{isArabic ? "رقم الموبايل" : "Mobile number"} <span className="required-star">*</span></span>
                  <input
                    required
                    autoComplete="tel"
                    maxLength={20}
                    inputMode="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    onBlur={() => {
                      const normalizedPhone = normalizeEgyptianMobile(form.phone);
                      if (normalizedPhone) {
                        setForm((current) => ({
                          ...current,
                          phone: normalizedPhone,
                        }));
                      }
                    }}
                    placeholder="01XXXXXXXXX"
                    dir="ltr"
                  />
                </label>
                <label>
                  <span>
                    {isArabic
                      ? "البريد الإلكتروني (اختياري)"
                      : "Email (optional)"}
                  </span>
                  <input
                    autoComplete="email"
                    maxLength={160}
                    inputMode="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="name@example.com"
                    dir="ltr"
                  />
                </label>
                <label>
                  <span>
                    {isArabic ? "تاريخ الميلاد (اختياري)" : "Birthday (optional)"}
                  </span>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        birthday: event.target.value,
                      }))
                    }
                    max={new Date().toISOString().split("T")[0]}
                    dir="ltr"
                  />
                </label>
                <label className="admin-wide-field">
                  <span>
                    {isArabic ? "موعد التوصيل أو الاستلام" : "Delivery or pickup time"} <span className="required-star">*</span>
                  </span>
                  <input
                    required
                    type="datetime-local"
                    min={earliestRequestedFor}
                    value={form.requestedFor}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requestedFor: event.target.value,
                      }))
                    }
                    dir="ltr"
                  />
                  <small className="zone-checkout-details">
                    {isArabic
                      ? `الحجز قبل الموعد بـ${orderLeadHours} ساعة على الأقل`
                      : `Book at least ${orderLeadHours} hours ahead`}
                  </small>
                </label>
                {form.fulfillment === "pickup" && (
                  <div className="jahez-pickup-note">
                    <b>{isArabic ? "عنوان الاستلام" : "Pickup address"}</b>
                    <p>{isArabic ? settings.pickupAddressAr : settings.pickupAddressEn}</p>
                    {settings.mapsUrl && (
                      <a
                        className="button button-dark"
                        href={settings.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {isArabic ? "افتحي الموقع على الخريطة" : "Open pickup location"}
                      </a>
                    )}
                  </div>
                )}
                {form.fulfillment === "delivery" && (
                  <LocationPicker
                    value={form.location}
                    onChange={(loc) =>
                      setForm((current) => ({ ...current, location: loc }))
                    }
                    storeLat={store.lat}
                    storeLng={store.lng}
                    isArabic={isArabic}
                  />
                )}
                {form.fulfillment === "delivery" && form.location && locationValid && (
                  <p className="delivery-price-note" style={{ fontWeight: 700 }}>
                    {isArabic
                      ? `المسافة من الفرع: ${deliveryQuote!.distanceKm} كم — رسوم التوصيل ${formatPrice(deliveryFee)}`
                      : `Distance from store: ${deliveryQuote!.distanceKm} km — delivery fee ${formatPrice(deliveryFee)}`}
                  </p>
                )}
                {form.fulfillment === "delivery" && !form.location && (
                  <p className="delivery-price-note">
                    {isArabic
                      ? "التوصيل: أول 5 كم بـ 35 ج.م، وكل كيلو زيادة بـ 10 ج.م — حددي موقعك على الخريطة للحساب بالظبط"
                      : "Delivery: first 5 km = EGP 35, each extra km = EGP 10 — pick your map location for the exact price."}
                  </p>
                )}
                {form.fulfillment === "delivery" && (
                  <label>
                    <span>{isArabic ? "عنوان التوصيل" : "Delivery address"} <span className="required-star">*</span></span>
                    <textarea
                      required
                      autoComplete="street-address"
                      maxLength={300}
                      value={form.address}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          address: event.target.value,
                        }))
                      }
                      placeholder={
                        isArabic
                          ? "المنطقة والشارع ورقم العمارة"
                          : "Area, street and building number"
                      }
                      rows={3}
                    />
                  </label>
                )}
                <label>
                  <span>{isArabic ? "ملاحظات" : "Notes"}</span>
                  <textarea
                    maxLength={400}
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder={
                      isArabic
                        ? "أي ملاحظة على الطلب"
                        : "Any notes for your order"
                    }
                    rows={3}
                  />
                </label>
                <label className="consent-row">
                  <input
                    type="checkbox"
                    checked={form.marketingConsent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        marketingConsent: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    {isArabic
                      ? "موافق استقبل عروض وأخبار چاهِز (اختياري)"
                      : "I agree to receive Jahez offers and news (optional)"}
                  </span>
                </label>
                {error && <p className="form-error">{error}</p>}
                {failedOrderId && selectedPaymentMethod === "paymob" && (
                  <button
                    type="button"
                    className="button whatsapp-submit retry-payment"
                    disabled={sending}
                    onClick={retryPayment}
                  >
                    {sending
                      ? isArabic ? "جاري إعادة المحاولة..." : "Retrying..."
                      : isArabic ? "إعادة محاولة الدفع" : "Retry payment"}
                  </button>
                )}
                <button
                  type="submit"
                  className="button whatsapp-submit"
                  disabled={sending || !selectedPaymentMethod}
                >
                  {sending
                    ? isArabic
                      ? "جاري حفظ الطلب..."
                      : "Saving order..."
                    : selectedPaymentMethod === "paymob"
                      ? isArabic
                        ? "ادفع أونلاين بأمان"
                        : "Pay securely online"
                      : selectedPaymentMethod === "instapay"
                        ? isArabic
                          ? "تأكيد الطلب والتحويل"
                          : "Confirm and transfer"
                        : isArabic ? "تأكيد الطلب" : "Confirm order"}
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{transform:"rotate(180deg)",verticalAlign:"middle"}}><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                </button>
                <small>
                  {isArabic
                    ? "بياناتك بتتحفظ لإتمام الطلب وخدمتك بشكل أفضل ولن تُستخدم في التسويق بدون موافقتك"
                    : "Your details are saved to fulfil the order and improve service. Marketing use requires your optional consent."}
                </small>
              </form>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
