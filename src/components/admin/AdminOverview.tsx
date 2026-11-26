"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, LifeBuoy, Store, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminConsole.module.css";

type Page<T> = { items: T[]; total: number; page: number; size: number };
type Offer = { id: string; title: string; shopName: string; city: string; reportedCount: number; allergensStatus: string; status: string; pickupStart: string | null };
type Merchant = { id: string; name: string; businessType: string; city: string; status: string };
type CaseItem = { reference: string; subject: string; priority: string; status: string; merchantName: string | null; updatedAt: string };

export function AdminOverview({ locale }: { locale: SiteLocale }) {
  const [offers, setOffers] = useState<Page<Offer> | null>(null);
  const [merchants, setMerchants] = useState<Page<Merchant> | null>(null);
  const [cases, setCases] = useState<Page<CaseItem> | null>(null);
  const [error, setError] = useState(false);
  const copy = locale === "fr"
    ? { title: "Aujourd’hui chez Kulha!", lead: "Vue opérationnelle de la modération et du support.", offers: "Offres à vérifier", merchants: "Commerces en attente", cases: "Dossiers support ouverts", queue: "À traiter en priorité", recent: "Offres nécessitant une vérification", view: "Tout voir", empty: "Aucun élément à traiter." }
    : locale === "ar"
      ? { title: "اليوم في KULHA!", lead: "نظرة تشغيلية على المراجعة والدعم.", offers: "عروض للمراجعة", merchants: "متاجر قيد الانتظار", cases: "طلبات دعم مفتوحة", queue: "الأكثر إلحاحاً", recent: "عروض تحتاج إلى مراجعة", view: "عرض الكل", empty: "لا توجد عناصر للمراجعة." }
      : { title: "Today at Kulha!", lead: "Operational overview of moderation and support.", offers: "Offers to review", merchants: "Merchants waiting", cases: "Open support cases", queue: "Up next · most urgent first", recent: "Offers needing review", view: "View all", empty: "Nothing needs attention." };

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<Page<Offer>>("/admin/offers?page=0&size=5"),
      api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=1"),
      api.get<Page<CaseItem>>("/admin/support-cases?status=OPEN&page=0&size=5")
    ]).then(([o, m, c]) => {
      if (!active) return;
      setOffers(o); setMerchants(m); setCases(c);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  const flagged = offers?.items.filter(o => o.reportedCount > 0 || o.allergensStatus === "UNKNOWN") ?? [];
  return <div className={styles.adminOverview}>
    <header className={styles.header}><div><h1>{copy.title}</h1><p>{copy.lead}</p></div></header>
    {error && <div className={styles.alert} role="alert">Unable to load operational data. Refresh and try again.</div>}
    <section className={styles.overviewMetrics}>
      <Link href={localePath(locale, "/admin/offer-moderation")}><span><AlertTriangle size={19}/></span><strong>{offers?.total ?? "—"}</strong><b>{copy.offers}</b><ArrowRight size={16}/></Link>
      <Link href={localePath(locale, "/admin/merchant-review")}><span><Store size={19}/></span><strong>{merchants?.total ?? "—"}</strong><b>{copy.merchants}</b><ArrowRight size={16}/></Link>
      <Link href={localePath(locale, "/admin/support-cases")}><span><LifeBuoy size={19}/></span><strong>{cases?.total ?? "—"}</strong><b>{copy.cases}</b><ArrowRight size={16}/></Link>
    </section>
    <section className={styles.overviewQueue}>
      <div className={styles.overviewQueueHead}><h2>{copy.queue}</h2><Link href={localePath(locale, "/admin/offer-moderation")}>{copy.view} <ArrowRight size={14}/></Link></div>
      {flagged.length ? flagged.map(item => <Link className={styles.overviewOffer} key={item.id} href={localePath(locale, "/admin/offer-moderation")}><span className={styles.overviewOfferIcon}><Tag size={17}/></span><span><strong>{item.title}</strong><small>{item.shopName} · {item.city}</small></span><span className={styles.overviewSignal}>{item.reportedCount > 0 ? item.reportedCount + " reports" : "Allergens unknown"}</span></Link>) : <p className={styles.empty}>{copy.empty}</p>}
    </section>
  </div>;
}
