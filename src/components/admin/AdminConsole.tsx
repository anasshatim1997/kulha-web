"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
import { Eye, FileText, Flag, Lock, Search, ShieldCheck, User } from "lucide-react";
import styles from "./AdminConsole.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";

type PageKey="merchant-review"|"offer-moderation"|"support-cases"|"audit-log";
type Merchant={id:string;ownerUserId:string;ownerEmail:string;name:string;businessType:string;address:string;city:string;phone:string;openingHours:string;status:string;decisionReason:string|null;createdAt:string};
type Offer={id:string;title:string;shopName:string;city:string;priceMinor:number;originalPriceMinor:number|null;quantityTotal:number;quantityReserved:number;allergensStatus:string;allergens:string|null;foodNotes:string|null;status:string;reportedCount:number;pickupStart:string|null;pickupEnd:string|null;imageUrl:string|null};
type CaseItem={id:string;reference:string;category:string;subject:string;description:string;priority:string;status:string;customerUserId:string;customerLabel:string;merchantId:string|null;merchantName:string|null;offerId:string|null;offerTitle:string|null;reservationReference:string|null;assignedTo:string|null;assigneeName:string|null;hiddenOffer:boolean;createdAt:string;updatedAt:string;resolvedAt:string|null};
type Timeline={id:string;authorType:string;authorUserId:string|null;authorLabel:string;visibility:string;message:string;createdAt:string};
type AuditRow={id:string;actorUserId:string;actorName:string;action:string;targetType:string;targetId:string;reason:string|null;result:string;correlationId:string|null;createdAt:string};
type Page<T>={items:T[];page:number;size:number;total:number};
type AuditPage=Page<AuditRow>;

const words={
 fr:{all:"Toutes",merchantTitle:"Revue des commerces",merchantLead:"Seuls les commerces approuvés peuvent publier des offres et recevoir des réservations.",offersTitle:"Modération des offres",offersLead:"Masquer, demander une correction ou rétablir une offre.",casesTitle:"Dossiers support",casesLead:"Réclamations clients et commerces, avec priorité à la sécurité alimentaire.",auditTitle:"Journal d’audit",auditLead:"Qui a fait quoi, sur quel dossier et pour quelle raison.",pending:"En attente",info:"Informations requises",approved:"Approuvés",rejected:"Refusés",review:"Fiche du commerce",business:"Type d’activité",owner:"Propriétaire",phone:"Téléphone",email:"E-mail",address:"Adresse",hours:"Horaires",documents:"Documents",documentsMissing:"Le dépôt et le stockage des documents d’immatriculation et d’identité ne sont pas encore disponibles. Aucun fichier à consulter.",checklist:"Liste de vérification",locationChecked:"Adresse et localisation vérifiées",phoneChecked:"Téléphone joignable",docsChecked:"Documents lisibles et valides",decision:"Décision",approve:"Approuver",requestInfo:"Demander des informations",reject:"Refuser",reason:"Motif obligatoire",internalNote:"Note interne",save:"Enregistrer la décision",offer:"Offre",shop:"Commerce",price:"Prix",foodInfo:"Informations alimentaires",reports:"Signalements",status:"Statut",hide:"Masquer l’offre",askEdit:"Demander une correction",putLive:"Rétablir en ligne",keepHidden:"Garder masquée",open:"Ouvert",foodSafety:"Sécurité alimentaire",waiting:"En attente de réponse",resolved:"Résolu",high:"Élevée",medium:"Moyenne",low:"Faible",customer:"Client",reveal:"Révéler",masked:"Les informations du client sont masquées. Toute révélation est autorisée et enregistrée.",timeline:"Historique",reply:"Répondre au client",internal:"Note interne",send:"Envoyer",contactShop:"Contacter le commerce",escalate:"Escalader",resolve:"Résoudre le dossier",assign:"M’assigner",keepOffer:"Garder l’offre masquée",audit:"Événements",today:"Aujourd’hui",person:"Personne",action:"Action",record:"Dossier",result:"Résultat",success:"Succès",denied:"Refusé",export:"Exporter (journalisé)",immutable:"Les entrées ne peuvent pas être modifiées ou supprimées.",from:"Du",to:"Au",filter:"Filtrer",loading:"Chargement…",retry:"Réessayer",empty:"Aucun élément à afficher.",error:"Impossible de charger les données.",saveReason:"Un motif est requis pour cette action.",hiddenAllergens:"Non renseigné",note:"Les allergènes inconnus restent « Non renseigné »."},
 en:{all:"All",merchantTitle:"Merchant review",merchantLead:"Only approved shops can publish offers or take reservations.",offersTitle:"Offer moderation",offersLead:"Hide, request a correction or restore an offer.",casesTitle:"Support cases",casesLead:"Customer and shop reports, with food safety first.",auditTitle:"Audit log",auditLead:"Who did what, on which record, and why.",pending:"Pending",info:"Info required",approved:"Approved",rejected:"Rejected",review:"Merchant details",business:"Business type",owner:"Owner",phone:"Phone",email:"Email",address:"Address",hours:"Opening hours",documents:"Documents",documentsMissing:"Business-registration and owner-ID document upload/storage is not available in the current backend. There are no files to view.",checklist:"Review checklist",locationChecked:"Address and location checked",phoneChecked:"Phone number reachable",docsChecked:"Documents readable and valid",decision:"Decision",approve:"Approve",requestInfo:"Request information",reject:"Reject",reason:"Reason (required)",internalNote:"Internal note",save:"Submit decision",offer:"Offer",shop:"Shop",price:"Price",foodInfo:"Food information",reports:"Reports",status:"Status",hide:"Hide offer",askEdit:"Ask shop to edit",putLive:"Put back live",keepHidden:"Keep hidden",open:"Open",foodSafety:"Food safety",waiting:"Waiting for reply",resolved:"Resolved",high:"High",medium:"Medium",low:"Low",customer:"Customer",reveal:"Reveal",masked:"Customer details are masked. Revealing them is permission-gated and logged.",timeline:"Timeline",reply:"Reply to customer",internal:"Internal note",send:"Send",contactShop:"Contact shop",escalate:"Escalate",resolve:"Resolve case",assign:"Assign to me",keepOffer:"Keep offer hidden",audit:"Audit entries",today:"Today",person:"Person",action:"Action",record:"Record",result:"Result",success:"Success",denied:"Denied",export:"Export (logged)",immutable:"Entries cannot be edited or deleted.",from:"From",to:"To",filter:"Filter",loading:"Loading…",retry:"Retry",empty:"Nothing to show yet.",error:"Could not load the data.",saveReason:"A reason is required for this action.",hiddenAllergens:"Not provided",note:"Unknown allergens remain “Not provided”."},
 ar:{all:"الكل",merchantTitle:"مراجعة المتاجر",merchantLead:"المتاجر المعتمدة فقط يمكنها نشر العروض واستقبال الحجوزات.",offersTitle:"مراجعة العروض",offersLead:"إخفاء العرض أو طلب تعديله أو إعادته للنشر.",casesTitle:"طلبات الدعم",casesLead:"بلاغات العملاء والمتاجر مع أولوية سلامة الغذاء.",auditTitle:"سجل التدقيق",auditLead:"من قام بماذا وعلى أي سجل ولماذا.",pending:"قيد الانتظار",info:"معلومات مطلوبة",approved:"معتمد",rejected:"مرفوض",review:"بيانات المتجر",business:"نوع النشاط",owner:"المالك",phone:"الهاتف",email:"البريد",address:"العنوان",hours:"ساعات العمل",documents:"الوثائق",documentsMissing:"رفع وتخزين وثائق التسجيل وهوية المالك غير متاح حالياً في النظام. لا توجد ملفات للعرض.",checklist:"قائمة التحقق",locationChecked:"تم التحقق من العنوان والموقع",phoneChecked:"رقم الهاتف يعمل",docsChecked:"الوثائق واضحة وصالحة",decision:"القرار",approve:"موافقة",requestInfo:"طلب معلومات",reject:"رفض",reason:"السبب مطلوب",internalNote:"ملاحظة داخلية",save:"إرسال القرار",offer:"العرض",shop:"المتجر",price:"السعر",foodInfo:"معلومات الطعام",reports:"البلاغات",status:"الحالة",hide:"إخفاء العرض",askEdit:"طلب تعديل",putLive:"إعادة النشر",keepHidden:"إبقاء مخفي",open:"مفتوح",foodSafety:"سلامة الغذاء",waiting:"بانتظار الرد",resolved:"تم الحل",high:"مرتفع",medium:"متوسط",low:"منخفض",customer:"العميل",reveal:"إظهار",masked:"بيانات العميل مخفية. إظهارها يتطلب صلاحية ويتم تسجيله.",timeline:"السجل الزمني",reply:"الرد على العميل",internal:"ملاحظة داخلية",send:"إرسال",contactShop:"التواصل مع المتجر",escalate:"تصعيد",resolve:"حل الطلب",assign:"تعيين لي",keepOffer:"إبقاء العرض مخفياً",audit:"سجلات التدقيق",today:"اليوم",person:"الشخص",action:"الإجراء",record:"السجل",result:"النتيجة",success:"نجاح",denied:"مرفوض",export:"تصدير (مسجل)",immutable:"لا يمكن تعديل السجلات أو حذفها.",from:"من",to:"إلى",filter:"تصفية",loading:"جارٍ التحميل…",retry:"إعادة المحاولة",empty:"لا توجد عناصر للعرض.",error:"تعذر تحميل البيانات.",saveReason:"السبب مطلوب لهذا الإجراء.",hiddenAllergens:"غير محدد",note:"تبقى مسببات الحساسية غير المعروفة «غير محددة»."}
} as const;


const more={
 fr:{search:"Rechercher commerces, commandes, dossiers…",application:"Dossier",escalated:"Escaladés",live:"En ligne",hiddenS:"Masquée",draftS:"Brouillon",expiredS:"Expirée",cancelledS:"Annulée",unpublishedS:"Dépubliée",complete:"Complet",report:"signalement",reportsN:"signalements",decisionNote:"Votre décision, le motif et votre nom sont enregistrés dans le journal d’audit.",actionNote:"Chaque action, motif et nom est enregistré dans le journal d’audit.",selectedOffer:"Offre sélectionnée",originalValue:"Valeur d’origine",notVerified:"non vérifiée",assignedTo:"Assigné à",replyNote:"Réponse ou note interne",writeMessage:"Écrire un message…",visibleCustomer:"Visible par le client",sendCustomer:"Envoyer au client",saveNote:"Enregistrer la note interne",actionReason:"Motif de l’action (obligatoire pour contacter, escalader ou résoudre)",optional:"Facultatif",allResults:"Tous les résultats",docsTitle:"Documents",needsReason:"Choisissez une décision et indiquez un motif.",system:"Système",customerRole:"Client"},
 en:{search:"Search merchants, orders, cases…",application:"Application",escalated:"Escalated",live:"Live",hiddenS:"Hidden",draftS:"Draft",expiredS:"Expired",cancelledS:"Cancelled",unpublishedS:"Unpublished",complete:"Complete",report:"report",reportsN:"reports",decisionNote:"Your decision, reason and name are saved in the audit log.",actionNote:"Every action, reason and name is saved in the audit log.",selectedOffer:"Selected offer",originalValue:"Original value",notVerified:"not verified",assignedTo:"Assigned to",replyNote:"Reply or internal note",writeMessage:"Write a message…",visibleCustomer:"Visible to the customer",sendCustomer:"Send to customer",saveNote:"Save internal note",actionReason:"Reason for the action (required to contact, escalate or resolve)",optional:"Optional",allResults:"All results",docsTitle:"Documents",needsReason:"Pick a decision and give a reason.",system:"System",customerRole:"Customer"},
 ar:{search:"ابحث عن متاجر وطلبات وحالات…",application:"طلب",escalated:"مصعّدة",live:"منشور",hiddenS:"مخفي",draftS:"مسودة",expiredS:"منتهي",cancelledS:"ملغى",unpublishedS:"غير منشور",complete:"مكتمل",report:"بلاغ",reportsN:"بلاغات",decisionNote:"يتم حفظ قرارك والسبب واسمك في سجل التدقيق.",actionNote:"يتم حفظ كل إجراء وسببه واسمك في سجل التدقيق.",selectedOffer:"العرض المحدد",originalValue:"القيمة الأصلية",notVerified:"غير موثقة",assignedTo:"مُسند إلى",replyNote:"رد أو ملاحظة داخلية",writeMessage:"اكتب رسالة…",visibleCustomer:"ظاهر للعميل",sendCustomer:"إرسال للعميل",saveNote:"حفظ الملاحظة الداخلية",actionReason:"سبب الإجراء (مطلوب للتواصل أو التصعيد أو الحل)",optional:"اختياري",allResults:"كل النتائج",docsTitle:"الوثائق",needsReason:"اختر قراراً واذكر السبب.",system:"النظام",customerRole:"العميل"}
} as const;

const loc=(l:SiteLocale)=>l==="ar"?"ar-MA":l==="en"?"en-MA":"fr-MA";
function amount(minor:number,l:SiteLocale){return new Intl.NumberFormat(loc(l),{maximumFractionDigits:2}).format(minor/100);}
function dateTime(value:string,l:SiteLocale){return new Intl.DateTimeFormat(loc(l),{timeZone:"Africa/Casablanca",weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
function shortDateTime(value:string,l:SiteLocale){return new Intl.DateTimeFormat(loc(l),{timeZone:"Africa/Casablanca",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
const merchantStatuses=["PENDING","INFO_REQUIRED","APPROVED","REJECTED"] as const;
const offerStatuses=["PUBLISHED","SUSPENDED","UNPUBLISHED","DRAFT","EXPIRED","CANCELLED"] as const;
type MerchantAction="approve"|"request-information"|"reject";
type OfferAction="suspend"|"request-edit"|"reinstate";

export function AdminConsole({locale,page}:{locale:SiteLocale;page:PageKey}){
 const t={...words[locale],...more[locale]};const {state}=useSession();const actorId=state.status==="authenticated"?state.user.id:"";
 const [loading,setLoading]=useState(true);const [failed,setFailed]=useState(false);const [reload,setReload]=useState(0);const [message,setMessage]=useState("");const [query,setQuery]=useState("");
 const [merchants,setMerchants]=useState<Page<Merchant>|null>(null);const [merchantStatus,setMerchantStatus]=useState("PENDING");const [selectedMerchant,setSelectedMerchant]=useState<Merchant|null>(null);const [merchantAction,setMerchantAction]=useState<MerchantAction|null>(null);const [checks,setChecks]=useState([false,false,false]);const [tabCounts,setTabCounts]=useState<{pending:number|null;info:number|null}>({pending:null,info:null});
 const [offers,setOffers]=useState<Page<Offer>|null>(null);const [offerStatus,setOfferStatus]=useState("");const [selectedOffer,setSelectedOffer]=useState<Offer|null>(null);const [offerAction,setOfferAction]=useState<OfferAction>("suspend");
 const [cases,setCases]=useState<Page<CaseItem>|null>(null);const [caseStatus,setCaseStatus]=useState("OPEN");const [selectedCase,setSelectedCase]=useState<{summary:CaseItem;timeline:Timeline[]}|null>(null);
 const [audit,setAudit]=useState<AuditPage|null>(null);const [auditFrom,setAuditFrom]=useState("");const [auditTo,setAuditTo]=useState("");const [auditAction,setAuditAction]=useState("");const [auditResult,setAuditResult]=useState("");
 const [reason,setReason]=useState("");const [internalNote,setInternalNote]=useState("");const [draftMessage,setDraftMessage]=useState("");const [sendToCustomer,setSendToCustomer]=useState(true);const [revealed,setRevealed]=useState<{fullName:string;email:string;phone:string|null}|null>(null);const [working,setWorking]=useState(false);

 useEffect(()=>{let active=true;
  const load=async()=>{try{
   if(page==="merchant-review"){const data=await api.get<Page<Merchant>>("/admin/merchants?status="+merchantStatus+"&page=0&size=50");if(active){setMerchants(data);setFailed(false);setSelectedMerchant(data.items[0]??null);setMerchantAction(null);setChecks([false,false,false]);}
    const [p,i]=await Promise.allSettled([api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=1"),api.get<Page<Merchant>>("/admin/merchants?status=INFO_REQUIRED&page=0&size=1")]);
    if(active)setTabCounts({pending:p.status==="fulfilled"?p.value.total:null,info:i.status==="fulfilled"?i.value.total:null});}
   if(page==="offer-moderation"){const data=await api.get<Page<Offer>>("/admin/offers?page=0&size=100"+(offerStatus?"&status="+offerStatus:""));if(active){setOffers(data);setFailed(false);setSelectedOffer(data.items[0]??null);setOfferAction("suspend");}}
   if(page==="support-cases"){const data=await api.get<Page<CaseItem>>("/admin/support-cases?status="+caseStatus+"&page=0&size=100");if(active){setCases(data);setFailed(false);if(data.items[0]){const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+data.items[0].reference);if(active)setSelectedCase(d);}else setSelectedCase(null);}}
   if(page==="audit-log"){const q=new URLSearchParams();if(auditFrom)q.set("from",auditFrom);if(auditTo)q.set("to",auditTo);if(auditAction)q.set("action",auditAction);if(auditResult)q.set("result",auditResult);q.set("page","0");q.set("size","100");const data=await api.get<AuditPage>("/admin/audit-log?"+q.toString());if(active){setAudit(data);setFailed(false);}}
  }catch{if(active)setFailed(true);}finally{if(active)setLoading(false);}};
  void load();return()=>{active=false;};
 },[page,reload,merchantStatus,offerStatus,caseStatus,auditFrom,auditTo,auditAction,auditResult]);

 const title=page==="merchant-review"?t.merchantTitle:page==="offer-moderation"?t.offersTitle:page==="support-cases"?t.casesTitle:t.auditTitle;
 const lead=page==="merchant-review"?t.merchantLead:page==="offer-moderation"?t.offersLead:page==="support-cases"?t.casesLead:t.auditLead;
 const q=query.trim().toLocaleLowerCase(locale);
 const match=(...values:(string|null|undefined)[])=>!q||values.some(v=>(v||"").toLocaleLowerCase(locale).includes(q));
 const merchantLabel=(s:string)=>s==="PENDING"?t.pending:s==="INFO_REQUIRED"?t.info:s==="APPROVED"?t.approved:t.rejected;
 const merchantTone=(s:string)=>s==="PENDING"?styles.toneWarn:s==="INFO_REQUIRED"?styles.toneInfo:s==="APPROVED"?styles.toneOk:styles.toneBad;
 const offerLabel=(s:string)=>({PUBLISHED:t.live,SUSPENDED:t.hiddenS,UNPUBLISHED:t.unpublishedS,DRAFT:t.draftS,EXPIRED:t.expiredS,CANCELLED:t.cancelledS} as Record<string,string>)[s]??s;
 const offerTone=(s:string)=>s==="PUBLISHED"?styles.toneOk:s==="SUSPENDED"?styles.toneBad:s==="DRAFT"?styles.toneWarn:styles.toneMuted;
 const priorityLabel=(p:string)=>p==="HIGH"?t.high:p==="MEDIUM"?t.medium:p==="LOW"?t.low:p;
 const priorityTone=(p:string)=>p==="HIGH"?styles.toneBad:p==="MEDIUM"?styles.toneWarn:p==="LOW"?styles.toneMuted:styles.toneInfo;
 const discount=(o:Offer)=>o.originalPriceMinor&&o.originalPriceMinor>o.priceMinor?Math.round((1-o.priceMinor/o.originalPriceMinor)*100):null;

 async function loadMerchant(id:string){setWorking(true);try{const data=await api.get<Merchant>("/admin/merchants/"+id);setSelectedMerchant(data);setReason("");setMerchantAction(null);setChecks([false,false,false]);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function submitMerchant(){
  if(!selectedMerchant)return;if(!merchantAction||!reason.trim()){setMessage(t.needsReason);return;}setWorking(true);setMessage("");
  try{await api.post("/admin/merchants/"+selectedMerchant.id+"/"+merchantAction,{reason:reason.trim(),internalNote:internalNote.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedMerchant(null);setReason("");setInternalNote("");setMerchantAction(null);}
  catch{setMessage(t.error);}finally{setWorking(false);}
 }
 async function submitOffer(){
  if(!selectedOffer)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);setMessage("");
  try{await api.post("/admin/offers/"+selectedOffer.id+"/"+offerAction,{reason:reason.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedOffer(null);setReason("");}
  catch{setMessage(t.error);}finally{setWorking(false);}
 }
 async function loadCase(reference:string){setWorking(true);setRevealed(null);try{const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+reference);setSelectedCase(d);setReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function caseAction(action:string){if(!selectedCase)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/actions",{action,reason:reason.trim()});setMessage(t.save);await loadCase(selectedCase.summary.reference);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function sendMessage(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selectedCase||!draftMessage.trim())return;setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/messages",{message:draftMessage.trim(),sendToCustomer});setDraftMessage("");await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function revealCustomer(){if(!selectedCase)return;setWorking(true);try{const d=await api.post<{fullName:string;email:string;phone:string|null}>("/admin/support-cases/"+selectedCase.summary.reference+"/reveal-customer",{});setRevealed(d);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function assignToMe(){if(!selectedCase||!actorId)return;setWorking(true);try{await api.put("/admin/support-cases/"+selectedCase.summary.reference+"/assignee",{assignedTo:actorId});await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function exportAudit(){setWorking(true);try{const p=new URLSearchParams();if(auditFrom)p.set("from",auditFrom);if(auditTo)p.set("to",auditTo);if(auditAction)p.set("action",auditAction);if(auditResult)p.set("result",auditResult);const res=await fetch("/api/bff/admin/audit-log/export?"+p.toString(),{credentials:"same-origin",cache:"no-store"});if(!res.ok)throw new Error();const url=URL.createObjectURL(await res.blob());const a=document.createElement("a");a.href=url;a.download="kulha-audit-log.csv";a.click();URL.revokeObjectURL(url);}catch{setMessage(t.error);}finally{setWorking(false);}}
 const switchTab=(apply:()=>void)=>{setLoading(true);setFailed(false);apply();};

 const topbar=<div className={styles.topbar}><label className={styles.search}><Search size={17} aria-hidden="true"/><span className="sr-only">{t.search}</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/></label></div>;
 const frame=(content:React.ReactNode)=><div className={styles.shell} dir={locale==="ar"?"rtl":"ltr"}>{topbar}<main className={styles.page}>{content}</main></div>;

 if(loading)return frame(<><div className={styles.header}><div><div className={styles.skeleton}/><div className={styles.skeletonWide}/></div></div><div className={styles.skeletonPanel}/></>);
 if(failed)return frame(<div className={styles.alert} role="alert">{t.error}<button onClick={()=>{setLoading(true);setFailed(false);setReload(v=>v+1);}}>{t.retry}</button></div>);

 const merchantItems=merchants?.items.filter(m=>match(m.name,m.businessType,m.city,m.ownerEmail))??[];
 const offerItems=offers?.items.filter(o=>match(o.title,o.shopName,o.city))??[];
 const caseItems=cases?.items.filter(c=>match(c.subject,c.reference,c.merchantName,c.reservationReference,c.offerTitle))??[];
 const auditItems=audit?.items.filter(a=>match(a.actorName,a.action,a.targetType,a.targetId,a.reason))??[];
 const tabCount=(value:string)=>value==="PENDING"?(merchantStatus==="PENDING"?merchants?.total:tabCounts.pending):value==="INFO_REQUIRED"?(merchantStatus==="INFO_REQUIRED"?merchants?.total:tabCounts.info):merchantStatus===value?merchants?.total:null;

 return frame(<>
  <header className={styles.header}><div><h1>{title}</h1><p>{lead}</p></div>
   {page==="audit-log"&&<button className={styles.ghostBtn} disabled={working} onClick={()=>void exportAudit()}><FileText size={16} aria-hidden="true"/>{t.export}</button>}
  </header>
  {message&&<div className={styles.notice} role="status">{message}</div>}

  {page==="merchant-review"&&merchants&&<>
   <div className={styles.tabs} role="tablist">{merchantStatuses.map(value=>{const n=tabCount(value);return <button key={value} role="tab" aria-selected={merchantStatus===value} className={merchantStatus===value?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setMerchantStatus(value);setSelectedMerchant(null);})}>{merchantLabel(value)}{typeof n==="number"?" · "+n:""}</button>;})}</div>
   <div className={`${styles.split} ${styles.reviewWorkspace}`}>
    <section className={styles.merchantPicker} aria-label={t.merchantTitle}>
     <div className={styles.list}>{merchantItems.map(item=><button key={item.id} className={selectedMerchant?.id===item.id?styles.selectedRow:styles.listRow} onClick={()=>void loadMerchant(item.id)}>
       <span className={styles.rowTop}><strong>{item.name}</strong><em className={`${styles.pill} ${merchantTone(item.status)}`}>{merchantLabel(item.status)}</em></span>
       <small>{item.businessType} · {item.city} · {shortDateTime(item.createdAt,locale)}</small>
     </button>)}</div>{!merchantItems.length&&<p className={styles.empty}>{t.empty}</p>}
    </section>
    <section className={`${styles.card} ${styles.merchantDetails}`}>
     {!selectedMerchant?<p className={styles.empty}>{t.empty}</p>:<>
      <div className={styles.detailHead}><div><small>{t.application} KLH-M-{selectedMerchant.id.slice(0,4).toUpperCase()}</small><h2>{selectedMerchant.name}</h2></div><span className={`${styles.pill} ${merchantTone(selectedMerchant.status)}`}>{merchantLabel(selectedMerchant.status)}</span></div>
      <dl className={styles.facts}>
       <div><dt>{t.business}</dt><dd>{selectedMerchant.businessType}</dd></div><div><dt>{t.owner}</dt><dd>{selectedMerchant.ownerEmail}</dd></div>
       <div><dt>{t.address}</dt><dd>{selectedMerchant.address}, {selectedMerchant.city}</dd></div><div><dt>{t.phone}</dt><dd>{selectedMerchant.phone}</dd></div>
       <div><dt>{t.hours}</dt><dd>{selectedMerchant.openingHours}</dd></div><div><dt>{t.email}</dt><dd>{selectedMerchant.ownerEmail}</dd></div>
      </dl>
      <h3>{t.documents}</h3><div className={styles.missingDocs}><FileText size={18} aria-hidden="true"/><span>{t.documentsMissing}</span></div>
      <h3>{t.checklist}</h3><div className={styles.checkList}>{[t.locationChecked,t.phoneChecked,t.docsChecked].map((label,i)=><label key={label}><input type="checkbox" checked={checks[i]} onChange={e=>setChecks(c=>c.map((v,j)=>j===i?e.target.checked:v))}/>{label}</label>)}</div>
      <h3>{t.decision}</h3>
      <div className={styles.segment} role="group" aria-label={t.decision}>
       <button type="button" aria-pressed={merchantAction==="approve"} className={`${styles.segApprove} ${merchantAction==="approve"?styles.segOn:""}`} onClick={()=>setMerchantAction("approve")}>{t.approve}</button>
       <button type="button" aria-pressed={merchantAction==="request-information"} className={`${styles.segInfo} ${merchantAction==="request-information"?styles.segOn:""}`} onClick={()=>setMerchantAction("request-information")}>{t.requestInfo}</button>
       <button type="button" aria-pressed={merchantAction==="reject"} className={`${styles.segReject} ${merchantAction==="reject"?styles.segOn:""}`} onClick={()=>setMerchantAction("reject")}>{t.reject}</button>
      </div>
      <label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
      <label className={styles.field}><span>{t.internalNote}</span><textarea rows={2} value={internalNote} onChange={e=>setInternalNote(e.target.value)} placeholder={t.optional}/></label>
      <div className={styles.cardFoot}><p><ShieldCheck size={14} aria-hidden="true"/>{t.decisionNote}</p><button className={styles.primary} disabled={working||!merchantAction||!reason.trim()} onClick={()=>void submitMerchant()}>{t.save}</button></div>
     </>}
    </section>
   </div>
  </>}

  {page==="offer-moderation"&&offers&&<>
   <div className={styles.offerWorkspace}>
    <section className={styles.offerPicker}>
     <div className={styles.tabs} role="tablist"><button role="tab" aria-selected={!offerStatus} className={!offerStatus?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setOfferStatus("");setSelectedOffer(null);})}>{t.all}{!offerStatus?" · "+offers.total:""}</button>{offerStatuses.map(value=><button key={value} role="tab" aria-selected={offerStatus===value} className={offerStatus===value?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setOfferStatus(value);setSelectedOffer(null);})}>{offerLabel(value)}{offerStatus===value?" · "+offers.total:""}</button>)}</div>
     <div className={styles.offerTable}><table><thead><tr><th>{t.offer}</th><th>{t.shop}</th><th>{t.price}</th><th>{t.reports}</th><th>{t.status}</th></tr></thead><tbody>
      {offerItems.map(item=>{const d=discount(item);return <tr key={item.id} tabIndex={0} aria-selected={selectedOffer?.id===item.id} className={selectedOffer?.id===item.id?styles.activeRow:""} onClick={()=>{setSelectedOffer(item);setReason("");}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelectedOffer(item);setReason("");}}}>
       <td><strong>{item.title}</strong><small>{item.city}</small></td><td>{item.shopName}</td><td>{amount(item.priceMinor,locale)} MAD{d?" · −"+d+"%":""}</td>
       <td>{item.reportedCount>0?<span className={styles.pill+" "+styles.toneBad}>{item.reportedCount} {item.reportedCount===1?t.report:t.reportsN}</span>:"0"}</td><td><span className={styles.pill+" "+offerTone(item.status)}>{offerLabel(item.status)}</span></td>
      </tr>;})}
     </tbody></table></div>
     {!offerItems.length&&<p className={styles.empty}>{t.empty}</p>}
    </section>
    <section className={styles.offerDecision}>
     {!selectedOffer?<div className={styles.offerEmpty}><Tag size={28} aria-hidden="true"/><strong>{t.selectedOffer}</strong><span>{t.empty}</span></div>:<>
      <div className={styles.detailHead}><div><small>{t.selectedOffer}</small><h2>{selectedOffer.title}</h2><span className={styles.pill+" "+offerTone(selectedOffer.status)}>{offerLabel(selectedOffer.status)}</span></div></div>
      <dl className={styles.rows}><div><dt>{t.shop}</dt><dd>{selectedOffer.shopName}</dd></div><div><dt>{t.price}</dt><dd>{amount(selectedOffer.priceMinor,locale)} MAD</dd></div><div><dt>{t.foodInfo}</dt><dd>{selectedOffer.allergensStatus==="UNKNOWN"?t.hiddenAllergens:(selectedOffer.allergens||t.complete)}</dd></div><div><dt>{t.reports}</dt><dd>{selectedOffer.reportedCount}</dd></div><div><dt>{t.originalValue}</dt><dd>{selectedOffer.originalPriceMinor?amount(selectedOffer.originalPriceMinor,locale)+" MAD":"—"} · {t.notVerified}</dd></div></dl>
      <p className={styles.hint}>{t.note}</p>
      <div className={styles.decisionCol}><small className={styles.eyebrow}>{t.decision}</small>
       <button type="button" aria-pressed={offerAction==="suspend"} className={offerAction==="suspend"?styles.stackOn:styles.stack} onClick={()=>setOfferAction("suspend")}>{selectedOffer.status==="SUSPENDED"?t.keepHidden:t.hide}</button>
       <button type="button" aria-pressed={offerAction==="request-edit"} className={offerAction==="request-edit"?styles.stackOn:styles.stack} onClick={()=>setOfferAction("request-edit")}>{t.askEdit}</button>
       <button type="button" aria-pressed={offerAction==="reinstate"} disabled={selectedOffer.status!=="SUSPENDED"} className={offerAction==="reinstate"?styles.stackOn:styles.stack} onClick={()=>setOfferAction("reinstate")}>{t.putLive}</button>
       <label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
       <button className={styles.primaryWide} disabled={working||!reason.trim()||(offerAction==="reinstate"&&selectedOffer.status!=="SUSPENDED")} onClick={()=>void submitOffer()}>{t.save}</button>
      </div>
      <p className={styles.hint}>{t.actionNote}</p>
     </>}
    </section>
   </div>
  </>}

  {page==="support-cases"&&cases&&<>
   <div className={styles.tabs} role="tablist">{([["OPEN",t.open],["ESCALATED",t.escalated],["WAITING_REPLY",t.waiting],["RESOLVED",t.resolved]] as const).map(([value,label])=><button key={value} role="tab" aria-selected={caseStatus===value} className={caseStatus===value?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setCaseStatus(value);setSelectedCase(null);})}>{label}{caseStatus===value?" · "+cases.total:""}</button>)}</div>
   <div className={styles.split}>
    <section aria-label={t.casesTitle}>
     <div className={styles.list}>{caseItems.map(item=><button key={item.reference} className={selectedCase?.summary.reference===item.reference?styles.selectedRow:styles.listRow} onClick={()=>void loadCase(item.reference)}>
       <span className={styles.rowTop}><strong>{item.subject}</strong><em className={`${styles.pill} ${priorityTone(item.priority)}`}>{priorityLabel(item.priority)}</em></span>
       <small>{item.category} · {shortDateTime(item.createdAt,locale)}</small>
     </button>)}</div>{!caseItems.length&&<p className={styles.empty}>{t.empty}</p>}
    </section>
    <section className={styles.card}>
     {!selectedCase?<p className={styles.empty}>{t.empty}</p>:<>
      <div className={styles.detailHead}><div><small>{t.record} {selectedCase.summary.reference} · {selectedCase.summary.category}</small><h2>{selectedCase.summary.subject}</h2></div><span className={`${styles.pill} ${priorityTone(selectedCase.summary.priority)}`}>{priorityLabel(selectedCase.summary.priority)}</span></div>
      <dl className={styles.facts}>
       <div><dt>{t.record}</dt><dd>{selectedCase.summary.reservationReference||"—"}</dd></div><div><dt>{t.offer}</dt><dd>{selectedCase.summary.offerTitle||"—"}</dd></div>
       <div><dt>{t.shop}</dt><dd>{selectedCase.summary.merchantName||"—"}</dd></div><div><dt>{t.assignedTo}</dt><dd>{selectedCase.summary.assigneeName||"—"} <button className={styles.linkBtn} disabled={working} onClick={()=>void assignToMe()}>{t.assign}</button></dd></div>
       <div><dt>{t.customer}</dt><dd>{revealed?revealed.fullName:selectedCase.summary.customerLabel} {!revealed&&<button className={styles.reveal} disabled={working} onClick={()=>void revealCustomer()}><Eye size={14} aria-hidden="true"/>{t.reveal}</button>}</dd></div>
       <div><dt>{t.status}</dt><dd><span className={`${styles.pill} ${styles.toneWarn}`}>{selectedCase.summary.status}</span></dd></div>
      </dl>
      {revealed&&<div className={styles.revealed}>{revealed.fullName} · {revealed.email} · {revealed.phone||"—"}</div>}
      <p className={styles.hint}><Lock size={13} aria-hidden="true"/>{t.masked}</p>
      <h3>{t.timeline}</h3>
      <div className={styles.timeline}>{selectedCase.timeline.map(item=><article key={item.id}>
       <span className={`${styles.avatar} ${item.authorType==="SYSTEM"?styles.avatarSystem:""}`} aria-hidden="true">{item.authorType==="SYSTEM"?<Flag size={15}/>:item.authorType==="CUSTOMER"?<User size={15}/>:(item.authorLabel||"?").slice(0,1)}</span>
       <div><strong>{item.authorLabel} · {new Intl.DateTimeFormat(loc(locale),{timeZone:"Africa/Casablanca",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt))}</strong><p>{item.message}</p></div>
      </article>)}</div>
      <form onSubmit={sendMessage}>
       <label className={styles.field}><span>{t.replyNote}</span><textarea rows={3} value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} placeholder={t.writeMessage} required/></label>
       <label className={styles.inlineCheck}><input type="checkbox" checked={sendToCustomer} onChange={e=>setSendToCustomer(e.target.checked)}/>{t.visibleCustomer}</label>
       <label className={styles.field}><span>{t.actionReason}</span><textarea rows={2} value={reason} onChange={e=>setReason(e.target.value)}/></label>
       <div className={styles.actionRow}>
        <button className={styles.primary} disabled={working||!draftMessage.trim()}>{sendToCustomer?t.sendCustomer:t.saveNote}</button>
        <button type="button" className={styles.ghostBtn} disabled={working} onClick={()=>void caseAction("CONTACT_SHOP")}>{t.contactShop}</button>
        <button type="button" className={styles.ghostBtn} disabled={working} onClick={()=>void caseAction("ESCALATE")}>{t.escalate}</button>
        <button type="button" className={styles.ghostBtn} disabled={working} onClick={()=>void caseAction("RESOLVE")}>{t.resolve}</button>
       </div>
      </form>
      {selectedCase.summary.offerId&&<div className={styles.actionRowEnd}><button type="button" className={styles.dangerOutline} disabled={working} onClick={()=>void caseAction("KEEP_OFFER_HIDDEN")}>{t.keepOffer}</button></div>}
      <p className={styles.hint}><ShieldCheck size={13} aria-hidden="true"/>{t.actionNote}</p>
     </>}
    </section>
   </div>
  </>}

  {page==="audit-log"&&audit&&<>
   <div className={styles.filters}>
    <label><span className="sr-only">{t.from}</span><input type="date" aria-label={t.from} value={auditFrom} onChange={e=>setAuditFrom(e.target.value)}/></label>
    <label><span className="sr-only">{t.to}</span><input type="date" aria-label={t.to} value={auditTo} onChange={e=>setAuditTo(e.target.value)}/></label>
    <label><span className="sr-only">{t.action}</span><input aria-label={t.action} value={auditAction} onChange={e=>setAuditAction(e.target.value)} placeholder={t.action}/></label>
    <label><span className="sr-only">{t.result}</span><select aria-label={t.result} value={auditResult} onChange={e=>setAuditResult(e.target.value)}><option value="">{t.allResults}</option><option value="SUCCESS">{t.success}</option><option value="DENIED">{t.denied}</option></select></label>
    <p className={styles.immutable}><Lock size={14} aria-hidden="true"/>{t.immutable}</p>
   </div>
   <section className={styles.card}>
    <div className={styles.table}><table><thead><tr><th>{t.today} / REF</th><th>{t.person}</th><th>{t.action}</th><th>{t.record}</th><th>{t.reason}</th><th>{t.result}</th></tr></thead><tbody>
     {auditItems.map(item=><tr key={item.id}><td>{shortDateTime(item.createdAt,locale)}<small>{item.id.slice(0,8)}</small></td><td><strong>{item.actorName}</strong></td><td><strong>{item.action}</strong></td><td>{item.targetType} · {item.targetId}</td><td>{item.reason||"—"}</td><td><span className={`${styles.pill} ${item.result==="SUCCESS"?styles.toneOk:styles.toneBad}`}>{item.result==="SUCCESS"?t.success:item.result==="DENIED"?t.denied:item.result}</span></td></tr>)}
    </tbody></table></div>{!auditItems.length&&<p className={styles.empty}>{t.empty}</p>}
   </section></>}
 </>);
}
