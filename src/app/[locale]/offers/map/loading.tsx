import { headers } from "next/headers";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { OfferMapLoadingState } from "@/components/offers/OfferMapLoadingState";

export default async function LocalizedOffersMapLoading() {
  const requestHeaders = await headers();
  const headerLocale = requestHeaders.get("x-kulha-locale");
  const locale: SiteLocale = headerLocale === "ar" || headerLocale === "en" ? headerLocale : "fr";
  return <OfferMapLoadingState locale={locale} />;
}
