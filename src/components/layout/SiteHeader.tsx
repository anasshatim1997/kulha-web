"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, ClipboardList, LayoutDashboard, MapPin, Package, ScanLine, Search } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { isCustomerAccountPath, isMerchantWorkspacePath, localeFromPath, localePath, shouldUseCustomerWorkspace, switchLocalePath } from "@/lib/navigation";
import { siteCopy, type SiteLocale } from "@/lib/i18n/site-copy";
import { Logo } from "./Logo";
import { api } from "@/lib/api/client";

const localeOptions: { value: SiteLocale; label: string }[] = [
  { value: "ar", label: "AR" }, { value: "fr", label: "FR" }, { value: "en", label: "EN" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { state, signOut } = useSession();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const locale = localeFromPath(pathname) as SiteLocale;
  const copy = siteCopy[locale];
  const links = [
    [copy.nav.customers, localePath(locale, "/offers"), "nav-customer-link"],
    [copy.nav.how, localePath(locale, "/how-it-works"), ""],
    [copy.nav.faq, localePath(locale, "/faq"), ""],
    [copy.nav.shops, localePath(locale, "/for-shops"), "nav-shop-link"],
  ] as const;
  const home = localePath(locale, "/");

  useEffect(() => {
    if (state.status !== "authenticated") { setUnreadNotifications(0); return; }
    let current = true;
    api.get<{ count: number }>("/notifications/unread-count")
      .then(result => { if (current) setUnreadNotifications(result.count); })
      .catch(() => { if (current) setUnreadNotifications(0); });
    return () => { current = false; };
  }, [state.status, pathname]);

  useEffect(() => {
    document.documentElement.lang = copy.localeTag;
    document.documentElement.dir = copy.dir;
  }, [copy.dir, copy.localeTag]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const authenticated = state.status === "authenticated";
  const accountHref = state.status === "authenticated" && state.user.roles.includes("MERCHANT")
    ? localePath(locale, "/merchant/dashboard")
    : localePath(locale, "/account");
  const isAuthPage = /\/(login|register(?:\/merchant)?|forgot-password|reset-password|verify-email)\/?$/.test(pathname);
  const isWorkspace = isMerchantWorkspacePath(pathname);
  const isMerchant = state.status === "authenticated" && state.user.roles.includes("MERCHANT");
  const isCustomerWorkspace = state.status === "authenticated"
    ? shouldUseCustomerWorkspace(pathname, state.user.roles)
    : isCustomerAccountPath(pathname);
  const isHomePath = /^\/(?:en|ar)?\/?$/.test(pathname);

  useEffect(() => {
    if (state.status === "authenticated" && state.user.roles.includes("CUSTOMER") && !state.user.roles.includes("MERCHANT") && !state.user.roles.includes("ADMIN") && isHomePath) {
      router.replace(localePath(locale, "/offers"));
    }
  }, [isHomePath, locale, router, state]);

  if (isCustomerWorkspace && !isAuthPage && !isWorkspace) {
    const discoverHref = localePath(locale, "/offers");
    const mapHref = localePath(locale, "/offers/map");
    const reservationsHref = localePath(locale, "/reservations");
    const customerAccountHref = localePath(locale, "/account");
    const notificationsHref = localePath(locale, "/notifications");
    const onNotifications = /^\/(?:(?:en|ar)\/)?notifications(?:\/|$)/.test(pathname);
    const onMap = /^\/(?:(?:en|ar)\/)?offers\/map(?:\/|$)/.test(pathname);
    const onReservations = /^\/(?:(?:en|ar)\/)?reservations(?:\/|$)/.test(pathname);
    const onOffers = /^\/(?:(?:en|ar)\/)?offers(?:\/|$)/.test(pathname) && !onMap;
    const onAccount = isCustomerAccountPath(pathname);
    const profileInitial = state.status === "authenticated"
      ? (state.user.fullName?.trim().slice(0, 1) || state.user.email.slice(0, 1)).toLocaleUpperCase(locale)
      : "?";
    const labels = {
      map: locale === "ar" ? "الخريطة" : locale === "en" ? "Map" : "Carte",
      reservations: locale === "ar" ? "حجوزاتي" : locale === "en" ? "My reservations" : "Mes réservations",
      profile: locale === "ar" ? "ملفي" : locale === "en" ? "Profile" : "Mon profil",
      notifications: locale === "ar" ? "الإشعارات" : locale === "en" ? "Notifications" : "Notifications",
    };
    const switchLanguage = (value: SiteLocale) => {
      window.dispatchEvent(new Event("kulha:navigation-start"));
      router.push(switchLocalePath(pathname, value));
    };
    return (
      <>
        <header className="site-header site-header-workspace site-header-customer" dir={copy.dir}>
          <div className="nav-shell">
            <Link href={discoverHref} aria-label="Kulha! — discover baskets" className="brand-link"><Logo /></Link>
            <nav className="workspace-nav" aria-label={locale === "ar" ? "مساحة الزبون" : locale === "en" ? "Customer navigation" : "Navigation client"}>
              <Link href={discoverHref} aria-current={onOffers ? "page" : undefined}><span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${onOffers ? "text-[#fdbe2e]" : "text-[#d94831]"}`} aria-hidden="true"><Search size={19} strokeWidth={2.15} /></span>{copy.nav.discover}</Link>
              <Link href={mapHref} aria-current={onMap ? "page" : undefined}><span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${onMap ? "text-[#fdbe2e]" : "text-[#d94831]"}`} aria-hidden="true"><MapPin size={19} strokeWidth={2.15} /></span>{labels.map}</Link>
              <Link href={reservationsHref} aria-current={onReservations ? "page" : undefined}><span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${onReservations ? "text-[#fdbe2e]" : "text-[#d94831]"}`} aria-hidden="true"><ClipboardList size={19} strokeWidth={2.15} /></span>{labels.reservations}</Link>
            </nav>
            <div className="workspace-actions">
              <label className="language-select-label">
                <span className="sr-only">{copy.nav.language}</span>
                <select aria-label={copy.nav.language} value={locale} onChange={(event) => switchLanguage(event.target.value as SiteLocale)}>
                  {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <Link href={notificationsHref} aria-label={labels.notifications} title={labels.notifications} aria-current={onNotifications ? "page" : undefined} className="customer-notification-link">
                <Bell size={20} strokeWidth={2.1} />
                {unreadNotifications > 0 && <span className="customer-notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
              </Link>
              <Link href={customerAccountHref} aria-label={labels.profile} title={labels.profile}
                aria-current={onAccount ? "page" : undefined}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7dac4] bg-[#fdbe2e] text-sm font-black text-[#073324]">
                {profileInitial}
              </Link>
            </div>
          </div>
        </header>
        <nav className="customer-mobile-tabs" aria-label={locale === "ar" ? "التنقل" : locale === "en" ? "App navigation" : "Navigation de l’application"} dir={copy.dir}>
          <Link href={discoverHref} aria-current={onOffers ? "page" : undefined}><span className="inline-flex h-6 w-6 items-center justify-center" aria-hidden="true"><Search size={21} strokeWidth={2.1} /></span><small>{copy.nav.discover}</small></Link>
          <Link href={mapHref} aria-current={onMap ? "page" : undefined}><span className="inline-flex h-6 w-6 items-center justify-center" aria-hidden="true"><MapPin size={21} strokeWidth={2.1} /></span><small>{labels.map}</small></Link>
          <Link href={reservationsHref} aria-current={onReservations ? "page" : undefined}><span className="inline-flex h-6 w-6 items-center justify-center" aria-hidden="true"><ClipboardList size={21} strokeWidth={2.1} /></span><small>{labels.reservations}</small></Link>
        </nav>
      </>
    );
  }

  if (isWorkspace) {
    const workspaceLinks = [
      [locale === "ar" ? "لوحة المتجر" : locale === "en" ? "Dashboard" : "Tableau de bord", localePath(locale, "/merchant/dashboard"), /\/merchant\/(dashboard|apply)\/?$/.test(pathname), LayoutDashboard],
      [locale === "ar" ? "عروضي" : locale === "en" ? "My offers" : "Mes offres", localePath(locale, "/merchant/offers"), /\/merchant\/offers/.test(pathname), Package],
      [locale === "ar" ? "مسح الاستلام" : locale === "en" ? "Pickup scanner" : "Scanner de retrait", localePath(locale, "/merchant/reservations/scan"), /\/merchant\/reservations\/scan/.test(pathname), ScanLine],
    ] as const;
    return (
      <header className="site-header site-header-workspace" dir={copy.dir}>
        <div className="nav-shell">
          <Link href={home} aria-label="Kulha!" className="brand-link"><Logo /></Link>
          {isMerchant && (
            <nav className="workspace-nav" aria-label={locale === "ar" ? "مساحة المتجر" : locale === "en" ? "Shop workspace" : "Espace commerçant"}>
              {workspaceLinks.map(([label, href, active, Icon]) => <Link key={href} href={href} aria-current={active ? "page" : undefined}><span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center ${active ? "text-[#fdbe2e]" : "text-[#d94831]"}`} aria-hidden="true"><Icon size={19} strokeWidth={2.15} /></span>{label}</Link>)}
            </nav>
          )}
          <div className="workspace-actions">
            <label className="language-select-label">
              <span className="sr-only">{copy.nav.language}</span>
              <select aria-label={copy.nav.language} value={locale} onChange={(event) => { window.dispatchEvent(new Event("kulha:navigation-start")); router.push(switchLocalePath(pathname, event.target.value as SiteLocale)); }}>
                {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {authenticated && <button type="button" className="workspace-signout" onClick={() => void signOut()}>{copy.nav.signOut}</button>}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`site-header${isAuthPage ? " site-header-auth" : ""}`} dir={copy.dir}>
      <div className="nav-shell">
        <Link href={home} aria-label="Kulha!" className="brand-link"><Logo /></Link>
        <nav className="desktop-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
          {links.map(([label, href, className]) => <Link key={href} href={href} className={className}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          <label className="language-select-label">
            <span className="sr-only">{copy.nav.language}</span>
            <select aria-label={copy.nav.language} value={locale} onChange={(event) => { window.dispatchEvent(new Event("kulha:navigation-start")); router.push(switchLocalePath(pathname, event.target.value as SiteLocale)); }}>
              {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {authenticated ? <>
            <LinkButton href={accountHref} variant="ghost" className="nav-login">{copy.nav.account}</LinkButton>
            <Button variant="primary" onClick={() => void signOut()} className="nav-cta">{copy.nav.signOut}</Button>
          </> : <>
            <LinkButton href={localePath(locale, "/login")} variant="ghost" className="nav-login">{copy.nav.login}</LinkButton>
            <LinkButton href={localePath(locale, "/register")} variant="accent" className="nav-cta">{copy.nav.signup}</LinkButton>
          </>}
        </div>
        <button className="menu-toggle" type="button" aria-label={open ? copy.nav.closeMenu : copy.nav.openMenu} aria-controls="kulha-mobile-navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span />
        </button>
      </div>
      {open && <div className="mobile-drawer" id="kulha-mobile-navigation" dir={copy.dir}>
        <nav aria-label={locale === "ar" ? "التنقل" : "Navigation"}>
          {links.map(([label, href, className]) => <Link key={href} href={href} className={className} onClick={() => setOpen(false)}>{label}<span aria-hidden="true">↗</span></Link>)}
        </nav>
        <div className="mobile-drawer-actions">
          {authenticated ? <>
            <LinkButton href={accountHref} variant="ghost" className="drawer-login" onClick={() => setOpen(false)}>{copy.nav.account}</LinkButton>
            <Button variant="primary" onClick={() => { setOpen(false); void signOut(); }} className="drawer-cta">{copy.nav.signOut}</Button>
          </> : <>
            <LinkButton href={localePath(locale, "/login")} variant="ghost" className="drawer-login" onClick={() => setOpen(false)}>{copy.nav.login}</LinkButton>
            <LinkButton href={localePath(locale, "/register")} variant="accent" className="drawer-cta" onClick={() => setOpen(false)}>{copy.nav.signup}</LinkButton>
          </>}
        </div>
        <div className="mobile-language-switch" aria-label={copy.nav.language}>
          {localeOptions.map((option) => (
            <button key={option.value} type="button" aria-pressed={locale === option.value} className={locale === option.value ? "is-active" : ""} onClick={() => { setOpen(false); window.dispatchEvent(new Event("kulha:navigation-start")); router.push(switchLocalePath(pathname, option.value)); }}>
              {option.label}
            </button>
          ))}
        </div>
      </div>}
    </header>
  );
}
