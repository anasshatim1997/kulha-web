import { headers } from "next/headers";
import { OfferLoadingState } from "@/components/offers/OfferListStates";
import type { SiteLocale } from "@/lib/i18n/site-copy";

export default async function OffersLoading() {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-kulha-locale");
  const locale: SiteLocale = headerLocale === "ar" || headerLocale === "en" ? headerLocale : "fr";
  return <OfferLoadingState locale={locale} />;
}
