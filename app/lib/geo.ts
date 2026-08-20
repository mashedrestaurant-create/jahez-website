export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isCoordinate(val: unknown): val is number {
  return typeof val === "number" && isFinite(val) && Math.abs(val) <= 180;
}

export function etaMinutes(distKm: number, speedKmh = 25): number {
  return Math.max(2, Math.round((distKm / speedKmh) * 60));
}

export function routeKm(distKm: number): number {
  return Math.round(distKm * 1.4 * 10) / 10;
}

export function distanceToEta(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distKm: number; etaMin: number } {
  const straight = haversineKm(lat1, lon1, lat2, lon2);
  const road = routeKm(straight);
  return { distKm: road, etaMin: etaMinutes(road) };
}

export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label ? `${label}@${lat},${lng}` : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
