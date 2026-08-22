"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type LatLng = { lat: number; lng: number };

declare global {
  interface Window {
    L?: any;
    __leafletLoading?: Promise<void>;
  }
}

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (window.__leafletLoading) return window.__leafletLoading;
  window.__leafletLoading = new Promise<void>((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("leaflet failed"));
    document.head.appendChild(script);
  });
  return window.__leafletLoading;
}

export function LocationPicker({ value, onChange, storeLat, storeLng, isArabic }: {
  value: LatLng | null;
  onChange: (loc: LatLng | null) => void;
  storeLat: number;
  storeLng: number;
  isArabic: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<LatLng>(
    value || { lat: storeLat + 0.01, lng: storeLng + 0.01 },
  );

  const setMarker = useCallback((pos: LatLng) => {
    posRef.current = pos;
    if (markerRef.current && window.L) {
      markerRef.current.setLatLng([pos.lat, pos.lng]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadLeaflet()
      .then(() => {
        if (cancelled || !containerRef.current || !window.L || mapRef.current) return;
        const start = posRef.current;
        const map = window.L.map(containerRef.current).setView([start.lat, start.lng], 14);
        window.L
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
          })
          .addTo(map);

        // Store marker (home)
        window.L.marker([storeLat, storeLng], {
          icon: window.L.divIcon({ html: "🏠", className: "", iconSize: [28, 28] }),
          interactive: false,
        }).addTo(map);

        const marker = window.L.marker([start.lat, start.lng], { draggable: true }).addTo(map);
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          setMarker({ lat: p.lat, lng: p.lng });
        });
        map.on("click", (e: any) => {
          setMarker({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        mapRef.current = map;
        markerRef.current = marker;
        setMapReady(true);
        setTimeout(() => map.invalidateSize(), 150);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, storeLat, storeLng, setMarker]);

  // Keep marker in sync when reopening with existing selection
  useEffect(() => {
    if (open && mapReady && value) {
      setMarker(value);
      mapRef.current?.setView([value.lat, value.lng], 15);
    }
  }, [open, mapReady, value, setMarker]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarker(loc);
        mapRef.current?.setView([loc.lat, loc.lng], 16);
        setGpsBusy(false);
      },
      () => setGpsBusy(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const confirm = () => {
    onChange({ ...posRef.current });
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <div className="location-picker">
      <span>
        {isArabic ? "موقعك على الخريطة" : "Your location on the map"}{" "}
        <span className="required-star">*</span>
      </span>

      {!open && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="button button-dark"
            style={{ padding: "10px 18px", fontSize: 14 }}
          >
            📍 {value
              ? isArabic ? "تعديل الموقع المحدد" : "Change selected location"
              : isArabic ? "اختاري موقعك على الخريطة" : "Pick your location on the map"}
          </button>
          {value && (
            <small className="zone-checkout-details" dir="ltr" style={{ alignSelf: "center" }}>
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </small>
          )}
        </div>
      )}

      {open && (
        <div style={{ border: "1px solid #e2e2e2", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
          <div ref={containerRef} style={{ height: 320, width: "100%", background: "#eef2ee" }} />
          <div style={{ display: "flex", gap: 8, padding: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={useMyLocation} disabled={gpsBusy || !mapReady}
              style={{ padding: "8px 14px", fontSize: 13, borderRadius: 8, border: "1px solid #ccc", background: "#fff" }}>
              {gpsBusy ? (isArabic ? "جاري التحديد..." : "Locating...") : isArabic ? "🎯 موقعي الحالي" : "🎯 Use my location"}
            </button>
            <span style={{ fontSize: 12, color: "#777", flex: 1, minWidth: 140 }}>
              {isArabic ? "اضغطي على الخريطة أو اسحبي الدبوس لمكان بيتك" : "Tap the map or drag the pin to your home"}
            </span>
            <button type="button" onClick={clear}
              style={{ padding: "8px 12px", fontSize: 13, borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#a33" }}>
              {isArabic ? "إلغاء" : "Cancel"}
            </button>
            <button type="button" onClick={confirm} disabled={!mapReady}
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 8, border: "none", background: "#0a2d1d", color: "#fff", fontWeight: 700 }}>
              ✓ {isArabic ? "تأكيد الموقع" : "Confirm location"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
