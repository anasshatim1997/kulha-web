"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, MapPin, CalendarDays, ArrowUpRight, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { AdminShell } from "./AdminShell";
import { AdminPagination } from "./AdminPagination";
import styles from "./MerchantReviewPage.module.css";

type Merchant = { id:string; ownerUserId:string; ownerEmail:string; name:string; businessType:string; address:string; city:string; phone:string; openingHours:string; status:string; decisionReason:string|null; createdAt:string };
type Page<T> = { items:T[]; page:number; size:number; total:number };
type Status = "PENDING" | "INFO_REQUIRED" | "APPROVED" | "REJECTED";
const PAGE_SIZE = 8;
const statuses: Status[] = ["PENDING","INFO_REQUIRED","APPROVED","REJECTED"];
const words = {
  fr: {title:"Revue des commerces",subtitle:"Vérifiez les entreprises qui souhaitent rejoindre KULHA et publier des offres.",assurance:"Chaque approbation repose sur trois vérifications documentées.",pending:"En attente",info:"Informations requises",approved:"Approuvés",rejected:"Refusés",merchant:"Commerce",category:"Activité",owner:"Contact",city:"Ville",submitted:"Envoyée le",status:"Statut",identifier:"Identifiant",search:"Rechercher commerces, propriétaires, villes",loading:"Chargement des demandes…",retry:"Réessayer",empty:"Aucune demande dans cette catégorie.",noMatch:"Aucun commerce ne correspond à cette recherche.",previous:"Précédent",next:"Suivant",of:"sur",pagination:"Pagination des demandes",warning:"Coordonnées incomplètes",open:"Ouvrir le dossier",bakery:"Boulangerie",restaurant:"Restaurant",cafe:"Café",grocery:"Épicerie",pastry:"Pâtisserie",pendingLabel:"En attente",infoLabel:"Informations requises",approvedLabel:"Approuvé",rejectedLabel:"Refusé",error:"Impossible de charger les demandes.",count:"demandes"},
  en: {title:"Merchant review",subtitle:"Verify businesses applying to join KULHA and publish discounted offers.",assurance:"Every approval is backed by three recorded verification checks.",pending:"Pending",info:"Info required",approved:"Approved",rejected:"Rejected",merchant:"Merchant",category:"Business",owner:"Contact",city:"City",submitted:"Submitted",status:"Status",identifier:"ID",search:"Search shops, owners, cities",loading:"Loading applications…",retry:"Try again",empty:"There are no applications in this status.",noMatch:"No merchants match this search.",previous:"Previous",next:"Next",of:"of",pagination:"Application pagination",warning:"Contact details incomplete",open:"Open application",bakery:"Bakery",restaurant:"Restaurant",cafe:"Café",grocery:"Grocery",pastry:"Pastry shop",pendingLabel:"Pending",infoLabel:"Info required",approvedLabel:"Approved",rejectedLabel:"Rejected",error:"Applications could not be loaded.",count:"applications"},
  ar: {title:"مراجعة المتاجر",subtitle:"تحقق من الأنشطة التجارية التي ترغب في الانضمام إلى KULHA ونشر العروض.",assurance:"تعتمد كل موافقة على ثلاث خطوات تحقق موثقة.",pending:"قيد الانتظار",info:"معلومات مطلوبة",approved:"معتمد",rejected:"مرفوض",merchant:"المتجر",category:"النشاط",owner:"جهة الاتصال",city:"المدينة",submitted:"تاريخ الإرسال",status:"الحالة",identifier:"المعرّف",search:"ابحث عن المتاجر والمالكين والمدن",loading:"جارٍ تحميل الطلبات…",retry:"إعادة المحاولة",empty:"لا توجد طلبات ضمن هذه الحالة.",noMatch:"لا توجد متاجر تطابق البحث.",previous:"السابق",next:"التالي",of:"من",pagination:"التنقل بين الطلبات",warning:"بيانات الاتصال غير مكتملة",open:"فتح الطلب",bakery:"مخبز",restaurant:"مطعم",cafe:"مقهى",grocery:"متجر بقالة",pastry:"حلويات",pendingLabel:"قيد الانتظار",infoLabel:"معلومات مطلوبة",approvedLabel:"معتمد",rejectedLabel:"مرفوض",error:"تعذر تحميل الطلبات.",count:"طلبات"}
} as const;
const localeTag = (l:SiteLocale) => l==="ar" ? "ar-MA" : l==="en" ? "en-MA" : "fr-MA";
function dateLabel(value:string, locale:SiteLocale) {
  const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat(localeTag(locale),{timeZone:"Africa/Casablanca",day:"2-digit",month:"short",year:"numeric"}).format(d);
}
function businessLabel(value:string, locale:SiteLocale) {
  const v=value.toLowerCase(), t=words[locale];
  if(v.includes("bakery")||v==="boulangerie") return t.bakery;
  if(v.includes("restaurant")) return t.restaurant;
  if(v.includes("cafe")||v.includes("coffee")) return t.cafe;
  if(v.includes("grocery")||v.includes("epicerie")||v.includes("épicerie")) return t.grocery;
  if(v.includes("pastry")||v.includes("pâtisserie")) return t.pastry;
  return value.replaceAll("_"," ").toLocaleLowerCase(localeTag(locale));
}
type Props = {locale:SiteLocale;initialStatus:Status;initialPage:number;initialQuery:string};

export function MerchantReviewQueue({locale,initialStatus,initialPage,initialQuery}:Props) {
  const t=words[locale], router=useRouter();
  const [status,setStatus]=useState<Status>(initialStatus), [page,setPage]=useState(initialPage);
  const [query,setQuery]=useState(initialQuery), [data,setData]=useState<Page<Merchant>|null>(null);
  const [counts,setCounts]=useState<Partial<Record<Status,number>>>({});
  const [settledKey,setSettledKey]=useState(""), [failedKey,setFailedKey]=useState(""), [reload,setReload]=useState(0);
  const requestUrl="/admin/merchants?status="+encodeURIComponent(status)+"&page="+page+"&size="+PAGE_SIZE;
  const requestKey=requestUrl+"|retry="+reload;
  const loading=settledKey!==requestKey, failed=failedKey===requestKey;
  useEffect(()=>{
    const onSearch=(event:Event)=>{setQuery((event as CustomEvent<string>).detail??"");setPage(0);};
    window.addEventListener("kulha:admin-search",onSearch);
    return()=>window.removeEventListener("kulha:admin-search",onSearch);
  },[]);
  useEffect(()=>{
    let active=true;
    api.get<Page<Merchant>>(requestUrl)
      .then(result=>{if(active){setData(result);setFailedKey("");setSettledKey(requestKey);}})
      .catch(()=>{if(active){setFailedKey(requestKey);setSettledKey(requestKey);}});
    return()=>{active=false;};
  },[requestUrl,requestKey]);
  useEffect(()=>{
    let active=true;
    Promise.allSettled(statuses.map(s=>api.get<Page<Merchant>>("/admin/merchants?status="+s+"&page=0&size=1")))
      .then(results=>{
        if(!active)return;
        const next:Partial<Record<Status,number>>={};
        results.forEach((r,i)=>{if(r.status==="fulfilled")next[statuses[i]]=r.value.total;});
        setCounts(next);
      });
    return()=>{active=false;};
  },[reload]);
  const rows=useMemo(()=>{
    const q=query.trim().toLocaleLowerCase(localeTag(locale));
    return (data?.items??[]).filter(m=>!q||[m.name,m.businessType,m.city,m.address,m.ownerEmail,m.phone].some(v=>v?.toLocaleLowerCase(localeTag(locale)).includes(q)));
  },[data,locale,query]);
  const base=localePath(locale,"/admin/merchant-review");
  const labels={previous:t.previous,next:t.next,of:t.of,label:t.pagination};
  const label=(s:Status)=>s==="PENDING"?t.pendingLabel:s==="INFO_REQUIRED"?t.infoLabel:s==="APPROVED"?t.approvedLabel:t.rejectedLabel;
  const open=(id:string)=>{
    const q=new URLSearchParams({status,page:String(page)});if(query.trim())q.set("q",query.trim());
    router.push(base+"/"+encodeURIComponent(id)+"?"+q.toString());
  };
  return <AdminShell page="merchant-review" locale={locale} topbar={null}>
    <header className={styles.pageHeader} data-testid="admin-page-heading">
      <div className={styles.pageHeadingCopy}>
        <span className={styles.eyebrow}><Store size={15} aria-hidden="true"/> KULHA! / {t.title}</span>
        <h1>{t.title}</h1><p>{t.subtitle}</p>
      </div>
      <div className={styles.queueAssurance}><span><AlertTriangle size={16} aria-hidden="true"/></span><p>{t.assurance}</p></div>
    </header>
    <section className={styles.queuePanel} aria-label={t.title}>
      <div className={styles.queueToolbar}>
        <div className={styles.queueSectionTitle}><h2>{t.merchant} <span>{data?.total?.toLocaleString(localeTag(locale))??"—"}</span></h2><p>{t.count}</p></div>
        <div className={styles.queueSearch}><Search size={17} aria-hidden="true"/><label className={styles.srOnly} htmlFor="merchant-queue-search">{t.search}</label>
          <input id="merchant-queue-search" type="search" value={query} placeholder={t.search} onChange={e=>{setQuery(e.target.value);setPage(0);}}/>
        </div>
      </div>
      <div className={styles.statusTabs} role="tablist" aria-label={t.status}>
        {statuses.map(s=><button key={s} type="button" role="tab" aria-selected={status===s} className={status===s?styles.statusTabActive:styles.statusTab} onClick={()=>{setStatus(s);setPage(0);}}>
          <span>{s==="PENDING"?t.pending:s==="INFO_REQUIRED"?t.info:s==="APPROVED"?t.approved:t.rejected}</span><strong>{counts[s]??(status===s?data?.total??"—":"—")}</strong>
        </button>)}
      </div>
      {failed?<div className={styles.queueState} role="alert"><p>{t.error}</p><button type="button" onClick={()=>setReload(v=>v+1)}>{t.retry}</button></div>:
        <>
          <div className={styles.tableScroll}>
            <div className={styles.tableHead} role="row"><span>{t.merchant}</span><span>{t.category}</span><span>{t.owner}</span><span>{t.city}</span><span>{t.submitted}</span><span>{t.status}</span><span/></div>
            <div className={styles.merchantRows} data-testid="merchant-review-list" aria-busy={loading}>
              {!loading&&rows.map(m=>{
                const incomplete=!m.ownerEmail||!m.phone;
                const tone=m.status==="APPROVED"?styles.status_approved:m.status==="REJECTED"?styles.status_rejected:m.status==="INFO_REQUIRED"?styles.status_info_required:styles.status_pending;
                return <button key={m.id} type="button" className={styles.merchantRow} data-testid="merchant-application-row" onClick={()=>open(m.id)}>
                  <span className={styles.merchantIdentity}><span className={styles.merchantAvatar}>{m.name.trim().slice(0,1).toLocaleUpperCase(localeTag(locale))}</span>
                    <span className={styles.merchantIdentityText}><strong>{m.name}</strong><small title={m.id}>{t.identifier} · {m.id.slice(0,8)}…</small>{incomplete&&<em><AlertTriangle size={13} aria-hidden="true"/> {t.warning}</em>}</span>
                  </span>
                  <span className={styles.categoryCell}>{businessLabel(m.businessType,locale)}</span>
                  <span className={styles.contactCell}><strong>{m.ownerEmail||"—"}</strong><small>{m.phone||"—"}</small></span>
                  <span className={styles.locationCell}><MapPin size={14} aria-hidden="true"/>{m.city||"—"}</span>
                  <span className={styles.dateCell}><CalendarDays size={14} aria-hidden="true"/>{dateLabel(m.createdAt,locale)}</span>
                  <span><em className={styles.statusPill+" "+tone}>{label(statuses.includes(m.status as Status)?m.status as Status:"PENDING")}</em></span>
                  <span className={styles.rowAction} aria-label={t.open}><ArrowUpRight size={18} aria-hidden="true"/></span>
                </button>;
              })}
            </div>
            {loading&&<div className={styles.loadingRows} aria-label={t.loading}><span/><span/><span/><span/></div>}
            {!loading&&rows.length===0&&<div className={styles.queueState} role="status"><p>{query.trim()?t.noMatch:t.empty}</p></div>}
          </div>
          <AdminPagination page={page} pageCount={Math.max(1,Math.ceil((data?.total??0)/Math.max(1,data?.size??PAGE_SIZE)))} total={data?.total??0} size={data?.size||PAGE_SIZE} labels={labels} loading={loading} onChange={setPage}/>
        </>
      }
    </section>
  </AdminShell>;
}
