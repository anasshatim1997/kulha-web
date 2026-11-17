export type PublicGeocodeResult = {
  latitude: number;
  longitude: number;
  displayName: string;
  accuracy: "address" | "street" | "area";
};

export type PublicGeocodeAddress = {
  address?: string | null;
  district?: string | null;
  city?: string | null;
  locale?: string;
};

export async function geocodePublicShop(address: PublicGeocodeAddress): Promise<PublicGeocodeResult | null> {
  const response = await fetch("/api/bff/map/geocode", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(address),
  });
  if (!response.ok) throw new Error(`PUBLIC_MAP_GEOCODE_${response.status}`);
  const payload = await response.json() as { location?: PublicGeocodeResult | null };
  return payload.location ?? null;
}
