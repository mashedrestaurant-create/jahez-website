import type { SiteSettings } from "./settings";

export const DELIVERY_BASE_FEE = 35;
export const DELIVERY_BASE_KM = 5;
export const DELIVERY_PER_KM_FEE = 10;
export const DELIVERY_MAX_KM = 30;

const DEFAULT_STORE_LAT = 29.9602;
const DEFAULT_STORE_LNG = 31.2569;

export function getStoreLocation(settings: SiteSettings): { lat: number; lng: number } {
  const lat = Number(settings.storeLat);
  const lng = Number(settings.storeLng);
  return {
    lat: Number.isFinite(lat) && lat !== 0 ? lat : DEFAULT_STORE_LAT,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : DEFAULT_STORE_LNG,
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDeliveryFee(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return 0;
  if (distanceKm <= DELIVERY_BASE_KM) return DELIVERY_BASE_FEE;
  const extraKm = Math.ceil(distanceKm - DELIVERY_BASE_KM);
  return DELIVERY_BASE_FEE + extraKm * DELIVERY_PER_KM_FEE;
}

export type DeliveryQuote = {
  ok: boolean;
  reason?: string;
  reasonAr?: string;
  distanceKm: number;
  fee: number;
};

export function quoteDelivery(
  settings: SiteSettings,
  lat: unknown,
  lng: unknown,
): DeliveryQuote {
  const customerLat = Number(lat);
  const customerLng = Number(lng);
  if (
    !Number.isFinite(customerLat) || !Number.isFinite(customerLng) ||
    customerLat < 21 || customerLat > 32 || customerLng < 24 || customerLng > 37
  ) {
    return { ok: false, reason: "Invalid location", reasonAr: "الموقع غير صحيح", distanceKm: 0, fee: 0 };
  }
  const store = getStoreLocation(settings);
  const distanceKm = haversineKm(store.lat, store.lng, customerLat, customerLng);
  if (distanceKm > DELIVERY_MAX_KM) {
    return {
      ok: false,
      reason: `We deliver within ${DELIVERY_MAX_KM} km only`,
      reasonAr: `بنوصل لحد ${DELIVERY_MAX_KM} كم بس`,
      distanceKm: Math.round(distanceKm * 10) / 10,
      fee: 0,
    };
  }
  return { ok: true, distanceKm: Math.round(distanceKm * 10) / 10, fee: calculateDeliveryFee(distanceKm) };
}
