"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminTopNav.module.css";

const labels={fr:["Aujourd’hui","Commerces","Offres","Support","Journal"],en:["Overview","Merchants","Offers","Support","Audit"],ar:["نظرة عامة","المتاجر","العروض","الدعم","التدقيق"]};
const routes=["/admin","/admin/merchant-review","/admin/offer-moderation","/admin/support-cases","/admin/audit-log"];

export function AdminTopNav({locale}:{locale:SiteLocale}) {
 const pathname=usePathname();const names=labels[locale];
 return <nav className={styles.nav} dir={locale==="ar"?"rtl":"ltr"} aria-label="Admin navigation">
  <Link className={styles.brand} href={localePath(locale,"/admin")}><span>KULHA</span><i>!</i></Link>
  <div className={styles.links}>{routes.map((route,i)=>{const active=i===0?pathname===localePath(locale,route):pathname.startsWith(localePath(locale,route));return <Link key={route} href={localePath(locale,route)} className={active?styles.active:styles.link}>{names[i]}</Link>})}</div>
  <div className={styles.right}><Link href={localePath(locale,"/")} className={styles.back}>KULHA ↗</Link></div>
 </nav>
}
