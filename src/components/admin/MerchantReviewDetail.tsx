"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft,ArrowRight,Building2,CalendarDays,Check,Clock3,FileText,Mail,MapPin,Phone,ShieldCheck,Store,AlertCircle } from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { AdminShell } from "./AdminShell";
import styles from "./MerchantReviewPage.module.css";

type Merchant={id:string;ownerUserId:string;ownerEmail:string;name:string;businessType:string;address:string;city:string;phone:string;openingHours:string;status:string;decisionReason:string|null;createdAt:string};
type Action="approve"|"request-information"|"reject";
const words={
 fr:{back:"Retour aux demandes",title:"Vérification du commerce",application:"Demande",submitted:"Envoyée le",overview:"Profil de l’entreprise",category:"Activité",address:"Adresse",city:"Ville",phone:"Téléphone",email:"E-mail du propriétaire",hours:"Horaires d’ouverture",documents:"Justificatifs",noDocuments:"Aucun document transmis",documentsInfo:"Le dépôt et le stockage des justificatifs d’immatriculation et d’identité ne sont pas disponibles dans KULHA. Aucun fichier n’est disponible pour prévisualisation ou téléchargement.",checks:"Vérifications requises",checksIntro:"Confirmez chaque point après avoir effectué le contrôle correspondant.",addressCheck:"Adresse et localisation vérifiées",phoneCheck:"Téléphone joignable",docsCheck:"Documents lisibles et valides",completed:"Vérifiée",decision:"Décision administrative",decisionIntro:"Choisissez l’issue, indiquez le motif et confirmez avant l’enregistrement.",approve:"Approuver",requestInfo:"Demander des informations",reject:"Refuser",reason:"Motif obligatoire",internalNote:"Note interne",optional:"Facultatif",reasonPlaceholder:"Décrivez le motif de cette décision…",notePlaceholder:"Note visible uniquement par l’équipe KULHA…",audit:"La décision, le motif et votre nom sont enregistrés dans le journal d’audit.",approveHint:"Les trois vérifications sont nécessaires avant toute approbation.",actionHint:"Choisissez une décision et saisissez un motif pour continuer.",review:"Examiner la décision",confirm:"Confirmer la décision",cancel:"Modifier",saving:"Enregistrement…",loadError:"Impossible de charger cette demande.",actionError:"La décision n’a pas pu être enregistrée. Vérifiez les informations et réessayez.",retry:"Réessayer",notFound:"Cette demande n’est pas disponible ou n’existe plus.",approved:"Approuvé",pending:"En attente",infoRequired:"Informations requises",rejected:"Refusé",status:"Statut",business:"Commerce",successful:"Décision enregistrée."},
 en:{back:"Back to applications",title:"Merchant verification",application:"Application",submitted:"Submitted",overview:"Business profile",category:"Business type",address:"Street address",city:"City",phone:"Phone number",email:"Owner email",hours:"Opening hours",documents:"Business documents",noDocuments:"No documents uploaded",documentsInfo:"Business-registration and owner-identity document upload and storage are not available in KULHA yet. There are no files to preview or download.",checks:"Required verification checks",checksIntro:"Mark each item only after completing the corresponding verification.",addressCheck:"Address and location checked",phoneCheck:"Phone number reachable",docsCheck:"Documents readable and valid",completed:"Verified",decision:"Administrative decision",decisionIntro:"Choose an outcome, provide a reason, and confirm before saving.",approve:"Approve",requestInfo:"Request information",reject:"Reject",reason:"Reason (required)",internalNote:"Internal note",optional:"Optional",reasonPlaceholder:"Explain the reason for this decision…",notePlaceholder:"Visible only to the KULHA team…",audit:"The decision, reason and your identity are recorded in the audit log.",approveHint:"All three verification checks are required before approval.",actionHint:"Choose a decision and enter a reason to continue.",review:"Review decision",confirm:"Confirm decision",cancel:"Change decision",saving:"Saving…",loadError:"This application could not be loaded.",actionError:"The decision could not be saved. Check the details and try again.",retry:"Try again",notFound:"This application is no longer available or does not exist.",approved:"Approved",pending:"Pending",infoRequired:"Info required",rejected:"Rejected",status:"Status",business:"Merchant",successful:"Decision saved."},
 ar:{back:"العودة إلى الطلبات",title:"التحقق من المتجر",application:"الطلب",submitted:"تاريخ الإرسال",overview:"ملف النشاط التجاري",category:"نوع النشاط",address:"عنوان الشارع",city:"المدينة",phone:"رقم الهاتف",email:"البريد الإلكتروني للمالك",hours:"ساعات العمل",documents:"مستندات النشاط التجاري",noDocuments:"لم يتم رفع مستندات",documentsInfo:"رفع مستندات التسجيل وهوية المالك وتخزينها غير متاح حالياً في KULHA. لا توجد ملفات للمعاينة أو التنزيل.",checks:"خطوات التحقق المطلوبة",checksIntro:"حدد كل بند بعد إتمام عملية التحقق الخاصة به.",addressCheck:"تم التحقق من العنوان والموقع",phoneCheck:"رقم الهاتف يعمل",docsCheck:"المستندات واضحة وصالحة",completed:"تم التحقق",decision:"القرار الإداري",decisionIntro:"اختر النتيجة وأدخل السبب ثم أكد قبل الحفظ.",approve:"موافقة",requestInfo:"طلب معلومات",reject:"رفض",reason:"السبب مطلوب",internalNote:"ملاحظة داخلية",optional:"اختياري",reasonPlaceholder:"اشرح سبب هذا القرار…",notePlaceholder:"مرئية لفريق KULHA فقط…",audit:"يتم تسجيل القرار والسبب وهويتك في سجل التدقيق.",approveHint:"يجب إكمال خطوات التحقق الثلاث قبل الموافقة.",actionHint:"اختر قراراً وأدخل السبب للمتابعة.",review:"مراجعة القرار",confirm:"تأكيد القرار",cancel:"تغيير القرار",saving:"جارٍ الحفظ…",loadError:"تعذر تحميل هذا الطلب.",actionError:"تعذر حفظ القرار. تحقق من البيانات ثم أعد المحاولة.",retry:"إعادة المحاولة",notFound:"هذا الطلب غير متاح أو لم يعد موجوداً.",approved:"معتمد",pending:"قيد الانتظار",infoRequired:"معلومات مطلوبة",rejected:"مرفوض",status:"الحالة",business:"المتجر",successful:"تم حفظ القرار."}
} as const;
const localeTag=(l:SiteLocale)=>l==="ar"?"ar-MA":l==="en"?"en-MA":"fr-MA";
function formatDate(value:string,l:SiteLocale){const d=new Date(value);return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat(localeTag(l),{timeZone:"Africa/Casablanca",weekday:"short",day:"2-digit",month:"long",year:"numeric"}).format(d);}
type Props={id:string;locale:SiteLocale;backStatus:string;backPage:number;backQuery:string};

export function MerchantReviewDetail({id,locale,backStatus,backPage,backQuery}:Props){
 const t=words[locale],router=useRouter();
 const [merchant,setMerchant]=useState<Merchant|null>(null),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false);
 const [checks,setChecks]=useState([false,false,false]),[action,setAction]=useState<Action|null>(null);
 const [reason,setReason]=useState(""),[internalNote,setInternalNote]=useState(""),[confirmation,setConfirmation]=useState(false);
 const [working,setWorking]=useState(false),[message,setMessage]=useState("");
 const base=localePath(locale,"/admin/merchant-review");
 const backHref=useMemo(()=>{const p=new URLSearchParams({status:backStatus,page:String(backPage)});if(backQuery.trim())p.set("q",backQuery.trim());return base+"?"+p.toString();},[backPage,backQuery,backStatus,base]);
 useEffect(()=>{let active=true;setLoading(true);setFailed(false);api.get<Merchant>("/admin/merchants/"+encodeURIComponent(id)).then(m=>{if(active)setMerchant(m);}).catch(()=>{if(active)setFailed(true);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[id]);
 const status=merchant?.status??"PENDING";
 const statusLabel=status==="APPROVED"?t.approved:status==="REJECTED"?t.rejected:status==="INFO_REQUIRED"?t.infoRequired:t.pending;
 const statusTone=status==="APPROVED"?styles.status_approved:status==="REJECTED"?styles.status_rejected:status==="INFO_REQUIRED"?styles.status_info_required:styles.status_pending;
 const valid=Boolean(action&&reason.trim()&&(action!=="approve"||checks.every(Boolean)));
 const selectAction=(next:Action)=>{setAction(next);setConfirmation(false);setMessage("");};
 const submit=async()=>{
  if(!merchant||!action||!reason.trim()||(action==="approve"&&!checks.every(Boolean)))return;
  setWorking(true);setMessage("");
  try{await api.post("/admin/merchants/"+merchant.id+"/"+action,{reason:reason.trim(),internalNote:internalNote.trim()});setMessage(t.successful);window.setTimeout(()=>router.push(backHref),650);}
  catch{setConfirmation(false);setMessage(t.actionError);}
  finally{setWorking(false);}
 };
 return <AdminShell page="merchant-review" locale={locale} topbar={null}>
  <main className={styles.detailPage} data-testid="merchant-review-detail-page">
   <div className={styles.detailBreadcrumb}><Link href={backHref} className={styles.backLink} data-testid="merchant-review-back">{locale==="ar"?<ArrowRight size={17}/>:<ArrowLeft size={17}/>} {t.back}</Link><span>{t.title}</span></div>
   {loading?<div className={styles.detailState} aria-live="polite">{t.title}…</div>:failed||!merchant?
    <div className={styles.detailState} role="alert"><AlertCircle size={22}/><p>{failed?t.loadError:t.notFound}</p><button type="button" onClick={()=>router.refresh()}>{t.retry}</button></div>:
    <>
     <header className={styles.detailHeader} data-testid="admin-page-heading">
      <div className={styles.detailTitleGroup}><span className={styles.eyebrow}><Store size={15}/> KULHA! / {t.business} / {t.title}</span>
       <h1>{merchant.name}</h1><div className={styles.detailMeta}>
        <span>{t.application} · KLH-M-{merchant.id.slice(0,4).toUpperCase()}</span>
        <span><CalendarDays size={14}/> {t.submitted} {formatDate(merchant.createdAt,locale)}</span>
        <em className={styles.statusPill+" "+statusTone}>{statusLabel}</em>
       </div>
      </div>
      <div className={styles.queuePosition}><span>{t.status}</span><strong>{statusLabel}</strong></div>
     </header>
     {message&&<div className={styles.feedback} role="status">{message}</div>}
     <div className={styles.detailLayout} data-testid="merchant-review-detail-layout">
      <div className={styles.detailMainColumn}>
       <section className={styles.detailSection}>
        <div className={styles.sectionHeading}><span className={styles.sectionIcon}><Building2 size={18}/></span><div><h2>{t.overview}</h2><p>{merchant.name}</p></div></div>
        <dl className={styles.profileGrid}>
         <div><dt>{t.category}</dt><dd>{merchant.businessType.replaceAll("_"," ").toLocaleLowerCase()}</dd></div>
         <div><dt>{t.city}</dt><dd><MapPin size={15}/> {merchant.city||"—"}</dd></div>
         <div className={styles.profileWide}><dt>{t.address}</dt><dd>{merchant.address||"—"}</dd></div>
         <div><dt>{t.phone}</dt><dd><Phone size={15}/> {merchant.phone||"—"}</dd></div>
         <div><dt>{t.email}</dt><dd><Mail size={15}/> {merchant.ownerEmail||"—"}</dd></div>
         <div><dt>{t.hours}</dt><dd><Clock3 size={15}/> {merchant.openingHours||"—"}</dd></div>
        </dl>
       </section>
       <section className={styles.detailSection}>
        <div className={styles.sectionHeading}><span className={styles.sectionIcon}><FileText size={18}/></span><div><h2>{t.documents}</h2><p>{t.noDocuments}</p></div></div>
        <div className={styles.documentNotice}><AlertCircle size={19}/><div><strong>{t.noDocuments}</strong><p>{t.documentsInfo}</p></div></div>
       </section>
       <section className={styles.detailSection} data-testid="merchant-review-workflow">
        <div className={styles.sectionHeading}><span className={styles.sectionIcon}><ShieldCheck size={18}/></span><div><h2>{t.checks}</h2><p>{t.checksIntro}</p></div><span className={styles.checkCount}>{checks.filter(Boolean).length}/3</span></div>
        <div className={styles.verificationList}>
         {[{label:t.addressCheck,detail:t.address,index:0},{label:t.phoneCheck,detail:t.phone,index:1},{label:t.docsCheck,detail:t.documents,index:2}].map(item=>
          <label className={styles.verificationItem} key={item.index}>
           <input type="checkbox" checked={checks[item.index]} onChange={e=>{setChecks(old=>old.map((v,i)=>i===item.index?e.target.checked:v));setConfirmation(false);}}/>
           <span className={styles.checkVisual}>{checks[item.index]?<Check size={15}/>:null}</span>
           <span className={styles.verificationCopy}><strong>{item.label}</strong><small>{item.detail}</small></span>
           <em>{checks[item.index]?t.completed:"—"}</em>
          </label>)}
        </div>
       </section>
      </div>
      <aside className={styles.decisionPanel} data-testid="merchant-review-decision">
       <div className={styles.decisionPanelHeader}><span className={styles.sectionIcon}><ShieldCheck size={18}/></span><div><h2>{t.decision}</h2><p>{t.decisionIntro}</p></div></div>
       <div className={styles.decisionOptions} role="group" aria-label={t.decision}>
        <button type="button" aria-pressed={action==="approve"} className={action==="approve"?styles.decisionApproveActive:styles.decisionApprove} disabled={working} onClick={()=>selectAction("approve")}>{t.approve}</button>
        <button type="button" aria-pressed={action==="request-information"} className={action==="request-information"?styles.decisionInfoActive:styles.decisionInfo} disabled={working} onClick={()=>selectAction("request-information")}>{t.requestInfo}</button>
        <button type="button" aria-pressed={action==="reject"} className={action==="reject"?styles.decisionRejectActive:styles.decisionReject} disabled={working} onClick={()=>selectAction("reject")}>{t.reject}</button>
       </div>
       <label className={styles.formField}><span>{t.reason}</span><textarea rows={4} maxLength={500} value={reason} placeholder={t.reasonPlaceholder} onChange={e=>{setReason(e.target.value);setConfirmation(false);}}/></label>
       <label className={styles.formField}><span>{t.internalNote} <small>· {t.optional}</small></span><textarea rows={3} value={internalNote} placeholder={t.notePlaceholder} onChange={e=>setInternalNote(e.target.value)}/></label>
       <div className={styles.decisionGuidance} id="merchant-decision-hint">{!action||!reason.trim()?t.actionHint:action==="approve"&&!checks.every(Boolean)?t.approveHint:t.audit}</div>
       <footer className={styles.decisionFooter} data-testid="merchant-review-footer">
        {!confirmation?<button type="button" className={styles.primaryButton} disabled={!valid||working} onClick={()=>setConfirmation(true)}>{t.review}</button>:
         <div className={styles.confirmationActions}><p>{action==="approve"?t.approve:action==="reject"?t.reject:t.requestInfo}</p>
          <button type="button" className={styles.secondaryButton} disabled={working} onClick={()=>setConfirmation(false)}>{t.cancel}</button>
          <button type="button" className={styles.primaryButton} disabled={working} onClick={()=>void submit()}>{working?t.saving:t.confirm}</button>
         </div>}
       </footer>
      </aside>
     </div>
    </>
   }
  </main>
 </AdminShell>;
}
