"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "@/components/session/SessionProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { localeFromPath, localePath, switchLocalePath } from "@/lib/navigation";
import { siteCopy, type SiteLocale } from "@/lib/i18n/site-copy";
import { Logo } from "./Logo";

const localeOptions: { value: SiteLocale; label: string }[] = [
  { value: "ar", label: "AR" }, { value: "fr", label: "FR" }, { value: "en", label: "EN" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { state, signOut } = useSession();
  const locale = localeFromPath(pathname) as SiteLocale;
  const copy = siteCopy[locale];
  // Make the two sides of the marketplace visible immediately: customers and shops.
  const links = [
    [copy.nav.customers, localePath(locale, "/categories"), "nav-customer-link"],
    [copy.nav.how, localePath(locale, "/how-it-works"), ""],
    [copy.nav.faq, localePath(locale, "/faq"), ""],
    [copy.nav.shops, localePath(locale, "/for-shops"), "nav-shop-link"],
  ] as const;
  const home = localePath(locale, "/");

  useEffect(() => {
    document.documentElement.lang = copy.localeTag;
    document.documentElement.dir = copy.dir;
  }, [copy.dir, copy.localeTag]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = ""; };
  }, [open]);

  const authenticated = state.status === "authenticated";
  const isAuthPage = /\/(login|register|forgot-password|reset-password|verify-email)\/?$/.test(pathname);
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
            <LinkButton href="/account" variant="ghost" className="nav-login">{locale === "ar" ? "حسابي" : locale === "en" ? "My account" : "Mon compte"}</LinkButton>
            <Button variant="primary" onClick={() => void signOut()} className="nav-cta">{locale === "ar" ? "تسجيل الخروج" : locale === "en" ? "Sign out" : "Déconnexion"}</Button>
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
            <LinkButton href="/account" variant="ghost" className="drawer-login">{locale === "en" ? "My account" : locale === "ar" ? "حسابي" : "Mon compte"}</LinkButton>
            <Button variant="primary" onClick={() => { setOpen(false); void signOut(); }} className="drawer-cta">{locale === "en" ? "Sign out" : locale === "ar" ? "تسجيل الخروج" : "Déconnexion"}</Button>
          </> : <>
            <LinkButton href={localePath(locale, "/login")} variant="ghost" className="drawer-login">{copy.nav.login}</LinkButton>
            <LinkButton href={localePath(locale, "/register")} variant="accent" className="drawer-cta">{copy.nav.signup}</LinkButton>
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
