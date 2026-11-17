import "server-only";
import { getConfig } from "@/lib/config";
export { localizedOfferPath } from "@/lib/offers/paths";

export type PublicMerchant = {
  name: string;
  address: string;
  city: string;
  district: string | null;
  pickupInstructions: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type PublicOffer = {
  id: string;
  title: string;
  category: string;
  priceMinor: number;
  originalPriceMinor: number | null;
  quantityTotal: number;
  availableUnits: number;
  pickupStart: string;
  pickupEnd: string;
  merchant: PublicMerchant;
  distanceKm?: number | null;
  publishedAt?: string | null;
};

export type PublicOfferDetail = PublicOffer & {
  description: string;
  allergensStatus: "UNKNOWN" | "DECLARED" | string;
  allergens: string[];
  foodNotes: string | null;
};

export type PublicOfferPage = { items: PublicOffer[]; page: number; size: number; total: number };
export type PublicOfferSuggestion = { id: string; title: string; category: string; priceMinor: number; merchantName: string; city: string; district: string | null };
export type OfferSearch = {
  q?: string;
  category?: string;
  maxPriceMinor?: string;
  pickupFrom?: string;
  pickupTo?: string;
  city?: string;
  district?: string;
  availableOnly?: string;
  sort?: string;
  page?: string;
  size?: string;
};

function searchParams(search: OfferSearch): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort", "page", "size"] as const) {
    const value = search[key];
    if (value !== undefined && value !== "") query.set(key, value);
  }
  query.set("availableOnly", search.availableOnly === "false" ? "false" : "true");
  return query.toString();
}

async function publicFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${getConfig().appOrigin}/api/bff/offers${path}`, {
    cache: "force-cache",
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`PUBLIC_OFFERS_${response.status}`);
  return await response.json() as T;
}

export function listPublicOffers(search: OfferSearch): Promise<PublicOfferPage> {
  return publicFetch<PublicOfferPage>(`?${searchParams(search)}`);
}

export function getPublicOffer(id: string): Promise<PublicOfferDetail> {
  return publicFetch<PublicOfferDetail>(`/${encodeURIComponent(id)}`);
}

