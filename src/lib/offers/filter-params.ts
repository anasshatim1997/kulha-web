import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";

export type PickupSelection = "none" | "now" | "tonight" | "tomorrow" | "custom";
export type QuickPickupRanges = Record<"now" | "tonight" | "tomorrow", { from: string; to: string }>;

export type OfferFilterDraft = {
  pickup: PickupSelection;
  maxPriceMinor: string;
  district: string;
  sort: string;
  includeSoldOut: boolean;
  pickupFromLocal: string;
  pickupToLocal: string;
};

function offersPath(locale: SiteLocale): string {
  return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

export function buildOfferFilterHref(
  locale: SiteLocale,
  values: OfferSearch,
  pickupRanges: QuickPickupRanges,
  draft: OfferFilterDraft,
): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "city"] as const) {
    const value = values[key];
    if (value) query.set(key, value);
  }
  if (draft.maxPriceMinor) query.set("maxPriceMinor", draft.maxPriceMinor);
  if (draft.district) query.set("district", draft.district);
  if (draft.sort !== "pickup_end") query.set("sort", draft.sort);
  if (draft.includeSoldOut) query.set("availableOnly", "false");

  if (draft.pickup === "now" || draft.pickup === "tonight" || draft.pickup === "tomorrow") {
    query.set("pickupFrom", pickupRanges[draft.pickup].from);
    query.set("pickupTo", pickupRanges[draft.pickup].to);
  } else if (draft.pickup === "custom") {
    if (draft.pickupFromLocal) query.set("pickupFromLocal", draft.pickupFromLocal);
    if (draft.pickupToLocal) query.set("pickupToLocal", draft.pickupToLocal);
  }

  query.set("page", "0");
  query.set("size", values.size || "20");
  return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}
