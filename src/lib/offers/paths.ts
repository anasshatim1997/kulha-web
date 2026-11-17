import type { SiteLocale } from "@/lib/i18n/site-copy";

export function localizedOfferPath(locale: SiteLocale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return locale === "fr" ? clean : `/${locale}${clean}`;
}
