import type { SiteLocale } from "@/lib/i18n/site-copy";

const localeTag: Record<SiteLocale, string> = { fr: "fr-MA", en: "en-MA", ar: "ar-MA" };

export type MadPriceDisplayParts = {
  major: string;
  fraction: string;
  currency: string;
  full: string;
};

export function getMadPriceDisplayParts(priceMinor: number, locale: SiteLocale): MadPriceDisplayParts {
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
    throw new RangeError("priceMinor must be a non-negative safe integer");
  }

  const major = Math.floor(priceMinor / 100);
  const fraction = priceMinor % 100;
  const majorText = new Intl.NumberFormat(localeTag[locale], { maximumFractionDigits: 0 }).format(major);
  const fractionText = new Intl.NumberFormat(localeTag[locale], {
    useGrouping: false,
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  }).format(fraction);
  const currency = locale === "ar" ? "د.م." : locale === "en" ? "MAD" : "DH";
  const fullAmount = new Intl.NumberFormat(localeTag[locale], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceMinor / 100);

  return { major: majorText, fraction: fractionText, currency, full: `${fullAmount} ${currency}` };
}

export function getMadDiscountPercent(priceMinor: number, originalPriceMinor: number | null | undefined): number | null {
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) return null;
  if (!Number.isSafeInteger(originalPriceMinor) || !originalPriceMinor || originalPriceMinor <= priceMinor) return null;
  return Math.max(1, Math.round((1 - priceMinor / originalPriceMinor) * 100));
}
