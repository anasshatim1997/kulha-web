import type { SiteLocale } from "@/lib/i18n/site-copy";

const localeTag: Record<SiteLocale, string> = { fr: "fr-MA", en: "en-MA", ar: "ar-MA" };

export function roundMadMinor(priceMinor: number): number {
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) throw new RangeError("priceMinor must be a non-negative safe integer");
  const amount = priceMinor / 100;
  const step = amount <= 12.5 ? 0.5 : 1;
  return Math.round(amount / step) * step * 100;
}

export function formatMad(priceMinor: number, locale: SiteLocale): string {
  const rounded = roundMadMinor(priceMinor) / 100;
  const formatted = new Intl.NumberFormat(localeTag[locale], {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(rounded);
  return locale === "ar" ? `${formatted} د.م.` : `${formatted} DH`;
}

export function formatPickupWindow(start: string, end: string, locale: SiteLocale): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate < startDate) {
    throw new RangeError("Pickup window must contain valid increasing instants");
  }
  const time = (date: Date) => new Intl.DateTimeFormat(localeTag[locale], {
    timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
  const dayLabel = (date: Date) => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const target = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    const tomorrowDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrow = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca", year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrowDate);
    if (target === today) return locale === "fr" ? "Aujourd’hui" : locale === "ar" ? "اليوم" : "Today";
    if (target === tomorrow) return locale === "fr" ? "Demain" : locale === "ar" ? "غداً" : "Tomorrow";
    return new Intl.DateTimeFormat(localeTag[locale], { timeZone: "Africa/Casablanca", day: "numeric", month: "short" }).format(date);
  };
  const day = dayLabel(startDate);
  return `${day} · ${time(startDate)}–${time(endDate)}`;
}

export function madToMinorUnits(value: string): number {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new RangeError("Enter a MAD amount with at most two decimal places");
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor < 100 || minor > 200000) {
    throw new RangeError("MAD amount must be between 1 and 2000");
  }
  return minor;
}
