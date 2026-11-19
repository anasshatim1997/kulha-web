import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";

export type OfferPageNumber = number | "ellipsis";

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
  return `${path}?${query.toString()}#kulha-offers-results`;
}

/** A compact zero-based page window for the marketplace's numbered pager. */
export function offerPageNumbers(currentPage: number, totalPages: number, maxVisible = 5): OfferPageNumber[] {
  const total = Math.max(0, Math.floor(totalPages));
  if (total === 0) return [];
  const current = Math.min(total - 1, Math.max(0, Math.floor(currentPage)));
  const width = Math.max(3, Math.floor(maxVisible));
  if (total <= width + 2) return Array.from({ length: total }, (_, index) => index);

  const radius = Math.floor(width / 2);
  let start = Math.max(1, current - radius);
  const end = Math.min(total - 2, start + width - 1);
  start = Math.max(1, end - width + 1);
  const pages: OfferPageNumber[] = [0];
  if (start > 1) pages.push("ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 2) pages.push("ellipsis");
  pages.push(total - 1);
  return pages;
}
