"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, ClipboardList, FileText, Flag, LayoutDashboard, LogOut, MapPin, QrCode, Search, Store, Tag, Users } from "lucide-react";
import { useSession } from "@/components/session/SessionProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { isAdminWorkspacePath, isCustomerAccountPath, isMerchantWorkspacePath, localeFromPath, localePath, shouldUseCustomerWorkspace, switchLocalePath } from "@/lib/navigation";
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
    if (state.status !== "authenticated") return;
    let current = true;
    const refreshUnread = () => {
      api.get<{ count: number }>("/notifications/unread-count")
        .then(result => { if (current) setUnreadNotifications(result.count); })
        .catch(() => { if (current) setUnreadNotifications(0); });
    };
    refreshUnread();
    window.addEventListener("kulha:notifications-updated", refreshUnread);
    return () => {
      current = false;
      window.removeEventListener("kulha:notifications-updated", refreshUnread);
    };
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
  const accountHref = state.status === "authenticated" && state.user.roles.some(role => ["MERCHANT", "MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role))
    ? localePath(locale, "/merchant/dashboard")
    : localePath(locale, "/account");
  const isAuthPage = /\/(?:login|admin\/login|register(?:\/merchant)?|forgot-password|reset-password|verify-email)\/?$/.test(pathname);
  const isWorkspace = isMerchantWorkspacePath(pathname);
  const isAdminWorkspace = isAdminWorkspacePath(pathname);
  const isMerchant = state.status === "authenticated" && state.user.roles.some(role => ["MERCHANT", "MERCHANT_OWNER", "MERCHANT_STAFF"].includes(role));
  const isMerchantOwner = state.status === "authenticated" && state.user.roles.some(role => ["MERCHANT", "MERCHANT_OWNER"].includes(role));
  const isCustomerMarketplacePath = /^\/(?:(?:en|ar)\/)?(?:offers(?:\/map)?|reservations|notifications|account)(?:\/|$)/.test(pathname);
  const isCustomerWorkspace = !isAuthPage && !isWorkspace && !isAdminWorkspace && (isCustomerMarketplacePath || (state.status === "authenticated" && shouldUseCustomerWorkspace(pathname, state.user.roles)));
  const isHomePath = /^\/(?:en|ar)?\/?$/.test(pathname);

  useEffect(() => {
    if (state.status === "authenticated" && state.user.roles.includes("CUSTOMER") && !state.user.roles.includes("MERCHANT") && !state.user.roles.includes("ADMIN") && isHomePath) {
      router.replace(localePath(locale, "/offers"));
    }
  }, [isHomePath, locale, router, state]);

  // Safety net: if a route change leaves a stale scroll lock on <body> (loader or modal that never
  // released it), clear it once nothing that legitimately needs the lock is on screen.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (open) return;
      if (document.body.style.overflow === "hidden" && !document.querySelector('[role="dialog"], [aria-modal="true"], [data-scroll-lock]')) {
        document.body.style.overflow = "";
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [pathname, open]);

  // Sidebar badges and shop identity for the admin / merchant workspaces.
  const [shellInfo, setShellInfo] = useState<{ shopName: string; city: string; toCollect: number; pendingMerchants: number; openCases: number }>({ shopName: "", city: "", toCollect: 0, pendingMerchants: 0, openCases: 0 });
  useEffect(() => {
    if (state.status !== "authenticated") return;
    let current = true;
    if (isAdminWorkspace) {
      Promise.allSettled([
        api.get<{ total: number }>("/admin/merchants?status=PENDING&page=0&size=1"),
        api.get<{ total: number }>("/admin/support-cases?status=OPEN&page=0&size=1"),
      ]).then(([merchants, cases]) => {
        if (!current) return;
        setShellInfo(prev => ({ ...prev, pendingMerchants: merchants.status === "fulfilled" ? merchants.value.total : 0, openCases: cases.status === "fulfilled" ? cases.value.total : 0 }));
      });
    } else if (isWorkspace && isMerchant) {
      api.get<{ shopName?: string; city?: string; toCollectNow?: number }>("/merchants/me/workspace")
        .then(data => { if (current) setShellInfo(prev => ({ ...prev, shopName: data.shopName ?? "", city: data.city ?? "", toCollect: data.toCollectNow ?? 0 })); })
        .catch(() => undefined);
    }
    return () => { current = false; };
  }, [state.status, isAdminWorkspace, isWorkspace, isMerchant, pathname]);

  if (/\/admin\/login\/?$/.test(pathname)) return null;

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
                {state.status === "authenticated" && unreadNotifications > 0 && <span className="customer-notification-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
              </Link>
              <Link href={customerAccountHref} aria-label={labels.profile} title={labels.profile}
                aria-current={onAccount ? "page" : undefined}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e7dac4] bg-[#fdbe2e] text-sm font-black text-[#073324]">
                {profileInitial}
              </Link>
            </div>
          </div>
        </header>

      </>
    );
  }

  if (isAdminWorkspace || isWorkspace) {
    const l = (ar: string, en: string, fr: string) => (locale === "ar" ? ar : locale === "en" ? en : fr);
    const user = state.status === "authenticated" ? state.user : null;
    const displayName = user ? (user.fullName?.trim() || user.email) : "";
    const initial = displayName ? displayName.slice(0, 1).toLocaleUpperCase(locale) : "?";
    const roles = user?.roles ?? [];
    const roleLabel = roles.includes("SUPER_ADMIN") ? l("مشرف عام", "Super admin", "Super admin")
      : roles.includes("MODERATOR") ? l("مشرف", "Moderator", "Modérateur")
      : roles.includes("SUPPORT") ? l("الدعم", "Support", "Support")
      : l("مدير", "Admin", "Administrateur");
    type WsLink = readonly [string, string, boolean, typeof Store, number];
    const canAdmin = roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
    const adminHomeHref = canAdmin
      ? localePath(locale, "/admin")
      : roles.includes("SUPPORT")
        ? localePath(locale, "/admin/support-cases")
        : localePath(locale, "/offers");
    const adminLinks: WsLink[] = canAdmin ? [
      [l("لوحة الإدارة", "Overview", "Vue d’ensemble"), localePath(locale, "/admin"), pathname === localePath(locale, "/admin"), LayoutDashboard, 0],
      [l("مراقبة العروض", "Offers", "Offres"), localePath(locale, "/admin/offer-moderation"), /\/admin\/offer-moderation(?:\/|$)/.test(pathname), Tag, 0],
      [l("مراجعة المتاجر", "Merchants", "Commerces"), localePath(locale, "/admin/merchant-review"), /\/admin\/merchant-review(?:\/|$)/.test(pathname), Store, shellInfo.pendingMerchants],
      [l("حالات الدعم", "Support", "Support"), localePath(locale, "/admin/support-cases"), /\/admin\/support-cases(?:\/|$)/.test(pathname), Flag, shellInfo.openCases],
      [l("سجل التدقيق", "Audit log", "Journal d’audit"), localePath(locale, "/admin/audit-log"), /\/admin\/audit-log(?:\/|$)/.test(pathname), FileText, 0],
    ] : roles.includes("SUPPORT") ? [
      [l("حالات الدعم", "Support", "Support"), localePath(locale, "/admin/support-cases"), /\/admin\/support-cases(?:\/|$)/.test(pathname), Flag, shellInfo.openCases],
    ] : [];
    const merchantLinks: WsLink[] = [
      [l("لوحة المتجر", "Dashboard", "Tableau de bord"), localePath(locale, "/merchant/dashboard"), /\/merchant\/(dashboard|apply)\/?$/.test(pathname), LayoutDashboard, 0],
      [l("الطلبات", "Orders", "Commandes"), localePath(locale, "/merchant/orders"), /\/merchant\/orders(?:\/|$)/.test(pathname), ClipboardList, shellInfo.toCollect],
      [l("عروضي", "Offers", "Offres"), localePath(locale, "/merchant/offers"), /\/merchant\/offers/.test(pathname), Tag, 0],
      [l("مسح الاستلام", "Pickup", "Retrait"), localePath(locale, "/merchant/reservations/scan"), /\/merchant\/reservations\/scan/.test(pathname), QrCode, 0],
      ...(isMerchantOwner ? [
        [l("الفريق", "Staff", "Équipe"), localePath(locale, "/merchant/staff"), /\/merchant\/staff(?:\/|$)/.test(pathname), Users, 0] as WsLink,
        [l("المبيعات", "Sales", "Ventes"), localePath(locale, "/merchant/sales"), /\/merchant\/sales(?:\/|$)/.test(pathname), BarChart3, 0] as WsLink,
      ] : []),
    ];
    const links: WsLink[] = isAdminWorkspace ? adminLinks : merchantLinks;
    const switchLanguage = (value: SiteLocale) => {
      window.dispatchEvent(new Event("kulha:navigation-start"));
      router.push(switchLocalePath(pathname, value));
    };
    const notificationsHref = localePath(locale, "/notifications");
    return (
      <>
        <aside className={`ws-sidebar ${isAdminWorkspace ? "ws-sidebar-admin" : "ws-sidebar-merchant"}`} dir={copy.dir}>
          <Link href={isAdminWorkspace ? adminHomeHref : localePath(locale, "/merchant/dashboard")} aria-label="Kulha!" className="ws-brand">
            <span className="ws-brand-word">KULHA<span>!</span></span>
            <small>{isAdminWorkspace ? "ADMIN" : "SHOP SPACE"}</small>
          </Link>
          {isWorkspace && isMerchant && shellInfo.shopName && (
            <div className="ws-shop-card">
              <span className="ws-shop-avatar" aria-hidden="true">{shellInfo.shopName.slice(0, 1).toLocaleUpperCase(locale)}</span>
              <span className="ws-shop-text"><strong>{shellInfo.shopName}</strong>{shellInfo.city && <small>{shellInfo.city}</small>}</span>
            </div>
          )}
          {(isAdminWorkspace || isMerchant) && (
            <nav className="ws-nav" aria-label={isAdminWorkspace ? l("مساحة الإدارة", "Admin navigation", "Navigation administration") : l("مساحة المتجر", "Shop workspace", "Espace commerçant")}>
              {links.map(([label, href, active, Icon, count]) => (
                <Link key={href} href={href} aria-current={active ? "page" : undefined} className="ws-nav-link">
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                  <span className="ws-nav-label">{label}</span>
                  {count > 0 && <span className="ws-badge" aria-label={String(count)}>{count > 99 ? "99+" : count}</span>}
                </Link>
              ))}
            </nav>
          )}
          <div className="ws-sidebar-foot">
            {isWorkspace && isMerchant && (
              <p className="ws-note"><strong>{l("متجر معتمد", "Approved shop", "Commerce approuvé")}</strong>{l("يمكنك نشر العروض واستقبال الحجوزات.", "You can publish offers and receive reservations.", "Vous pouvez publier des offres et recevoir des réservations.")}</p>
            )}
          </div>
        </aside>
        {(isAdminWorkspace || isWorkspace) && (
          <div className="ws-topbar" dir={copy.dir}>
            {!isAdminWorkspace && <Link href={notificationsHref} className="ws-bell" aria-label={l("الإشعارات", "Notifications", "Notifications")} title={l("الإشعارات", "Notifications", "Notifications")}>
              <Bell size={18} strokeWidth={2} />
              {unreadNotifications > 0 && <span className="ws-bell-count">{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
            </Link>}
            <div className="ws-top-user"><span className="ws-avatar" aria-hidden="true">{initial}</span><span className="ws-top-identity"><strong>{displayName}</strong><small>{isAdminWorkspace ? roleLabel : shellInfo.shopName || l("مساحة المتجر", "Merchant", "Espace commerçant")}</small></span></div>
            <label className="ws-top-lang"><span className="sr-only">{copy.nav.language}</span><select aria-label={copy.nav.language} value={locale} onChange={(event) => switchLanguage(event.target.value as SiteLocale)}>{localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            {authenticated && <button type="button" className="ws-top-signout" onClick={() => void signOut()}><LogOut size={16} strokeWidth={1.9} aria-hidden="true" />{copy.nav.signOut}</button>}
          </div>
        )}
      </>
    );
  }

  if (isCustomerWorkspace) {
    const discoverLabel = locale === "ar" ? "اكتشف" : locale === "en" ? "Discover" : "Découvrir";
    const profileLabel = locale === "ar" ? "ملفي الشخصي" : locale === "en" ? "My profile" : "Mon profil";
    return (
      <header className="site-header site-header-customer" dir={copy.dir}>
        <div className="nav-shell">
          <Link href={home} aria-label="Kulha!" className="brand-link"><Logo /></Link>
          <nav className="desktop-nav" aria-label={locale === "ar" ? "تنقل العملاء" : locale === "en" ? "Customer navigation" : "Navigation client"}>
            <Link href={localePath(locale, "/offers")}>{discoverLabel}</Link>
          </nav>
          <div className="nav-actions">
            <label className="language-select-label">
              <span className="sr-only">{copy.nav.language}</span>
              <select aria-label={copy.nav.language} value={locale} onChange={(event) => { window.dispatchEvent(new Event("kulha:navigation-start")); router.push(switchLocalePath(pathname, event.target.value as SiteLocale)); }}>
                {localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <LinkButton href={localePath(locale, "/account")} variant="ghost" className="nav-login">{profileLabel}</LinkButton>
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
