"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, FileText, Flag, RefreshCw, Store, Tag } from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminOverview.module.css";
import redesign from "./AdminOverviewRedesign.module.css";

type Page<T> = { items: T[]; page: number; size: number; total: number };
type Merchant = { id: string; name: string; businessType: string; city: string; ownerEmail: string; status: string; createdAt: string };
type Offer = { id: string; title: string; shopName: string; city: string; status: string; reportedCount: number; allergensStatus: string; priceMinor: number };
type SupportCase = { id: string; reference: string; subject: string; priority: string; status: string; merchantName: string | null; updatedAt: string };
type AuditEntry = { id: string; actorName: string; action: string; targetType: string; targetId: string; reason: string | null; result: string; createdAt: string };
type Snapshot = { merchants: Page<Merchant> | null; infoMerchants: Page<Merchant> | null; offers: Page<Offer> | null; cases: Page<SupportCase> | null; audit: Page<AuditEntry> | null };
const emptySnapshot: Snapshot = { merchants: null, infoMerchants: null, offers: null, cases: null, audit: null };

const copy = {
  en: {
    title:"Today at Kulha!", live:"Live", refresh:"Refresh", syncing:"Refreshing…", refreshed:"refreshed",
    foodSafety:"Food-safety offers", reported:"reported", allergensUnknown:"allergens unknown",
    merchants:"Merchants waiting", pending:"pending", infoRequired:"info required",
    support:"Open support cases", high:"high", medium:"medium", low:"low",
    upNext:"Up next · most urgent first", viewAll:"View all", recent:"Recent activity",
    offers:"Offers", audit:"Audit", noResponse:"no response", documents:"Documents not connected",
    documentsLead:"Can’t verify files until the backend serves them.", review:"Review", open:"Open",
    applied:"Applied", updated:"Updated", empty:"Nothing needs attention right now.",
    error:"Admin services are temporarily unavailable.", partial:"Some sources did not respond.",
    retry:"Try again", offer:"Offer", case:"Case", shop:"Merchant", systems:"Systems",
    offerHidden:"Offer hidden", merchantApproved:"Merchant approved", caseEscalated:"Case escalated",
    noActivity:"No recent activity.", dataUnavailable:"Unavailable", ready:"Connected",
  },
  fr: {
    title:"Aujourd’hui chez Kulha !", live:"En direct", refresh:"Actualiser", syncing:"Actualisation…", refreshed:"actualisé",
    foodSafety:"Offres · sécurité alimentaire", reported:"signalées", allergensUnknown:"allergènes inconnus",
    merchants:"Commerces en attente", pending:"en attente", infoRequired:"infos requises",
    support:"Dossiers de support ouverts", high:"élevée", medium:"moyenne", low:"faible",
    upNext:"À traiter · par ordre d’urgence", viewAll:"Voir tout", recent:"Activité récente",
    offers:"Offres", audit:"Audit", noResponse:"sans réponse", documents:"Documents non connectés",
    documentsLead:"Impossible de vérifier les fichiers tant que le backend ne les fournit pas.", review:"Examiner", open:"Ouvrir",
    applied:"Déposé", updated:"Mis à jour", empty:"Aucun élément à traiter pour le moment.",
    error:"Les services d’administration sont temporairement indisponibles.", partial:"Certaines sources n’ont pas répondu.",
    retry:"Réessayer", offer:"Offre", case:"Dossier", shop:"Commerce", systems:"Systèmes",
    offerHidden:"Offre masquée", merchantApproved:"Commerce approuvé", caseEscalated:"Dossier escaladé",
    noActivity:"Aucune activité récente.", dataUnavailable:"Indisponible", ready:"Connecté",
  },
  ar: {
    title:"اليوم في Kulha!", live:"مباشر", refresh:"تحديث", syncing:"جارٍ التحديث…", refreshed:"تم التحديث",
    foodSafety:"عروض · سلامة الغذاء", reported:"بلاغات", allergensUnknown:"مسببات حساسية غير معروفة",
    merchants:"متاجر بانتظار المراجعة", pending:"قيد الانتظار", infoRequired:"معلومات مطلوبة",
    support:"حالات دعم مفتوحة", high:"مرتفعة", medium:"متوسطة", low:"منخفضة",
    upNext:"التالي · حسب الأولوية", viewAll:"عرض الكل", recent:"النشاط الأخير",
    offers:"العروض", audit:"التدقيق", noResponse:"لا توجد استجابة", documents:"الوثائق غير متصلة",
    documentsLead:"لا يمكن التحقق من الملفات حتى توفرها الواجهة الخلفية.", review:"مراجعة", open:"فتح",
    applied:"تاريخ الطلب", updated:"آخر تحديث", empty:"لا توجد عناصر تتطلب الانتباه حالياً.",
    error:"خدمات الإدارة غير متاحة مؤقتاً.", partial:"لم تستجب بعض المصادر.",
    retry:"إعادة المحاولة", offer:"عرض", case:"حالة", shop:"متجر", systems:"الأنظمة",
    offerHidden:"تم إخفاء العرض", merchantApproved:"تمت الموافقة على المتجر", caseEscalated:"تم تصعيد الحالة",
    noActivity:"لا يوجد نشاط حديث.", dataUnavailable:"غير متاح", ready:"متصل",
  },
} as const;

function number(value:number, locale:SiteLocale) {
  return new Intl.NumberFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{maximumFractionDigits:0}).format(value);
}
function date(value:string|undefined, locale:SiteLocale) {
  if(!value) return "";
  const stamp=Date.parse(value); if(!Number.isFinite(stamp)) return "";
  return new Intl.DateTimeFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{timeZone:"Africa/Casablanca",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(stamp);
}
function humanize(value:string) { return value.split(/[._-]+/).filter(Boolean).map(x=>x.charAt(0)+x.slice(1).toLowerCase()).join(" "); }

export function AdminOverview({locale}:{locale:SiteLocale}) {
  const t=copy[locale];
  const [snapshot,setSnapshot]=useState<Snapshot>(emptySnapshot);
  const [refreshing,setRefreshing]=useState(false);
  const [lastUpdated,setLastUpdated]=useState<Date|null>(null);
  const [loadState,setLoadState]=useState<"initial"|"ready"|"partial"|"error">("initial");
  const mounted=useRef(false);

  const refresh=useCallback(async()=>{
    setRefreshing(true);
    const settled=await Promise.allSettled([
      api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=6"),
      api.get<Page<Offer>>("/admin/offers?page=0&size=8"),
      api.get<Page<SupportCase>>("/admin/support-cases?status=OPEN&page=0&size=5"),
      api.get<Page<AuditEntry>>("/admin/audit-log?page=0&size=6"),
    ]);
    if(!mounted.current) return;
    const next:Snapshot={
      merchants:settled[0].status==="fulfilled"?settled[0].value:null,
      offers:settled[1].status==="fulfilled"?settled[1].value:null,
      cases:settled[2].status==="fulfilled"?settled[2].value:null,
      audit:settled[3].status==="fulfilled"?settled[3].value:null,
    };
    const available=settled.filter(x=>x.status==="fulfilled").length;
    setSnapshot(next); setLoadState(available===0?"error":available===5?"ready":"partial");
    setLastUpdated(new Date()); setRefreshing(false);
  },[]);

  useEffect(()=>{
    mounted.current=true;
    const initial=window.setTimeout(()=>void refresh(),0);
    const onFocus=()=>void refresh();
    const onVisibility=()=>{if(!document.hidden) void refresh();};
    const interval=window.setInterval(()=>{if(!document.hidden) void refresh();},60_000);
    window.addEventListener("focus",onFocus); document.addEventListener("visibilitychange",onVisibility);
    return ()=>{mounted.current=false;window.clearTimeout(initial);window.clearInterval(interval);window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onVisibility);};
  },[refresh]);

  const offers=snapshot.offers?.items??[];
  const flagged=offers.filter(x=>x.reportedCount>0||x.allergensStatus==="UNKNOWN");
  const reported=offers.filter(x=>x.reportedCount>0).length;
  const unknown=offers.filter(x=>x.allergensStatus==="UNKNOWN").length;
  const merchants=snapshot.merchants?.items??[];
  const infoRequired=merchants.filter(x=>x.status==="INFO_REQUIRED").length;
  const cases=snapshot.cases?.items??[];
  const high=cases.filter(x=>x.priority==="HIGH").length;
  const medium=cases.filter(x=>x.priority==="MEDIUM").length;
  const low=cases.filter(x=>x.priority==="LOW").length;
  const queue=[
    ...flagged.slice(0,2).map(x=>({id:x.id,title:x.title,subtitle:x.shopName+" · "+x.city,kind:"offer" as const,meta:x.reportedCount>0?x.reportedCount+" "+t.reported:t.allergensUnknown,href:"/admin/offer-moderation",time:""})),
    ...cases.slice(0,1).map(x=>({id:x.id,title:x.reference+" · "+x.subject,subtitle:x.merchantName||t.case,kind:"case" as const,meta:humanize(x.priority),href:"/admin/support-cases",time:date(x.updatedAt,locale)})),
    ...([...merchants,...infoMerchants].slice(0,2).map(x=>({id:x.id,title:x.name,subtitle:(x.businessType||t.shop)+" · "+x.city,kind:"shop" as const,meta:x.status==="INFO_REQUIRED"?t.infoRequired:t.pending,href:"/admin/merchant-review",time:date(x.createdAt,locale)}))),
  ];
  const activity=snapshot.audit?.items.slice(0,3)??[];
  const updatedLabel=lastUpdatedLabel(lastUpdated,locale,t.syncing);

  return <div className={`${styles.overview} ${redesign.root}`} data-testid="admin-overview" dir={locale==="ar"?"rtl":"ltr"}>
    <header className={styles.dashboardHeading}>
      <div><h1 id="admin-overview-title">{t.title}</h1><p>{updatedLabel} · {t.refreshed}</p></div>
      <div className={styles.dashboardActions}><span className={styles.livePill}><span/>{t.live}</span><button type="button" className={styles.refreshButton} onClick={()=>void refresh()} disabled={refreshing}><RefreshCw size={15} className={refreshing?styles.spinning:""} aria-hidden="true"/>{refreshing?t.syncing:t.refresh}</button></div>
    </header>

    {loadState==="error"&&<div className={styles.errorNotice} role="alert"><AlertTriangle size={18}/><span>{t.error}</span><button type="button" onClick={()=>void refresh()}>{t.retry}</button></div>}
    {loadState==="partial"&&<div className={styles.partialNotice} role="status"><AlertTriangle size={16}/><span>{t.partial}</span></div>}

    <section className={styles.metrics} data-testid="admin-overview-metrics" aria-label={t.title}>
      <Link href={localePath(locale,"/admin/offer-moderation")} className={`${styles.metricCard} ${styles.metricSafety}`}>
        <div className={styles.metricIcon}><AlertTriangle size={19}/></div><strong>{snapshot.offers?number(flagged.length,locale):"—"}</strong>
        <div><b>{t.foodSafety}</b><small>{reported} {t.reported} · {unknown} {t.allergensUnknown}</small></div><ArrowUpRight size={16}/>
      </Link>
      <Link href={localePath(locale,"/admin/merchant-review")} className={`${styles.metricCard} ${styles.metricMerchants}`}>
        <div className={styles.metricIcon}><Store size={19}/></div><strong>{snapshot.merchants||snapshot.infoMerchants?number((snapshot.merchants?.total??0)+(snapshot.infoMerchants?.total??0),locale):"—"}</strong>
        <div><b>{t.merchants}</b><small>{number(snapshot.merchants?.total??0,locale)} {t.pending} · {number(infoRequired,locale)} {t.infoRequired}</small></div><ArrowUpRight size={16}/>
      </Link>
      <Link href={localePath(locale,"/admin/support-cases")} className={`${styles.metricCard} ${styles.metricSupport}`}>
        <div className={styles.metricIcon}><Flag size={19}/></div><strong>{snapshot.cases?number(snapshot.cases.total,locale):"—"}</strong>
        <div><b>{t.support}</b><small>{high} {t.high} · {medium} {t.medium} · {low} {t.low}</small></div><ArrowUpRight size={16}/>
      </Link>
    </section>

    <section className={styles.dashboardGrid}>
      <article className={styles.queuePanel}>
        <div className={styles.panelHeader}><h2>{t.upNext}</h2><Link href={localePath(locale,"/admin/offer-moderation")}>{t.viewAll} <ArrowUpRight size={15}/></Link></div>
        <div className={styles.priorityQueue}>
          {queue.map(item=><Link className={styles.queueItem} href={localePath(locale,item.href)} key={item.kind+item.id}>
            <span className={item.kind==="offer"?styles.queueOffer:item.kind==="case"?styles.queueCase:styles.queueShop}>{item.kind==="offer"?<Tag size={17}/>:item.kind==="case"?<Flag size={17}/>:<Store size={17}/>}</span>
            <span className={styles.queueCopy}><strong>{item.title}</strong><small>{item.subtitle}</small></span>
            <span className={styles.queueMeta}>{item.meta}</span>
            {item.time&&<time>{item.time}</time>}
            <span className={styles.queueAction}>{item.kind==="case"?t.open:t.review}</span>
          </Link>)}
          {queue.length===0&&loadState!=="initial"&&<p className={styles.emptyState}>{t.empty}</p>}
          {loadState==="initial"&&<div className={styles.tableSkeleton}><span/><span/><span/></div>}
        </div>
      </article>

      <aside className={styles.dashboardAside}>
        <article className={styles.activityPanel}>
          <div className={styles.panelHeader}><h2>{t.recent}</h2><Activity size={17}/></div>
          <div className={styles.activityList}>{activity.map(entry=><div className={styles.activityRow} key={entry.id}>
            <span className={entry.result==="SUCCESS"?styles.activitySuccess:styles.activityIssue}>{entry.result==="SUCCESS"?<CheckCircle2 size={14}/>:<AlertTriangle size={14}/>}</span>
            <div className={styles.activityCopy}><strong>{humanize(entry.action)}</strong><small>{entry.actorName} · {date(entry.createdAt,locale)}</small></div>
          </div>)}{snapshot.audit&&activity.length===0&&<p className={styles.emptyState}>{t.noActivity}</p>}</div>
        </article>
        <article className={styles.systemPanel}>
          <h2>{t.systems}</h2><div className={styles.systemPills}>
            <span className={snapshot.offers?styles.systemOk:styles.systemWait}>{t.offers} {snapshot.offers?"✓":"·"}</span>
            <span className={snapshot.audit?styles.systemOk:styles.systemWait}>{t.audit} {snapshot.audit?"✓":"·"}</span>
            <span className={snapshot.cases?styles.systemOk:styles.systemWait}>{t.support}: {snapshot.cases?t.ready:t.noResponse}</span>
          </div>
        </article>
        <article className={styles.documentCard} data-testid="admin-overview-document-warning">
          <div className={styles.documentTop}><span className={styles.documentIcon}><FileText size={18}/></span></div>
          <h2>{t.documents}</h2><p>{t.documentsLead}</p>
        </article>
      </aside>
    </section>
  </div>;
}

function lastUpdatedLabel(value:Date|null,locale:SiteLocale,fallback:string) {
  if(!value) return fallback;
  const tag=locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA";
  return new Intl.DateTimeFormat(tag,{timeZone:"Africa/Casablanca",weekday:"long",day:"2-digit",month:"long",hour:"2-digit",minute:"2-digit"}).format(value);
}
