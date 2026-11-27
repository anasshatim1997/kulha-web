"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminTopNav.module.css";

const labels={fr:["Aujourd’hui","Commerces","Offres","Support","Journal"],en:["Overview","Merchants","Offers","Support","Audit"],ar:["نظرة عامة","المتاجر","العروض","الدعم","التدقيق"]};
const routes=["/admin","/admin/merchant-review","/admin/offer-moderation","/admin/support-cases","/admin/audit-log"];
const languageNames={fr:"FR",en:"EN",ar:"ع"};

export function AdminTopNav({locale}:{locale:SiteLocale}) {
 const pathname=usePathname();const names=labels[locale];
 return <nav className={styles.nav} dir={locale==="ar"?"rtl":"ltr"} aria-label="Admin navigation">
  <Link className={styles.brand} href={localePath(locale,"/admin")} aria-label="KULHA admin"><span>KULHA</span><i>!</i></Link>
  <div className={styles.links}>{routes.map((route,i)=>{const active=i===0?pathname===localePath(locale,route):pathname.startsWith(localePath(locale,route));return <Link key={route} href={localePath(locale,route)} className={active?styles.active:styles.link}>{names[i]}</Link>})}</div>
  <div className={styles.tools}>
   <div className={styles.languages} aria-label="Languages">{(["fr","en","ar"] as const).map(l=><Link key={l} href={localePath(l,pathname.replace(/^\\/(fr|en|ar)/,"")||"/")} className={l===locale?styles.languageActive:styles.language}>{languageNames[l]}</Link>)}</div>
   <Link href={localePath(locale,"/")} className={styles.exit}>{locale==="fr"?"Site public":locale==="ar"?"الموقع العام":"Public site"} <span>↗</span></Link>
  </div>
 </nav>
}
