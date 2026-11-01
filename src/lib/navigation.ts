import type { SiteLocale } from "@/lib/i18n/site-copy";

/** Keep post-auth redirects on this origin and away from internal API routes. */
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  if (!/^\/(?![/\\])[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#[\]]*$/.test(raw)) return fallback;
  if (raw.startsWith("/api/")) return fallback;
  return raw;
}

const localePrefix = /^\/(en|ar)(?=\/|$)/;

export function localeFromPath(pathname: string): SiteLocale {
  if (/^\/ar(?:\/|$)/.test(pathname)) return "ar";
  if (/^\/en(?:\/|$)/.test(pathname)) return "en";
  return "fr";
}

export function localePath(locale: SiteLocale, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const withoutPrefix = cleanPath.replace(localePrefix, "") || "/";
  if (locale === "fr") return withoutPrefix;
  return `/${locale}${withoutPrefix === "/" ? "" : withoutPrefix}`;
}

export function switchLocalePath(pathname: string, locale: SiteLocale): string {
  const withoutPrefix = pathname.replace(localePrefix, "") || "/";
  const parts = withoutPrefix.split("?")[0].split("#")[0].split("/").filter(Boolean);
  const supported = new Set(["how-it-works", "about", "categories", "faq", "for-shops", "pickup-policy", "contact", "login", "register"]);
  if (parts.length > 1 || (parts.length === 1 && !supported.has(parts[0]))) return localePath(locale, "/");
  return localePath(locale, withoutPrefix);
}
