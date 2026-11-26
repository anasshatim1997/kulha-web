"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Clock3, FileText, LifeBuoy, RefreshCw, Store, Tag, XCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminConsole.module.css";

type Page<T> = { items: T[]; total: number; page: number; size: number };
type Offer = { id: string; title: string; shopName: string; city: string; reportedCount: number; allergensStatus: string; status: string; pickupStart: string | null };
type Merchant = { id: string; name: string; businessType: string; city: string; status: string; createdAt: string };
type CaseItem = { reference: string; subject: string; priority: string; status: string; merchantName: string | null; updatedAt: string };
type AuditRow = { id: string; actorName: string; action: string; targetType: string; targetId: string; result: string; createdAt: string };
type Snapshot = { offers: Page<Offer>; merchants: Page<Merchant>; cases: Page<CaseItem>; audit: Page<AuditRow> };

export function AdminOverview({ locale }: { locale: SiteLocale }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const [reload, setReload] = useState(0);
  const copy = locale === "fr"
    ? { title: "Aujourd’hui chez Kulha!", lead: "Vue opérationnelle de la modération et du support.", offers: "Offres à vérifier", merchants: "Commerces en attente", cases: "Dossiers support ouverts", queue: "À traiter en priorité", recent: "Activité récente", view: "Tout voir", empty: "Aucun élément à traiter.", refresh: "Actualiser", live: "En direct", reported: "signalements", unknown: "Allergènes inconnus", pending: "En attente", high: "Élevée", medium: "Moyenne", low: "Faible", systems: "Systèmes", documents: "Documents non connectés", docsHelp: "Les fichiers ne peuvent pas être vérifiés tant que le backend ne les fournit pas.", noActivity: "Aucune activité récente.", updated: "Actualisé", failed: "Échec du chargement des données opérationnelles." }
    : locale === "ar"
      ? { title: "اليوم في KULHA!", lead: "نظرة تشغيلية على المراجعة والدعم.", offers: "عروض للمراجعة", merchants: "متاجر قيد الانتظار", cases: "طلبات دعم مفتوحة", queue: "الأكثر إلحاحاً", recent: "النشاط الأخير", view: "عرض الكل", empty: "لا توجد عناصر للمراجعة.", refresh: "تحديث", live: "مباشر", reported: "بلاغات", unknown: "مسببات الحساسية غير معروفة", pending: "قيد الانتظار", high: "مرتفع", medium: "متوسط", low: "منخفض", systems: "الأنظمة", documents: "الوثائق غير متصلة", docsHelp: "لا يمكن التحقق من الملفات حتى يوفرها الخادم.", noActivity: "لا يوجد نشاط حديث.", updated: "تم التحديث", failed: "تعذر تحميل بيانات العمليات." }
      : { title: "Today at Kulha!", lead: "Operational overview of moderation and support.", offers: "Food-safety offers", merchants: "Merchants waiting", cases: "Open support cases", queue: "Up next · most urgent first", recent: "Recent activity", view: "View all", empty: "Nothing needs attention.", refresh: "Refresh", live: "Live", reported: "reports", unknown: "Allergens unknown", pending: "Pending", high: "High", medium: "Medium", low: "Low", systems: "Systems", documents: "Documents not connected", docsHelp: "Files cannot be verified until the backend serves them.", noActivity: "No recent activity.", updated: "Refreshed", failed: "Could not load operational data." };

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      const [offers, merchants, cases, audit] = await Promise.all([
        api.get<Page<Offer>>("/admin/offers?page=0&size=8"),
        api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=4"),
        api.get<Page<CaseItem>>("/admin/support-cases?status=OPEN&page=0&size=4"),
        api.get<Page<AuditRow>>("/admin/audit-log?page=0&size=4")
      ]);
      setSnapshot({ offers, merchants, cases, audit });
      setRefreshedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load, reload]);

  const flagged = (snapshot?.offers.items ?? [])
    .filter(item => item.reportedCount > 0 || item.allergensStatus === "UNKNOWN")
    .sort((a, b) => b.reportedCount - a.reportedCount);
  const openCases = [...(snapshot?.cases.items ?? [])].sort((a, b) => ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[a.priority as "HIGH" | "MEDIUM" | "LOW"] ?? 3) - ({ HIGH: 0, MEDIUM: 1, LOW: 2 }[b.priority as "HIGH" | "MEDIUM" | "LOW"] ?? 3));
  const waitingMerchants = snapshot?.merchants.items ?? [];
  const auditRows = snapshot?.audit.items ?? [];
  const priorityLabel = (priority: string) => priority === "HIGH" ? copy.high : priority === "MEDIUM" ? copy.medium : copy.low;
  const timeLabel = (value: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA", { timeZone: "Africa/Casablanca", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  const actionLabel = (value: string) => value.split(/[._-]+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");

  return <div className={styles.shell+" kulhaAdminShell"} data-page="overview" dir={locale==="ar"?"rtl":"ltr"}>
    <main className={styles.page}>
  <div className={styles.adminOverview}>
    <header className={styles.header}>
      <div><h1>{copy.title}</h1><p>{copy.lead}{refreshedAt ? " · "+copy.updated+" "+timeLabel(refreshedAt.toISOString()) : ""}</p></div>
      <div className={styles.overviewLive}><span><i/>{copy.live}</span><button type="button" disabled={refreshing} onClick={()=>setReload(value=>value+1)}><RefreshCw size={15} className={refreshing?styles.overviewSpin:""}/>{copy.refresh}</button></div>
    </header>
    {error && <div className={styles.alert} role="alert">{copy.failed}<button type="button" onClick={()=>setReload(value=>value+1)}>{copy.refresh}</button></div>}
    <section className={styles.overviewMetrics}>
      <Link href={localePath(locale, "/admin/offer-moderation")}><span><AlertTriangle size={19}/></span><strong>{snapshot ? flagged.length : "—"}</strong><b>{copy.offers}</b><small>{snapshot?flagged.filter(item=>item.reportedCount>0).length+" "+copy.reported+" · "+flagged.filter(item=>item.allergensStatus==="UNKNOWN").length+" "+copy.unknown:""}</small><ArrowRight size={16}/></Link>
      <Link href={localePath(locale, "/admin/merchant-review")}><span><Store size={19}/></span><strong>{snapshot?.merchants.total ?? "—"}</strong><b>{copy.merchants}</b><small>{copy.pending}</small><ArrowRight size={16}/></Link>
      <Link href={localePath(locale, "/admin/support-cases")}><span><LifeBuoy size={19}/></span><strong>{snapshot?.cases.total ?? "—"}</strong><b>{copy.cases}</b><small>{snapshot?openCases.filter(item=>item.priority==="HIGH").length+" "+copy.high+" · "+openCases.filter(item=>item.priority==="MEDIUM").length+" "+copy.medium+" · "+openCases.filter(item=>item.priority==="LOW").length+" "+copy.low:""}</small><ArrowRight size={16}/></Link>
    </section>
    <div className={styles.overviewColumns}>
      <section className={styles.overviewQueue}>
        <div className={styles.overviewQueueHead}><h2>{copy.queue}</h2><Link href={localePath(locale, "/admin/offer-moderation")}>{copy.view} <ArrowRight size={14}/></Link></div>
        {flagged.slice(0,3).map(item => <Link className={styles.overviewOffer} key={item.id} href={localePath(locale, "/admin/offer-moderation")}><span className={styles.overviewOfferIcon}><Tag size={17}/></span><span><strong>{item.title}</strong><small>{item.shopName} · {item.city}{item.pickupStart ? " · "+timeLabel(item.pickupStart) : ""}</small></span><span className={styles.overviewSignal}>{item.reportedCount > 0 ? item.reportedCount+" "+copy.reported : copy.unknown}</span></Link>)}
        {openCases.slice(0,1).map(item=><Link className={styles.overviewOffer} key={item.reference} href={localePath(locale,"/admin/support-cases")}><span className={styles.overviewOfferIcon}><LifeBuoy size={17}/></span><span><strong>{item.reference} · {item.subject}</strong><small>{item.merchantName||"—"}</small></span><span className={styles.overviewSignal}>{priorityLabel(item.priority)}</span></Link>)}
        {waitingMerchants.slice(0,2).map(item=><Link className={styles.overviewOffer} key={item.id} href={localePath(locale,"/admin/merchant-review")}><span className={styles.overviewOfferIcon}><Store size={17}/></span><span><strong>{item.name}</strong><small>{item.businessType} · {item.city}</small></span><span className={styles.overviewPending}>{copy.pending}</span></Link>)}
        {snapshot&&flagged.length===0&&openCases.length===0&&waitingMerchants.length===0&&<p className={styles.empty}>{copy.empty}</p>}
      </section>
      <div className={styles.overviewSide}>
        <section className={styles.overviewQueue}>
          <div className={styles.overviewQueueHead}><h2>{copy.recent}</h2><Link href={localePath(locale,"/admin/audit-log")}>{copy.view} <ArrowRight size={14}/></Link></div>
          {auditRows.length?auditRows.map(item=><article className={styles.overviewActivity} key={item.id}><span className={styles.overviewActivityIcon}><Clock3 size={15}/></span><span><strong>{actionLabel(item.action)}</strong><small>{item.actorName} · {timeLabel(item.createdAt)}</small></span><em className={item.result==="SUCCESS"?styles.overviewSuccess:styles.overviewFailure}>{item.result==="SUCCESS"?<Check size={13}/>:<XCircle size={13}/>}</em></article>):<p className={styles.empty}>{snapshot?copy.noActivity:"—"}</p>}
        </section>
        <section className={styles.overviewSystems}>
          <h2>{copy.systems}</h2>
          <p><Check size={14}/><span>Offers</span><strong>✓</strong></p>
          <p><Check size={14}/><span>Audit</span><strong>✓</strong></p>
          <p><Check size={14}/><span>Support</span><strong>✓</strong></p>
          <div><FileText size={17}/><span><strong>{copy.documents}</strong><small>{copy.docsHelp}</small></span></div>
        </section>
      </div>
    </div>
  </div>
    </main>
  </div>;
}
