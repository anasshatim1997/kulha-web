"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminTopNav.module.css";

const labels={fr:["Aujourd’hui","Commerces","Offres","Support","Journal"],en:["Overview","Merchants","Offers","Support","Audit"],ar:["نظرة عامة","المتاجر","العروض","الدعم","التدقيق"]};
const routes=["/admin","/admin/merchant-review","/admin/offer-moderation","/admin/support-cases","/admin/audit-log"];
const languageNames={fr:"FR",en:"EN",ar:"ع"};
const searchPlaceholder={fr:"Rechercher dans l’admin…",en:"Search admin…",ar:"بحث في الإدارة…"};
function removeLocalePrefix(pathname:string){for(const prefix of ["/fr","/en","/ar"]){if(pathname===prefix)return "/";if(pathname.startsWith(prefix+"/"))return pathname.slice(prefix.length);}return pathname;}

export function AdminTopNav({locale}:{locale:SiteLocale}) {
 const pathname=usePathname();const router=useRouter();const names=labels[locale];const [query,setQuery]=useState("");
 const matches=useMemo(()=>routes.map((route,i)=>({route,label:names[i]})).filter(item=>!query.trim()||item.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[query,names]);
 function submitSearch(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(matches[0])router.push(localePath(locale,matches[0].route));setQuery("");}
 return <nav className={styles.nav} dir={locale==="ar"?"rtl":"ltr"} aria-label="Admin navigation">
  <Link className={styles.brand} href={localePath(locale,"/admin")} aria-label="KULHA admin"><span>KULHA</span><i>!</i></Link>
  <div className={styles.links}>{routes.map((route,i)=>{const active=i===0?pathname===localePath(locale,route):pathname.startsWith(localePath(locale,route));return <Link key={route} href={localePath(locale,route)} className={active?styles.active:styles.link}>{names[i]}</Link>})}</div>
  <form className={styles.navSearch} onSubmit={submitSearch} role="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={searchPlaceholder[locale]} aria-label={searchPlaceholder[locale]}/><button type="submit" aria-label={locale==="fr"?"Rechercher":locale==="ar"?"بحث":"Search"}>↵</button></form>
  <div className={styles.tools}>
   <div className={styles.languages} aria-label="Languages">{(["fr","en","ar"] as const).map(l=><Link key={l} href={localePath(l,removeLocalePrefix(pathname)||"/")} className={l===locale?styles.languageActive:styles.language}>{languageNames[l]}</Link>)}</div>
   <Link href={localePath(locale,"/")} className={styles.exit}>{locale==="fr"?"Site public":locale==="ar"?"الموقع العام":"Public site"} <span>↗</span></Link>
  </div>
 </nav>
