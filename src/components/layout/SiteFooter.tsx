"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isMerchantWorkspacePath, localeFromPath, localePath } from "@/lib/navigation";
import { siteCopy, type SiteLocale } from "@/lib/i18n/site-copy";
import { Logo } from "./Logo";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname) as SiteLocale;
  const t = siteCopy[locale].footer;
  const isAuthPage = /\/(login|register|forgot-password|reset-password|verify-email)(\/|$)/.test(pathname);
  if (isAuthPage || isMerchantWorkspacePath(pathname)) return null;

  const columns = [
    { title: t.explore, links: [[t.how, "/how-it-works"], [t.categories, "/categories"], [t.shops, "/for-shops"]] },
    { title: t.brand, links: [[t.about, "/about"], [t.pickup, "/pickup-policy"]] },
    { title: t.help, links: [[t.faq, "/faq"], [t.contact, "/contact"]] },
    { title: t.legal, links: [[t.privacy, "/privacy"], [t.terms, "/terms"]] },
  ] as const;

  return (
    <footer className="site-footer" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="footer-top">
        <div className="footer-brand-block">
          <Link href={localePath(locale, "/")} aria-label="Kulha! accueil"><Logo light size={48} /></Link>
          <p>{t.promise}</p>
        </div>
        {columns.map((column) => <div className="footer-col" key={column.title}>
          <h3>{column.title}</h3>
          {column.links.map(([label, href]) => <Link href={localePath(locale, href)} key={href}>{label}</Link>)}
        </div>)}
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} KULHA! · Maroc</span><span>{t.languages}: AR · FR · EN</span></div>
    </footer>
  );
}
