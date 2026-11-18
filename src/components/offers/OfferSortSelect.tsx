"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { OfferSearch } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";

function offersPath(locale: SiteLocale): string {
  return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

export function OfferSortSelect({ locale, values }: { locale: SiteLocale; values: OfferSearch }) {
  const copy = publicOfferCopy(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function updateSort(sort: string) {
    const query = new URLSearchParams();
    for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "size"] as const) {
      const value = values[key];
      if (value) query.set(key, value);
    }
    if (values.availableOnly === "false") query.set("availableOnly", "false");
    if (sort !== "pickup_end") query.set("sort", sort);
    query.set("page", "0");
    startTransition(() => router.push(`${offersPath(locale)}?${query.toString()}#kulha-offers-results`));
  }

  return (
    <label className="kulha-sort-control" aria-busy={isPending}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v16m0-16L5 7m3-3 3 3M16 20V4m0 16 3-3m-3 3-3-3" /></svg>
      <span className="sr-only">{copy.sort}</span>
      <select value={values.sort || "pickup_end"} onChange={(event) => updateSort(event.currentTarget.value)} disabled={isPending}>
        <option value="pickup_end">{locale === "fr" ? "Se termine bientôt" : locale === "ar" ? "ينتهي قريباً" : "Ending soon"}</option>
        <option value="price">{copy.price}</option>
        <option value="newest">{copy.newest}</option>
      </select>
      <svg className="kulha-sort-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
    </label>
  );
}
