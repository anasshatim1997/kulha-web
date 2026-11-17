import type { PublicOfferSuggestion } from "@/lib/offers/public-api";

export type OfferSuggestionFilters = { city?: string; district?: string };

export async function fetchPublicOfferSuggestions(
  query: string,
  filters: OfferSuggestionFilters = {},
  signal?: AbortSignal,
): Promise<PublicOfferSuggestion[]> {
  const normalized = query.trim();
  if (normalized.length < 2 || normalized.length > 80) return [];

  const params = new URLSearchParams({ q: normalized, limit: "6" });
  if (filters.city) params.set("city", filters.city);
  if (filters.district) params.set("district", filters.district);

  const response = await fetch(`/api/bff/offers/suggestions?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error(`OFFER_SUGGESTIONS_${response.status}`);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) return [];
  return payload.slice(0, 8) as PublicOfferSuggestion[];
}


export function offerSuggestionHref(locale: "fr" | "ar" | "en", offerId: string): string {
  const offersPath = locale === "fr" ? "/offers" : `/${locale}/offers`;
  return `${offersPath}/${encodeURIComponent(offerId)}`;
}
