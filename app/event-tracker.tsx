"use client";

import { useEffect, useRef } from "react";

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

export function EventTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent("pageview");

    const handleBeforeUnload = () => {
      trackEvent("page_exit");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return null;
}
