"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCart } from "../../cart-context";
import { useLanguage } from "../../language-context";
import { formatWhatsAppOrder } from "../../whatsapp-message";
import { trackEvent } from "../../event-tracker";
import { useCatalog } from "../../catalog-context";

type OrderDetails = {
  id: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  fulfillment: string;
  address?: string;
  notes?: string;
  language: string;
  deliveryZone?: string;
  items: Array<{ name: string; price: number; quantity: number; details?: string }>;
  createdAt: string;
  customer?: { name: string; phone: string; email?: string } | null;
};

function PaymentResultContent() {
  const params = useSearchParams();
  const { clear } = useCart();
  const { isArabic } = useLanguage();
  const { settings } = useCatalog();
  const status = params.get("status");
  const order = params.get("order");
  const paid = status === "success";
  const cancelled = status === "cancelled";
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    const key = `jahez-paid-order-${order || "latest"}`;
    if (paid && window.sessionStorage.getItem(key) !== "1") {
      window.sessionStorage.setItem(key, "1");
      clear();
      trackEvent("payment_success", undefined, { orderId: order });
    } else if (cancelled) {
      trackEvent("payment_cancelled", undefined, { orderId: order });
    } else if (status && !paid) {
      trackEvent("payment_failed", undefined, { orderId: order, status });
    }
  }, [clear, order, paid, cancelled, status]);

  useEffect(() => {
    if (!order) return;
    fetch(`/api/orders/${order}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.id) setOrderDetails(data);
      })
      .catch(() => {});
  }, [order]);

  const whatsappMessage = orderDetails
    ? formatWhatsAppOrder({
        items: orderDetails.items.map((item) => ({ ...item, id: "" })),
        subtotal: orderDetails.subtotal,
        deliveryFee: orderDetails.deliveryFee,
        total: orderDetails.total,
        orderId: orderDetails.id,
        paymentMethod: orderDetails.paymentMethod,
        paymentStatus: orderDetails.paymentStatus || status || undefined,
        fulfillment: orderDetails.fulfillment,
        customerName: orderDetails.customer?.name || "Customer",
        customerPhone: orderDetails.customer?.phone || "",
        customerEmail: orderDetails.customer?.email || undefined,
        address: orderDetails.fulfillment === "delivery" ? orderDetails.address : undefined,
        notes: orderDetails.notes || undefined,
        deliveryZoneName: orderDetails.deliveryZone || undefined,
        language: (orderDetails.language === "en" ? "en" : "ar") as "ar" | "en",
        createdAt: orderDetails.createdAt,
      })
    : "";

  const whatsappNumber = settings.whatsappNumber.trim();
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ""}`
    : "";

  return (
    <section className="payment-result-page">
      <div className={`payment-result-card ${paid ? "success" : "failed"}`}>
        <img
          src="/assets/jahez/logo.jpg"
          alt="Jahez"
          className="payment-result-logo"
          width={140}
          height={46}
        />
        <div className={`payment-result-icon ${paid ? "success" : cancelled ? "cancelled" : "failed"}`}>
          {paid ? (
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="26" fill="#22c55e" opacity="0.12" />
              <circle cx="26" cy="26" r="20" fill="#22c55e" />
              <path d="M16 27l7 7 13-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : cancelled ? (
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="26" fill="#f59e0b" opacity="0.12" />
              <circle cx="26" cy="26" r="20" fill="#f59e0b" />
              <path d="M18 18l16 16M34 18L18 34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="26" fill="#ef4444" opacity="0.12" />
              <circle cx="26" cy="26" r="20" fill="#ef4444" />
              <path d="M18 18l16 16M34 18L18 34" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <span className="payment-result-label">{paid ? "PAYMENT COMPLETE" : cancelled ? "PAYMENT CANCELLED" : "PAYMENT UPDATE"}</span>
        <h1>
          {paid
            ? isArabic
              ? "تم الدفع بنجاح"
              : "Payment successful"
            : cancelled
              ? isArabic
                ? "تم إلغاء الدفع"
                : "Payment cancelled"
              : isArabic
                ? "الدفع لم يكتمل"
                : "Payment was not completed"}
        </h1>
        <p>
          {paid
            ? isArabic
              ? `طلبك${order ? ` #${order}` : ""} اتسجل واتأكد دفعه، وفريق Jahez هيبدأ تجهيزه.`
              : `Order${order ? ` #${order}` : ""} is paid and confirmed. The Jahez team will start preparing it.`
            : cancelled
              ? isArabic
                ? "تم إلغاء عملية الدفع. يمكنك الرجوع للسلة والمحاولة مرة أخرى أو اختيار طريقة دفع مختلفة."
                : "The payment was cancelled. Return to your cart to retry or choose another payment method."
              : isArabic
                ? "لم يتم خصم المبلغ حسب النتيجة المستلمة. يمكنك الرجوع للسلة والمحاولة مرة أخرى أو اختيار طريقة دفع مختلفة."
                : "The payment was not confirmed. Return to your cart to retry or choose another payment method."}
        </p>
        {orderDetails && (
          <div className="payment-result-order-summary">
            <div className="payment-result-detail">
              <span>{isArabic ? "رقم الطلب" : "Order"}</span>
              <strong>#{orderDetails.id}</strong>
            </div>
            <div className="payment-result-detail">
              <span>{isArabic ? "الإجمالي" : "Total"}</span>
              <strong>{orderDetails.total} {isArabic ? "ج.م" : "EGP"}</strong>
            </div>
            <div className="payment-result-detail">
              <span>{isArabic ? "طريقة الدفع" : "Payment"}</span>
              <strong>
                {orderDetails.paymentMethod === "cash"
                  ? isArabic ? "كاش عند الاستلام" : "Cash on Delivery"
                  : orderDetails.paymentMethod === "instapay"
                    ? "InstaPay"
                    : isArabic ? "دفع إلكتروني" : "Online Payment"}
              </strong>
            </div>
            <div className="payment-result-detail">
              <span>{isArabic ? "حالة الدفع" : "Payment status"}</span>
              <strong>
                {paid
                  ? isArabic ? "تم الدفع" : "Paid"
                  : cancelled
                    ? isArabic ? "تم الإلغاء" : "Cancelled"
                    : isArabic ? "لم يكتمل" : "Not completed"}
              </strong>
            </div>
          </div>
        )}
        <div className="payment-result-actions">
          {paid ? (
            <Link href="/menu" className="button button-primary">
              {isArabic ? "ارجع للمنيو" : "Back to menu"}
            </Link>
          ) : (
            <Link href="/cart" className="button button-primary">
              {isArabic ? "ارجع للسلة" : "Back to cart"}
            </Link>
          )}
          {paid && whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="button button-whatsapp"
            >
              {isArabic ? "إرسال الطلب على واتساب" : "Send order on WhatsApp"}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <section className="payment-result-page">
          <div className="payment-result-card">
            <img
              src="/assets/jahez/logo.jpg"
              alt="Jahez"
              className="payment-result-logo"
              width={140}
              height={46}
            />
            <div className="payment-result-loading">
              <div className="payment-result-spinner" />
            </div>
            <h1>Loading...</h1>
          </div>
        </section>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
