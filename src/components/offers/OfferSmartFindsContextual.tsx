"use client";

import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { PublicOffer } from "@/lib/offers/public-api";
import { OfferSmartFinds } from "@/components/offers/OfferSmartFinds";
import { useOfferNearby } from "@/components/offers/OfferNearbyContext";

export function OfferSmartFindsContextual({
  items,
  freshItems,
  locale,
}: {
  items: PublicOffer[];
  freshItems: PublicOffer[];
  locale: SiteLocale;
}) {
  const { results } = useOfferNearby();
  const selectedItems = results?.items ?? items;
  const selectedFreshItems = results?.items ?? freshItems;

  return <OfferSmartFinds items={selectedItems} freshItems={selectedFreshItems} locale={locale} />;
}
