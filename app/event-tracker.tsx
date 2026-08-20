"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "jahez-session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackEvent(event: string, page?: string, meta?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const sessionId = getSessionId();
  const body = JSON.stringify({ event, page: page || window.location.pathname, meta, sessionId });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

export function trackAddToCart(productId: string, productName: string, price: number) {
  trackEvent("add_to_cart", undefined, { productId, productName, price });
}

export function trackCheckoutStart(total: number, items: number) {
  trackEvent("checkout_start", undefined, { total, items });
}

export function trackPaymentAttempt(method: string, total: number) {
  trackEvent("payment_attempt", undefined, { method, total });
}

export function trackPaymentSuccess(method: string, total: number, orderId?: string) {
  trackEvent("payment_success", undefined, { method, total, orderId });
}

export function trackPaymentFailed(method: string, reason?: string) {
  trackEvent("payment_failed", undefined, { method, reason });
}

export function trackPaymentCancelled(method: string) {
  trackEvent("payment_cancelled", undefined, { method });
}

export function EventTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string>("");
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackEvent("pageview", pathname);
    } else if (pathname !== lastPath.current) {
      trackEvent("pageview", pathname);
    }
    lastPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      trackEvent("page_exit");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return null;
}
