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
/** Root-level French auth pages are defined in src/app/(auth), not under [locale]. */
export function isCanonicalFrenchAuthPath(pathname: string): boolean {
  return /^\/(?:login|admin\/login|register|forgot-password|reset-password|verify-email)(?:\/|$)/.test(pathname);
}

export function switchLocalePath(pathname: string, locale: SiteLocale): string {
  const withoutPrefix = pathname.replace(localePrefix, "") || "/";
  const parts = withoutPrefix.split("?")[0].split("#")[0].split("/").filter(Boolean);
  const supported = new Set(["how-it-works", "about", "categories", "faq", "for-shops", "pickup-policy", "contact", "terms", "privacy", "login", "register", "forgot-password", "reset-password", "verify-email", "account", "notifications", "offers"]);
  if (parts[0] === "reservations" && parts.length >= 1) return localePath(locale, `/${parts.join("/")}`);
  if (parts[0] === "account" && parts.length === 2 && parts[1] === "notifications") return localePath(locale, "/account/notifications");
  if (parts[0] === "merchant" && parts.length >= 2 && ["apply", "dashboard", "offers", "reservations", "orders", "staff", "sales"].includes(parts[1])) {
    return localePath(locale, `/${parts.join("/")}`);
  }
  if (parts[0] === "admin" && (parts.length === 1 || (parts.length === 2 && ["login", "merchant-review", "offer-moderation", "support-cases", "audit-log"].includes(parts[1])))) {
    return localePath(locale, `/${parts.join("/")}`);
  }
  if (parts[0] === "offers" && parts.length <= 3) return localePath(locale, `/${parts.join("/")}`);
  if (parts[0] === "register" && parts.length === 2 && parts[1] === "merchant") {
    return localePath(locale, "/register/merchant");
  }
  if (parts.length > 1 || (parts.length === 1 && !supported.has(parts[0]))) return localePath(locale, "/");
  return localePath(locale, withoutPrefix);
}
export function isAdminWorkspacePath(pathname: string): boolean {
  return /^\/(?:(?:en|ar)\/)?admin(?:\/(?!login(?:\/|$))|$)/.test(pathname);
}
export function isMerchantWorkspacePath(pathname: string): boolean {
  return /^\/(?:(?:en|ar)\/)?merchant(?:\/|$)/.test(pathname);
}
export function isCustomerAccountPath(pathname: string): boolean {
  return /^\/(?:(?:en|ar)\/)?account\/?$/.test(pathname);
}
export function shouldUseCustomerWorkspace(pathname: string, roles: readonly string[]): boolean {
  if (!roles.includes("CUSTOMER") || roles.some(role => ["MERCHANT", "MERCHANT_OWNER", "MERCHANT_STAFF", "ADMIN", "SUPER_ADMIN", "MODERATOR", "SUPPORT"].includes(role))) return false;
  if (isMerchantWorkspacePath(pathname)) return false;
  if (/^\/(?:(?:en|ar)\/)?(?:login|admin\/login|register(?:\/merchant)?|forgot-password|reset-password|verify-email)\/?$/.test(pathname)) return false;
  return true;
}
export function defaultSignedInPath(locale: SiteLocale, roles: readonly string[]): string {
  if (roles.some(role => ["ADMIN", "SUPER_ADMIN", "MODERATOR", "SUPPORT"].includes(role))) return localePath(locale, "/admin/merchant-review");
  if (roles.some(role => ["MERCHANT", "MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role))) return localePath(locale, "/merchant/dashboard");
  if (roles.includes("CUSTOMER")) return localePath(locale, "/offers");
  return localePath(locale, "/account");
}
