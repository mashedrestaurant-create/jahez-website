import type { SiteSettings } from "./settings";

export type DeliveryZone = {
  id: string;
  nameAr: string;
  nameEn: string;
  areasAr: string;
  areasEn: string;
  fee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number;
  etaMinutes: number;
  active: boolean;
};

function safeMoney(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100) / 100
    : 0;
}

function safeMinutes(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 360 ? parsed : 0;
}

export function parseDeliveryZones(value: string): DeliveryZone[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set<string>();
    return parsed
      .slice(0, 30)
      .map((unknownZone): DeliveryZone | null => {
        if (!unknownZone || typeof unknownZone !== "object") return null;
        const zone = unknownZone as Record<string, unknown>;
        const id =
          typeof zone.id === "string"
            ? zone.id.trim().slice(0, 80)
            : "";
        const nameAr =
          typeof zone.nameAr === "string"
            ? zone.nameAr.trim().slice(0, 100)
            : "";
        const nameEn =
          typeof zone.nameEn === "string"
            ? zone.nameEn.trim().slice(0, 100)
            : "";
        if (!id || !nameAr || !nameEn || ids.has(id)) return null;
        ids.add(id);
        return {
          id,
          nameAr,
          nameEn,
          areasAr:
            typeof zone.areasAr === "string"
              ? zone.areasAr.trim().slice(0, 300)
              : "",
          areasEn:
            typeof zone.areasEn === "string"
              ? zone.areasEn.trim().slice(0, 300)
              : "",
          fee: safeMoney(zone.fee),
          minimumOrder: safeMoney(zone.minimumOrder),
          freeDeliveryThreshold: safeMoney(zone.freeDeliveryThreshold),
          etaMinutes: safeMinutes(zone.etaMinutes),
          active: zone.active !== false,
        };
      })
      .filter((zone): zone is DeliveryZone => Boolean(zone));
  } catch {
    return [];
  }
}

export function activeDeliveryZones(settings: SiteSettings) {
  return parseDeliveryZones(settings.deliveryZones).filter((zone) => zone.active);
}

export function resolveDeliveryZone(
  settings: SiteSettings,
  deliveryZoneId: string,
) {
  return (
    activeDeliveryZones(settings).find((zone) => zone.id === deliveryZoneId) ||
    null
  );
}

export function serializeDeliveryZones(zones: DeliveryZone[]) {
  return JSON.stringify(zones.slice(0, 30));
}
