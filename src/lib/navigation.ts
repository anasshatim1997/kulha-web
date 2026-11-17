import type { SiteLocale } from "@/lib/i18n/site-copy";

/** Keep post-auth redirects on this origin and away from internal API routes. */
export function safeNext(raw: string | null | undefined, fallback = "/offers"): string {
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
  const supported = new Set(["how-it-works", "about", "categories", "faq", "for-shops", "pickup-policy", "contact", "terms", "privacy", "login", "register", "account", "offers"]);
  if (parts[0] === "merchant" && parts.length >= 2 && ["apply", "dashboard", "offers"].includes(parts[1])) {
    return localePath(locale, `/${parts.join("/")}`);
  }
  if (parts[0] === "offers" && parts.length <= 2) {
    return localePath(locale, `/${parts.join("/")}`);
  }
  if (parts[0] === "register" && parts.length === 2 && parts[1] === "merchant") {
    return localePath(locale, "/register/merchant");
  }
  if (parts.length > 1 || (parts.length === 1 && !supported.has(parts[0]))) return localePath(locale, "/");
  return localePath(locale, withoutPrefix);
}

/** Merchant workspace pages (/merchant/..., /en|ar/merchant/...) get a focused shell without the marketing navigation or footer. */
export function isMerchantWorkspacePath(pathname: string): boolean {
  return /^\/(?:(?:en|ar)\/)?merchant(?:\/|$)/.test(pathname);
}

export function isCustomerAccountPath(pathname: string): boolean {
  return /^\/(?:(?:en|ar)\/)?account\/?$/.test(pathname);
}

/**
 * Signed-in customers use the customer app shell instead of the public marketing shell.
 * Merchant and admin workspaces keep their own navigation.
 */
export function shouldUseCustomerWorkspace(pathname: string, roles: readonly string[]): boolean {
  if (!roles.includes("CUSTOMER") || roles.includes("MERCHANT") || roles.includes("ADMIN")) return false;
  if (isMerchantWorkspacePath(pathname)) return false;
  if (/^\/(?:(?:en|ar)\/)?(?:login|register(?:\/merchant)?|forgot-password|reset-password|verify-email)\/?$/.test(pathname)) return false;
  return true;
}

export function defaultSignedInPath(locale: SiteLocale, roles: readonly string[]): string {
  if (roles.includes("MERCHANT")) return localePath(locale, "/merchant/dashboard");
  if (roles.includes("CUSTOMER")) return localePath(locale, "/offers");
  return localePath(locale, "/account");
}
