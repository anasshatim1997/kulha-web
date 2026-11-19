import type { SiteLocale } from "@/lib/i18n/site-copy";

const localeTag: Record<SiteLocale, string> = { fr: "fr-MA", en: "en-MA", ar: "ar-MA" };
const casablancaZone = "Africa/Casablanca";

type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function getZonedParts(date: Date): ZonedParts {
  const values = new Intl.DateTimeFormat("en-GB", {
    timeZone: casablancaZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const parts = Object.fromEntries(values.map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  };
}

/**
 * Pickup timestamps are instants when they include Z/an offset. Legacy API values without
 * an offset represent Casablanca wall time, never the Node process or visitor's machine zone.
 */
export function parsePickupInstant(value: string): Date {
  if (/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(value)) {
    const parsed = new Date(value);
    if (Number.isFinite(parsed.getTime())) return parsed;
    throw new RangeError("Pickup window must contain valid increasing instants");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/.exec(value);
  if (!match) throw new RangeError("Pickup window must contain valid increasing instants");

  const [, year, month, day, hour, minute, second = "0", fraction = ""] = match;
  const milliseconds = Number(fraction.slice(0, 3).padEnd(3, "0"));
  const target = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), milliseconds);
  let timestamp = target;

  // Resolve Casablanca's offset iteratively so server and browser never use their host timezone.
  for (let iteration = 0; iteration < 5; iteration++) {
    const represented = getZonedParts(new Date(timestamp));
    const representedUtc = Date.UTC(
      represented.year, represented.month - 1, represented.day,
      represented.hour, represented.minute, represented.second, milliseconds,
    );
    const difference = target - representedUtc;
    if (difference === 0) break;
    timestamp += difference;
  }

  const parsed = new Date(timestamp);
  if (!Number.isFinite(parsed.getTime())) throw new RangeError("Pickup window must contain valid increasing instants");
  return parsed;
}

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

export function formatPickupDate(value: string, locale: SiteLocale): string {
  const date = parsePickupInstant(value);
  return new Intl.DateTimeFormat(localeTag[locale], {
    timeZone: casablancaZone, weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

export function formatPickupWindow(start: string, end: string, locale: SiteLocale): string {
  const startDate = parsePickupInstant(start);
  const endDate = parsePickupInstant(end);
  if (endDate < startDate) throw new RangeError("Pickup window must contain valid increasing instants");

  const time = (date: Date) => new Intl.DateTimeFormat(localeTag[locale], {
    timeZone: casablancaZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date);
  // Absolute date labels are intentional: relative "today/tomorrow" text based on Date.now()
  // can differ between SSR and hydration around midnight.
  const day = new Intl.DateTimeFormat(localeTag[locale], {
    timeZone: casablancaZone, day: "numeric", month: "short",
  }).format(startDate);
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
