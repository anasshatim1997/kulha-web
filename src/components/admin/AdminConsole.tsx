"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { useSession } from "@/components/session/SessionProvider";
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

function money(minor:number,locale:SiteLocale){return new Intl.NumberFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{style:"currency",currency:"MAD",maximumFractionDigits:2}).format(minor/100);}
function dateTime(value:string,locale:SiteLocale){return new Intl.DateTimeFormat(locale==="ar"?"ar-MA":locale==="en"?"en-MA":"fr-MA",{timeZone:"Africa/Casablanca",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
function maskReason(reason:string){return (reason||"").trim();}
const merchantStatuses=[["PENDING","Pending"],["INFO_REQUIRED","Info required"],["APPROVED","Approved"],["REJECTED","Rejected"]] as const;
const offerStatuses=["PUBLISHED","SUSPENDED","UNPUBLISHED","DRAFT","EXPIRED","CANCELLED"];

export function AdminConsole({locale,page}:{locale:SiteLocale;page:PageKey}){
 const t=words[locale];const {state}=useSession();const actorId=state.status==="authenticated"?state.user.id:"";
 const [loading,setLoading]=useState(true);const [failed,setFailed]=useState(false);const [reload,setReload]=useState(0);const [message,setMessage]=useState("");
 const [merchants,setMerchants]=useState<Page<Merchant>|null>(null);const [merchantStatus,setMerchantStatus]=useState("PENDING");const [selectedMerchant,setSelectedMerchant]=useState<Merchant|null>(null);
 const [offers,setOffers]=useState<Page<Offer>|null>(null);const [offerStatus,setOfferStatus]=useState("");const [selectedOffer,setSelectedOffer]=useState<Offer|null>(null);
 const [cases,setCases]=useState<Page<CaseItem>|null>(null);const [caseStatus,setCaseStatus]=useState("OPEN");const [selectedCase,setSelectedCase]=useState<{summary:CaseItem;timeline:Timeline[]}|null>(null);
 const [audit,setAudit]=useState<AuditPage|null>(null);const [auditFrom,setAuditFrom]=useState("");const [auditTo,setAuditTo]=useState("");const [auditAction,setAuditAction]=useState("");const [auditResult,setAuditResult]=useState("");
 const [reason,setReason]=useState("");const [internalNote,setInternalNote]=useState("");const [draftMessage,setDraftMessage]=useState("");const [sendToCustomer,setSendToCustomer]=useState(true);const [revealed,setRevealed]=useState<{fullName:string;email:string;phone:string|null}|null>(null);const [working,setWorking]=useState(false);

 useEffect(()=>{let active=true;setLoading(true);setFailed(false);setMessage("");
  const load=async()=>{try{
   if(page==="merchant-review"){const data=await api.get<Page<Merchant>>("/admin/merchants?status="+merchantStatus+"&page=0&size=50");if(active){setMerchants(data);if(!selectedMerchant&&data.items[0])setSelectedMerchant(data.items[0]);}}
   if(page==="offer-moderation"){const data=await api.get<Page<Offer>>("/admin/offers?page=0&size=100"+(offerStatus?"&status="+offerStatus:""));if(active){setOffers(data);if(!selectedOffer&&data.items[0])setSelectedOffer(data.items[0]);}}
   if(page==="support-cases"){const data=await api.get<Page<CaseItem>>("/admin/support-cases?status="+caseStatus+"&page=0&size=100");if(active){setCases(data);if(!selectedCase&&data.items[0]){const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+data.items[0].reference);if(active)setSelectedCase(d);}}}
   if(page==="audit-log"){const query=new URLSearchParams();if(auditFrom)query.set("from",auditFrom);if(auditTo)query.set("to",auditTo);if(auditAction)query.set("action",auditAction);if(auditResult)query.set("result",auditResult);query.set("page","0");query.set("size","100");const data=await api.get<AuditPage>("/admin/audit-log?"+query.toString());if(active)setAudit(data);}
  }catch{if(active)setFailed(true);}finally{if(active)setLoading(false);}};
  void load();return()=>{active=false;};
 },[page,reload,merchantStatus,offerStatus,caseStatus,auditFrom,auditTo,auditAction,auditResult]);

 const title=page==="merchant-review"?t.merchantTitle:page==="offer-moderation"?t.offersTitle:page==="support-cases"?t.casesTitle:t.auditTitle;
 const lead=page==="merchant-review"?t.merchantLead:page==="offer-moderation"?t.offersLead:page==="support-cases"?t.casesLead:t.auditLead;
 async function loadMerchant(id:string){setWorking(true);try{const data=await api.get<Merchant>("/admin/merchants/"+id);setSelectedMerchant(data);setReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function merchantDecision(action:"approve"|"request-information"|"reject"){
  if(action!=="approve"&&!maskReason(reason)){setMessage(t.saveReason);return;}if(!selectedMerchant)return;setWorking(true);setMessage("");
  try{await api.post("/admin/merchants/"+selectedMerchant.id+"/"+action,action==="approve"?{internalNote:internalNote.trim()}:{reason:reason.trim(),internalNote:internalNote.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedMerchant(null);setReason("");setInternalNote("");}
  catch{setMessage(t.error);}finally{setWorking(false);}
 }
 async function offerDecision(action:"suspend"|"request-edit"|"reinstate"){
  if(!reason.trim()){setMessage(t.saveReason);return;}if(!selectedOffer)return;setWorking(true);setMessage("");
  try{await api.post("/admin/offers/"+selectedOffer.id+"/"+action,{reason:reason.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedOffer(null);setReason("");}
  catch{setMessage(t.error);}finally{setWorking(false);}
 }
 async function loadCase(reference:string){setWorking(true);setRevealed(null);try{const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+reference);setSelectedCase(d);setReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function caseAction(action:string){if(!selectedCase)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/actions",{action,reason:reason.trim()});setMessage(t.save);await loadCase(selectedCase.summary.reference);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function sendMessage(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selectedCase||!draftMessage.trim())return;setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/messages",{message:draftMessage.trim(),sendToCustomer});setDraftMessage("");await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function revealCustomer(){if(!selectedCase)return;setWorking(true);try{const d=await api.post<{fullName:string;email:string;phone:string|null}>("/admin/support-cases/"+selectedCase.summary.reference+"/reveal-customer",{});setRevealed(d);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function assignToMe(){if(!selectedCase||!actorId)return;setWorking(true);try{await api.put("/admin/support-cases/"+selectedCase.summary.reference+"/assignee",{assignedTo:actorId});await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
 async function exportAudit(){setWorking(true);try{const query=new URLSearchParams();if(auditFrom)query.set("from",auditFrom);if(auditTo)query.set("to",auditTo);if(auditAction)query.set("action",auditAction);if(auditResult)query.set("result",auditResult);const res=await fetch("/api/bff/admin/audit-log/export?"+query.toString(),{credentials:"same-origin",cache:"no-store"});if(!res.ok)throw new Error();const url=URL.createObjectURL(await res.blob());const a=document.createElement("a");a.href=url;a.download="kulha-audit-log.csv";a.click();URL.revokeObjectURL(url);}catch{setMessage(t.error);}finally{setWorking(false);}}

 if(loading)return <main className={styles.page}><div className={styles.header}><div className={styles.skeleton}/><div className={styles.skeletonWide}/></div><div className={styles.skeletonPanel}/></main>;
 if(failed)return <main className={styles.page}><div className={styles.alert}>{t.error}<button onClick={()=>setReload(v=>v+1)}>{t.retry}</button></div></main>;

 return <main className={styles.page} dir={locale==="ar"?"rtl":"ltr"}>
  <header className={styles.header}><div><p className={styles.kicker}>KULHA! · ADMIN</p><h1>{title}</h1><p>{lead}</p></div>
   {page==="audit-log"&&<button className={styles.primary} disabled={working} onClick={()=>void exportAudit()}>{t.export}</button>}
  </header>
  {message&&<div className={styles.notice} role="status">{message}</div>}

  {page==="merchant-review"&&merchants&&<div className={styles.split}>
   <section className={styles.panel}>
    <div className={styles.tabs}>{merchantStatuses.map(([value,label])=><button key={value} className={merchantStatus===value?styles.activeTab:styles.tab} onClick={()=>{setMerchantStatus(value);setSelectedMerchant(null);}}>{value==="PENDING"?t.pending:value==="INFO_REQUIRED"?t.info:value==="APPROVED"?t.approved:t.rejected}</button>)}</div>
    <div className={styles.list}>{merchants.items.map(item=><button key={item.id} className={selectedMerchant?.id===item.id?styles.selectedRow:styles.listRow} onClick={()=>void loadMerchant(item.id)}>
      <strong>{item.name}</strong><span>{item.businessType} · {item.city}</span><small>{item.ownerEmail}</small><em>{item.status==="PENDING"?t.pending:item.status==="INFO_REQUIRED"?t.info:item.status==="APPROVED"?t.approved:t.rejected}</em>
    </button>)}</div>{!merchants.items.length&&<p className={styles.empty}>{t.empty}</p>}
   </section>
   <section className={styles.panel}>
    {!selectedMerchant?<p className={styles.empty}>{t.empty}</p>:<>
     <div className={styles.detailHead}><div><small>{t.review} · {selectedMerchant.id.slice(0,8)}</small><h2>{selectedMerchant.name}</h2></div><span className={styles.status}>{selectedMerchant.status}</span></div>
     <div className={styles.detailGrid}><p><small>{t.business}</small><strong>{selectedMerchant.businessType}</strong></p><p><small>{t.owner}</small><strong>{selectedMerchant.ownerEmail}</strong></p><p><small>{t.address}</small><strong>{selectedMerchant.address}, {selectedMerchant.city}</strong></p><p><small>{t.phone}</small><strong>{selectedMerchant.phone}</strong></p><p><small>{t.hours}</small><strong>{selectedMerchant.openingHours}</strong></p></div>
     <h3>{t.documents}</h3><div className={styles.missingDocs}>{t.documentsMissing}</div>
     <h3>{t.checklist}</h3><div className={styles.checkList}><label><input type="checkbox"/>{t.locationChecked}</label><label><input type="checkbox"/>{t.phoneChecked}</label><label><input type="checkbox"/>{t.docsChecked}</label></div>
     <h3>{t.decision}</h3><label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
     <label className={styles.field}><span>{t.internalNote}</span><textarea rows={2} value={internalNote} onChange={e=>setInternalNote(e.target.value)} placeholder={t.internalNote}/></label>
     <div className={styles.actionRow}><button className={styles.success} disabled={working} onClick={()=>void merchantDecision("approve")}>{t.approve}</button><button className={styles.neutral} disabled={working} onClick={()=>void merchantDecision("request-information")}>{t.requestInfo}</button><button className={styles.danger} disabled={working} onClick={()=>void merchantDecision("reject")}>{t.reject}</button></div>
    </>}
   </section>
  </div>}

  {page==="offer-moderation"&&offers&&<section className={styles.panel}>
   <div className={styles.tabs}><button className={!offerStatus?styles.activeTab:styles.tab} onClick={()=>{setOfferStatus("");setSelectedOffer(null);}}>{t.filter} · {t.all}</button>{offerStatuses.map(value=><button key={value} className={offerStatus===value?styles.activeTab:styles.tab} onClick={()=>{setOfferStatus(value);setSelectedOffer(null);}}>{value}</button>)}</div>
   <div className={styles.offerTable}><table><thead><tr><th>{t.offer}</th><th>{t.shop}</th><th>{t.price}</th><th>{t.foodInfo}</th><th>{t.reports}</th><th>{t.status}</th></tr></thead><tbody>
    {offers.items.map(item=><tr key={item.id} className={selectedOffer?.id===item.id?styles.activeOffer:""} onClick={()=>{setSelectedOffer(item);setReason("");}}>
      <td><strong>{item.title}</strong><small>{item.city}</small></td><td>{item.shopName}</td><td>{money(item.priceMinor,locale)} / {item.originalPriceMinor?money(item.originalPriceMinor,locale):"—"}</td><td><span className={styles.pill}>{item.allergensStatus==="UNKNOWN"?t.hiddenAllergens:(item.allergens||"Complete")}</span></td><td><span className={item.reportedCount>0?styles.high:styles.status}>{item.reportedCount}</span></td><td><span className={styles.status}>{item.status}</span></td>
    </tr>)}
   </tbody></table></div>
   {!offers.items.length&&<p className={styles.empty}>{t.empty}</p>}
   {selectedOffer&&<div className={styles.selectedOffer}><div><small>{t.offer}</small><h2>{selectedOffer.title}</h2><p>{t.shop}: {selectedOffer.shopName} · {selectedOffer.city}</p><p>{t.price}: {money(selectedOffer.priceMinor,locale)} · {selectedOffer.originalPriceMinor?money(selectedOffer.originalPriceMinor,locale):"—"}</p><p>{t.foodInfo}: {selectedOffer.allergensStatus==="UNKNOWN"?t.hiddenAllergens:(selectedOffer.allergens||"Complete")}</p><p>{t.note}</p></div>
    <div className={styles.decision}><label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)}/></label>
     <button className={styles.danger} disabled={working} onClick={()=>void offerDecision("suspend")}>{t.hide}</button><button className={styles.neutral} disabled={working} onClick={()=>void offerDecision("request-edit")}>{t.askEdit}</button><button className={styles.success} disabled={working||selectedOffer.status!=="SUSPENDED"} onClick={()=>void offerDecision("reinstate")}>{t.putLive}</button>
    </div>
   </div>}
  </section>}

  {page==="support-cases"&&cases&&<div className={styles.split}>
   <section className={styles.panel}>
    <div className={styles.tabs}>{[["OPEN",t.open],["ESCALATED",t.high],["WAITING_REPLY",t.waiting],["RESOLVED",t.resolved]].map(([value,label])=><button key={value} className={caseStatus===value?styles.activeTab:styles.tab} onClick={()=>{setCaseStatus(value);setSelectedCase(null);}}>{label}</button>)}</div>
    <div className={styles.list}>{cases.items.map(item=><button key={item.reference} className={selectedCase?.summary.reference===item.reference?styles.selectedRow:styles.listRow} onClick={()=>void loadCase(item.reference)}>
      <strong>{item.subject}</strong><span>{item.category} · {dateTime(item.createdAt,locale)}</span><small>{item.merchantName||item.reservationReference||item.reference}</small><em>{item.priority}</em>
    </button>)}</div>{!cases.items.length&&<p className={styles.empty}>{t.empty}</p>}
   </section>
   <section className={styles.panel}>
    {!selectedCase?<p className={styles.empty}>{t.empty}</p>:<>
     <div className={styles.detailHead}><div><small>{selectedCase.summary.reference} · {selectedCase.summary.category}</small><h2>{selectedCase.summary.subject}</h2></div><span className={selectedCase.summary.priority==="HIGH"?styles.high:styles.status}>{selectedCase.summary.priority}</span></div>
     <div className={styles.detailGrid}><p><small>{t.record}</small><strong>{selectedCase.summary.reservationReference||"—"}</strong></p><p><small>{t.offer}</small><strong>{selectedCase.summary.offerTitle||"—"}</strong></p><p><small>{t.shop}</small><strong>{selectedCase.summary.merchantName||"—"}</strong></p><p><small>{t.person}</small><strong>{selectedCase.summary.assigneeName||"—"}</strong></p><p><small>{t.customer}</small><strong>{revealed?revealed.fullName:selectedCase.summary.customerLabel}</strong></p></div>
     {!revealed?<button className={styles.reveal} disabled={working} onClick={()=>void revealCustomer()}>{t.reveal}</button>:<div className={styles.revealed}>{revealed.fullName} · {revealed.email} · {revealed.phone||"—"}</div>}
     <p className={styles.hint}>{t.masked}</p><h3>{t.timeline}</h3><div className={styles.timeline}>{selectedCase.timeline.map(item=><article key={item.id}><span>{item.authorType}</span><strong>{item.authorLabel} · {dateTime(item.createdAt,locale)}</strong><p>{item.message}</p></article>)}</div>
     <form className={styles.messageForm} onSubmit={sendMessage}><label className={styles.field}><span>{t.reply}</span><textarea rows={3} value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} required/></label>
      <label className={styles.inlineCheck}><input type="checkbox" checked={sendToCustomer} onChange={e=>setSendToCustomer(e.target.checked)}/>{sendToCustomer?t.reply:t.internal}</label><button className={styles.primary} disabled={working||!draftMessage.trim()}>{t.send}</button>
     </form>
     <label className={styles.field}><span>{t.reason}</span><textarea rows={2} value={reason} onChange={e=>setReason(e.target.value)}/></label>
     <div className={styles.actionRow}><button className={styles.neutral} disabled={working} onClick={()=>void assignToMe()}>{t.assign}</button><button className={styles.neutral} disabled={working} onClick={()=>void caseAction("CONTACT_SHOP")}>{t.contactShop}</button><button className={styles.neutral} disabled={working} onClick={()=>void caseAction("ESCALATE")}>{t.escalate}</button><button className={styles.success} disabled={working} onClick={()=>void caseAction("RESOLVE")}>{t.resolve}</button></div>
     {selectedCase.summary.offerId&&<button className={styles.dangerOutline} disabled={working} onClick={()=>void caseAction("KEEP_OFFER_HIDDEN")}>{t.keepOffer}</button>}
    </>}
   </section>
  </div>}

  {page==="audit-log"&&audit&&<section className={styles.panel}>
   <div className={styles.auditFilters}>
    <label>{t.from}<input type="date" value={auditFrom} onChange={e=>setAuditFrom(e.target.value)}/></label>
    <label>{t.to}<input type="date" value={auditTo} onChange={e=>setAuditTo(e.target.value)}/></label>
    <label>{t.action}<input value={auditAction} onChange={e=>setAuditAction(e.target.value)} placeholder={t.filter}/></label>
    <label>{t.result}<select value={auditResult} onChange={e=>setAuditResult(e.target.value)}><option value="">{t.filter}</option><option value="SUCCESS">{t.success}</option><option value="DENIED">{t.denied}</option></select></label>
    <button className={styles.neutral} onClick={()=>setReload(v=>v+1)}>{t.filter}</button>
   </div>
   <p className={styles.hint}>🔒 {t.immutable}</p>
   <div className={styles.offerTable}><table><thead><tr><th>{t.today} / REF</th><th>{t.person}</th><th>{t.action}</th><th>{t.record}</th><th>{t.reason}</th><th>{t.result}</th></tr></thead><tbody>
    {audit.items.map(item=><tr key={item.id}><td>{dateTime(item.createdAt,locale)}<small>{item.id.slice(0,8)}</small></td><td>{item.actorName}</td><td>{item.action}</td><td>{item.targetType} · {item.targetId}</td><td>{item.reason||"—"}</td><td><span className={styles.status}>{item.result}</span></td></tr>)}
   </tbody></table></div>{!audit.items.length&&<p className={styles.empty}>{t.empty}</p>}
  </section>}
 </main>;
}
