"use client";
import { useEffect, useRef, useState, type ReactNode, type RefObject, type SyntheticEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api/client";
import { canRevealSupportCustomerDetails, SUPPORT_DISCLOSURE_REASON_MAX_LENGTH } from "@/lib/auth/admin-access";
import { useSession } from "@/components/session/SessionProvider";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Eye, FileText, Filter, Image as ImageIcon, LayoutDashboard, LifeBuoy, Lock, Search, ShieldCheck, Store, Tag, Utensils, X } from "lucide-react";
import styles from "./AdminConsole.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import { eligibleOfferBatchItems, toggleBatchSelection } from "@/lib/admin/offer-batch";

type PageKey="merchant-review"|"offer-moderation"|"support-cases"|"audit-log";
type Merchant={id:string;ownerUserId:string;ownerEmail:string;name:string;businessType:string;address:string;city:string;phone:string;openingHours:string;status:string;decisionReason:string|null;createdAt:string};
type Offer={id:string;title:string;shopName:string;city:string;priceMinor:number;originalPriceMinor:number|null;quantityTotal:number;quantityReserved:number;allergensStatus:string;allergens:string|null;foodNotes:string|null;status:string;reportedCount:number;pickupStart:string|null;pickupEnd:string|null;imageUrl:string|null};
type CaseItem={id:string;reference:string;category:string;subject:string;description:string;priority:string;status:string;customerUserId:string;customerLabel:string;merchantId:string|null;merchantName:string|null;offerId:string|null;offerTitle:string|null;reservationReference:string|null;assignedTo:string|null;assigneeName:string|null;hiddenOffer:boolean;createdAt:string;updatedAt:string;resolvedAt:string|null};
type Timeline={id:string;authorType:string;authorUserId:string|null;authorLabel:string;visibility:string;message:string;createdAt:string};
type AuditRow={id:string;actorUserId:string;actorName:string;action:string;targetType:string;targetId:string;reason:string|null;result:string;correlationId:string|null;createdAt:string};
type Page<T>={items:T[];page:number;size:number;total:number};
type AuditPage=Page<AuditRow>;
type LabelMap=Record<string,string>;

const words={
    fr:{all:"Toutes",merchantTitle:"Revue des commerces",merchantLead:"Seuls les commerces approuvés peuvent publier des offres et recevoir des réservations.",offersTitle:"Modération des offres",offersLead:"Masquer, demander une correction ou rétablir une offre.",casesTitle:"Dossiers support",casesLead:"Réclamations clients et commerces, avec priorité à la sécurité alimentaire.",auditTitle:"Journal d’audit",auditLead:"Qui a fait quoi, sur quel dossier et pour quelle raison.",pending:"En attente",info:"Informations requises",approved:"Approuvés",rejected:"Refusés",review:"Fiche du commerce",businessDetails:"Informations sur le commerce",business:"Type d’activité",owner:"Propriétaire",phone:"Téléphone",email:"E-mail",address:"Adresse",hours:"Horaires",documents:"Documents",documentsMissing:"Le dépôt et le stockage des documents d’immatriculation et d’identité ne sont pas encore disponibles. Aucun fichier à consulter.",checklist:"Liste de vérification",locationChecked:"Adresse et localisation vérifiées",phoneChecked:"Téléphone joignable",docsChecked:"Documents lisibles et valides",decision:"Décision",approve:"Approuver",requestInfo:"Demander des informations",reject:"Refuser",reason:"Motif obligatoire",internalNote:"Note interne",save:"Enregistrer la décision",offer:"Offre",shop:"Commerce",price:"Prix",foodInfo:"Informations alimentaires",reports:"Signalements",status:"Statut",hide:"Masquer l’offre",askEdit:"Demander une correction",putLive:"Rétablir en ligne",keepHidden:"Garder masquée",open:"Ouvert",foodSafety:"Sécurité alimentaire",waiting:"En attente de réponse",resolved:"Résolu",high:"Élevée",medium:"Moyenne",low:"Faible",customer:"Client",reveal:"Révéler",masked:"Les informations du client sont masquées. Toute révélation est limitée par rôle, motivée et enregistrée.",disclosureReason:"Motif obligatoire de consultation",timeline:"Historique",reply:"Répondre au client",internal:"Note interne",send:"Envoyer",contactShop:"Contacter le commerce",escalate:"Escalader",resolve:"Résoudre le dossier",assign:"M’assigner",keepOffer:"Garder l’offre masquée",audit:"Événements",today:"Aujourd’hui",person:"Personne",action:"Action",record:"Dossier",result:"Résultat",success:"Succès",denied:"Refusé",export:"Exporter (journalisé)",immutable:"Les entrées ne peuvent pas être modifiées ou supprimées.",from:"Du",to:"Au",filter:"Filtrer",loading:"Chargement…",retry:"Réessayer",empty:"Aucun élément à afficher.",error:"Impossible de charger les données.",saveReason:"Un motif est requis pour cette action.",hiddenAllergens:"Non renseigné",note:"Les allergènes inconnus restent « Non renseigné »."},
    en:{all:"All",merchantTitle:"Merchant review",merchantLead:"Only approved shops can publish offers or take reservations.",offersTitle:"Offer moderation",offersLead:"Hide, request a correction or restore an offer.",casesTitle:"Support cases",casesLead:"Customer and shop reports, with food safety first.",auditTitle:"Audit log",auditLead:"Who did what, on which record, and why.",pending:"Pending",info:"Info required",approved:"Approved",rejected:"Rejected",review:"Merchant details",businessDetails:"Business details",business:"Business type",owner:"Owner",phone:"Phone",email:"Email",address:"Address",hours:"Opening hours",documents:"Documents",documentsMissing:"Business-registration and owner-ID document upload/storage is not available in the current backend. There are no files to view.",checklist:"Review checklist",locationChecked:"Address and location checked",phoneChecked:"Phone number reachable",docsChecked:"Documents readable and valid",decision:"Decision",approve:"Approve",requestInfo:"Request information",reject:"Reject",reason:"Reason (required)",internalNote:"Internal note",save:"Submit decision",offer:"Offer",shop:"Shop",price:"Price",foodInfo:"Food information",reports:"Reports",status:"Status",hide:"Hide offer",askEdit:"Ask shop to edit",putLive:"Put back live",keepHidden:"Keep hidden",open:"Open",foodSafety:"Food safety",waiting:"Waiting for reply",resolved:"Resolved",high:"High",medium:"Medium",low:"Low",customer:"Customer",reveal:"Reveal",masked:"Customer details stay masked by default. Authorized disclosures require a reason and are audited.",disclosureReason:"Reason for viewing customer details (required)",timeline:"Timeline",reply:"Reply to customer",internal:"Internal note",send:"Send",contactShop:"Contact shop",escalate:"Escalate",resolve:"Resolve case",assign:"Assign to me",keepOffer:"Keep offer hidden",audit:"Audit entries",today:"Today",person:"Person",action:"Action",record:"Record",result:"Result",success:"Success",denied:"Denied",export:"Export (logged)",immutable:"Entries cannot be edited or deleted.",from:"From",to:"To",filter:"Filter",loading:"Loading…",retry:"Retry",empty:"Nothing to show yet.",error:"Could not load the data.",saveReason:"A reason is required for this action.",hiddenAllergens:"Not provided",note:"Unknown allergens remain “Not provided”."},
    ar:{all:"الكل",merchantTitle:"مراجعة المتاجر",merchantLead:"المتاجر المعتمدة فقط يمكنها نشر العروض واستقبال الحجوزات.",offersTitle:"مراجعة العروض",offersLead:"إخفاء العرض أو طلب تعديله أو إعادته للنشر.",casesTitle:"طلبات الدعم",casesLead:"بلاغات العملاء والمتاجر مع أولوية سلامة الغذاء.",auditTitle:"سجل التدقيق",auditLead:"من قام بماذا وعلى أي سجل ولماذا.",pending:"قيد الانتظار",info:"معلومات مطلوبة",approved:"معتمد",rejected:"مرفوض",review:"بيانات المتجر",businessDetails:"تفاصيل النشاط التجاري",business:"نوع النشاط",owner:"المالك",phone:"الهاتف",email:"البريد",address:"العنوان",hours:"ساعات العمل",documents:"الوثائق",documentsMissing:"رفع وتخزين وثائق التسجيل وهوية المالك غير متاح حالياً في النظام. لا توجد ملفات للعرض.",checklist:"قائمة التحقق",locationChecked:"تم التحقق من العنوان والموقع",phoneChecked:"رقم الهاتف يعمل",docsChecked:"الوثائق واضحة وصالحة",decision:"القرار",approve:"موافقة",requestInfo:"طلب معلومات",reject:"رفض",reason:"السبب مطلوب",internalNote:"ملاحظة داخلية",save:"إرسال القرار",offer:"العرض",shop:"المتجر",price:"السعر",foodInfo:"معلومات الطعام",reports:"البلاغات",status:"الحالة",hide:"إخفاء العرض",askEdit:"طلب تعديل",putLive:"إعادة النشر",keepHidden:"إبقاء مخفي",open:"مفتوح",foodSafety:"سلامة الغذاء",waiting:"بانتظار الرد",resolved:"تم الحل",high:"مرتفع",medium:"متوسط",low:"منخفض",customer:"العميل",reveal:"إظهار",masked:"تبقى بيانات العميل مخفية افتراضياً. يتطلب إظهارها سبباً وصلاحية ويتم تسجيله.",disclosureReason:"سبب الاطلاع على بيانات العميل (مطلوب)",timeline:"السجل الزمني",reply:"الرد على العميل",internal:"ملاحظة داخلية",send:"إرسال",contactShop:"التواصل مع المتجر",escalate:"تصعيد",resolve:"حل الطلب",assign:"تعيين لي",keepOffer:"إبقاء العرض مخفياً",audit:"سجلات التدقيق",today:"اليوم",person:"الشخص",action:"الإجراء",record:"السجل",result:"النتيجة",success:"نجاح",denied:"مرفوض",export:"تصدير (مسجل)",immutable:"لا يمكن تعديل السجلات أو حذفها.",from:"من",to:"إلى",filter:"تصفية",loading:"جارٍ التحميل…",retry:"إعادة المحاولة",empty:"لا توجد عناصر للعرض.",error:"تعذر تحميل البيانات.",saveReason:"السبب مطلوب لهذا الإجراء.",hiddenAllergens:"غير محدد",note:"تبقى مسببات الحساسية غير المعروفة «غير محددة»."}
} as const;


const more={
    fr:{search:"Rechercher…",searchMerchant:"Rechercher commerces, propriétaires, villes",searchOffers:"Rechercher offres, commerces, villes",searchCases:"Rechercher dossiers, références, commerces",searchAudit:"Rechercher personnes, actions, dossiers, motifs",submitted:"Envoyée",stageApplication:"Demande",stageChecks:"Vérifications",stageDecision:"Décision",noDocumentsTitle:"Aucun document transmis",noDocumentsBody:"Le dépôt et le stockage des justificatifs ne sont pas encore disponibles dans KULHA.",approveUnlocks:"L’approbation est disponible après les trois vérifications.",caseReservation:"Réservation",caseOffer:"Offre",caseShop:"Commerce",replyToCustomer:"Répondre au client",internalNoteTab:"Note interne",replyVisibleHint:"Le client verra cette réponse.",internalVisibleHint:"Cette note reste visible uniquement par l’équipe KULHA.",selectedRecord:"Dossier sélectionné",when:"Quand",recordValue:"Enregistrement",application:"Dossier",escalated:"Escaladés",live:"En ligne",hiddenS:"Masquée",draftS:"Brouillon",expiredS:"Expirée",cancelledS:"Annulée",unpublishedS:"Dépubliée",complete:"Complet",report:"signalement",reportsN:"signalements",decisionNote:"Votre décision, le motif et votre nom sont enregistrés dans le journal d’audit.",actionNote:"Chaque action, motif et nom est enregistré dans le journal d’audit.",selectedOffer:"Offre sélectionnée",openOfferReview:"Ouvrir la modération",offerReviewHint:"Vérifiez les détails, les signalements et les informations alimentaires avant de prendre une décision.",offerDetails:"Détails de l’offre",needsReview:"À vérifier",reportedMetric:"Signalées",hiddenMetric:"Masquées",liveNow:"En ligne",reportedFilter:"Signalées",allergensUnknown:"Allergènes inconnus",hiddenFilter:"Masquées",foodSafetyTitle:"Sécurité alimentaire : allergènes inconnus",foodSafetyBody:"Les informations sur les allergènes doivent être vérifiées avant la remise en ligne.",stock:"Stock",reserved:"réservés",pickup:"Retrait",pickupUnavailable:"Créneau non renseigné",originalPrice:"Prix initial",reportsTitle:"Signalements",reportReceived:"signalements reçus pour cette offre.",noReports:"Aucun signalement n’a été reçu.",reasonMisleading:"Prix trompeur",reasonAllergens:"Allergènes manquants",reasonPhoto:"Photo incorrecte",reasonOther:"Autre",reinstateOnlyHidden:"La remise en ligne est réservée aux offres masquées.",keepHidden:"Garder masquée",auditRecorded:"Votre décision est enregistrée dans le journal d’audit.",originalValue:"Valeur d’origine",notVerified:"non vérifiée",assignedTo:"Assigné à",replyNote:"Réponse ou note interne",writeMessage:"Écrire un message…",visibleCustomer:"Visible par le client",sendCustomer:"Envoyer au client",saveNote:"Enregistrer la note interne",actionReason:"Motif de l’action (obligatoire pour contacter, escalader ou résoudre)",optional:"Facultatif",allResults:"Tous les résultats",docsTitle:"Documents",needsReason:"Choisissez une décision et indiquez un motif.",system:"Système",customerRole:"Client",openReview:"Ouvrir la vérification",closeReview:"Fermer",reviewHint:"Vérifiez les informations, complétez la checklist et prenez une décision."},
    en:{search:"Search…",searchMerchant:"Search shops, owners, cities",searchOffers:"Search offers, shops, cities",searchCases:"Search cases, references, shops",searchAudit:"Search people, actions, records, reasons",submitted:"Submitted",stageApplication:"Application",stageChecks:"Checks",stageDecision:"Decision",noDocumentsTitle:"No documents uploaded",noDocumentsBody:"Document upload and storage are not available in KULHA yet.",approveUnlocks:"Approval unlocks once all three checks are ticked.",caseReservation:"Reservation",caseOffer:"Offer",caseShop:"Shop",replyToCustomer:"Reply to customer",internalNoteTab:"Internal note",replyVisibleHint:"The customer will see this reply.",internalVisibleHint:"This note is visible only to the KULHA team.",selectedRecord:"Selected record",when:"When",recordValue:"Record",application:"Application",escalated:"Escalated",live:"Live",hiddenS:"Hidden",draftS:"Draft",expiredS:"Expired",cancelledS:"Cancelled",unpublishedS:"Unpublished",complete:"Complete",report:"report",reportsN:"reports",decisionNote:"Your decision, reason and name are saved in the audit log.",actionNote:"Every action, reason and name is saved in the audit log.",selectedOffer:"Selected offer",openOfferReview:"Open moderation",offerReviewHint:"Review the details, customer reports and food-safety information before recording a decision.",offerDetails:"Offer details",needsReview:"Needs review",reportedMetric:"Reported",hiddenMetric:"Hidden",liveNow:"Live now",reportedFilter:"Reported",allergensUnknown:"Allergens unknown",hiddenFilter:"Hidden",foodSafetyTitle:"Food safety: allergens unknown",foodSafetyBody:"Allergen information must be checked before this offer is restored.",stock:"Stock",reserved:"reserved",pickup:"Pickup",pickupUnavailable:"Pickup window not provided",originalPrice:"Original price",reportsTitle:"Reports",reportReceived:"reports received for this offer.",noReports:"No customer reports have been received.",reasonMisleading:"Misleading price",reasonAllergens:"Missing allergens",reasonPhoto:"Wrong photo",reasonOther:"Other",reinstateOnlyHidden:"Put live is only available for hidden offers.",keepHidden:"Keep hidden",auditRecorded:"Your decision is recorded in the audit log.",originalValue:"Original value",notVerified:"not verified",assignedTo:"Assigned to",replyNote:"Reply or internal note",writeMessage:"Write a message…",visibleCustomer:"Visible to the customer",sendCustomer:"Send to customer",saveNote:"Save internal note",actionReason:"Reason for the action (required to contact, escalate or resolve)",optional:"Optional",allResults:"All results",docsTitle:"Documents",needsReason:"Pick a decision and give a reason.",system:"System",customerRole:"Customer",openReview:"Review application",closeReview:"Close",reviewHint:"Check the business details, complete the checklist and record your decision."},
    ar:{search:"بحث…",searchMerchant:"ابحث عن المتاجر والمالكين والمدن",searchOffers:"ابحث عن العروض والمتاجر والمدن",searchCases:"ابحث عن الحالات والمراجع والمتاجر",searchAudit:"ابحث عن الأشخاص والإجراءات والسجلات والأسباب",submitted:"تاريخ الإرسال",stageApplication:"الطلب",stageChecks:"التحقق",stageDecision:"القرار",noDocumentsTitle:"لم يتم رفع أي وثائق",noDocumentsBody:"رفع الوثائق وتخزينها غير متاح حالياً في KULHA.",approveUnlocks:"تُتاح الموافقة بعد إكمال عمليات التحقق الثلاث.",caseReservation:"الحجز",caseOffer:"العرض",caseShop:"المتجر",replyToCustomer:"الرد على العميل",internalNoteTab:"ملاحظة داخلية",replyVisibleHint:"سيتمكن العميل من رؤية هذا الرد.",internalVisibleHint:"هذه الملاحظة مرئية لفريق KULHA فقط.",selectedRecord:"السجل المحدد",when:"التوقيت",recordValue:"السجل",application:"طلب",escalated:"مصعّدة",live:"منشور",hiddenS:"مخفي",draftS:"مسودة",expiredS:"منتهي",cancelledS:"ملغى",unpublishedS:"غير منشور",complete:"مكتمل",report:"بلاغ",reportsN:"بلاغات",decisionNote:"يتم حفظ قرارك والسبب واسمك في سجل التدقيق.",actionNote:"يتم حفظ كل إجراء وسببه واسمك في سجل التدقيق.",selectedOffer:"العرض المحدد",openOfferReview:"فتح المراجعة",offerReviewHint:"راجع التفاصيل وبلاغات العملاء ومعلومات سلامة الغذاء قبل تسجيل القرار.",offerDetails:"تفاصيل العرض",needsReview:"بحاجة إلى مراجعة",reportedMetric:"مُبلّغ عنها",hiddenMetric:"مخفية",liveNow:"منشورة الآن",reportedFilter:"المُبلّغ عنها",allergensUnknown:"مسببات الحساسية غير معروفة",hiddenFilter:"مخفية",foodSafetyTitle:"سلامة الغذاء: مسببات الحساسية غير معروفة",foodSafetyBody:"يجب التحقق من معلومات مسببات الحساسية قبل إعادة نشر العرض.",stock:"المخزون",reserved:"محجوز",pickup:"الاستلام",pickupUnavailable:"موعد الاستلام غير محدد",originalPrice:"السعر الأصلي",reportsTitle:"البلاغات",reportReceived:"بلاغات واردة عن هذا العرض.",noReports:"لا توجد بلاغات من العملاء.",reasonMisleading:"سعر مضلل",reasonAllergens:"مسببات الحساسية ناقصة",reasonPhoto:"صورة غير صحيحة",reasonOther:"أخرى",reinstateOnlyHidden:"إعادة النشر متاحة للعروض المخفية فقط.",keepHidden:"إبقاء مخفي",auditRecorded:"تم تسجيل قرارك في سجل التدقيق.",originalValue:"القيمة الأصلية",notVerified:"غير موثقة",assignedTo:"مُسند إلى",replyNote:"رد أو ملاحظة داخلية",writeMessage:"اكتب رسالة…",visibleCustomer:"ظاهر للعميل",sendCustomer:"إرسال للعميل",saveNote:"حفظ الملاحظة الداخلية",actionReason:"سبب الإجراء (مطلوب للتواصل أو التصعيد أو الحل)",optional:"اختياري",allResults:"كل النتائج",docsTitle:"الوثائق",needsReason:"اختر قراراً واذكر السبب.",system:"النظام",customerRole:"العميل",openReview:"مراجعة الطلب",closeReview:"إغلاق",reviewHint:"تحقق من بيانات المتجر وأكمل قائمة التحقق ثم سجل قرارك."}
} as const;

const loc=(l:SiteLocale)=>l==="ar"?"ar-MA":l==="en"?"en-MA":"fr-MA";
function amount(minor:number,l:SiteLocale){return new Intl.NumberFormat(loc(l),{maximumFractionDigits:2}).format(minor/100);}
function dateTime(value:string,l:SiteLocale){return new Intl.DateTimeFormat(loc(l),{timeZone:"Africa/Casablanca",weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}
function shortDateTime(value:string,l:SiteLocale){return new Intl.DateTimeFormat(loc(l),{timeZone:"Africa/Casablanca",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(value));}

const auditText={
    fr:{history:"Historique des activités",latest:"Plus récentes en premier",eventDetails:"Détails de l’événement",adminAction:"Action administrative",affected:"Élément concerné",dateTime:"Date et heure",category:"Catégorie",technicalAction:"Action technique",eventId:"Identifiant de l’événement",entityType:"Type d’enregistrement",identifier:"Identifiant",immutableNotice:"Cette entrée d’audit ne peut être ni modifiée ni supprimée.",pageSize:"Lignes par page",noMatches:"Aucun résultat pour cette recherche.",close:"Fermer",failed:"Échoué",searchHint:"Recherche dans les événements correspondants",searchLabel:"Recherche",exportCsv:"Exporter CSV",correlationId:"ID de corrélation"},
    en:{history:"Activity history",latest:"Newest first",eventDetails:"Event details",adminAction:"Administrative action",affected:"Affected record",dateTime:"Date and time",category:"Category",technicalAction:"Technical action",eventId:"Event ID",entityType:"Record type",identifier:"Identifier",immutableNotice:"This audit entry cannot be edited or deleted.",pageSize:"Rows per page",noMatches:"No events match your search.",close:"Close",failed:"Failed",searchHint:"Search matching audit events",searchLabel:"Search",exportCsv:"Export CSV",correlationId:"Correlation ID"},
    ar:{history:"سجل الأنشطة",latest:"الأحدث أولاً",eventDetails:"تفاصيل الحدث",adminAction:"الإجراء الإداري",affected:"السجل المتأثر",dateTime:"التاريخ والوقت",category:"التصنيف",technicalAction:"الإجراء التقني",eventId:"معرّف الحدث",entityType:"نوع السجل",identifier:"المعرّف",immutableNotice:"لا يمكن تعديل سجل التدقيق هذا أو حذفه.",pageSize:"عدد السجلات في الصفحة",noMatches:"لا توجد أحداث تطابق البحث.",close:"إغلاق",failed:"فشل",searchHint:"البحث في أحداث التدقيق المطابقة",searchLabel:"بحث",exportCsv:"تصدير CSV",correlationId:"معرّف الترابط"}
} as const;

/* NOTE: keep a space before "=" after a generic type annotation.
   `Record<A,Record<B,C>>={` is tokenised as `>>=` (right-shift-assign) and WebStorm's parser
   reports "',' expected" and then cascades into hundreds of follow-up errors. */
const auditActionNames:Record<SiteLocale,LabelMap> = {
    fr:{"offer.suspend":"Offre masquée","offer.reinstate":"Offre remise en ligne","offer.request-edit":"Correction demandée","support.reply":"Réponse envoyée","support.assign":"Dossier assigné","support.escalate":"Dossier escaladé","support.resolve":"Dossier résolu","merchant.request-info":"Informations demandées","merchant.approve":"Commerce approuvé","merchant.reject":"Commerce refusé"},
    en:{"offer.suspend":"Offer hidden","offer.reinstate":"Offer restored","offer.request-edit":"Correction requested","support.reply":"Reply sent","support.assign":"Case assigned","support.escalate":"Case escalated","support.resolve":"Case resolved","merchant.request-info":"Information requested","merchant.approve":"Merchant approved","merchant.reject":"Merchant rejected"},
    ar:{"offer.suspend":"تم إخفاء العرض","offer.reinstate":"تمت إعادة نشر العرض","offer.request-edit":"طُلب تعديل العرض","support.reply":"تم إرسال الرد","support.assign":"تم تعيين الحالة","support.escalate":"تم تصعيد الحالة","support.resolve":"تم حل الحالة","merchant.request-info":"طُلبت معلومات إضافية","merchant.approve":"تم اعتماد المتجر","merchant.reject":"تم رفض المتجر"}
};
const auditCategoryNames:Record<SiteLocale,LabelMap> = {
    fr:{offer:"Modération des offres",merchant:"Revue des commerces",support:"Support",security:"Sécurité",auth:"Authentification"},
    en:{offer:"Offer moderation",merchant:"Merchant review",support:"Support",security:"Security",auth:"Authentication"},
    ar:{offer:"مراجعة العروض",merchant:"مراجعة المتاجر",support:"الدعم",security:"الأمان",auth:"المصادقة"}
};
function auditActionLabel(action:string,locale:SiteLocale){
    const translated=auditActionNames[locale][action];
    if(translated)return translated;
    return action.split(/[._-]+/).filter(Boolean).map(part=>part.charAt(0).toLocaleUpperCase(locale)+part.slice(1)).join(" ");
}
function auditCategoryLabel(action:string,locale:SiteLocale){
    const prefix=action.split(".")[0];
    return auditCategoryNames[locale][prefix]??prefix;
}

/** Closes a popover when the user clicks outside `ref` or presses Escape. */
function useDismiss(open:boolean,ref:RefObject<HTMLElement|null>,setOpen:(open:boolean)=>void){
    useEffect(()=>{
        if(!open)return;
        const onPointerDown=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))setOpen(false);};
        const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false);};
        document.addEventListener("pointerdown",onPointerDown);
        document.addEventListener("keydown",onKeyDown);
        return()=>{document.removeEventListener("pointerdown",onPointerDown);document.removeEventListener("keydown",onKeyDown);};
    },[open,ref,setOpen]);
}

/** Offer photos are merchant-supplied URLs on arbitrary hosts. next/image would need each host
 *  whitelisted in next.config (images.remotePatterns), so a plain <img> is used on purpose here. */
function OfferImage({src,alt,lazy=false}:{src:string;alt:string;lazy?:boolean}){
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading={lazy?"lazy":undefined}/>;
}

type AuditDatePickerProps={label:string;value:string;onChange:(value:string)=>void;locale:SiteLocale;min?:string;max?:string;placeholder:string};
function auditDateFromValue(value:string){
    if(!value)return new Date();
    const [year,month,day]=value.split("-").map(Number);
    return new Date(year,month-1,day);
}
function auditDateValue(date:Date){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function AuditDatePicker({label,value,onChange,locale,min,max,placeholder}:AuditDatePickerProps){
    const [open,setOpen]=useState(false);
    const [visibleMonth,setVisibleMonth]=useState(()=>{const d=auditDateFromValue(value);return new Date(d.getFullYear(),d.getMonth(),1);});
    const rootRef=useRef<HTMLDivElement>(null);
    useDismiss(open,rootRef,setOpen);
    const firstDay=new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),1);
    const offset=(firstDay.getDay()+6)%7;
    const days=Array.from({length:42},(_,index)=>new Date(visibleMonth.getFullYear(),visibleMonth.getMonth(),index-offset+1));
    const weekdays=Array.from({length:7},(_,index)=>new Intl.DateTimeFormat(loc(locale),{weekday:"short"}).format(new Date(2024,0,1+index)).replace(/\.$/,""));
    const monthLabel=new Intl.DateTimeFormat(loc(locale),{month:"long",year:"numeric"}).format(visibleMonth);
    const displayValue=value?new Intl.DateTimeFormat(loc(locale),{day:"2-digit",month:"short",year:"numeric"}).format(auditDateFromValue(value)):placeholder;
    const today=auditDateValue(new Date());
    const rtl=locale==="ar";
    return <div className={styles.auditDatePicker} ref={rootRef} dir={rtl?"rtl":"ltr"}>
        <span className={styles.auditFilterLabel}>{label}</span>
        <div className={styles.auditDateTriggerRow}>
            <button type="button" className={`${styles.auditDateTrigger} ${open?styles.auditDateTriggerOpen:""}`} aria-label={label} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
                <CalendarDays size={18} className={styles.auditDateTriggerIcon} aria-hidden="true"/>
                <span className={`${styles.auditDateValue} ${value?"":styles.auditDatePlaceholder}`}>{displayValue}</span>
                <ChevronDown size={17} className={styles.auditDateChevron} aria-hidden="true"/>
            </button>
            {value&&<button type="button" className={styles.auditDateClear} aria-label={locale==="fr"?"Effacer la date":locale==="ar"?"مسح التاريخ":"Clear date"} onClick={()=>{onChange("");setOpen(false);}}><X size={14}/></button>}
        </div>
        {open&&<div className={styles.auditCalendarPopover} role="dialog" aria-label={label}>
            <div className={styles.auditCalendarHeader}>
                <button type="button" aria-label={locale==="fr"?"Mois précédent":locale==="ar"?"الشهر السابق":"Previous month"} onClick={()=>setVisibleMonth(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()-1,1))}><ChevronLeft size={17}/></button>
                <strong>{monthLabel}</strong>
                <button type="button" aria-label={locale==="fr"?"Mois suivant":locale==="ar"?"الشهر التالي":"Next month"} onClick={()=>setVisibleMonth(new Date(visibleMonth.getFullYear(),visibleMonth.getMonth()+1,1))}><ChevronRight size={17}/></button>
            </div>
            <div className={styles.auditCalendarGrid}>
                {weekdays.map((day,index)=><span key={`weekday-${index}`} className={styles.auditCalendarWeekday}>{day}</span>)}
                {days.map((day,index)=>{
                    const iso=auditDateValue(day);
                    const disabled=Boolean((min&&iso<min)||(max&&iso>max));
                    const outside=day.getMonth()!==visibleMonth.getMonth();
                    const selected=iso===value;
                    return <button key={iso+index} type="button" disabled={disabled} aria-pressed={selected} className={`${styles.auditCalendarDay} ${outside?styles.auditCalendarOutside:""} ${selected?styles.auditCalendarSelected:""} ${iso===today?styles.auditCalendarToday:""}`} onClick={()=>{onChange(iso);setVisibleMonth(new Date(day.getFullYear(),day.getMonth(),1));setOpen(false);}}>{day.getDate()}</button>;
                })}
            </div>
            <div className={styles.auditCalendarFooter}>
                <button type="button" onClick={()=>{onChange(today);setVisibleMonth(new Date(new Date().getFullYear(),new Date().getMonth(),1));setOpen(false);}}>{locale==="fr"?"Aujourd’hui":locale==="ar"?"اليوم":"Today"}</button>
                <button type="button" onClick={()=>setOpen(false)}>{locale==="fr"?"Fermer":locale==="ar"?"إغلاق":"Close"}</button>
            </div>
        </div>}
    </div>;
}

type AuditSelectOption={value:string;label:string;description?:string};
type AuditSelectProps={label:string;value:string;options:AuditSelectOption[];onChange:(value:string)=>void;icon?:ReactNode;className?:string;menuPlacement?:"top"|"bottom"};
function AuditSelect({label,value,options,onChange,icon,className,menuPlacement="bottom"}:AuditSelectProps){
    const [open,setOpen]=useState(false);
    const rootRef=useRef<HTMLDivElement>(null);
    useDismiss(open,rootRef,setOpen);
    const selected=options.find(option=>option.value===value)??options[0];
    return <div className={`${styles.auditSelectField} ${className||""}`} ref={rootRef}>
        <span className={styles.auditFilterLabel}>{label}</span>
        <button type="button" className={`${styles.auditSelectTrigger} ${open?styles.auditSelectTriggerOpen:""}`} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
            {icon&&<span className={styles.auditSelectIcon}>{icon}</span>}
            <span className={styles.auditSelectSelected}>
                <strong>{selected?.label??label}</strong>
                {selected?.description&&<small>{selected.description}</small>}
            </span>
            <ChevronDown size={17} className={styles.auditSelectChevron}/>
        </button>
        {open&&<div className={`${styles.auditSelectMenu} ${menuPlacement==="top"?styles.auditSelectMenuTop:""}`} role="listbox" aria-label={label}>
            {options.map(option=><button key={option.value||"__all"} type="button" role="option" aria-selected={option.value===value} className={`${styles.auditSelectOption} ${option.value===value?styles.auditSelectOptionSelected:""}`} onClick={()=>{onChange(option.value);setOpen(false);}}>
                <span>{option.label}</span>{option.description&&<small>{option.description}</small>}
                {option.value===value&&<span className={styles.auditSelectCheck}>✓</span>}
            </button>)}
        </div>}
    </div>;
}

const merchantStatuses=["PENDING","INFO_REQUIRED","APPROVED","REJECTED"] as const;
const MERCHANT_PAGE_SIZE=3;
const OFFER_PAGE_SIZE=5;
const CASE_PAGE_SIZE=4;
const AUDIT_PAGE_SIZE=10;

type PaginationLabels={previous:string;next:string;of:string;label:string};
function AdminPagination({page,pageCount,total,size,labels,onChange,loading}:{page:number;pageCount:number;total:number;size:number;labels:PaginationLabels;onChange:(page:number)=>void;loading:boolean}){
    const visible=[...new Set([0,pageCount-1,...Array.from({length:3},(_,index)=>page-1+index).filter(value=>value>0&&value<pageCount-1)])].sort((a,b)=>a-b);
    const pages:(number|null)[]=[];
    visible.forEach((value,index)=>{if(index>0&&value-visible[index-1]>1)pages.push(null);pages.push(value);});
    const from=total===0?0:page*size+1;
    const to=Math.min(total,(page+1)*size);
    return <nav className={styles.pagination} aria-label={labels.label}>
        <span className={styles.paginationSummary}>{from}–{to} {labels.of} {total}</span>
        <div className={styles.paginationControls}>
            <button type="button" className={styles.pageButton} disabled={loading||page===0} onClick={()=>onChange(Math.max(0,page-1))}>{labels.previous}</button>
            {pages.map((value,index)=>value===null?<span key={`ellipsis-${index}`} className={styles.paginationEllipsis}>…</span>:<button key={value} type="button" className={value===page?styles.pageCurrent:styles.pageNumber} aria-current={value===page?"page":undefined} disabled={loading} onClick={()=>onChange(value)}>{value+1}</button>)}
            <button type="button" className={styles.pageButton} disabled={loading||page>=pageCount-1} onClick={()=>onChange(Math.min(pageCount-1,page+1))}>{labels.next}</button>
        </div>
    </nav>;
}

type MerchantAction="approve"|"request-information"|"reject";
type OfferAction="suspend"|"request-edit"|"reinstate";
type BatchOfferResult={id:string;title:string;ok:boolean;detail:string};
type BatchMerchantResult={id:string;name:string;ok:boolean;detail:string};

export function AdminConsole({locale,page}:{locale:SiteLocale;page:PageKey}){
    const t={...words[locale],...more[locale]};const {state}=useSession();const actorId=state.status==="authenticated"?state.user.id:"";const roles=state.status==="authenticated"?state.user.roles:[];const isSupportOnly=roles.includes("SUPPORT")&&!roles.includes("ADMIN")&&!roles.includes("SUPER_ADMIN");
    const [loading,setLoading]=useState(true);const [failed,setFailed]=useState(false);const [reload,setReload]=useState(0);const [message,setMessage]=useState("");const [query,setQuery]=useState("");
    const [merchants,setMerchants]=useState<Page<Merchant>|null>(null);const [merchantStatus,setMerchantStatus]=useState("PENDING");const [merchantPage,setMerchantPage]=useState(0);const [selectedMerchant,setSelectedMerchant]=useState<Merchant|null>(null);const [merchantAction,setMerchantAction]=useState<MerchantAction|null>(null);const [checks,setChecks]=useState([false,false,false]);const [tabCounts,setTabCounts]=useState<{pending:number|null;info:number|null}>({pending:null,info:null});
    const [selectedMerchants,setSelectedMerchants]=useState<Record<string,Merchant>>({});const [batchMerchantOpen,setBatchMerchantOpen]=useState(false);const [batchMerchantAction,setBatchMerchantAction]=useState<Exclude<MerchantAction,"approve">>("request-information");const [batchMerchantReason,setBatchMerchantReason]=useState("");const [batchMerchantNote,setBatchMerchantNote]=useState("");const [batchMerchantResults,setBatchMerchantResults]=useState<BatchMerchantResult[]|null>(null);const [batchMerchantWorking,setBatchMerchantWorking]=useState(false);
    const [offers,setOffers]=useState<Page<Offer>|null>(null);const [offerStatus,setOfferStatus]=useState("");const [offerPage,setOfferPage]=useState(0);const [selectedOffer,setSelectedOffer]=useState<Offer|null>(null);const [offerAction,setOfferAction]=useState<OfferAction>("suspend");const [offerConfirmOpen,setOfferConfirmOpen]=useState(false);
    const [selectedOffers,setSelectedOffers]=useState<Record<string,Offer>>({});const [batchOfferOpen,setBatchOfferOpen]=useState(false);const [batchOfferAction,setBatchOfferAction]=useState<OfferAction>("suspend");const [batchOfferReason,setBatchOfferReason]=useState("");const [batchOfferResults,setBatchOfferResults]=useState<BatchOfferResult[]|null>(null);const [batchOfferWorking,setBatchOfferWorking]=useState(false);
    const [cases,setCases]=useState<Page<CaseItem>|null>(null);const [caseStatus,setCaseStatus]=useState("OPEN");const [casePage,setCasePage]=useState(0);const [selectedCase,setSelectedCase]=useState<{summary:CaseItem;timeline:Timeline[]}|null>(null);const [caseCounts,setCaseCounts]=useState<{open:number|null;escalated:number|null;waiting:number|null;resolved:number|null}>({open:null,escalated:null,waiting:null,resolved:null});
    const [audit,setAudit]=useState<AuditPage|null>(null);const [auditPage,setAuditPage]=useState(0);const [auditPageSize,setAuditPageSize]=useState(AUDIT_PAGE_SIZE);const [selectedAuditId,setSelectedAuditId]=useState<string|null>(null);const [auditModalOpen,setAuditModalOpen]=useState(false);const [auditSearch,setAuditSearch]=useState("");const [auditFrom,setAuditFrom]=useState("");const [auditTo,setAuditTo]=useState("");const [auditAction,setAuditAction]=useState("");const [auditResult,setAuditResult]=useState("");
    const [reason,setReason]=useState("");const [disclosureReason,setDisclosureReason]=useState("");const [internalNote,setInternalNote]=useState("");const [draftMessage,setDraftMessage]=useState("");const [sendToCustomer,setSendToCustomer]=useState(true);const [revealed,setRevealed]=useState<{fullName:string;email:string;phone:string|null}|null>(null);const [working,setWorking]=useState(false);

    useEffect(()=>{if(page!=="audit-log")return;const timeout=window.setTimeout(()=>setAuditSearch(query.trim()),280);return()=>window.clearTimeout(timeout);},[page,query]);

    useEffect(()=>{let active=true;
        const load=async()=>{try{
            if(page==="merchant-review"){const data=await api.get<Page<Merchant>>("/admin/merchants?status="+merchantStatus+"&page="+merchantPage+"&size="+MERCHANT_PAGE_SIZE);if(active){setMerchants(data);setFailed(false);setSelectedMerchant(data.items[0]??null);setMerchantAction(null);setChecks([false,false,false]);setReason("");setInternalNote("");}
                const [p,i]=await Promise.allSettled([api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=1"),api.get<Page<Merchant>>("/admin/merchants?status=INFO_REQUIRED&page=0&size=1")]);
                if(active)setTabCounts({pending:p.status==="fulfilled"?p.value.total:null,info:i.status==="fulfilled"?i.value.total:null});}
            if(page==="offer-moderation"){const data=await api.get<Page<Offer>>(`/admin/offers?page=${offerPage}&size=${OFFER_PAGE_SIZE}`);if(active){const lastPage=Math.max(0,Math.ceil(data.total/Math.max(1,data.size))-1);if(offerPage>lastPage){setOfferPage(lastPage);return;}setOffers(data);setFailed(false);setSelectedOffer(data.items[0]??null);setOfferAction(data.items[0]?.status==="SUSPENDED"?"reinstate":"suspend");}}
            if(page==="support-cases"){
                const data=await api.get<Page<CaseItem>>("/admin/support-cases?status="+caseStatus+"&page="+casePage+"&size="+CASE_PAGE_SIZE);
                if(active){setCases(data);setFailed(false);}
                const statuses=["OPEN","ESCALATED","WAITING_REPLY","RESOLVED"] as const;
                const stats=await Promise.allSettled(statuses.map(status=>api.get<Page<CaseItem>>("/admin/support-cases?status="+status+"&page=0&size=1")));
                if(active)setCaseCounts({open:stats[0].status==="fulfilled"?stats[0].value.total:null,escalated:stats[1].status==="fulfilled"?stats[1].value.total:null,waiting:stats[2].status==="fulfilled"?stats[2].value.total:null,resolved:stats[3].status==="fulfilled"?stats[3].value.total:null});
                if(data.items[0]){const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+data.items[0].reference);if(active)setSelectedCase(d);}else if(active)setSelectedCase(null);
            }
            if(page==="audit-log"){const q=new URLSearchParams();if(auditFrom)q.set("from",auditFrom);if(auditTo)q.set("to",auditTo);if(auditAction)q.set("action",auditAction);if(auditResult)q.set("result",auditResult);if(auditSearch)q.set("q",auditSearch);q.set("page",String(auditPage));q.set("size",String(auditPageSize));const data=await api.get<AuditPage>("/admin/audit-log?"+q.toString());if(active){setAudit(data);setSelectedAuditId(data.items[0]?.id??null);setAuditModalOpen(false);setFailed(false);}}
        }catch{if(active)setFailed(true);}finally{if(active)setLoading(false);}};
        void load();return()=>{active=false;};
    },[page,reload,merchantStatus,merchantPage,caseStatus,casePage,auditFrom,auditTo,auditAction,auditResult,auditPage,auditPageSize,auditSearch,offerPage]);

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

    async function loadMerchant(id:string){setWorking(true);try{const data=await api.get<Merchant>("/admin/merchants/"+id);setSelectedMerchant(data);setReason("");setInternalNote("");setMerchantAction(null);setChecks([false,false,false]);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function submitMerchant(){
        if(!selectedMerchant)return;if(!merchantAction||!reason.trim()){setMessage(t.needsReason);return;}if(merchantAction==="approve"){setMessage("Approval is unavailable: documents cannot be verified by the current system.");return;}setWorking(true);setMessage("");
        try{await api.post("/admin/merchants/"+selectedMerchant.id+"/"+merchantAction,{reason:reason.trim(),internalNote:internalNote.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedMerchant(null);setReason("");setInternalNote("");setMerchantAction(null);}
        catch(error){setMessage(error instanceof ApiError?(error.detail||error.title):t.error);}finally{setWorking(false);}
    }
    async function runBatchMerchantDecision(){
        if(!batchMerchantReason.trim()){setMessage(t.saveReason);return;}
        const items=Object.values(selectedMerchants);
        if(!items.length)return;
        setBatchMerchantWorking(true);
        const results:BatchMerchantResult[]=batchMerchantResults?.filter(item=>item.ok)??[];
        for(const item of items){
            try{
                await api.post("/admin/merchants/"+item.id+"/"+batchMerchantAction,{reason:batchMerchantReason.trim(),internalNote:batchMerchantNote.trim()});
                results.push({id:item.id,name:item.name,ok:true,detail:t.success});
                setSelectedMerchants(current=>{const next={...current};delete next[item.id];return next;});
            }catch(error){
                results.push({id:item.id,name:item.name,ok:false,detail:error instanceof ApiError?(error.detail||error.title):t.error});
            }
        }
        setBatchMerchantResults(results);setBatchMerchantWorking(false);setReload(v=>v+1);
    }
    async function submitOffer(){
        if(!selectedOffer)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);setMessage("");
        try{await api.post("/admin/offers/"+selectedOffer.id+"/"+offerAction,{reason:reason.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedOffer(null);setReason("");setOfferConfirmOpen(false);}
        catch(error){setMessage(error instanceof ApiError?(error.detail||error.title):t.error);}finally{setWorking(false);}
    }
    function toggleOfferSelection(offer:Offer){
        setSelectedOffers(current=>{
            const next=toggleBatchSelection(current,offer);
            if(next===current&&Object.keys(current).length>=20&&!current[offer.id])setMessage("A batch is limited to 20 offers.");
            return next;
        });
    }
    async function runBatchOfferDecision(){
        const candidates=eligibleOfferBatchItems(Object.values(selectedOffers),batchOfferAction);
        if(!batchOfferReason.trim()){setMessage(t.saveReason);return;}
        if(!candidates.length){setMessage(t.reinstateOnlyHidden);return;}
        setBatchOfferWorking(true);setMessage("");
        const results:BatchOfferResult[]=batchOfferResults?.filter(item=>item.ok)??[];
        for(const item of candidates){
            try{
                await api.post("/admin/offers/"+item.id+"/"+batchOfferAction,{reason:batchOfferReason.trim()});
                results.push({id:item.id,title:item.title,ok:true,detail:t.success});
                setSelectedOffers(current=>{const next={...current};delete next[item.id];return next;});
            }catch(error){
                const detail=error instanceof ApiError?(error.detail||error.title):t.error;
                results.push({id:item.id,title:item.title,ok:false,detail});
            }
        }
        setBatchOfferResults(results);setBatchOfferWorking(false);setReload(v=>v+1);
    }
    async function loadCase(reference:string){setWorking(true);setRevealed(null);setDisclosureReason("");try{const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+reference);setSelectedCase(d);setReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function caseAction(action:string){if(!selectedCase)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/actions",{action,reason:reason.trim()});setMessage(t.save);await loadCase(selectedCase.summary.reference);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function sendMessage(event:SyntheticEvent<HTMLFormElement>){event.preventDefault();if(!selectedCase||!draftMessage.trim())return;setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/messages",{message:draftMessage.trim(),sendToCustomer});setDraftMessage("");await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function revealCustomer(){if(!selectedCase)return;if(!disclosureReason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{const d=await api.post<{fullName:string;email:string;phone:string|null}>("/admin/support-cases/"+selectedCase.summary.reference+"/reveal-customer",{reason:disclosureReason.trim()});setRevealed(d);setDisclosureReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function assignToMe(){if(!selectedCase||!actorId)return;setWorking(true);try{await api.put("/admin/support-cases/"+selectedCase.summary.reference+"/assignee",{assignedTo:actorId});await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
    function exportAudit(){const p=new URLSearchParams();if(auditFrom)p.set("from",auditFrom);if(auditTo)p.set("to",auditTo);if(auditAction)p.set("action",auditAction);if(auditResult)p.set("result",auditResult);if(auditSearch)p.set("q",auditSearch);const a=document.createElement("a");a.href="/api/bff/admin/audit-log/export?"+p.toString();a.download="kulha-audit-log.csv";a.click();}
    const switchTab=(apply:()=>void)=>{setLoading(true);setFailed(false);apply();};

    const searchPlaceholder=page==="merchant-review"?t.searchMerchant:page==="offer-moderation"?t.searchOffers:page==="support-cases"?t.searchCases:t.searchAudit;
    const navigation=[
        {key:"overview",href:"/admin",label:locale==="fr"?"Vue d’ensemble":locale==="ar"?"نظرة عامة":"Overview",icon:LayoutDashboard},
        {key:"offer-moderation",href:"/admin/offer-moderation",label:locale==="fr"?"Offres":locale==="ar"?"العروض":"Offers",icon:Tag},
        {key:"merchant-review",href:"/admin/merchant-review",label:locale==="fr"?"Commerces":locale==="ar"?"المتاجر":"Merchants",icon:Store},
        {key:"support-cases",href:"/admin/support-cases",label:locale==="fr"?"Support":locale==="ar"?"الدعم":"Support",icon:LifeBuoy},
        {key:"audit-log",href:"/admin/audit-log",label:locale==="fr"?"Journal d’audit":locale==="ar"?"سجل التدقيق":"Audit log",icon:ClipboardList}
    ] as const;
    const topbar=<header className={styles.topbar} data-testid="admin-console-topbar">
        {page!=="audit-log"&&<label className={styles.search} data-testid="admin-console-search"><Search size={17} aria-hidden="true"/><span className="sr-only">{searchPlaceholder}</span><input type="search" data-testid="admin-global-search" value={query} onChange={e=>{setQuery(e.target.value);}} placeholder={searchPlaceholder}/></label>}
        <div className={styles.adminTopbarRight}><nav aria-label={locale==="fr"?"Langue":locale==="ar"?"اللغة":"Language"} className={styles.adminLanguages}>{(["fr","en","ar"] as const).map(value=><Link key={value} href={localePath(value,page==="merchant-review"?"/admin/merchant-review":page==="offer-moderation"?"/admin/offer-moderation":page==="support-cases"?"/admin/support-cases":"/admin/audit-log")} aria-current={locale===value?"page":undefined}>{value.toUpperCase()}</Link>)}</nav><span className={styles.adminIdentity}>{locale==="fr"?"Administration":locale==="ar"?"الإدارة":"Administrator"}</span><span className={styles.adminAvatar} aria-hidden="true">K</span></div>
    </header>;
    const frame=(content:ReactNode)=><div className={`${styles.shell} kulhaAdminShell`} data-page={page} dir={locale==="ar"?"rtl":"ltr"}>
        <aside className={styles.adminSidebar}><Link href={localePath(locale,"/admin")} className={styles.adminBrand} aria-label="KULHA!"><span>Kulha<span>!</span></span></Link><nav className={styles.adminNavigation} aria-label={locale==="fr"?"Navigation principale":locale==="ar"?"التنقل الرئيسي":"Main navigation"}>{navigation.map(item=>{const Icon=item.icon;return <Link key={item.key} href={localePath(locale,item.href)} className={item.key===page?styles.adminNavActive:styles.adminNavLink} aria-current={item.key===page?"page":undefined}><Icon size={18} aria-hidden="true"/><span>{item.label}</span></Link>;})}</nav><p className={styles.adminSidebarFoot}>KULHA! · ADMIN</p></aside>
        <div className={styles.adminMain}>{topbar}<main className={styles.page}>{content}</main></div>
    </div>;

    if(loading)return frame(<><div className={styles.header}><div><div className={styles.skeleton}/><div className={styles.skeletonWide}/></div></div><div className={styles.skeletonPanel}/></>);
    if(failed)return frame(<div className={styles.alert} role="alert">{t.error}<button onClick={()=>{setLoading(true);setFailed(false);setReload(v=>v+1);}}>{t.retry}</button></div>);

    const merchantItems=merchants?.items.filter(m=>match(m.name,m.businessType,m.city,m.ownerEmail))??[];
    const allOfferItems=offers?.items??[];
    const offerItems=allOfferItems.filter(o=>{
        const matchesQuery=match(o.title,o.shopName,o.city);
        const matchesFilter=!offerStatus||(offerStatus==="NEEDS_REVIEW"&&(o.reportedCount>0||o.allergensStatus==="UNKNOWN"))||(offerStatus==="REPORTED"&&o.reportedCount>0)||(offerStatus==="ALLERGENS_UNKNOWN"&&o.allergensStatus==="UNKNOWN")||(offerStatus==="SUSPENDED"&&o.status==="SUSPENDED");
        return matchesQuery&&matchesFilter;
    });
    const needsReviewCount=allOfferItems.filter(o=>o.reportedCount>0||o.allergensStatus==="UNKNOWN").length;
    const reportedOfferCount=allOfferItems.filter(o=>o.reportedCount>0).length;
    const unknownAllergenCount=allOfferItems.filter(o=>o.allergensStatus==="UNKNOWN").length;
    const hiddenOfferCount=allOfferItems.filter(o=>o.status==="SUSPENDED").length;
    const liveOfferCount=allOfferItems.filter(o=>o.status==="PUBLISHED").length;
    const offerPageCount=Math.max(1,Math.ceil((offers?.total??0)/Math.max(1,offers?.size??OFFER_PAGE_SIZE)));
    const pagerLabels:PaginationLabels=locale==="fr"?{previous:"Précédent",next:"Suivant",of:"sur",label:"Pagination"}:locale==="ar"?{previous:"السابق",next:"التالي",of:"من",label:"التنقل بين الصفحات"}:{previous:"Previous",next:"Next",of:"of",label:"Pagination"};
    const merchantPageCount=Math.max(1,Math.ceil((merchants?.total??0)/Math.max(1,merchants?.size??MERCHANT_PAGE_SIZE)));
    const casePageCount=Math.max(1,Math.ceil((cases?.total??0)/Math.max(1,cases?.size??CASE_PAGE_SIZE)));
    const auditPageCount=Math.max(1,Math.ceil((audit?.total??0)/Math.max(1,audit?.size??AUDIT_PAGE_SIZE)));
    const caseItems=cases?.items.filter(c=>match(c.subject,c.reference,c.merchantName,c.reservationReference,c.offerTitle))??[];
    const auditItems=audit?.items.filter(a=>match(a.actorName,a.actorUserId,a.action,a.targetType,a.targetId,a.reason,a.correlationId))??[];
    const selectedAudit=auditItems.find(item=>item.id===selectedAuditId)??null;
    const auditUi=auditText[locale];
    const resultLabel=(r:string)=>r==="SUCCESS"?t.success:r==="DENIED"?t.denied:r==="FAILED"?auditUi.failed:r;
    const resultTone=(r:string)=>r==="SUCCESS"?styles.toneOk:r==="DENIED"||r==="FAILED"?styles.toneBad:styles.toneMuted;
    const resultPill=(r:string)=><span className={styles.pill+" "+resultTone(r)}>{resultLabel(r)}</span>;
    const tabCount=(value:string)=>value==="PENDING"?(merchantStatus==="PENDING"?merchants?.total:tabCounts.pending):value==="INFO_REQUIRED"?(merchantStatus==="INFO_REQUIRED"?merchants?.total:tabCounts.info):merchantStatus===value?merchants?.total:null;

    return frame(<>
        <header className={`${styles.header} ${page==="offer-moderation"?styles.offerHeader:""}`} data-testid="admin-page-heading">
            <div className={styles.headerCopy}><h1>{title}</h1><p>{lead}</p></div>
            {page==="offer-moderation"&&offers&&<div className={styles.offerMetrics}>
                <article><strong>{needsReviewCount}</strong><span>{t.needsReview}</span></article>
                <article><strong>{reportedOfferCount}</strong><span>{t.reportedMetric}</span></article>
                <article><strong>{hiddenOfferCount}</strong><span>{t.hiddenMetric}</span></article>
                <article><strong>{liveOfferCount}</strong><span>{t.liveNow}</span></article>
            </div>}
            {page==="audit-log"&&<button className={styles.ghostBtn} disabled={working} onClick={()=>void exportAudit()}><FileText size={16} aria-hidden="true"/>{auditText[locale].exportCsv}</button>}
        </header>
        {message&&<div className={styles.notice} role="status">{message}</div>}

        {page==="merchant-review"&&merchants&&<>
            <div className={styles.tabs} role="tablist" aria-label={t.merchantTitle}>{merchantStatuses.map(value=>{const n=tabCount(value);return <button key={value} role="tab" aria-selected={merchantStatus===value} className={merchantStatus===value?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setMerchantStatus(value);setMerchantPage(0);setSelectedMerchant(null);setReason("");setInternalNote("");})}>{merchantLabel(value)}{typeof n==="number"?" · "+n:""}</button>;})}</div>
            <div className={styles.merchantReviewWorkspace}>
                <section className={styles.merchantPicker} aria-label={t.merchantTitle}>
                    <div className={styles.list} data-testid="merchant-review-list">{merchantItems.map(item=><div key={item.id} className={styles.merchantBatchRow}>
                        <label className={styles.offerSelectControl}><input type="checkbox" checked={Boolean(selectedMerchants[item.id])} onChange={()=>setSelectedMerchants(current=>toggleBatchSelection(current,item))} aria-label={"Select "+item.name}/></label>
                        <button type="button" className={selectedMerchant?.id===item.id?styles.merchantSelected:styles.merchantListItem} onClick={()=>void loadMerchant(item.id)}>
                            <span className={styles.merchantListTop}><strong>{item.name}</strong><em className={styles.pill+" "+merchantTone(item.status)}>{merchantLabel(item.status)}</em></span>
                            <small>{item.businessType} · {item.city}</small><small>{item.ownerEmail}</small>
                        </button>
                    </div>)}</div>{!merchantItems.length&&<p className={styles.empty}>{t.empty}</p>}
                    {Object.keys(selectedMerchants).length>0&&<div className={styles.offerBatchBar} data-testid="merchant-batch-bar"><span><strong>{Object.keys(selectedMerchants).length}</strong> merchants selected</span><button type="button" className={styles.linkBtn} onClick={()=>setSelectedMerchants({})}>Clear</button><button type="button" className={styles.primary} onClick={()=>{setBatchMerchantOpen(true);setBatchMerchantResults(null);setBatchMerchantReason("");setBatchMerchantNote("");setBatchMerchantAction("request-information");}}>Review together →</button></div>}
                    <AdminPagination page={merchantPage} pageCount={merchantPageCount} total={merchants.total} size={merchants.size||MERCHANT_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setMerchantPage(next);setSelectedMerchant(null);}} />
                </section>
                <section className={styles.card+" "+styles.merchantDetails} data-testid="merchant-review-detail-panel">
                    {!selectedMerchant?<p className={styles.empty}>{t.empty}</p>:<>
                        <div className={styles.detailHead}><div><small>{t.application} KLH-M-{selectedMerchant.id.slice(0,4).toUpperCase()}</small><h2>{selectedMerchant.name}</h2></div><span className={styles.pill+" "+merchantTone(selectedMerchant.status)}>{merchantLabel(selectedMerchant.status)}</span></div>
                        <div className={styles.merchantStepper} aria-label={t.application}>
                            <div className={styles.stepDone}><span>✓</span><strong>{t.stageApplication}</strong></div><i aria-hidden="true"/>
                            <div className={styles.stepCurrent}><span>2</span><strong>{t.stageChecks}</strong></div><i aria-hidden="true"/>
                            <div className={styles.stepPending}><span>3</span><strong>{t.stageDecision}</strong></div>
                        </div>
                        <section className={styles.merchantPreviewInfo}>
                            <h3>{t.businessDetails}</h3>
                            <dl className={styles.merchantFacts}>
                                <div><dt>{t.business}</dt><dd>{selectedMerchant.businessType}</dd></div>
                                <div><dt>{t.address}</dt><dd>{selectedMerchant.city} · {selectedMerchant.address}</dd></div>
                                <div><dt>{t.phone}</dt><dd>{selectedMerchant.phone}</dd></div>
                                <div><dt>{t.email}</dt><dd>{selectedMerchant.ownerEmail}</dd></div>
                                <div><dt>{t.submitted}</dt><dd>{dateTime(selectedMerchant.createdAt,locale)}</dd></div>
                            </dl>
                        </section>
                        <div className={styles.merchantInlineBody} data-testid="merchant-review-workflow">
                            <div className={styles.merchantModalColumn}>
                                <section className={styles.merchantModalSection}>
                                    <h3>{t.documents}</h3>
                                    <div className={styles.missingDocs}><FileText size={18} aria-hidden="true"/><span><strong>{t.noDocumentsTitle}</strong><small>{t.noDocumentsBody}</small></span></div>
                                </section>
                            </div>
                            <div className={styles.merchantModalColumn}>
                                <section className={styles.merchantModalSection}>
                                    <h3>{t.checklist}</h3>
                                    <div className={styles.missingDocs}><Lock size={18} aria-hidden="true"/><span><strong>{t.noDocumentsTitle}</strong><small>{t.noDocumentsBody}</small></span></div>
                                    <p className={styles.approveNote}>Approval remains blocked until document verification is enforced by the backend.</p>
                                </section>
                                <section className={styles.merchantDecision+" "+styles.merchantModalDecision} data-testid="merchant-review-decision">
                                    <h3>{t.decision}</h3>
                                    <div className={styles.segment} role="group" aria-label={t.decision}>
                                        <button type="button" aria-pressed={merchantAction==="approve"} className={styles.segApprove+" "+(merchantAction==="approve"?styles.segOn:"")} disabled={true} onClick={()=>setMerchantAction("approve")}>{t.approve}</button>
                                        <button type="button" aria-pressed={merchantAction==="request-information"} className={styles.segInfo+" "+(merchantAction==="request-information"?styles.segOn:"")} onClick={()=>setMerchantAction("request-information")}>{t.requestInfo}</button>
                                        <button type="button" aria-pressed={merchantAction==="reject"} className={styles.segReject+" "+(merchantAction==="reject"?styles.segOn:"")} onClick={()=>setMerchantAction("reject")}>{t.reject}</button>
                                    </div>
                                    <div className={styles.merchantDecisionFields}>
                                        <label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
                                        <label className={styles.field}><span>{t.internalNote} · {t.optional}</span><textarea rows={3} value={internalNote} onChange={e=>setInternalNote(e.target.value)} placeholder={t.optional}/></label>
                                    </div>
                                </section>
                            </div>
                        </div>
                        <footer className={styles.merchantInlineFooter} data-testid="merchant-review-footer">
                            <p><ShieldCheck size={15} aria-hidden="true"/>{t.decisionNote}</p>
                            <button className={styles.primary} disabled={working||!merchantAction||!reason.trim()||merchantAction==="approve"} onClick={()=>void submitMerchant()}>{working?t.loading:t.save}</button>
                        </footer>
                    </>}
                </section>
            </div>
            
        </>}
        {page==="offer-moderation"&&offers&&<>
            <div className={styles.offerWorkspace} data-testid="offer-workspace">
                <section className={styles.offerPicker} aria-label={t.offersTitle} data-testid="offer-picker">
                    <div className={styles.tabs} role="tablist" aria-label={t.filter}>
                        {[
                            {value:"NEEDS_REVIEW",label:t.needsReview,count:needsReviewCount},
                            {value:"",label:t.all,count:offers.total},
                            {value:"REPORTED",label:t.reportedFilter,count:reportedOfferCount},
                            {value:"ALLERGENS_UNKNOWN",label:t.allergensUnknown,count:unknownAllergenCount},
                            {value:"SUSPENDED",label:t.hiddenFilter,count:hiddenOfferCount}
                        ].map(tab=><button key={tab.value||"all"} type="button" role="tab" aria-selected={offerStatus===tab.value} className={offerStatus===tab.value?styles.activeTab:styles.tab} onClick={()=>{setOfferStatus(tab.value);setOfferPage(0);setSelectedOffer(null);setReason("");}}>{tab.label} · {tab.count}</button>)}
                    </div>
                    <div className={styles.offerQueue} data-testid="offer-queue">
                        {offerItems.map(item=>{const d=discount(item);return <div key={item.id} className={selectedOffer?.id===item.id?styles.offerItemSelected:styles.offerItem}>
                            <label className={styles.offerSelectControl}><input type="checkbox" checked={Boolean(selectedOffers[item.id])} onChange={()=>toggleOfferSelection(item)} aria-label={"Select "+item.title}/></label>
                            <button type="button" aria-pressed={selectedOffer?.id===item.id} className={styles.offerRowOpen} onClick={()=>{setSelectedOffer(item);setReason("");setOfferAction(item.status==="SUSPENDED"?"reinstate":"suspend");}}>
                                <span className={styles.offerThumb}>{item.imageUrl?<OfferImage src={item.imageUrl} alt="" lazy/>:<ImageIcon size={20} aria-hidden="true"/>}</span>
                                <span className={styles.offerCopy}><strong>{item.title}</strong><small>{item.shopName} · {item.city}</small><span className={styles.offerTags}>
                                    {item.reportedCount>0&&<em className={styles.reportTag}>{item.reportedCount} {item.reportedCount===1?t.report:t.reportsN}</em>}
                                    {item.allergensStatus==="UNKNOWN"&&<em className={styles.allergenTag}>{t.allergensUnknown}</em>}
                                    {item.status==="SUSPENDED"&&<em className={styles.hiddenTag}>{t.hiddenS}</em>}
                                </span></span>
                                <span className={styles.offerPrice}><strong>{amount(item.priceMinor,locale)} MAD</strong><small>{d?"−"+d+"%":""}</small></span>
                            </button>
                        </div>;})}
                    </div>
                    {!offerItems.length&&<p className={styles.empty}>{t.empty}</p>}
                    <div className={styles.offerPagination} data-testid="offer-pagination"><AdminPagination page={offerPage} pageCount={offerPageCount} total={offers.total} size={offers.size||OFFER_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setOfferPage(next);setSelectedOffer(null);}} /></div>
                    {Object.keys(selectedOffers).length>0&&<div className={styles.offerBatchBar} data-testid="offer-batch-bar"><span><strong>{Object.keys(selectedOffers).length}</strong> offers selected</span><button type="button" className={styles.linkBtn} onClick={()=>setSelectedOffers({})}>Clear</button><button type="button" className={styles.primary} onClick={()=>{setBatchOfferOpen(true);setBatchOfferResults(null);setBatchOfferReason("");setBatchOfferAction("suspend");}}>Review together →</button></div>}
                </section>
                <section className={styles.offerPreviewCard} role={selectedOffer?"dialog":undefined} aria-modal={selectedOffer?true:undefined} aria-label={t.selectedOffer} data-testid="offer-detail-panel">
                    {!selectedOffer?<div className={styles.offerEmpty}><Tag size={28} aria-hidden="true"/><strong>{t.selectedOffer}</strong><span>{t.empty}</span></div>:<>
                        <div className={styles.offerPreviewScroll} data-testid="offer-preview-scroll">
                            <div className={styles.offerDialogTopbar}>
                                <div className={styles.offerDialogPager}>
                                    <button type="button" aria-label="Previous offer" disabled={offerItems.length<2} onClick={()=>{const index=offerItems.findIndex(item=>item.id===selectedOffer.id);setSelectedOffer(offerItems[(index-1+offerItems.length)%offerItems.length]);setReason("");}}><ChevronLeft size={18}/></button>
                                    <span>{Math.max(0,offerItems.findIndex(item=>item.id===selectedOffer.id)+1)} / {offerItems.length}</span>
                                    <button type="button" aria-label="Next offer" disabled={offerItems.length<2} onClick={()=>{const index=offerItems.findIndex(item=>item.id===selectedOffer.id);setSelectedOffer(offerItems[(index+1)%offerItems.length]);setReason("");}}><ChevronRight size={18}/></button>
                                </div>
                                <button type="button" className={styles.offerDialogClose} aria-label={t.closeReview} onClick={()=>{setSelectedOffer(null);setReason("");setOfferConfirmOpen(false);}}><X size={19}/></button>
                            </div>
                            <div className={styles.offerPreviewHeading}>
                                <div className={styles.offerPreviewThumb}>{selectedOffer.imageUrl?<OfferImage src={selectedOffer.imageUrl} alt={selectedOffer.title}/>:<ImageIcon size={24} aria-hidden="true"/>}</div>
                                <div className={styles.offerPreviewTitle}>
                                    <small>{t.selectedOffer}</small>
                                    <h2>{selectedOffer.title}</h2>
                                    <p>{selectedOffer.shopName} · {selectedOffer.city}</p>
                                </div>
                                <span className={styles.pill+" "+offerTone(selectedOffer.status)}>{offerLabel(selectedOffer.status)}</span>
                            </div>
                            <dl className={styles.offerPreviewFacts}>
                                <div><dt>{t.price}</dt><dd>{amount(selectedOffer.priceMinor,locale)} MAD</dd></div>
                                <div><dt>{t.originalPrice}</dt><dd>{selectedOffer.originalPriceMinor?amount(selectedOffer.originalPriceMinor,locale)+" MAD":"—"}</dd></div>
                                <div><dt>{t.stock}</dt><dd>{selectedOffer.quantityReserved} / {selectedOffer.quantityTotal} {t.reserved}</dd></div>
                                <div><dt>{t.reportsTitle}</dt><dd>{selectedOffer.reportedCount}</dd></div>
                            </dl>
                            {selectedOffer.allergensStatus==="UNKNOWN"&&<div className={styles.offerPreviewAlert} data-testid="offer-food-safety-alert"><AlertTriangle size={17} aria-hidden="true"/><span><strong>{t.foodSafetyTitle}</strong><small>{t.foodSafetyBody}</small></span></div>}
                            <section className={styles.merchantModalSection+" "+styles.offerEvidence} data-testid="offer-evidence">
                                <h3>{t.reportsTitle} · {selectedOffer.reportedCount}</h3>
                                {selectedOffer.reportedCount>0?<div className={styles.offerModalReport}><strong>{selectedOffer.reportedCount} {t.reportReceived}</strong><span>{t.status}: {offerLabel(selectedOffer.status)}</span></div>:<p className={styles.offerModalNoReports}>{t.noReports}</p>}
                                {selectedOffer.foodNotes&&<div className={styles.offerModalFoodNotes}><strong>{t.foodInfo}</strong><p>{selectedOffer.foodNotes}</p></div>}
                            </section>
                        </div>
                        <div className={styles.offerDecisionDock} data-testid="offer-decision-dock">
                            <div className={styles.offerInlineBody} data-testid="offer-moderation-workflow">
                                <div className={styles.merchantModalColumn}>
                                    <section className={styles.merchantModalSection+" "+styles.offerModalReason} data-testid="offer-decision-reason">
                                        <h3>{t.reason}</h3>
                                        <div className={styles.reasonChips}>
                                            {[t.reasonMisleading,t.reasonAllergens,t.reasonPhoto,t.reasonOther].map(label=><button key={label} type="button" className={reason.startsWith(label)?styles.reasonChipActive:styles.reasonChip} onClick={()=>setReason(label+": ")}>{label}</button>)}
                                        </div>
                                        <label className={styles.field}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}/></label>
                                    </section>
                                </div>
                                <div className={styles.merchantModalColumn}>
                                    <section className={styles.merchantDecision+" "+styles.offerModalDecision}>
                                        <h3>{t.decision}</h3>
                                        <p className={styles.offerModalDecisionHint}>{t.reinstateOnlyHidden}</p>
                                        <div className={styles.offerActionRow}>
                                            <button type="button" data-action="reinstate" aria-pressed={offerAction==="reinstate"} className={offerAction==="reinstate"?styles.offerActionActive:styles.offerAction} disabled={selectedOffer.status!=="SUSPENDED"} onClick={()=>setOfferAction("reinstate")}>{t.putLive}</button>
                                            <button type="button" data-action="request-edit" aria-pressed={offerAction==="request-edit"} className={offerAction==="request-edit"?styles.offerActionActive:styles.offerAction} onClick={()=>setOfferAction("request-edit")}>{t.askEdit}</button>
                                            <button type="button" data-action="suspend" aria-pressed={offerAction==="suspend"} className={offerAction==="suspend"?styles.offerActionActive:styles.offerAction} onClick={()=>setOfferAction("suspend")}>{selectedOffer.status==="SUSPENDED"?t.keepHidden:t.hide}</button>
                                        </div>
                                    </section>
                                </div>
                            </div>
                            <footer className={styles.offerInlineFooter} data-testid="offer-moderation-footer">
                                <p><ShieldCheck size={15} aria-hidden="true"/>{t.auditRecorded}</p>
                                <button className={styles.primary} disabled={working||!reason.trim()||(offerAction==="reinstate"&&selectedOffer.status!=="SUSPENDED")} onClick={()=>setOfferConfirmOpen(true)}>{working?t.loading:offerAction==="reinstate"?t.putLive:offerAction==="request-edit"?t.askEdit:selectedOffer.status==="SUSPENDED"?t.keepHidden:t.hide}</button>
                            </footer>
                        </div>
                    </>}
                </section>
            </div>
            {offerConfirmOpen&&selectedOffer&&<div className={styles.adminModalBackdrop} role="presentation">
                <section className={styles.offerConfirmModal} role="dialog" aria-modal="true" aria-labelledby="offer-confirm-title">
                    <h2 id="offer-confirm-title">{locale==="fr"?"Confirmer la décision":locale==="ar"?"تأكيد القرار":"Confirm moderation decision"}</h2>
                    <p><strong>{selectedOffer.title}</strong></p>
                    <p>{offerAction==="reinstate"?t.putLive:offerAction==="request-edit"?t.askEdit:t.hide}</p>
                    <label className={styles.field}><span>{t.reason}</span><textarea rows={3} maxLength={500} value={reason} onChange={event=>setReason(event.target.value)}/></label>
                    <footer><button type="button" className={styles.ghostBtn} disabled={working} onClick={()=>setOfferConfirmOpen(false)}>{locale==="fr"?"Annuler":"Cancel"}</button><button type="button" className={styles.primary} disabled={working||!reason.trim()} onClick={()=>void submitOffer()}>{working?t.loading:locale==="fr"?"Confirmer":locale==="ar"?"تأكيد":"Confirm"}</button></footer>
                </section>
            </div>}
            {batchOfferOpen&&<div className={styles.adminModalBackdrop} role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget&&!batchOfferWorking)setBatchOfferOpen(false);}}>
                <section className={styles.batchOfferModal} role="dialog" aria-modal="true" aria-labelledby="batch-offer-title" data-testid="batch-offer-modal">
                    <header className={styles.batchOfferHeader}><div><small>{batchOfferResults?"BATCH REVIEW · DONE":"BATCH REVIEW"}</small><h2 id="batch-offer-title">{batchOfferResults?"Batch review results":"Review "+Object.keys(selectedOffers).length+" offers together"}</h2><p>Same decision and reason for all. Each offer gets its own audit entry.</p></div><button type="button" aria-label={t.closeReview} disabled={batchOfferWorking} onClick={()=>setBatchOfferOpen(false)}><X size={19}/></button></header>
                    {!batchOfferResults?<div className={styles.batchOfferBody}>
                        <section><h3>Selected · {Object.keys(selectedOffers).length}</h3><ul className={styles.batchOfferList}>{Object.values(selectedOffers).map(item=><li key={item.id}><span><strong>{item.title}</strong><small>{item.shopName} · {item.city}</small></span><button type="button" aria-label={"Remove "+item.title} onClick={()=>setSelectedOffers(current=>{const next={...current};delete next[item.id];return next;})}>×</button></li>)}</ul></section>
                        <section className={styles.batchOfferDecision}><h3>Your decision · applies to all</h3>
                            <div className={styles.batchOfferActions}>
                                <button type="button" aria-pressed={batchOfferAction==="suspend"} onClick={()=>setBatchOfferAction("suspend")} className={batchOfferAction==="suspend"?styles.batchActionActive:styles.batchAction}><strong>{t.hide}</strong><small>Remove selected offers from the marketplace.</small></button>
                                <button type="button" aria-pressed={batchOfferAction==="request-edit"} onClick={()=>setBatchOfferAction("request-edit")} className={batchOfferAction==="request-edit"?styles.batchActionActive:styles.batchAction}><strong>{t.askEdit}</strong><small>Ask each shop to correct its offer.</small></button>
                                <button type="button" aria-pressed={batchOfferAction==="reinstate"} onClick={()=>setBatchOfferAction("reinstate")} className={batchOfferAction==="reinstate"?styles.batchActionActive:styles.batchAction}><strong>{t.putLive}</strong><small>{t.reinstateOnlyHidden} {Object.values(selectedOffers).filter(item=>item.status==="SUSPENDED").length} / {Object.keys(selectedOffers).length} eligible.</small></button>
                            </div>
                            <label className={styles.field}><span>One reason for all (required)</span><textarea rows={3} maxLength={500} value={batchOfferReason} onChange={event=>setBatchOfferReason(event.target.value)}/></label>
                        </section>
                    </div>:<div className={styles.batchOfferResults}><h3>{batchOfferResults.filter(item=>item.ok).length} / {batchOfferResults.length} processed</h3><p>Failed items stay selected. Your decision and reason are kept so you can retry without retyping.</p>{batchOfferResults.map(item=><article key={item.id}><span className={item.ok?styles.batchResultOk:styles.batchResultFail}>{item.ok?"✓":"×"}</span><span><strong>{item.title}</strong><small>{item.ok?t.success:item.detail}</small></span></article>)}</div>}
                    <footer className={styles.batchOfferFooter}>
                        <span>{batchOfferResults?batchOfferResults.filter(item=>item.ok).length+" audit entries saved":Object.keys(selectedOffers).length+" offers selected · "+batchOfferReason.length+"/500"}</span>
                        {!batchOfferResults?<><button type="button" className={styles.ghostBtn} disabled={batchOfferWorking} onClick={()=>setBatchOfferOpen(false)}>Cancel</button><button type="button" className={styles.primary} disabled={batchOfferWorking||!batchOfferReason.trim()||!Object.keys(selectedOffers).length||(batchOfferAction==="reinstate"&&!Object.values(selectedOffers).some(item=>item.status==="SUSPENDED"))} onClick={()=>void runBatchOfferDecision()}>{batchOfferWorking?t.loading:"Confirm decision"}</button></>:<><button type="button" className={styles.ghostBtn} onClick={()=>{setBatchOfferOpen(false);setBatchOfferResults(null);}}>Close</button>{batchOfferResults.some(item=>!item.ok)&&<button type="button" className={styles.primary} disabled={batchOfferWorking} onClick={()=>void runBatchOfferDecision()}>Retry failed →</button>}</>}
                    </footer>
                </section>
            </div>}
        </>}

        {page==="support-cases"&&cases&&<>
            <div className={styles.tabs} role="tablist" aria-label={t.casesTitle}>
                {([["OPEN",t.open,caseCounts.open],["ESCALATED",t.escalated,caseCounts.escalated],["WAITING_REPLY",t.waiting,caseCounts.waiting],["RESOLVED",t.resolved,caseCounts.resolved]] as const).map(([value,label,count])=><button key={value} role="tab" aria-selected={caseStatus===value} className={caseStatus===value?styles.activeTab:styles.tab} onClick={()=>switchTab(()=>{setCaseStatus(value);setCasePage(0);setSelectedCase(null);setReason("");})}>{label}{typeof count==="number"?" · "+count:""}</button>)}
            </div>
            <div className={styles.supportWorkspace} data-testid="support-workspace">
                <section className={styles.casePicker} aria-label={t.casesTitle} data-testid="support-case-queue">
                    <div className={styles.caseList} data-testid="support-case-list">{caseItems.map(item=><button key={item.reference} data-testid="support-case-row" className={selectedCase?.summary.reference===item.reference?styles.caseSelected:styles.caseItem} onClick={()=>void loadCase(item.reference)}>
                        <span className={styles.caseListTop}><small>{item.reference} · {item.category}</small><em className={styles.pill+" "+priorityTone(item.priority)}>{priorityLabel(item.priority)}</em></span>
                        <strong>{item.subject}</strong><small>{item.reservationReference?item.reservationReference+" · ":""}{item.merchantName||t.shop}</small>
                    </button>)}</div>{!caseItems.length&&<p className={styles.empty}>{t.empty}</p>}
                    <AdminPagination page={casePage} pageCount={casePageCount} total={cases.total} size={cases.size||CASE_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setCasePage(next);setSelectedCase(null);}} />
                </section>
                <section className={styles.caseDetail} data-testid="support-case-detail">
                    {!selectedCase?<p className={styles.empty}>{t.empty}</p>:<>
                        <div className={styles.detailHead}><div><small>{t.record} {selectedCase.summary.reference} · {selectedCase.summary.category}</small><h2>{selectedCase.summary.subject}</h2></div><span className={styles.pill+" "+priorityTone(selectedCase.summary.priority)}>{priorityLabel(selectedCase.summary.priority)}</span></div>
                        <div className={styles.caseHistory} data-testid="support-case-history">
                        <div className={styles.caseReferenceCards}>
                            <article><small>{t.caseReservation}</small><strong>{selectedCase.summary.reservationReference||"—"}</strong></article>
                            <article><small>{t.caseOffer}</small><strong>{selectedCase.summary.offerTitle||"—"}</strong></article>
                            <article><small>{t.caseShop}</small><strong>{selectedCase.summary.merchantName||"—"}</strong></article>
                        </div>
                        <h3 className={styles.sectionLabel}>{t.timeline}</h3>
                        <div className={styles.caseTimeline} data-testid="support-case-timeline">{selectedCase.timeline.map(item=><article key={item.id} className={item.visibility==="INTERNAL"?styles.timelineInternal:item.authorType==="CUSTOMER"?styles.timelineCustomer:styles.timelineAgent}>
                            <strong>{item.visibility==="INTERNAL"?t.internal:item.authorType==="CUSTOMER"?t.customer:t.reply} · {new Intl.DateTimeFormat(loc(locale),{timeZone:"Africa/Casablanca",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt))}</strong>
                            <p>{item.message}</p>
                        </article>)}</div>
                        <div className={styles.caseAssignment}>
                            <p>{t.assignedTo}: <strong>{selectedCase.summary.assigneeName||"Unassigned"}</strong></p>
                            <div><button className={styles.ghostBtn} type="button" disabled={working} onClick={()=>void caseAction("CONTACT_SHOP")}>{t.contactShop}</button>{!isSupportOnly&&<button className={styles.ghostBtn} type="button" disabled={working} onClick={()=>void assignToMe()}>{t.assign}</button>}</div>
                        </div>
                        <div className={styles.caseCustomer}>
                            <span>{t.customer}: <strong>{revealed?revealed.fullName:selectedCase.summary.customerLabel}</strong></span>
                            {revealed&&<small>{revealed.email} · {revealed.phone||"—"}</small>}
                        </div>
                        {!revealed&&canRevealSupportCustomerDetails(roles,actorId,selectedCase.summary.assignedTo)&&
                            <div className={styles.caseCustomerDisclosure}>
                                <label className={styles.field}><span>{t.disclosureReason}</span><input value={disclosureReason} maxLength={SUPPORT_DISCLOSURE_REASON_MAX_LENGTH} onChange={event=>setDisclosureReason(event.target.value)} required /></label>
                                <button className={styles.linkBtn} type="button" disabled={working||!disclosureReason.trim()} onClick={()=>void revealCustomer()}><Eye size={13} aria-hidden="true"/>{t.reveal}</button>
                            </div>
                        }
                        <p className={styles.hint}><Lock size={13} aria-hidden="true"/>{t.masked}</p>
                        <section className={styles.caseActions} data-testid="support-case-actions">
                            <label className={styles.caseActionReason}><span>{t.actionReason}</span><input value={reason} onChange={e=>setReason(e.target.value)} placeholder={t.needsReason}/></label>
                            <button type="button" className={styles.ghostBtn} disabled={working||!reason.trim()} onClick={()=>void caseAction("ESCALATE")}>{t.escalate}</button>
                            <button type="button" className={styles.primary} disabled={working||!reason.trim()} onClick={()=>void caseAction("RESOLVE")}>{t.resolve}</button>
                        </section>
                        {!isSupportOnly&&selectedCase.summary.offerId&&<div className={styles.actionRowEnd}><button type="button" className={styles.dangerOutline} disabled={working||!reason.trim()} onClick={()=>void caseAction("KEEP_OFFER_HIDDEN")}>{t.keepOffer}</button></div>}
                        <p className={styles.hint}><ShieldCheck size={13} aria-hidden="true"/>{t.actionNote}</p>
                        </div>
                        <section className={styles.messageComposer} data-testid="support-message-composer">
                            <div className={styles.messageModes} role="group" aria-label={t.replyNote}>
                                <button type="button" aria-pressed={sendToCustomer} className={sendToCustomer?styles.modeActive:styles.modeButton} onClick={()=>setSendToCustomer(true)}>{t.replyToCustomer}</button>
                                <button type="button" aria-pressed={!sendToCustomer} className={!sendToCustomer?styles.modeActive:styles.modeButton} onClick={()=>setSendToCustomer(false)}>{t.internalNoteTab}</button>
                            </div>
                            <form onSubmit={sendMessage}>
                                <label className={styles.field}><span className="sr-only">{t.replyNote}</span><textarea rows={3} value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} placeholder={t.writeMessage} required/></label>
                                <div className={styles.composerFoot}><p>{sendToCustomer?t.replyVisibleHint:t.internalVisibleHint}</p><button className={styles.primary} disabled={working||!draftMessage.trim()}>{sendToCustomer?t.sendCustomer:t.saveNote}</button></div>
                            </form>
                        </section>
                    </>}
                </section>
            </div>
        </>}
        {page==="audit-log"&&audit&&<>
            <section className={styles.auditFilters} aria-label={t.filter}>
                <div className={styles.auditFilterTopRow}>
                    <label className={`${styles.auditFilterField} ${styles.auditFilterSearch}`}>
                        <span>{auditUi.searchLabel}</span>
                        <div className={styles.auditSearchControl}>
                            <Search size={19} aria-hidden="true"/>
                            <input type="search" data-testid="audit-search-input" aria-label={more[locale].searchAudit} value={query} onChange={e=>{setQuery(e.target.value);setAuditPage(0);setAuditModalOpen(false);}} placeholder={more[locale].searchAudit}/>
                            {query&&<button type="button" aria-label={locale==="fr"?"Effacer la recherche":locale==="ar"?"مسح البحث":"Clear search"} onClick={()=>{setQuery("");setAuditSearch("");setAuditPage(0);}}><X size={15}/></button>}
                        </div>
                    </label>
                    <div className={styles.auditDateRange} role="group" aria-label={locale==="fr"?"Période":locale==="ar"?"الفترة":"Date range"}>
                        <AuditDatePicker label={t.from} value={auditFrom} onChange={value=>{setAuditFrom(value);setAuditPage(0);setAuditModalOpen(false);}} locale={locale} max={auditTo||undefined} placeholder={locale==="fr"?"Choisir une date":locale==="ar"?"اختر التاريخ":"Choose date"}/>
                        <AuditDatePicker label={t.to} value={auditTo} onChange={value=>{setAuditTo(value);setAuditPage(0);setAuditModalOpen(false);}} locale={locale} min={auditFrom||undefined} placeholder={locale==="fr"?"Choisir une date":locale==="ar"?"اختر التاريخ":"Choose date"}/>
                    </div>
                </div>
                <div className={styles.auditFilterBottomRow}>
                    <AuditSelect label={t.action} value={auditAction} icon={<Filter size={17}/>} options={[
                        {value:"",label:locale==="fr"?"Toutes les actions":locale==="ar"?"كل الإجراءات":"All actions"},
                        ...Object.keys(auditActionNames[locale]).map(action=>({value:action,label:auditActionLabel(action,locale),description:action}))
                    ]} onChange={value=>{setAuditAction(value);setAuditPage(0);setAuditModalOpen(false);}}/>
                    <AuditSelect label={t.result} value={auditResult} icon={<ShieldCheck size={17}/>} options={[
                        {value:"",label:t.allResults},
                        {value:"SUCCESS",label:t.success},
                        {value:"DENIED",label:t.denied},
                        {value:"FAILED",label:auditUi.failed}
                    ]} onChange={value=>{setAuditResult(value);setAuditPage(0);setAuditModalOpen(false);}}/>
                </div>
            </section>
            <section className={styles.auditExplorer} aria-label={auditUi.history} data-testid="audit-explorer">
                <div className={styles.auditExplorerHeading}>
                    <div><h2>{auditUi.history}</h2><p>{auditUi.latest}</p></div>
                    <span>{audit.total.toLocaleString(loc(locale))} · {t.audit}</span>
                </div>
                <section className={styles.auditTableCard} data-testid="audit-table-card">
                    <div className={styles.table}>
                        <table><thead><tr><th>{t.when.toUpperCase()}</th><th>{t.person.toUpperCase()}</th><th>{t.action.toUpperCase()}</th><th>{t.record.toUpperCase()}</th><th>{t.reason.toUpperCase()}</th><th>{t.result.toUpperCase()}</th></tr></thead>
                            <tbody>{auditItems.map(item=><tr key={item.id} data-testid="audit-record-row" tabIndex={0} aria-label={`${auditActionLabel(item.action,locale)} · ${item.actorName}`} aria-pressed={selectedAuditId===item.id} className={selectedAuditId===item.id?styles.auditSelectedRow:""} onClick={()=>{setSelectedAuditId(item.id);setAuditModalOpen(true);}} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setSelectedAuditId(item.id);setAuditModalOpen(true);}}}>
                                <td data-label={t.when}>{shortDateTime(item.createdAt,locale)}</td>
                                <td data-label={t.person}><strong>{item.actorName}</strong></td>
                                <td data-label={t.action}><strong>{auditActionLabel(item.action,locale)}</strong><small>{item.action}</small></td>
                                <td data-label={t.record}><strong>{item.targetType}</strong><small>{item.targetId}</small></td>
                                <td data-label={t.reason}><span className={styles.auditTableReason}>{item.reason||"—"}</span></td>
                                <td data-label={t.result}>{resultPill(item.result)}</td>
                            </tr>)}</tbody>
                        </table>
                    </div>
                    {!auditItems.length&&<p className={styles.empty}>{auditSearch?auditUi.noMatches:t.empty}</p>}
                    <div className={styles.auditPaginationBar}>
                        <AuditSelect label={auditUi.pageSize} value={String(auditPageSize)} className={styles.auditPageSizeCustom} menuPlacement="top" options={[{value:"10",label:"10"},{value:"20",label:"20"},{value:"50",label:"50"}]} onChange={value=>{setAuditPageSize(Number(value));setAuditPage(0);setAuditModalOpen(false);}}/>
                        <AdminPagination page={auditPage} pageCount={auditPageCount} total={audit.total} size={audit.size||auditPageSize} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setAuditPage(next);setAuditModalOpen(false);setSelectedAuditId(null);}} />
                    </div>
                </section>
            {audit&&<section className={styles.auditRecordCard} aria-label={auditUi.eventDetails} data-testid="audit-record-detail">
                {!selectedAudit?<div className={styles.auditRecordEmpty}><ShieldCheck size={22} aria-hidden="true"/><strong>{auditUi.eventDetails}</strong><p>{locale==="fr"?"Sélectionnez une ligne du journal pour consulter les détails.":locale==="ar"?"اختر سجلاً من الجدول لعرض التفاصيل.":"Select an audit row to inspect its details."}</p></div>:<>
                    <header className={styles.auditRecordHeader} data-testid="audit-record-header">
                        <div><small>{auditUi.eventDetails}</small><h2>{auditActionLabel(selectedAudit.action,locale)}</h2><code>{selectedAudit.action}</code></div>
                        {resultPill(selectedAudit.result)}
                    </header>
                    <section className={styles.auditRecordSection}>
                        <h3>{auditUi.adminAction}</h3>
                        <dl className={styles.auditRecordFacts}>
                            <div><dt>{t.person}</dt><dd>{selectedAudit.actorName}</dd></div>
                            <div><dt>{auditUi.identifier}</dt><dd>{selectedAudit.actorUserId}</dd></div>
                            <div><dt>{auditUi.dateTime}</dt><dd>{dateTime(selectedAudit.createdAt,locale)}</dd></div>
                            <div><dt>{auditUi.category}</dt><dd>{auditCategoryLabel(selectedAudit.action,locale)}</dd></div>
                            <div><dt>{t.result}</dt><dd>{resultPill(selectedAudit.result)}</dd></div>
                        </dl>
                    </section>
                    <section className={styles.auditRecordSection}>
                        <h3>{auditUi.affected}</h3>
                        <dl className={styles.auditRecordFacts}>
                            <div><dt>{auditUi.entityType}</dt><dd>{selectedAudit.targetType}</dd></div>
                            <div><dt>{auditUi.identifier}</dt><dd>{selectedAudit.targetId}</dd></div>
                            <div><dt>{t.reason}</dt><dd>{selectedAudit.reason||"—"}</dd></div>
                            {selectedAudit.correlationId&&<div><dt>{auditUi.correlationId}</dt><dd><code>{selectedAudit.correlationId}</code></dd></div>}
                            <div><dt>{auditUi.eventId}</dt><dd><code>{selectedAudit.id}</code></dd></div>
                        </dl>
                    </section>
                    <p className={styles.auditRecordNotice}><Lock size={14} aria-hidden="true"/>{auditUi.immutableNotice}</p>
                </>}
            </section>}
            </section>
        </>}

    </>);
}