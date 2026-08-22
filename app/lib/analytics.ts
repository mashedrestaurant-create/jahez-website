"use client";

import { useEffect, useRef, useCallback } from "react";

let _sessionId: string | null = null;

function getOrCreateSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window !== "undefined") {
    _sessionId = localStorage.getItem("jahez_session_id");
    if (!_sessionId) {
      _sessionId = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
      localStorage.setItem("jahez_session_id", _sessionId);
    }
  }
  return _sessionId || "";
}

export function trackEvent(event: string, page?: string, meta?: Record<string, unknown>) {
  const sessionId = getOrCreateSessionId();
  const body = { event, page: page || window.location.pathname, meta, sessionId };
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    navigator.sendBeacon("/api/signal", blob);
  } else {
    fetch("/api/signal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }
}

export function trackPageview(page?: string) {
  trackEvent("pageview", page);
}

export function trackAddToCart(productId: string, productName: string, price: number) {
  trackEvent("add_to_cart", undefined, { productId, productName, price });
}

export function trackCheckoutStart(total: number) {
  trackEvent("checkout_start", undefined, { total });
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

export function usePageTracking() {
  const lastPath = useRef<string>("");
  useEffect(() => {
    const path = window.location.pathname;
    if (path !== lastPath.current) {
      lastPath.current = path;
      trackPageview(path);
    }
  }, []);
}

export function useAutoTrack() {
  usePageTracking();
}
