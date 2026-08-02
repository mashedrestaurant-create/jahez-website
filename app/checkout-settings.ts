import type { SiteSettings } from "./settings";
import {
  activeDeliveryZones,
  resolveDeliveryZone,
} from "./delivery-zones.ts";

export function settingEnabled(value: string) {
  return value === "true";
}

function safeMoney(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100) / 100
    : 0;
}

export function calculateCheckoutTotals(
  subtotal: number,
  fulfillment: "delivery" | "pickup",
  settings: SiteSettings,
  deliveryZoneId = "",
) {
  const zones = activeDeliveryZones(settings);
  const zone =
    fulfillment === "delivery"
      ? resolveDeliveryZone(settings, deliveryZoneId)
      : null;
  const zoneRequired = fulfillment === "delivery" && zones.length > 0;
  const minimumOrder =
    zone?.minimumOrder ?? safeMoney(settings.minimumOrder);
  const freeDeliveryThreshold =
    zone?.freeDeliveryThreshold ??
    safeMoney(settings.freeDeliveryThreshold);
  const configuredDeliveryFee =
    zone?.fee ?? safeMoney(settings.deliveryFee);
  const qualifiesForFreeDelivery =
    freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold;
  const deliveryFee =
    fulfillment === "delivery" &&
    (!zoneRequired || zone) &&
    !qualifiesForFreeDelivery
      ? configuredDeliveryFee
      : 0;
  return {
    subtotal,
    deliveryFee,
    total: Math.round((subtotal + deliveryFee) * 100) / 100,
    minimumOrder,
    meetsMinimumOrder: subtotal >= minimumOrder,
    deliveryZone: zone,
    deliveryZoneRequired: zoneRequired,
    deliveryZoneValid: !zoneRequired || Boolean(zone),
  };
}
