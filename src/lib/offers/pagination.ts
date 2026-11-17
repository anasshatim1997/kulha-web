import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";

export function offerPageHref(locale: SiteLocale, search: OfferSearch, page: number): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
    const value = search[key];
    if (value !== undefined && value !== "") query.set(key, value);
  }
  query.set("availableOnly", search.availableOnly === "false" ? "false" : "true");
  query.set("page", String(Math.max(0, Math.floor(page))));
  query.set("size", search.size && /^\d+$/.test(search.size) ? search.size : "20");
  const path = locale === "fr" ? "/offers" : `/${locale}/offers`;
  return `${path}?${query.toString()}`;
}
