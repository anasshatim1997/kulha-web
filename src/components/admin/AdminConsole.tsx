"use client";
import { useEffect, useRef, useState, type ReactNode, type RefObject, type SyntheticEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { canRevealSupportCustomerDetails, SUPPORT_DISCLOSURE_REASON_MAX_LENGTH } from "@/lib/auth/admin-access";
import { useSession } from "@/components/session/SessionProvider";
import { AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Clock3, LayoutDashboard, Eye, EyeOff, FileText, Filter, Flag, Image as ImageIcon, LifeBuoy, Lock, Mail, MapPin, PackageCheck, Phone, Search, ShieldCheck, Store, Tag, X, LogOut, Building2, MessageSquare, Send, Inbox, UserCheck, ShieldAlert, StickyNote, PhoneCall, PanelLeftClose, PanelLeftOpen, Languages, SlidersHorizontal } from "lucide-react";
import styles from "./AdminConsole.module.css";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath, switchLocalePath } from "@/lib/navigation";

type PageKey="overview"|"merchant-review"|"offer-moderation"|"support-cases"|"audit-log";
type Merchant={id:string;ownerUserId:string;ownerEmail:string;name:string;businessType:string;address:string;city:string;district?:string|null;latitude?:number|null;longitude?:number|null;pickupInstructions?:string|null;phone:string;openingHours:string;status:string;decisionReason:string|null;createdAt:string};
type Offer={id:string;title:string;shopName:string;city:string;priceMinor:number;originalPriceMinor:number|null;quantityTotal:number;quantityReserved:number;allergensStatus:string;allergens:string|null;foodNotes:string|null;status:string;reportedCount:number;pickupStart:string|null;pickupEnd:string|null;imageUrl:string|null;createdAt?:string};
type CaseItem={id:string;reference:string;category:string;subject:string;description:string;priority:string;status:string;customerUserId:string;customerLabel:string;merchantId:string|null;merchantName:string|null;offerId:string|null;offerTitle:string|null;reservationReference:string|null;assignedTo:string|null;assigneeName:string|null;hiddenOffer:boolean;createdAt:string;updatedAt:string;resolvedAt:string|null};
type Timeline={id:string;authorType:string;authorUserId:string|null;authorLabel:string;visibility:string;message:string;createdAt:string};
type AuditRow={id:string;actorUserId:string;actorName:string;action:string;targetType:string;targetId:string;reason:string|null;result:string;correlationId:string|null;createdAt:string};
type Page<T>={items:T[];page:number;size:number;total:number};
type AuditPage=Page<AuditRow>;
type OverviewData={merchants:Page<Merchant>;offers:Page<Offer>;cases:Page<CaseItem>;audit:AuditPage};
type TodayQueueItem={kind:"merchant";item:Merchant;createdAt?:string}|{kind:"offer";item:Offer;createdAt?:string}|{kind:"case";item:CaseItem;createdAt?:string};
type LabelMap=Record<string,string>;

const words={
    fr:{all:"Toutes",merchantTitle:"Revue des commerces",merchantLead:"",offersTitle:"Modération des offres",offersLead:"Masquer, demander une correction ou rétablir une offre.",casesTitle:"Dossiers support",casesLead:"Réclamations clients et commerces, avec priorité à la sécurité alimentaire.",auditTitle:"Journal d’audit",auditLead:"Qui a fait quoi, sur quel dossier et pour quelle raison.",pending:"En attente",info:"Informations requises",approved:"Approuvés",rejected:"Refusés",review:"Fiche du commerce",businessDetails:"Informations sur le commerce",business:"Type d’activité",owner:"Propriétaire",phone:"Téléphone",email:"E-mail",address:"Adresse",hours:"Horaires",documents:"Documents",documentsMissing:"Le dépôt et le stockage des documents d’immatriculation et d’identité ne sont pas encore disponibles. Aucun fichier à consulter.",checklist:"Liste de vérification",locationChecked:"Adresse et localisation vérifiées",phoneChecked:"Téléphone joignable",docsChecked:"Documents lisibles et valides",decision:"Décision",approve:"Approuver",requestInfo:"Demander des informations",reject:"Refuser",reason:"Motif obligatoire",internalNote:"Note interne",save:"Enregistrer la décision",offer:"Offre",shop:"Commerce",price:"Prix",foodInfo:"Informations alimentaires",reports:"Signalements",status:"Statut",hide:"Masquer l’offre",askEdit:"Demander une correction",putLive:"Rétablir en ligne",keepHidden:"Garder masquée",open:"Ouvert",foodSafety:"Sécurité alimentaire",waiting:"En attente de réponse",resolved:"Résolu",high:"Élevée",medium:"Moyenne",low:"Faible",customer:"Client",reveal:"Révéler",masked:"Les informations du client sont masquées. Toute révélation est limitée par rôle, motivée et enregistrée.",disclosureReason:"Motif obligatoire de consultation",timeline:"Historique",reply:"Répondre au client",internal:"Note interne",send:"Envoyer",contactShop:"Contacter le commerce",escalate:"Escalader",resolve:"Résoudre le dossier",assign:"M’assigner",keepOffer:"Garder l’offre masquée",audit:"Événements",today:"Aujourd’hui",person:"Personne",action:"Action",record:"Dossier",result:"Résultat",success:"Succès",denied:"Refusé",export:"Exporter (journalisé)",immutable:"Les entrées ne peuvent pas être modifiées ou supprimées.",from:"Du",to:"Au",filter:"Filtrer",loading:"Chargement…",retry:"Réessayer",empty:"Aucun élément à afficher.",error:"Impossible de charger les données.",saveReason:"Un motif est requis pour cette action.",hiddenAllergens:"Non renseigné",note:"Les allergènes inconnus restent « Non renseigné »."},
    en:{all:"All",merchantTitle:"Merchant review",merchantLead:"",offersTitle:"Offer moderation",offersLead:"Hide, request a correction or restore an offer.",casesTitle:"Support cases",casesLead:"Customer and shop reports, with food safety first.",auditTitle:"Audit log",auditLead:"Who did what, on which record, and why.",pending:"Pending",info:"Info required",approved:"Approved",rejected:"Rejected",review:"Merchant details",businessDetails:"Business details",business:"Business type",owner:"Owner",phone:"Phone",email:"Email",address:"Address",hours:"Opening hours",documents:"Documents",documentsMissing:"Business-registration and owner-ID document upload/storage is not available in the current backend. There are no files to view.",checklist:"Review checklist",locationChecked:"Address and location checked",phoneChecked:"Phone number reachable",docsChecked:"Documents readable and valid",decision:"Decision",approve:"Approve",requestInfo:"Request information",reject:"Reject",reason:"Reason (required)",internalNote:"Internal note",save:"Submit decision",offer:"Offer",shop:"Shop",price:"Price",foodInfo:"Food information",reports:"Reports",status:"Status",hide:"Hide offer",askEdit:"Ask shop to edit",putLive:"Put back live",keepHidden:"Keep hidden",open:"Open",foodSafety:"Food safety",waiting:"Waiting for reply",resolved:"Resolved",high:"High",medium:"Medium",low:"Low",customer:"Customer",reveal:"Reveal",masked:"Customer details stay masked by default. Authorized disclosures require a reason and are audited.",disclosureReason:"Reason for viewing customer details (required)",timeline:"Timeline",reply:"Reply to customer",internal:"Internal note",send:"Send",contactShop:"Contact shop",escalate:"Escalate",resolve:"Resolve case",assign:"Assign to me",keepOffer:"Keep offer hidden",audit:"Audit entries",today:"Today",person:"Person",action:"Action",record:"Record",result:"Result",success:"Success",denied:"Denied",export:"Export (logged)",immutable:"Entries cannot be edited or deleted.",from:"From",to:"To",filter:"Filter",loading:"Loading…",retry:"Retry",empty:"Nothing to show yet.",error:"Could not load the data.",saveReason:"A reason is required for this action.",hiddenAllergens:"Not provided",note:"Unknown allergens remain “Not provided”."},
    ar:{all:"الكل",merchantTitle:"مراجعة المتاجر",merchantLead:"",offersTitle:"مراجعة العروض",offersLead:"إخفاء العرض أو طلب تعديله أو إعادته للنشر.",casesTitle:"طلبات الدعم",casesLead:"بلاغات العملاء والمتاجر مع أولوية سلامة الغذاء.",auditTitle:"سجل التدقيق",auditLead:"من قام بماذا وعلى أي سجل ولماذا.",pending:"قيد الانتظار",info:"معلومات مطلوبة",approved:"معتمد",rejected:"مرفوض",review:"بيانات المتجر",businessDetails:"تفاصيل النشاط التجاري",business:"نوع النشاط",owner:"المالك",phone:"الهاتف",email:"البريد",address:"العنوان",hours:"ساعات العمل",documents:"الوثائق",documentsMissing:"رفع وتخزين وثائق التسجيل وهوية المالك غير متاح حالياً في النظام. لا توجد ملفات للعرض.",checklist:"قائمة التحقق",locationChecked:"تم التحقق من العنوان والموقع",phoneChecked:"رقم الهاتف يعمل",docsChecked:"الوثائق واضحة وصالحة",decision:"القرار",approve:"موافقة",requestInfo:"طلب معلومات",reject:"رفض",reason:"السبب مطلوب",internalNote:"ملاحظة داخلية",save:"إرسال القرار",offer:"العرض",shop:"المتجر",price:"السعر",foodInfo:"معلومات الطعام",reports:"البلاغات",status:"الحالة",hide:"إخفاء العرض",askEdit:"طلب تعديل",putLive:"إعادة النشر",keepHidden:"إبقاء مخفي",open:"مفتوح",foodSafety:"سلامة الغذاء",waiting:"بانتظار الرد",resolved:"تم الحل",high:"مرتفع",medium:"متوسط",low:"منخفض",customer:"العميل",reveal:"إظهار",masked:"تبقى بيانات العميل مخفية افتراضياً. يتطلب إظهارها سبباً وصلاحية ويتم تسجيله.",disclosureReason:"سبب الاطلاع على بيانات العميل (مطلوب)",timeline:"السجل الزمني",reply:"الرد على العميل",internal:"ملاحظة داخلية",send:"إرسال",contactShop:"التواصل مع المتجر",escalate:"تصعيد",resolve:"حل الطلب",assign:"تعيين لي",keepOffer:"إبقاء العرض مخفياً",audit:"سجلات التدقيق",today:"اليوم",person:"الشخص",action:"الإجراء",record:"السجل",result:"النتيجة",success:"نجاح",denied:"مرفوض",export:"تصدير (مسجل)",immutable:"لا يمكن تعديل السجلات أو حذفها.",from:"من",to:"إلى",filter:"تصفية",loading:"جارٍ التحميل…",retry:"إعادة المحاولة",empty:"لا توجد عناصر للعرض.",error:"تعذر تحميل البيانات.",saveReason:"السبب مطلوب لهذا الإجراء.",hiddenAllergens:"غير محدد",note:"تبقى مسببات الحساسية غير المعروفة «غير محددة»."}
} as const;


const more={
    fr:{search:"Rechercher…",searchMerchant:"Rechercher commerces, propriétaires, villes",searchOffers:"Rechercher offres, commerces, villes",searchCases:"Rechercher dossiers, références, commerces",searchAudit:"Rechercher personnes, actions, dossiers, motifs",offerQueueEyebrow:"FILE DE MODÉRATION",offerQueueTitle:"À examiner",offerQueueHint:"Priorité aux signalements et aux informations alimentaires",offerMetricsScope:"Sur les résultats chargés",offerFactsTitle:"Informations de l’offre",offerFoodTitle:"Informations alimentaires",offerAllergensLabel:"Allergènes",offerNotesLabel:"Notes alimentaires",offerDecisionTitle:"Décision de modération",offerDecisionLead:"Choisissez une action et indiquez le motif correspondant.",offerReasonPlaceholder:"Décrivez le problème constaté et la correction attendue…",offerRecordDecision:"Enregistrer la décision",offerImageMissing:"Aucune photo transmise",offerReportedFlag:"Offre signalée",offerCheckAllergens:"Informations à vérifier",submitted:"Envoyée",stageApplication:"Demande",stageChecks:"Vérifications",stageDecision:"Décision",noDocumentsTitle:"Aucun document transmis",noDocumentsBody:"Le dépôt et le stockage des justificatifs ne sont pas encore disponibles dans KULHA.",approveUnlocks:"L’approbation est disponible après les trois vérifications.",caseReservation:"Réservation",caseOffer:"Offre",caseShop:"Commerce",replyToCustomer:"Répondre au client",internalNoteTab:"Note interne",replyVisibleHint:"Le client verra cette réponse.",internalVisibleHint:"Cette note reste visible uniquement par l’équipe KULHA.",selectedRecord:"Dossier sélectionné",when:"Quand",recordValue:"Enregistrement",application:"Dossier",escalated:"Escaladés",live:"En ligne",hiddenS:"Masquée",draftS:"Brouillon",expiredS:"Expirée",cancelledS:"Annulée",unpublishedS:"Dépubliée",complete:"Complet",report:"signalement",reportsN:"signalements",decisionNote:"Votre décision, le motif et votre nom sont enregistrés dans le journal d’audit.",actionNote:"Chaque action, motif et nom est enregistré dans le journal d’audit.",selectedOffer:"Offre sélectionnée",openOfferReview:"Ouvrir la modération",offerReviewHint:"Vérifiez les détails, les signalements et les informations alimentaires avant de prendre une décision.",offerDetails:"Détails de l’offre",needsReview:"À vérifier",reportedMetric:"Signalées",hiddenMetric:"Masquées",liveNow:"En ligne",reportedFilter:"Signalées",allergensUnknown:"Allergènes inconnus",hiddenFilter:"Masquées",foodSafetyTitle:"Sécurité alimentaire : allergènes inconnus",foodSafetyBody:"Les informations sur les allergènes doivent être vérifiées avant la remise en ligne.",stock:"Stock",reserved:"réservés",pickup:"Retrait",pickupUnavailable:"Créneau non renseigné",originalPrice:"Prix initial",reportsTitle:"Signalements",reportReceived:"signalements reçus pour cette offre.",noReports:"Aucun signalement n’a été reçu.",reasonMisleading:"Prix trompeur",reasonAllergens:"Allergènes manquants",reasonPhoto:"Photo incorrecte",reasonOther:"Autre",reinstateOnlyHidden:"La remise en ligne est réservée aux offres masquées.",keepHidden:"Garder masquée",auditRecorded:"Votre décision est enregistrée dans le journal d’audit.",originalValue:"Valeur d’origine",notVerified:"non vérifiée",assignedTo:"Assigné à",replyNote:"Réponse ou note interne",writeMessage:"Écrire un message…",visibleCustomer:"Visible par le client",sendCustomer:"Envoyer au client",saveNote:"Enregistrer la note interne",actionReason:"Motif de l’action (obligatoire pour contacter, escalader ou résoudre)",optional:"Facultatif",allResults:"Tous les résultats",docsTitle:"Documents",needsReason:"Choisissez une décision et indiquez un motif.",system:"Système",customerRole:"Client",openReview:"Ouvrir la vérification",closeReview:"Fermer",reviewHint:"Vérifiez les informations, complétez la checklist et prenez une décision.",merchantListTitle:"Commerces",merchantListSubtitle:"Demandes et établissements selon leur statut",merchantRecords:"commerces",merchantVerifyButton:"Vérifier la demande",merchantReadButton:"Voir les informations",merchantIdentityGroup:"Identité du commerce",merchantContactGroup:"Contact du propriétaire",merchantEstablishmentGroup:"Établissement",merchantVerificationTitle:"Vérifications à effectuer",merchantVerificationLead:"Validez chaque point avant de prendre votre décision.",merchantIdentityCheck:"Identité du commerce",merchantIdentityCheckHelp:"Nom, activité et cohérence de l’établissement",merchantContactCheck:"Coordonnées du propriétaire",merchantContactCheckHelp:"E-mail et numéro du propriétaire",merchantAddressCheck:"Adresse et horaires",merchantAddressCheckHelp:"Adresse complète et horaires d’ouverture",merchantCheckPending:"À vérifier",merchantCheckComplete:"Vérifié",merchantSelectEmpty:"Sélectionnez un commerce pour consulter son dossier."},
    en:{search:"Search…",searchMerchant:"Search shops, owners, cities",searchOffers:"Search offers, shops, cities",searchCases:"Search cases, references, shops",searchAudit:"Search people, actions, records, reasons",offerQueueEyebrow:"MODERATION QUEUE",offerQueueTitle:"To review",offerQueueHint:"Prioritise reports and incomplete food information",offerMetricsScope:"Across loaded results",offerFactsTitle:"Offer information",offerFoodTitle:"Food information",offerAllergensLabel:"Allergens",offerNotesLabel:"Food notes",offerDecisionTitle:"Moderation decision",offerDecisionLead:"Choose an action and provide the matching reason.",offerReasonPlaceholder:"Describe the issue found and the correction expected…",offerRecordDecision:"Record decision",offerImageMissing:"No photo submitted",offerReportedFlag:"Reported offer",offerCheckAllergens:"Information needs review",submitted:"Submitted",stageApplication:"Application",stageChecks:"Checks",stageDecision:"Decision",noDocumentsTitle:"No documents uploaded",noDocumentsBody:"Document upload and storage are not available in KULHA yet.",approveUnlocks:"Approval unlocks once all three checks are ticked.",caseReservation:"Reservation",caseOffer:"Offer",caseShop:"Shop",replyToCustomer:"Reply to customer",internalNoteTab:"Internal note",replyVisibleHint:"The customer will see this reply.",internalVisibleHint:"This note is visible only to the KULHA team.",selectedRecord:"Selected record",when:"When",recordValue:"Record",application:"Application",escalated:"Escalated",live:"Live",hiddenS:"Hidden",draftS:"Draft",expiredS:"Expired",cancelledS:"Cancelled",unpublishedS:"Unpublished",complete:"Complete",report:"report",reportsN:"reports",decisionNote:"Your decision, reason and name are saved in the audit log.",actionNote:"Every action, reason and name is saved in the audit log.",selectedOffer:"Selected offer",openOfferReview:"Open moderation",offerReviewHint:"Review the details, customer reports and food-safety information before recording a decision.",offerDetails:"Offer details",needsReview:"Needs review",reportedMetric:"Reported",hiddenMetric:"Hidden",liveNow:"Live now",reportedFilter:"Reported",allergensUnknown:"Allergens unknown",hiddenFilter:"Hidden",foodSafetyTitle:"Food safety: allergens unknown",foodSafetyBody:"Allergen information must be checked before this offer is restored.",stock:"Stock",reserved:"reserved",pickup:"Pickup",pickupUnavailable:"Pickup window not provided",originalPrice:"Original price",reportsTitle:"Reports",reportReceived:"reports received for this offer.",noReports:"No customer reports have been received.",reasonMisleading:"Misleading price",reasonAllergens:"Missing allergens",reasonPhoto:"Wrong photo",reasonOther:"Other",reinstateOnlyHidden:"Put live is only available for hidden offers.",keepHidden:"Keep hidden",auditRecorded:"Your decision is recorded in the audit log.",originalValue:"Original value",notVerified:"not verified",assignedTo:"Assigned to",replyNote:"Reply or internal note",writeMessage:"Write a message…",visibleCustomer:"Visible to the customer",sendCustomer:"Send to customer",saveNote:"Save internal note",actionReason:"Reason for the action (required to contact, escalate or resolve)",optional:"Optional",allResults:"All results",docsTitle:"Documents",needsReason:"Pick a decision and give a reason.",system:"System",customerRole:"Customer",openReview:"Review application",closeReview:"Close",reviewHint:"Check the business details, complete the checklist and record your decision.",merchantListTitle:"Merchants",merchantListSubtitle:"Applications and businesses grouped by status",merchantRecords:"merchants",merchantVerifyButton:"Review application",merchantReadButton:"View information",merchantIdentityGroup:"Business identity",merchantContactGroup:"Owner contact",merchantEstablishmentGroup:"Establishment",merchantVerificationTitle:"Checks to complete",merchantVerificationLead:"Confirm each point before recording your decision.",merchantIdentityCheck:"Business identity",merchantIdentityCheckHelp:"Business name, activity and consistency",merchantContactCheck:"Owner contact details",merchantContactCheckHelp:"Owner email address and phone number",merchantAddressCheck:"Address and opening hours",merchantAddressCheckHelp:"Full address and business opening hours",merchantCheckPending:"To verify",merchantCheckComplete:"Verified",merchantSelectEmpty:"Select a merchant to view its application."},
    ar:{search:"بحث…",searchMerchant:"ابحث عن المتاجر والمالكين والمدن",searchOffers:"ابحث عن العروض والمتاجر والمدن",searchCases:"ابحث عن الحالات والمراجع والمتاجر",searchAudit:"ابحث عن الأشخاص والإجراءات والسجلات والأسباب",offerQueueEyebrow:"قائمة مراجعة العروض",offerQueueTitle:"بحاجة إلى مراجعة",offerQueueHint:"ابدأ بالبلاغات ومعلومات الطعام غير المكتملة",offerMetricsScope:"ضمن النتائج المحمّلة",offerFactsTitle:"معلومات العرض",offerFoodTitle:"معلومات الطعام",offerAllergensLabel:"مسببات الحساسية",offerNotesLabel:"ملاحظات الطعام",offerDecisionTitle:"قرار المراجعة",offerDecisionLead:"اختر الإجراء واكتب السبب المناسب.",offerReasonPlaceholder:"اشرح المشكلة والتعديل المطلوب…",offerRecordDecision:"حفظ القرار",offerImageMissing:"لم يتم إرسال صورة",offerReportedFlag:"عرض تم الإبلاغ عنه",offerCheckAllergens:"معلومات تحتاج إلى مراجعة",submitted:"تاريخ الإرسال",stageApplication:"الطلب",stageChecks:"التحقق",stageDecision:"القرار",noDocumentsTitle:"لم يتم رفع أي وثائق",noDocumentsBody:"رفع الوثائق وتخزينها غير متاح حالياً في KULHA.",approveUnlocks:"تُتاح الموافقة بعد إكمال عمليات التحقق الثلاث.",caseReservation:"الحجز",caseOffer:"العرض",caseShop:"المتجر",replyToCustomer:"الرد على العميل",internalNoteTab:"ملاحظة داخلية",replyVisibleHint:"سيتمكن العميل من رؤية هذا الرد.",internalVisibleHint:"هذه الملاحظة مرئية لفريق KULHA فقط.",selectedRecord:"السجل المحدد",when:"التوقيت",recordValue:"السجل",application:"طلب",escalated:"مصعّدة",live:"منشور",hiddenS:"مخفي",draftS:"مسودة",expiredS:"منتهي",cancelledS:"ملغى",unpublishedS:"غير منشور",complete:"مكتمل",report:"بلاغ",reportsN:"بلاغات",decisionNote:"يتم حفظ قرارك والسبب واسمك في سجل التدقيق.",actionNote:"يتم حفظ كل إجراء وسببه واسمك في سجل التدقيق.",selectedOffer:"العرض المحدد",openOfferReview:"فتح المراجعة",offerReviewHint:"راجع التفاصيل وبلاغات العملاء ومعلومات سلامة الغذاء قبل تسجيل القرار.",offerDetails:"تفاصيل العرض",needsReview:"بحاجة إلى مراجعة",reportedMetric:"مُبلّغ عنها",hiddenMetric:"مخفية",liveNow:"منشورة الآن",reportedFilter:"المُبلّغ عنها",allergensUnknown:"مسببات الحساسية غير معروفة",hiddenFilter:"مخفية",foodSafetyTitle:"سلامة الغذاء: مسببات الحساسية غير معروفة",foodSafetyBody:"يجب التحقق من معلومات مسببات الحساسية قبل إعادة نشر العرض.",stock:"المخزون",reserved:"محجوز",pickup:"الاستلام",pickupUnavailable:"موعد الاستلام غير محدد",originalPrice:"السعر الأصلي",reportsTitle:"البلاغات",reportReceived:"بلاغات واردة عن هذا العرض.",noReports:"لا توجد بلاغات من العملاء.",reasonMisleading:"سعر مضلل",reasonAllergens:"مسببات الحساسية ناقصة",reasonPhoto:"صورة غير صحيحة",reasonOther:"أخرى",reinstateOnlyHidden:"إعادة النشر متاحة للعروض المخفية فقط.",keepHidden:"إبقاء مخفي",auditRecorded:"تم تسجيل قرارك في سجل التدقيق.",originalValue:"القيمة الأصلية",notVerified:"غير موثقة",assignedTo:"مُسند إلى",replyNote:"رد أو ملاحظة داخلية",writeMessage:"اكتب رسالة…",visibleCustomer:"ظاهر للعميل",sendCustomer:"إرسال للعميل",saveNote:"حفظ الملاحظة الداخلية",actionReason:"سبب الإجراء (مطلوب للتواصل أو التصعيد أو الحل)",optional:"اختياري",allResults:"كل النتائج",docsTitle:"الوثائق",needsReason:"اختر قراراً واذكر السبب.",system:"النظام",customerRole:"العميل",openReview:"مراجعة الطلب",closeReview:"إغلاق",reviewHint:"تحقق من بيانات المتجر وأكمل قائمة التحقق ثم سجل قرارك.",merchantListTitle:"المتاجر",merchantListSubtitle:"طلبات المتاجر مرتبة حسب الحالة",merchantRecords:"متاجر",merchantVerifyButton:"التحقق من الطلب",merchantReadButton:"عرض المعلومات",merchantIdentityGroup:"هوية المتجر",merchantContactGroup:"بيانات تواصل المالك",merchantEstablishmentGroup:"معلومات المنشأة",merchantVerificationTitle:"عمليات التحقق المطلوبة",merchantVerificationLead:"تحقق من كل نقطة قبل تسجيل القرار.",merchantIdentityCheck:"هوية المتجر",merchantIdentityCheckHelp:"اسم النشاط ونوعه ومدى اتساق المعلومات",merchantContactCheck:"بيانات تواصل المالك",merchantContactCheckHelp:"البريد الإلكتروني ورقم هاتف المالك",merchantAddressCheck:"العنوان وساعات العمل",merchantAddressCheckHelp:"العنوان الكامل وساعات عمل المتجر",merchantCheckPending:"بانتظار التحقق",merchantCheckComplete:"تم التحقق",merchantSelectEmpty:"اختر متجراً لعرض ملفه."}
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
const supportCopy={
    fr:{inbox:"Boîte de réception",queue:"File des dossiers",queueHint:"Priorité aux urgences et à la sécurité alimentaire",conversation:"Conversation",context:"Contexte du dossier",customerDetails:"Informations du client",management:"Gestion du dossier",latestActivity:"Dernière activité",messages:"échanges",foodSafety:"Sécurité alimentaire",unassigned:"Non assigné",noReservation:"Aucune réservation liée",noOffer:"Aucune offre liée",noShop:"Aucun commerce lié",emptyQueue:"Aucun dossier dans cette file",emptyQueueHint:"Essayez un autre statut ou modifiez votre recherche.",selectTitle:"Sélectionnez un dossier",selectHint:"Choisissez une demande dans la file pour consulter les échanges et les actions disponibles.",initialMessage:"Message initial du client",teamMessage:"Équipe KULHA",customerMessage:"Client",internalNote:"Note interne",replyPlaceholder:"Rédigez une réponse claire au client…",notePlaceholder:"Rédigez une note réservée à l’équipe…",replyMode:"Réponse au client",noteMode:"Note interne",replyHint:"Cette réponse sera visible par le client.",noteHint:"Cette note reste privée et visible uniquement par l’équipe.",sendReply:"Envoyer la réponse",saveInternal:"Enregistrer la note",caseReasonHint:"Un motif est requis pour chaque action de gestion.",foodSafetyFlag:"À traiter en priorité",customerMaskedTitle:"Identité protégée",customerMaskedBody:"Les coordonnées restent masquées jusqu’à une consultation autorisée et motivée.",noMessages:"Aucun message supplémentaire pour le moment.",reference:"Référence",created:"Créé le",updated:"Mis à jour",customer:"Client",caseCount:"dossiers",linkedRecords:"Éléments liés",assignee:"Responsable",replyComposer:"Votre message",reasonPlaceholder:"Expliquez le motif de cette action…",privacyAudit:"La consultation des coordonnées est enregistrée dans le journal d’audit."},
    en:{inbox:"Support inbox",queue:"Case queue",queueHint:"Prioritise urgent cases and food safety",conversation:"Conversation",context:"Case context",customerDetails:"Customer details",management:"Case management",latestActivity:"Last activity",messages:"messages",foodSafety:"Food safety",unassigned:"Unassigned",noReservation:"No linked reservation",noOffer:"No linked offer",noShop:"No linked shop",emptyQueue:"No cases in this queue",emptyQueueHint:"Try another status or adjust your search.",selectTitle:"Select a case",selectHint:"Choose a request from the queue to review its conversation and available actions.",initialMessage:"Customer’s original message",teamMessage:"KULHA team",customerMessage:"Customer",internalNote:"Internal note",replyPlaceholder:"Write a clear reply to the customer…",notePlaceholder:"Write a note for the team only…",replyMode:"Customer reply",noteMode:"Internal note",replyHint:"The customer will be able to see this reply.",noteHint:"This note stays private to the KULHA team.",sendReply:"Send reply",saveInternal:"Save internal note",caseReasonHint:"A reason is required for every case-management action.",foodSafetyFlag:"Priority review",customerMaskedTitle:"Customer identity protected",customerMaskedBody:"Contact details stay masked until an authorized, reasoned disclosure.",noMessages:"No additional messages yet.",reference:"Reference",created:"Created",updated:"Updated",customer:"Customer",caseCount:"cases",linkedRecords:"Linked records",assignee:"Assignee",replyComposer:"Your message",reasonPlaceholder:"Explain why you are taking this action…",privacyAudit:"Customer-detail disclosures are recorded in the audit log."},
    ar:{inbox:"صندوق الدعم",queue:"قائمة الطلبات",queueHint:"أولوية للحالات العاجلة وسلامة الغذاء",conversation:"المحادثة",context:"سياق الحالة",customerDetails:"بيانات العميل",management:"إدارة الحالة",latestActivity:"آخر نشاط",messages:"رسائل",foodSafety:"سلامة الغذاء",unassigned:"غير معيّن",noReservation:"لا يوجد حجز مرتبط",noOffer:"لا يوجد عرض مرتبط",noShop:"لا يوجد متجر مرتبط",emptyQueue:"لا توجد حالات في هذه القائمة",emptyQueueHint:"جرّب حالة أخرى أو عدّل البحث.",selectTitle:"اختر حالة",selectHint:"اختر طلباً من القائمة لمراجعة المحادثة والإجراءات المتاحة.",initialMessage:"رسالة العميل الأصلية",teamMessage:"فريق KULHA",customerMessage:"العميل",internalNote:"ملاحظة داخلية",replyPlaceholder:"اكتب رداً واضحاً للعميل…",notePlaceholder:"اكتب ملاحظة للفريق فقط…",replyMode:"رد على العميل",noteMode:"ملاحظة داخلية",replyHint:"سيتمكن العميل من رؤية هذا الرد.",noteHint:"تبقى هذه الملاحظة خاصة بفريق KULHA.",sendReply:"إرسال الرد",saveInternal:"حفظ الملاحظة",caseReasonHint:"السبب مطلوب لكل إجراء إداري على الحالة.",foodSafetyFlag:"مراجعة ذات أولوية",customerMaskedTitle:"هوية العميل محمية",customerMaskedBody:"تبقى بيانات الاتصال مخفية حتى يتم الاطلاع عليها بصلاحية وسبب.",noMessages:"لا توجد رسائل إضافية حالياً.",reference:"المرجع",created:"تاريخ الإنشاء",updated:"آخر تحديث",customer:"العميل",caseCount:"حالات",linkedRecords:"السجلات المرتبطة",assignee:"المسؤول",replyComposer:"رسالتك",reasonPlaceholder:"اشرح سبب هذا الإجراء…",privacyAudit:"يتم تسجيل الاطلاع على بيانات العميل في سجل التدقيق."}
} as const;

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
const MERCHANT_PAGE_SIZE=5;
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

export function AdminConsole({locale,page}:{locale:SiteLocale;page:PageKey}){
    const pathname=usePathname();const router=useRouter();const searchParams=useSearchParams();const searchInputRef=useRef<HTMLInputElement>(null);
    const t={...words[locale],...more[locale]};
    const supportText=supportCopy[locale];
    const offerUi=locale==="fr"?{
        queueEyebrow:t.offerQueueEyebrow,queueTitle:t.offerQueueTitle,queueHint:t.offerQueueHint,metricsScope:t.offerMetricsScope,
        factsTitle:t.offerFactsTitle,foodTitle:t.offerFoodTitle,allergensLabel:t.offerAllergensLabel,notesLabel:t.offerNotesLabel,
        decisionTitle:t.offerDecisionTitle,decisionLead:t.offerDecisionLead,reasonPlaceholder:t.offerReasonPlaceholder,
        recordDecision:t.offerRecordDecision,imageMissing:t.offerImageMissing,reportedFlag:t.offerReportedFlag,checkAllergens:t.offerCheckAllergens
    }:locale==="ar"?{
        queueEyebrow:t.offerQueueEyebrow,queueTitle:t.offerQueueTitle,queueHint:t.offerQueueHint,metricsScope:t.offerMetricsScope,
        factsTitle:t.offerFactsTitle,foodTitle:t.offerFoodTitle,allergensLabel:t.offerAllergensLabel,notesLabel:t.offerNotesLabel,
        decisionTitle:t.offerDecisionTitle,decisionLead:t.offerDecisionLead,reasonPlaceholder:t.offerReasonPlaceholder,
        recordDecision:t.offerRecordDecision,imageMissing:t.offerImageMissing,reportedFlag:t.offerReportedFlag,checkAllergens:t.offerCheckAllergens
    }:{
        queueEyebrow:t.offerQueueEyebrow,queueTitle:t.offerQueueTitle,queueHint:t.offerQueueHint,metricsScope:t.offerMetricsScope,
        factsTitle:t.offerFactsTitle,foodTitle:t.offerFoodTitle,allergensLabel:t.offerAllergensLabel,notesLabel:t.offerNotesLabel,
        decisionTitle:t.offerDecisionTitle,decisionLead:t.offerDecisionLead,reasonPlaceholder:t.offerReasonPlaceholder,
        recordDecision:t.offerRecordDecision,imageMissing:t.offerImageMissing,reportedFlag:t.offerReportedFlag,checkAllergens:t.offerCheckAllergens
    };const {state,signOut}=useSession();const actorId=state.status==="authenticated"?state.user.id:"";const roles=state.status==="authenticated"?state.user.roles:[];const isSupportOnly=roles.includes("SUPPORT")&&!roles.includes("ADMIN")&&!roles.includes("SUPER_ADMIN");
    const [loading,setLoading]=useState(true);const [failed,setFailed]=useState(false);const [overview,setOverview]=useState<OverviewData|null>(null);const [reload,setReload]=useState(0);const [message,setMessage]=useState("");const [query,setQuery]=useState("");const [sidebarCollapsed,setSidebarCollapsed]=useState(false);
    const [todayChecks,setTodayChecks]=useState([false,false,false]);const [todayChecksMerchantId,setTodayChecksMerchantId]=useState<string|null>(null);const [todayVerifyMerchantId,setTodayVerifyMerchantId]=useState<string|null>(null);const [todayReason,setTodayReason]=useState("");const [todayDecisionAction,setTodayDecisionAction]=useState<MerchantAction|null>(null);const [todayDecisionMerchantId,setTodayDecisionMerchantId]=useState<string|null>(null);
    const [merchants,setMerchants]=useState<Page<Merchant>|null>(null);const [merchantStatus,setMerchantStatus]=useState("PENDING");const [merchantPage,setMerchantPage]=useState(()=>Math.max(0,Number(searchParams.get("page"))||0));const requestedMerchantId=useRef(page==="merchant-review"?searchParams.get("selected"):null);const [selectedMerchant,setSelectedMerchant]=useState<Merchant|null>(null);const [merchantViewMode,setMerchantViewMode]=useState<"read"|"verify">("read");const [merchantAction,setMerchantAction]=useState<MerchantAction|null>(null);const [checks,setChecks]=useState([false,false,false]);const [tabCounts,setTabCounts]=useState<{pending:number|null;info:number|null;approved:number|null;rejected:number|null}>({pending:null,info:null,approved:null,rejected:null});
    const [offers,setOffers]=useState<Page<Offer>|null>(null);const [offerStatus,setOfferStatus]=useState("");const [offerPage,setOfferPage]=useState(()=>Math.max(0,Number(searchParams.get("page"))||0));const requestedOfferId=useRef(page==="offer-moderation"?searchParams.get("selected"):null);const [selectedOffer,setSelectedOffer]=useState<Offer|null>(null);const [offerViewMode,setOfferViewMode]=useState<"read"|"write">("read");const [offerAction,setOfferAction]=useState<OfferAction>("suspend");
    const [cases,setCases]=useState<Page<CaseItem>|null>(null);const [caseStatus,setCaseStatus]=useState("OPEN");const [casePage,setCasePage]=useState(()=>Math.max(0,Number(searchParams.get("page"))||0));const requestedCaseReference=useRef(page==="support-cases"?searchParams.get("selected"):null);const [selectedCase,setSelectedCase]=useState<{summary:CaseItem;timeline:Timeline[]}|null>(null);const [caseCounts,setCaseCounts]=useState<{open:number|null;escalated:number|null;waiting:number|null;resolved:number|null}>({open:null,escalated:null,waiting:null,resolved:null});
    const [audit,setAudit]=useState<AuditPage|null>(null);const [auditPage,setAuditPage]=useState(0);const [auditPageSize,setAuditPageSize]=useState(AUDIT_PAGE_SIZE);const [selectedAuditId,setSelectedAuditId]=useState<string|null>(null);const [auditSearch,setAuditSearch]=useState("");const [auditFrom,setAuditFrom]=useState("");const [auditTo,setAuditTo]=useState("");const [auditAction,setAuditAction]=useState("");const [auditResult,setAuditResult]=useState("");const [auditQuickRange,setAuditQuickRange]=useState<"today"|"7"|"30"|null>(null);const [auditFiltersExpanded,setAuditFiltersExpanded]=useState(false);
    const [reason,setReason]=useState("");const [disclosureReason,setDisclosureReason]=useState("");const [internalNote,setInternalNote]=useState("");const [draftMessage,setDraftMessage]=useState("");const [sendToCustomer,setSendToCustomer]=useState(true);const [revealed,setRevealed]=useState<{fullName:string;email:string;phone:string|null}|null>(null);const [working,setWorking]=useState(false);

    useEffect(()=>{if(page!=="audit-log")return;const timeout=window.setTimeout(()=>setAuditSearch(query.trim()),280);return()=>window.clearTimeout(timeout);},[page,query]);
    useEffect(()=>{const onShortcut=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();searchInputRef.current?.focus();}};window.addEventListener("keydown",onShortcut);return()=>window.removeEventListener("keydown",onShortcut);},[]);

    useEffect(()=>{let active=true;
        const load=async()=>{try{
            if(page==="overview"){const results=await Promise.all([api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=30"),api.get<Page<Offer>>("/admin/offers?page=0&size=30"),api.get<Page<CaseItem>>("/admin/support-cases?status=OPEN&page=0&size=10"),api.get<AuditPage>("/admin/audit-log?page=0&size=5")]);if(active){setOverview({merchants:results[0],offers:results[1],cases:results[2],audit:results[3]});setFailed(false);}}
            if(page==="merchant-review"){const data=await api.get<Page<Merchant>>("/admin/merchants?status="+merchantStatus+"&page="+merchantPage+"&size="+MERCHANT_PAGE_SIZE);if(active){setMerchants(data);setFailed(false);setSelectedMerchant(data.items.find(item=>item.id===requestedMerchantId.current)??data.items[0]??null);requestedMerchantId.current=null;setMerchantViewMode("read");setMerchantAction(null);setChecks([false,false,false]);setReason("");setInternalNote("");}
                const statuses=["PENDING","INFO_REQUIRED","APPROVED","REJECTED"] as const;
                const stats=await Promise.allSettled(statuses.map(status=>status===merchantStatus?Promise.resolve(data):api.get<Page<Merchant>>("/admin/merchants?status="+status+"&page=0&size=1")));
                if(active)setTabCounts({pending:stats[0].status==="fulfilled"?stats[0].value.total:null,info:stats[1].status==="fulfilled"?stats[1].value.total:null,approved:stats[2].status==="fulfilled"?stats[2].value.total:null,rejected:stats[3].status==="fulfilled"?stats[3].value.total:null});}
            if(page==="offer-moderation"){const data=await api.get<Page<Offer>>(`/admin/offers?page=${offerPage}&size=${OFFER_PAGE_SIZE}`);if(active){const lastPage=Math.max(0,Math.ceil(data.total/Math.max(1,data.size))-1);if(offerPage>lastPage){setOfferPage(lastPage);return;}setOffers(data);setFailed(false);const selectedOfferItem=data.items.find(item=>item.id===requestedOfferId.current)??data.items[0]??null;setSelectedOffer(selectedOfferItem);requestedOfferId.current=null;setOfferViewMode("read");setReason("");setOfferAction(selectedOfferItem?.status==="SUSPENDED"?"reinstate":"suspend");}}
            if(page==="support-cases"){
                const data=await api.get<Page<CaseItem>>("/admin/support-cases?status="+caseStatus+"&page="+casePage+"&size="+CASE_PAGE_SIZE);
                if(active){setCases(data);setFailed(false);}
                const statuses=["OPEN","ESCALATED","WAITING_REPLY","RESOLVED"] as const;
                const stats=await Promise.allSettled(statuses.map(status=>api.get<Page<CaseItem>>("/admin/support-cases?status="+status+"&page=0&size=1")));
                if(active)setCaseCounts({open:stats[0].status==="fulfilled"?stats[0].value.total:null,escalated:stats[1].status==="fulfilled"?stats[1].value.total:null,waiting:stats[2].status==="fulfilled"?stats[2].value.total:null,resolved:stats[3].status==="fulfilled"?stats[3].value.total:null});
                const selectedCaseItem=data.items.find(item=>item.reference===requestedCaseReference.current)??data.items[0];if(active)requestedCaseReference.current=null;if(selectedCaseItem){const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+selectedCaseItem.reference);if(active)setSelectedCase(d);}else if(active)setSelectedCase(null);
            }
            if(page==="audit-log"){const q=new URLSearchParams();if(auditFrom)q.set("from",auditFrom);if(auditTo)q.set("to",auditTo);if(auditAction)q.set("action",auditAction);if(auditResult)q.set("result",auditResult);if(auditSearch)q.set("q",auditSearch);q.set("page",String(auditPage));q.set("size",String(auditPageSize));const data=await api.get<AuditPage>("/admin/audit-log?"+q.toString());if(active){setAudit(data);setSelectedAuditId(data.items[0]?.id??null);setFailed(false);}}
        }catch{if(active)setFailed(true);}finally{if(active)setLoading(false);}};
        void load();return()=>{active=false;};
    },[page,reload,merchantStatus,merchantPage,caseStatus,casePage,auditFrom,auditTo,auditAction,auditResult,auditPage,auditPageSize,auditSearch,offerPage]);

    const title=page==="overview"?(locale==="fr"?"Aujourd’hui":locale==="ar"?"اليوم":"Today"):page==="merchant-review"?t.merchantTitle:page==="offer-moderation"?t.offersTitle:page==="support-cases"?t.casesTitle:t.auditTitle;
    const lead=page==="overview"?(locale==="fr"?"Les priorités du jour, les demandes récentes et les décisions à examiner.":locale==="ar"?"أولويات اليوم والطلبات الأخيرة والقرارات التي تحتاج إلى مراجعة.":"Today’s priorities, recent requests and decisions that need review."):page==="merchant-review"?t.merchantLead:page==="offer-moderation"?t.offersLead:page==="support-cases"?t.casesLead:t.auditLead;
    const q=query.trim().toLocaleLowerCase(locale);
    const match=(...values:(string|null|undefined)[])=>!q||values.some(v=>(v||"").toLocaleLowerCase(locale).includes(q));
    const merchantLabel=(s:string)=>s==="PENDING"?t.pending:s==="INFO_REQUIRED"?t.info:s==="APPROVED"?t.approved:t.rejected;
    const merchantTone=(s:string)=>s==="PENDING"?styles.toneWarn:s==="INFO_REQUIRED"?styles.toneInfo:s==="APPROVED"?styles.toneOk:styles.toneBad;
    const offerLabel=(s:string)=>({PUBLISHED:t.live,SUSPENDED:t.hiddenS,UNPUBLISHED:t.unpublishedS,DRAFT:t.draftS,EXPIRED:t.expiredS,CANCELLED:t.cancelledS} as Record<string,string>)[s]??s;
    const offerTone=(s:string)=>s==="PUBLISHED"?styles.toneOk:s==="SUSPENDED"?styles.toneBad:s==="DRAFT"?styles.toneWarn:styles.toneMuted;
    const priorityLabel=(p:string)=>p==="HIGH"?t.high:p==="MEDIUM"?t.medium:p==="LOW"?t.low:p;
    const priorityTone=(p:string)=>p==="HIGH"?styles.toneBad:p==="MEDIUM"?styles.toneWarn:p==="LOW"?styles.toneMuted:styles.toneInfo;
    const caseStatusLabel=(status:string)=>status==="OPEN"?t.open:status==="ESCALATED"?t.escalated:status==="WAITING_REPLY"?t.waiting:status==="RESOLVED"?t.resolved:status;
    const caseStatusTone=(status:string)=>status==="RESOLVED"?styles.toneOk:status==="ESCALATED"?styles.toneBad:status==="WAITING_REPLY"?styles.toneWarn:styles.toneInfo;
    const isFoodSafetyCase=(...values:(string|null|undefined)[])=>/(food|allergen|safety|aliment|allerg|sécurité alimentaire|سلامة|غذاء)/i.test(values.filter(Boolean).join(" "));
    const discount=(o:Offer)=>o.originalPriceMinor&&o.originalPriceMinor>o.priceMinor?Math.round((1-o.priceMinor/o.originalPriceMinor)*100):null;

    async function loadMerchant(id:string){setWorking(true);try{const data=await api.get<Merchant>("/admin/merchants/"+id);setSelectedMerchant(data);setMerchantViewMode("read");setReason("");setInternalNote("");setMerchantAction(null);setChecks([false,false,false]);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function submitMerchant(){
        if(!selectedMerchant)return;if(!merchantAction||!reason.trim()){setMessage(t.needsReason);return;}if(merchantAction==="approve"&&checks.some(value=>!value)){setMessage(t.approveUnlocks);return;}setWorking(true);setMessage("");
        try{await api.post("/admin/merchants/"+selectedMerchant.id+"/"+merchantAction,{reason:reason.trim(),internalNote:internalNote.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedMerchant(null);setReason("");setInternalNote("");setMerchantAction(null);}
        catch{setMessage(t.error);}finally{setWorking(false);}
    }
    async function decideTodayMerchant(merchant:Merchant,action:MerchantAction,merchantChecks:boolean[]){
        if(action==="approve"&&merchantChecks.some(value=>!value)){setMessage(t.approveUnlocks);return;}
        if(!todayReason.trim()){setMessage(t.saveReason);return;}
        setWorking(true);setMessage("");
        try{await api.post("/admin/merchants/"+merchant.id+"/"+action,{reason:todayReason.trim(),internalNote:""});setMessage(t.save);setTodayReason("");setTodayChecks([false,false,false]);setTodayChecksMerchantId(null);setTodayVerifyMerchantId(null);setTodayDecisionAction(null);setTodayDecisionMerchantId(null);setReload(v=>v+1);}
        catch{setMessage(t.error);}finally{setWorking(false);}
    }
    async function submitOffer(){
        if(!selectedOffer)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);setMessage("");
        try{await api.post("/admin/offers/"+selectedOffer.id+"/"+offerAction,{reason:reason.trim()});setMessage(t.save);setReload(v=>v+1);setSelectedOffer(null);setOfferViewMode("read");setReason("");}
        catch{setMessage(t.error);}finally{setWorking(false);}
    }
    async function loadCase(reference:string){setWorking(true);setRevealed(null);setDisclosureReason("");setDraftMessage("");setSendToCustomer(true);try{const d=await api.get<{summary:CaseItem;timeline:Timeline[]}>("/admin/support-cases/"+reference);setSelectedCase(d);setReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function caseAction(action:string){if(!selectedCase)return;if(!reason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/actions",{action,reason:reason.trim()});setMessage(t.save);await loadCase(selectedCase.summary.reference);setReload(v=>v+1);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function sendMessage(event:SyntheticEvent<HTMLFormElement>){event.preventDefault();if(!selectedCase||!draftMessage.trim())return;setWorking(true);try{await api.post("/admin/support-cases/"+selectedCase.summary.reference+"/messages",{message:draftMessage.trim(),sendToCustomer});setDraftMessage("");await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function revealCustomer(){if(!selectedCase)return;if(!disclosureReason.trim()){setMessage(t.saveReason);return;}setWorking(true);try{const d=await api.post<{fullName:string;email:string;phone:string|null}>("/admin/support-cases/"+selectedCase.summary.reference+"/reveal-customer",{reason:disclosureReason.trim()});setRevealed(d);setDisclosureReason("");}catch{setMessage(t.error);}finally{setWorking(false);}}
    async function assignToMe(){if(!selectedCase||!actorId)return;setWorking(true);try{await api.put("/admin/support-cases/"+selectedCase.summary.reference+"/assignee",{assignedTo:actorId});await loadCase(selectedCase.summary.reference);setMessage(t.save);}catch{setMessage(t.error);}finally{setWorking(false);}}
    function exportAudit(){const p=new URLSearchParams();if(auditFrom)p.set("from",auditFrom);if(auditTo)p.set("to",auditTo);if(auditAction)p.set("action",auditAction);if(auditResult)p.set("result",auditResult);if(auditSearch)p.set("q",auditSearch);const a=document.createElement("a");a.href="/api/bff/admin/audit-log/export?"+p.toString();a.download="kulha-audit-log.csv";a.click();}
    function applyAuditRange(range:"today"|"7"|"30"){
        const days=range==="today"?1:Number(range);
        const end=new Date();end.setHours(0,0,0,0);
        const start=new Date(end);start.setDate(start.getDate()-(days-1));
        setAuditFrom(auditDateValue(start));setAuditTo(auditDateValue(end));setAuditQuickRange(range);setAuditPage(0);
    }
    const switchTab=(apply:()=>void)=>{setLoading(true);setFailed(false);apply();};

    const searchPlaceholder=page==="overview"?(locale==="fr"?"Rechercher partout":locale==="ar"?"ابحث في لوحة الإدارة":"Search the admin workspace"):page==="merchant-review"?t.searchMerchant:page==="offer-moderation"?t.searchOffers:page==="support-cases"?t.searchCases:t.searchAudit;
    const navItems=[
        {key:"overview" as const,href:"/admin",label:locale==="fr"?"Aujourd’hui":locale==="ar"?"اليوم":"Today",icon:LayoutDashboard},
        {key:"merchant-review" as const,href:"/admin/merchant-review",label:locale==="fr"?"Commerces":locale==="ar"?"المتاجر":"Merchants",icon:Store},
        {key:"offer-moderation" as const,href:"/admin/offer-moderation",label:locale==="fr"?"Offres":locale==="ar"?"العروض":"Offers",icon:Tag},
        {key:"support-cases" as const,href:"/admin/support-cases",label:locale==="fr"?"Support":locale==="ar"?"الدعم":"Support",icon:LifeBuoy},
        {key:"audit-log" as const,href:"/admin/audit-log",label:locale==="fr"?"Journal":locale==="ar"?"سجل التدقيق":"Audit log",icon:ClipboardList}
    ];
    const changeLocale=(nextLocale:SiteLocale)=>{window.dispatchEvent(new Event("kulha:navigation-start"));router.push(switchLocalePath(pathname,nextLocale));};
    const sidebarLabel=locale==="fr"?"Espace de travail":locale==="ar"?"مساحة العمل":"Workspace";
    const operationsLabel=locale==="fr"?"OPÉRATIONS":locale==="ar"?"العمليات":"OPERATIONS";
    const governanceLabel=locale==="fr"?"GOUVERNANCE":locale==="ar"?"الحوكمة":"GOVERNANCE";
    const collapseLabel=sidebarCollapsed?(locale==="fr"?"Développer le menu":locale==="ar"?"توسيع القائمة":"Expand navigation"):(locale==="fr"?"Réduire le menu":locale==="ar"?"طي القائمة":"Collapse navigation");
    const currentNavLabel=navItems.find(item=>item.key===page)?.label??title;
    const countForNav=(key:PageKey):number|null=>key==="overview"?(overview?overview.merchants.total+overview.offers.total+overview.cases.total:null):key==="merchant-review"?(tabCounts.pending??(page==="overview"?overview?.merchants.total??null:null)):key==="offer-moderation"?(offers?.total??(page==="overview"?overview?.offers.total??null:null)):key==="support-cases"?(caseCounts.open??(page==="overview"?overview?.cases.total??null:null)):null;
    const topbar=<header className={styles.adminTopbar} data-testid="admin-console-topbar">
        <div className={styles.adminBreadcrumb} aria-label={locale==="fr"?"Fil d’Ariane":locale==="ar"?"مسار التنقل":"Breadcrumb"}>
            <span>KULHA</span><ChevronRight size={14} aria-hidden="true"/><span>ADMIN</span><ChevronRight size={14} aria-hidden="true"/><strong>{currentNavLabel}</strong>
        </div>
        <div className={styles.adminTopbarTools}>
            <label className={`${styles.search} ${styles.adminSearch}`} data-testid="admin-console-search">
                <span className={styles.adminSearchIcon}><Search size={17} strokeWidth={2.2} aria-hidden="true"/></span>
                <span className="sr-only">{searchPlaceholder}</span>
                <input ref={searchInputRef} type="search" data-testid="admin-global-search" value={query} onChange={e=>{setQuery(e.target.value);if(page==="audit-log")setAuditPage(0);}} placeholder={searchPlaceholder}/>
                <kbd>⌘ K</kbd>
            </label>
            <label className={styles.localeControl}>
                <span className="sr-only">{locale==="fr"?"Langue":locale==="ar"?"اللغة":"Language"}</span>
                <Languages size={17} aria-hidden="true"/>
                <span className={styles.localeCurrent}>{locale==="ar"?"عربي":locale.toUpperCase()}</span>
                <ChevronDown size={14} aria-hidden="true"/>
                <select aria-label={locale==="fr"?"Langue":locale==="ar"?"اللغة":"Language"} value={locale} onChange={e=>changeLocale(e.target.value as SiteLocale)}>
                    <option value="fr">FR</option><option value="en">EN</option><option value="ar">عربي</option>
                </select>
            </label>
            <button type="button" className={styles.topbarSignOut} onClick={()=>void signOut()} aria-label={locale==="fr"?"Déconnexion":locale==="ar"?"تسجيل الخروج":"Sign out"} title={locale==="fr"?"Déconnexion":locale==="ar"?"تسجيل الخروج":"Sign out"}>
                <LogOut size={17} aria-hidden="true"/><span>{locale==="fr"?"Déconnexion":locale==="ar"?"تسجيل الخروج":"Sign out"}</span>
            </button>
        </div>
    </header>;
    const sidebarLink=(item:typeof navItems[number])=>{
        const Icon=item.icon;const count=countForNav(item.key);const active=page===item.key;
        return <Link key={item.key} href={localePath(locale,item.href)} aria-current={active?"page":undefined} aria-label={item.label} title={item.label} className={active?styles.sidebarNavActive:styles.sidebarNavLink}>
            <span className={styles.sidebarNavIcon}><Icon size={19} strokeWidth={active?2.25:1.9} aria-hidden="true"/></span>
            <span className={styles.sidebarNavText}>{item.label}</span>
            {typeof count==="number"&&<em className={styles.sidebarNavCount}>{count>99?"99+":count}</em>}
            {active&&<span className={styles.sidebarActiveMark} aria-hidden="true"/>}
        </Link>;
    };
    const frame=(content:ReactNode)=><div className={`${styles.shell} ${sidebarCollapsed?styles.shellCollapsed:""} kulhaAdminShell`} data-page={page} dir={locale==="ar"?"rtl":"ltr"}>
        <aside className={styles.adminSidebar} aria-label={locale==="fr"?"Navigation d’administration":locale==="ar"?"قائمة الإدارة":"Admin navigation"}>
            <div className={styles.sidebarBrandRow}>
                <Link href={localePath(locale,"/admin")} className={styles.sidebarBrand} aria-label="KULHA Administration">KULHA<span>!</span></Link>
                <button type="button" className={styles.sidebarCollapse} onClick={()=>setSidebarCollapsed(value=>!value)} aria-label={collapseLabel} aria-expanded={!sidebarCollapsed} title={collapseLabel}>{sidebarCollapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button>
            </div>
            <div className={styles.sidebarWorkspace}>
                <span className={styles.sidebarWorkspaceIcon}><ShieldCheck size={17} aria-hidden="true"/></span>
                <span className={styles.sidebarWorkspaceCopy}><strong>ADMIN CONSOLE</strong><small>{sidebarLabel}</small></span>
            </div>
            <nav className={styles.sidebarNav} aria-label={locale==="fr"?"Sections":locale==="ar"?"الأقسام":"Sections"}>
                <div className={styles.sidebarSection}>
                    <span className={styles.sidebarSectionLabel}>{operationsLabel}</span>
                    {navItems.slice(0,4).map(sidebarLink)}
                </div>
                <div className={styles.sidebarSection}>
                    <span className={styles.sidebarSectionLabel}>{governanceLabel}</span>
                    {navItems.slice(4).map(sidebarLink)}
                </div>
            </nav>
            <div className={styles.sidebarFooter}>
                <span className={styles.sidebarAvatar}>{state.status==="authenticated"?(state.user.fullName||state.user.email).slice(0,1).toUpperCase():"A"}</span>
                <span className={styles.sidebarProfileCopy}><strong>{state.status==="authenticated"?(state.user.fullName||state.user.email):"Admin"}</strong><small>{locale==="fr"?"Administrateur":locale==="ar"?"مسؤول الإدارة":"Administrator"}</small></span>
            </div>
        </aside>
        <div className={styles.adminMainColumn}>
            {topbar}
            <main className={styles.page}>{content}</main>
        </div>
    </div>;

    if(loading)return frame(<><div className={styles.header}><div><div className={styles.skeleton}/><div className={styles.skeletonWide}/></div></div><div className={styles.skeletonPanel}/></>);
    if(failed)return frame(<div className={styles.alert} role="alert">{t.error}<button onClick={()=>{setLoading(true);setFailed(false);setReload(v=>v+1);}}>{t.retry}</button></div>);

    const merchantItems=merchants?.items.filter(m=>match(m.name,m.businessType,m.city,m.ownerEmail))??[];
    const allOfferItems=offers?.items??[];
    const offerItems=allOfferItems.filter(o=>{
        const matchesQuery=match(o.title,o.shopName,o.city);
        const matchesFilter=!offerStatus||(offerStatus==="REPORTED"&&o.reportedCount>0)||(offerStatus==="ALLERGENS_UNKNOWN"&&o.allergensStatus==="UNKNOWN")||(offerStatus==="SUSPENDED"&&o.status==="SUSPENDED");
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
    const hasAuditFilters=Boolean(auditSearch||auditFrom||auditTo||auditAction||auditResult);
    const activeAuditAdvancedCount=[Boolean(auditFrom||auditTo),Boolean(auditAction),Boolean(auditResult)].filter(Boolean).length;
    const auditDateGroup=(value:string)=>{const date=new Date(value);if(Number.isNaN(date.getTime()))return {key:"unknown",label:"—"};return {key:`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,label:date.toLocaleDateString(loc(locale),{weekday:"long",day:"numeric",month:"long",year:"numeric"})};};
    const auditUi=auditText[locale];
    const resultLabel=(r:string)=>r==="SUCCESS"?t.success:r==="DENIED"?t.denied:r==="FAILED"?auditUi.failed:r;
    const resultTone=(r:string)=>r==="SUCCESS"?styles.toneOk:r==="DENIED"||r==="FAILED"?styles.toneBad:styles.toneMuted;
    const resultPill=(r:string)=><span className={styles.pill+" "+resultTone(r)}>{resultLabel(r)}</span>;
    const tabCount=(value:string)=>value==="PENDING"?(merchantStatus==="PENDING"?merchants?.total:tabCounts.pending):value==="INFO_REQUIRED"?(merchantStatus==="INFO_REQUIRED"?merchants?.total:tabCounts.info):value==="APPROVED"?(merchantStatus==="APPROVED"?merchants?.total:tabCounts.approved):(merchantStatus==="REJECTED"?merchants?.total:tabCounts.rejected);

    return frame(<>
        <header className={`${styles.header} ${page==="offer-moderation"?styles.offerHeader:""} ${page==="overview"?styles.todayPageHeader:""} ${page==="merchant-review"?styles.merchantPageHeader:""}`} data-testid="admin-page-heading">
            <div className={styles.headerCopy}>
                <h1>{title}</h1>
                {page==="overview"&&overview? <div className={styles.todayHeaderSubline}>
                    <p>{lead}</p>
                    <nav className={styles.todayInlineMetrics} aria-label={locale==="fr"?"Indicateurs du jour":locale==="ar"?"مؤشرات اليوم":"Today metrics"}>
                        <Link href={localePath(locale,"/admin/merchant-review")} className={styles.todayInlineMetric}><span className={styles.todayInlineMetricIcon}><Store size={21} strokeWidth={2.1} aria-hidden="true"/></span><strong>{overview.merchants.total.toLocaleString(locale)}</strong><span>{locale==="fr"?"Commerces en attente":locale==="ar"?"متاجر بانتظار المراجعة":"Pending merchants"}</span></Link>
                        <Link href={localePath(locale,"/admin/offer-moderation")} className={styles.todayInlineMetric}><span className={styles.todayInlineMetricIcon}><PackageCheck size={21} strokeWidth={2.1} aria-hidden="true"/></span><strong>{overview.offers.total.toLocaleString(locale)}</strong><span>{locale==="fr"?"Offres enregistrées":locale==="ar"?"العروض المسجلة":"Offers recorded"}</span></Link>
                        <Link href={localePath(locale,"/admin/support-cases")} className={styles.todayInlineMetric}><span className={styles.todayInlineMetricIcon}><LifeBuoy size={21} strokeWidth={2.1} aria-hidden="true"/></span><strong>{overview.cases.total.toLocaleString(locale)}</strong><span>{locale==="fr"?"Dossiers ouverts":locale==="ar"?"ملفات مفتوحة":"Open cases"}</span></Link>
                    </nav>
                </div>:page==="merchant-review"?<div className={styles.merchantHeaderSubline}>
                    <nav className={styles.merchantStatusMetrics} role="tablist" aria-label={t.merchantTitle}>
                        {merchantStatuses.map(value=>{const Icon=value==="PENDING"?Clock3:value==="INFO_REQUIRED"?AlertTriangle:value==="APPROVED"?CheckCircle2:X;const count=tabCount(value);return <button key={value} type="button" role="tab" aria-selected={merchantStatus===value} className={`${styles.merchantStatusMetric} ${merchantStatus===value?styles.merchantStatusMetricActive:""}`} onClick={()=>{if(merchantStatus===value)return;switchTab(()=>{setMerchantStatus(value);setMerchantPage(0);setSelectedMerchant(null);setMerchantViewMode("read");setReason("");setInternalNote("");setMerchantAction(null);setChecks([false,false,false]);});}}><span className={styles.merchantStatusMetricIcon}><Icon size={19} strokeWidth={2.1} aria-hidden="true"/></span><span className={styles.merchantStatusMetricLabel}>{merchantLabel(value)}</span><strong>{typeof count==="number"?count.toLocaleString(locale):"—"}</strong></button>;})}
                    </nav>
                </div>:<p>{lead}</p>}
            </div>
            {page==="offer-moderation"&&offers&&<div className={styles.offerMetrics} aria-label={t.offersTitle}>
                <article><span className={styles.offerMetricIcon}><AlertTriangle size={19} strokeWidth={2.1} aria-hidden="true"/></span><div><strong>{needsReviewCount}</strong><span>{t.needsReview}</span></div></article>
                <article><span className={styles.offerMetricIcon}><Flag size={19} strokeWidth={2.1} aria-hidden="true"/></span><div><strong>{reportedOfferCount}</strong><span>{t.reportedMetric}</span></div></article>
                <article><span className={styles.offerMetricIcon}><EyeOff size={19} strokeWidth={2.1} aria-hidden="true"/></span><div><strong>{hiddenOfferCount}</strong><span>{t.hiddenMetric}</span></div></article>
                <article><span className={styles.offerMetricIcon}><CheckCircle2 size={19} strokeWidth={2.1} aria-hidden="true"/></span><div><strong>{liveOfferCount}</strong><span>{t.liveNow}</span></div></article>
                <small className={styles.offerMetricsScope}>{offerUi.metricsScope}</small>
            </div>}
            {page==="audit-log"&&<button className={styles.ghostBtn} disabled={working} onClick={()=>void exportAudit()}><FileText size={16} aria-hidden="true"/>{auditText[locale].exportCsv}</button>}
        </header>
        {message&&<div className={styles.notice} role="status">{message}</div>}


        {page==="overview"&&overview&&(()=>{
            const visibleMerchants=overview.merchants.items.filter(item=>match(item.name,item.businessType,item.city,item.ownerEmail));
            const visibleOffers=overview.offers.items.filter(item=>match(item.title,item.shopName,item.city)&&(item.allergensStatus==="UNKNOWN"||item.reportedCount>0));
            const visibleCases=overview.cases.items.filter(item=>match(item.subject,item.reference,item.merchantName,item.offerTitle));
            const queueItems:TodayQueueItem[]=[
                ...visibleMerchants.map(item=>({kind:"merchant" as const,item,createdAt:item.createdAt})),
                ...visibleOffers.map(item=>({kind:"offer" as const,item,createdAt:item.createdAt})),
                ...visibleCases.map(item=>({kind:"case" as const,item,createdAt:item.createdAt}))
            ].sort((a,b)=>{const left=a.createdAt?Date.parse(a.createdAt):Number.NaN;const right=b.createdAt?Date.parse(b.createdAt):Number.NaN;if(!Number.isFinite(left)&&!Number.isFinite(right))return 0;if(!Number.isFinite(left))return 1;if(!Number.isFinite(right))return -1;return left-right;});
            const nextTask=queueItems[0]??null;
            const nextMerchant=nextTask?.kind==="merchant"?nextTask.item:null;
            const nextOffer=nextTask?.kind==="offer"?nextTask.item:null;
            const nextCase=nextTask?.kind==="case"?nextTask.item:null;
            const currentTodayChecks=nextMerchant&&todayChecksMerchantId===nextMerchant.id?todayChecks:[false,false,false];
            const checksDone=currentTodayChecks.filter(Boolean).length;
            const isTodayVerifyMode=Boolean(nextMerchant&&todayVerifyMerchantId===nextMerchant.id);
            const activeTodayDecisionAction=isTodayVerifyMode&&todayDecisionAction&&todayDecisionMerchantId===nextMerchant?.id?todayDecisionAction:null;
            const labels=locale==="fr"?{
                pending:"Commerces en attente",offers:"Offres enregistrées",cases:"Dossiers ouverts",
                pendingCaption:"Décisions à prendre",offersCaption:"Dans le catalogue",casesCaption:"À traiter par l’équipe",
                activity:"Activité récente",queue:"File d’attente",queueTitle:"À traiter",queueHint:"Classé du plus ancien au plus récent",
                next:"Prochaine décision",view:"Voir tout",empty:"Aucun élément prioritaire dans les résultats chargés.",
                merchant:"Demande de commerce",offer:"Offre à examiner",support:"Dossier support",
                openMerchant:"Examiner la demande",openOffer:"Ouvrir la modération",openCase:"Ouvrir le dossier",
                owner:"Propriétaire",phone:"Téléphone",address:"Adresse",hours:"Horaires",submitted:"Envoyée",audit:"Ouvrir le journal",
                noMerchant:"Aucune demande de commerce en attente dans cette vue.",noOffer:"Aucune offre signalée ou incomplète dans les résultats chargés.",
                queueMerchant:"Commerce",queueOffer:"Offre",queueCase:"Support",oldest:"Plus ancien",reviewFlow:"Parcours de vérification",
                identity:"Identité du commerce",contact:"Coordonnées du propriétaire",location:"Adresse et horaires",
                identityHelp:"Nom, activité et cohérence de l’établissement",contactHelp:"E-mail et numéro du propriétaire",locationHelp:"Adresse complète et horaires d’ouverture",
                businessInfo:"Informations du commerce",checksTitle:"Vérifications à effectuer",checksHelp:"Validez chaque point avant de prendre votre décision.",
                checked:"vérifié(s) sur 3",reasonPlaceholder:"Décrivez le motif de votre décision et les éléments vérifiés…",reasonForApprove:"Motif de l’approbation",reasonForRequest:"Motif de la demande d’informations",reasonForReject:"Motif du refus",confirmDecision:"Confirmer la décision",confirmAction:"Confirmer",cancelDecision:"Annuler",
                reviewCount:"À contrôler",catalogueCount:"Enregistrées",supportCount:"Ouverts",verifyRequest:"Vérifier la demande",viewInformation:"Voir les informations",readSummaryTitle:"Informations transmises",readSummarySubtitle:"Aperçu des champs fournis dans la demande, avant toute vérification.",readSummaryIdentity:"Identité commerciale",readSummaryIdentityFields:"Nom · activité · ville",readSummaryContact:"Contact propriétaire",readSummaryContactFields:"E-mail · téléphone",readSummaryEstablishment:"Établissement",readSummaryEstablishmentFields:"Adresse · horaires",readSummaryProvided:"champs renseignés",readSummaryDisclosure:"Ces indicateurs confirment uniquement la présence des informations, pas leur exactitude."
            }:locale==="ar"?{
                pending:"متاجر بانتظار المراجعة",offers:"العروض المسجلة",cases:"ملفات الدعم المفتوحة",
                pendingCaption:"قرارات بانتظار المراجعة",offersCaption:"في الكتالوج",casesCaption:"تحتاج إلى معالجة",
                activity:"النشاط الأخير",queue:"قائمة الانتظار",queueTitle:"عناصر تحتاج إلى إجراء",queueHint:"مرتبة من الأقدم إلى الأحدث",
                next:"القرار التالي",view:"عرض الكل",empty:"لا توجد عناصر ذات أولوية ضمن النتائج المحملة.",
                merchant:"طلب متجر",offer:"عرض يحتاج إلى مراجعة",support:"ملف دعم",
                openMerchant:"مراجعة الطلب",openOffer:"فتح مراجعة العروض",openCase:"فتح ملف الدعم",
                owner:"المالك",phone:"الهاتف",address:"العنوان",hours:"ساعات العمل",submitted:"تاريخ الإرسال",audit:"فتح سجل التدقيق",
                noMerchant:"لا توجد طلبات متاجر معلقة في هذه القائمة.",noOffer:"لا توجد عروض مبلغ عنها أو غير مكتملة ضمن النتائج المحملة.",
                queueMerchant:"متجر",queueOffer:"عرض",queueCase:"دعم",oldest:"الأقدم أولاً",reviewFlow:"مراحل التحقق",
                identity:"هوية المتجر",contact:"بيانات المالك",location:"العنوان وساعات العمل",
                identityHelp:"اسم المتجر ونشاطه ومدى تطابق البيانات",contactHelp:"البريد الإلكتروني ورقم هاتف المالك",locationHelp:"العنوان الكامل وساعات العمل",
                businessInfo:"معلومات المتجر",checksTitle:"عمليات التحقق المطلوبة",checksHelp:"تحقق من كل نقطة قبل اتخاذ القرار.",
                checked:"منجزة من 3",reasonPlaceholder:"اشرح سبب القرار والعناصر التي تم التحقق منها…",reasonForApprove:"سبب الموافقة",reasonForRequest:"سبب طلب المعلومات",reasonForReject:"سبب الرفض",confirmDecision:"تأكيد القرار",confirmAction:"تأكيد",cancelDecision:"إلغاء",
                reviewCount:"بانتظار المراجعة",catalogueCount:"مسجلة",supportCount:"مفتوحة",verifyRequest:"التحقق من الطلب",viewInformation:"عرض المعلومات",readSummaryTitle:"المعلومات المقدمة",readSummarySubtitle:"نظرة عامة على البيانات الواردة في الطلب قبل التحقق منها.",readSummaryIdentity:"هوية المتجر",readSummaryIdentityFields:"الاسم · النشاط · المدينة",readSummaryContact:"بيانات المالك",readSummaryContactFields:"البريد الإلكتروني · الهاتف",readSummaryEstablishment:"معلومات المتجر",readSummaryEstablishmentFields:"العنوان · ساعات العمل",readSummaryProvided:"حقول مدخلة",readSummaryDisclosure:"توضح هذه المؤشرات توفر المعلومات فقط، ولا تعني التحقق من صحتها."
            }:{
                pending:"Merchants pending review",offers:"Offers in the system",cases:"Open support cases",
                pendingCaption:"Decisions waiting",offersCaption:"In the catalogue",casesCaption:"Needs team action",
                activity:"Recent activity",queue:"Work queue",queueTitle:"Needs attention",queueHint:"Sorted oldest first",
                next:"Next decision",view:"View all",empty:"No priority items in the loaded results.",
                merchant:"Merchant application",offer:"Offer to review",support:"Support case",
                openMerchant:"Review application",openOffer:"Open moderation",openCase:"Open support case",
                owner:"Owner",phone:"Phone",address:"Address",hours:"Opening hours",submitted:"Submitted",audit:"Open audit log",
                noMerchant:"There are no pending merchant applications in this view.",noOffer:"There are no reported or incomplete offers in the loaded results.",
                queueMerchant:"Merchant",queueOffer:"Offer",queueCase:"Support",oldest:"Oldest first",reviewFlow:"Verification process",
                identity:"Business identity",contact:"Owner contact details",location:"Address and opening hours",
                identityHelp:"Business name, activity and consistency",contactHelp:"Owner email address and phone number",locationHelp:"Full address and opening hours",
                businessInfo:"Business information",checksTitle:"Checks to complete",checksHelp:"Confirm each point before making your decision.",
                checked:"of 3 checked",reasonPlaceholder:"Explain the reason for your decision and what you verified…",reasonForApprove:"Reason for approval",reasonForRequest:"Reason for requesting information",reasonForReject:"Reason for rejection",confirmDecision:"Confirm decision",confirmAction:"Confirm",cancelDecision:"Cancel",
                reviewCount:"Needs review",catalogueCount:"Registered",supportCount:"Open",verifyRequest:"Verify application",viewInformation:"View submitted details",readSummaryTitle:"Submitted information",readSummarySubtitle:"A quick overview of the fields supplied with this application, before review.",readSummaryIdentity:"Business identity",readSummaryIdentityFields:"Name · activity · city",readSummaryContact:"Owner contact",readSummaryContactFields:"Email · phone",readSummaryEstablishment:"Business details",readSummaryEstablishmentFields:"Address · opening hours",readSummaryProvided:"fields supplied",readSummaryDisclosure:"These indicators show that information was supplied; they do not mean it has been verified."
            };
            const readSummaryGroups=nextMerchant?[
                {key:"identity",title:labels.readSummaryIdentity,description:labels.readSummaryIdentityFields,icon:<Store size={19} aria-hidden="true"/>,fields:[nextMerchant.name,nextMerchant.businessType,nextMerchant.city]},
                {key:"contact",title:labels.readSummaryContact,description:labels.readSummaryContactFields,icon:<Mail size={19} aria-hidden="true"/>,fields:[nextMerchant.ownerEmail,nextMerchant.phone]},
                {key:"establishment",title:labels.readSummaryEstablishment,description:labels.readSummaryEstablishmentFields,icon:<MapPin size={19} aria-hidden="true"/>,fields:[nextMerchant.address,nextMerchant.openingHours]}
            ]:[];
            const readSummaryProvided=readSummaryGroups.reduce((sum,group)=>sum+group.fields.filter(value=>Boolean(value?.trim())).length,0);
            const readSummaryTotal=readSummaryGroups.reduce((sum,group)=>sum+group.fields.length,0);
            const handleTodayDecisionChoice=(action:MerchantAction)=>{
                if(!nextMerchant||!isTodayVerifyMode)return;
                if(activeTodayDecisionAction===action){
                    void decideTodayMerchant(nextMerchant,action,currentTodayChecks);
                    return;
                }
                setTodayDecisionMerchantId(nextMerchant.id);
                setTodayDecisionAction(action);
                setTodayReason("");
                setMessage("");
            };
            return <section className={styles.overview} data-testid="admin-today-workspace">
                <div className={styles.overviewGrid}>
                    <section className={styles.overviewPanel+" "+styles.todayQueue}>
                        <header>
                            <div className={styles.todayQueueHeaderText}>
                                <span className={styles.overviewEyebrow}>{labels.queue}</span>
                                <h3>{labels.queueTitle}</h3>
                                <small><Clock3 size={13}/>{labels.queueHint}</small>
                            </div>
                            <span className={styles.overviewTotal}>{queueItems.length.toLocaleString(locale)}</span>
                        </header>
                        <div className={styles.todayQueueRows}>
                            {queueItems.map((entry,index)=>{
                                const current=index===0;
                                const when=entry.createdAt?shortDateTime(entry.createdAt,locale):"";
                                if(entry.kind==="merchant"){
                                    const item=entry.item;const itemIndex=overview.merchants.items.findIndex(candidate=>candidate.id===item.id);
                                    return <Link key={`merchant-${item.id}`} href={`${localePath(locale,"/admin/merchant-review")}?page=${Math.floor(Math.max(0,itemIndex)/MERCHANT_PAGE_SIZE)}&selected=${encodeURIComponent(item.id)}`} className={[styles.todayQueueRow,styles.todayQueueRowMerchant,current?styles.todayQueueRowCurrent:""].join(" ")}>
                                        <span className={styles.todayQueueIcon}><Store size={20}/></span>
                                        <span className={styles.todayQueueCopy}><span className={styles.todayQueueType}>{labels.queueMerchant}{when&&<i><Clock3 size={12}/>{when}</i>}</span><strong>{item.name}</strong><small>{item.businessType} · {item.city} · {item.ownerEmail}</small></span>
                                        <span className={styles.todayQueueMeta}><em className={styles.pill+" "+merchantTone(item.status)}>{merchantLabel(item.status)}</em><ChevronRight size={17}/></span>
                                    </Link>;
                                }
                                if(entry.kind==="offer"){
                                    const item=entry.item;const itemIndex=overview.offers.items.findIndex(candidate=>candidate.id===item.id);
                                    return <Link key={`offer-${item.id}`} href={`${localePath(locale,"/admin/offer-moderation")}?page=${Math.floor(Math.max(0,itemIndex)/OFFER_PAGE_SIZE)}&selected=${encodeURIComponent(item.id)}`} className={[styles.todayQueueRow,styles.todayQueueRowOffer,current?styles.todayQueueRowCurrent:""].join(" ")}>
                                        <span className={styles.todayQueueThumb}>{item.imageUrl?<OfferImage src={item.imageUrl} alt="" lazy/>:<Tag size={20}/>}</span>
                                        <span className={styles.todayQueueCopy}><span className={styles.todayQueueType}>{labels.queueOffer}{when&&<i><Clock3 size={12}/>{when}</i>}</span><strong>{item.title}</strong><small>{item.shopName} · {item.city}</small></span>
                                        <span className={styles.todayQueueMeta}><em className={styles.pill+" "+(item.allergensStatus==="UNKNOWN"?styles.toneWarn:styles.toneBad)}>{item.allergensStatus==="UNKNOWN"?(locale==="fr"?"Allergènes inconnus":locale==="ar"?"مسببات حساسية غير معروفة":"Allergens unknown"):locale==="fr"?"Signalée":locale==="ar"?"مبلغ عنها":"Reported"}</em><ChevronRight size={17}/></span>
                                    </Link>;
                                }
                                const item=entry.item;const itemIndex=overview.cases.items.findIndex(candidate=>candidate.reference===item.reference);
                                return <Link key={`case-${item.reference}`} href={`${localePath(locale,"/admin/support-cases")}?page=${Math.floor(Math.max(0,itemIndex)/CASE_PAGE_SIZE)}&selected=${encodeURIComponent(item.reference)}`} className={[styles.todayQueueRow,styles.todayQueueRowCase,current?styles.todayQueueRowCurrent:""].join(" ")}>
                                    <span className={styles.todayQueueIcon}><LifeBuoy size={20}/></span>
                                    <span className={styles.todayQueueCopy}><span className={styles.todayQueueType}>{labels.queueCase}{when&&<i><Clock3 size={12}/>{when}</i>}</span><strong>{item.subject}</strong><small>{item.reference} · {item.merchantName||t.shop}</small></span>
                                    <span className={styles.todayQueueMeta}><em className={styles.pill+" "+priorityTone(item.priority)}>{priorityLabel(item.priority)}</em><ChevronRight size={17}/></span>
                                </Link>;
                            })}
                            {!queueItems.length&&<div className={styles.todayQueueEmpty}><ShieldCheck size={25}/><strong>{labels.empty}</strong></div>}
                        </div>
                        <div className={styles.todayQueueActivity}>
                            <div><span className={styles.todayQueueActivityDot}/><span><strong>{overview.audit.items[0]?auditActionLabel(overview.audit.items[0].action,locale):labels.activity}</strong><small>{overview.audit.items[0]?`${overview.audit.items[0].actorName} · ${shortDateTime(overview.audit.items[0].createdAt,locale)}`:(locale==="fr"?"Aucune activité récente.":locale==="ar"?"لا توجد أنشطة حديثة.":"No recent activity.")}</small></span></div>
                            <Link href={localePath(locale,"/admin/audit-log")} aria-label={labels.audit}><ArrowUpRight size={16}/></Link>
                        </div>
                    </section>
                    <section className={styles.overviewPanel+" "+styles.todayNext}>
                        <header className={styles.todayNextHeader}>
                            <div><span className={styles.overviewEyebrow}>{labels.next}</span><h3>{nextMerchant?labels.merchant:nextOffer?labels.offer:nextCase?labels.support:labels.next}</h3></div>
                            {nextMerchant&&<button type="button" className={styles.todayModeToggle} aria-pressed={isTodayVerifyMode} onClick={()=>{
                                if(isTodayVerifyMode){setTodayVerifyMerchantId(null);setTodayDecisionAction(null);setTodayDecisionMerchantId(null);setTodayReason("");}
                                else{setTodayVerifyMerchantId(nextMerchant.id);setTodayDecisionAction(null);setTodayDecisionMerchantId(null);setTodayReason("");}
                            }}>
                                {isTodayVerifyMode?<Eye size={16}/>:<ShieldCheck size={16}/>}
                                <span>{isTodayVerifyMode?labels.viewInformation:labels.verifyRequest}</span>
                            </button>}
                            <span className={styles.pill+" "+(nextMerchant?merchantTone(nextMerchant.status):nextOffer?styles.toneWarn:nextCase?priorityTone(nextCase.priority):styles.toneOk)}>{nextMerchant?merchantLabel(nextMerchant.status):nextOffer?labels.offer:nextCase?priorityLabel(nextCase.priority):(locale==="fr"?"À jour":locale==="ar"?"مكتمل":"Clear")}</span>
                        </header>
                        <div className={styles.todayNextBody+(nextMerchant?" "+styles.todayNextMerchantBody:"")}>
                            {nextMerchant? <>
                                <div className={`${styles.todayDecisionWorkspace} ${isTodayVerifyMode?styles.todayVerificationMode:styles.todayReadMode}`}>
                                    {!isTodayVerifyMode? <><section className={styles.todayMerchantOverview} aria-label={labels.businessInfo}>
                                        <div className={styles.todayMerchantIdentity}>
                                            <span className={styles.todayNextAvatar}><Store size={27}/></span>
                                            <div className={styles.todayNextTitle}>
                                                <div className={styles.todayNextReference}><span>{labels.merchant}</span><code>KLH-M-{nextMerchant.id.slice(0,4).toUpperCase()}</code></div>
                                                <h2>{nextMerchant.name}</h2>
                                                <p><span>{nextMerchant.businessType}</span><i>·</i><span>{nextMerchant.city}</span></p>
                                            </div>
                                        </div>
                                        <dl className={styles.todayMerchantFacts}>
                                            <div><dt><Mail size={15}/>{labels.owner}</dt><dd>{nextMerchant.ownerEmail||"—"}</dd></div>
                                            <div><dt><Phone size={15}/>{labels.phone}</dt><dd>{nextMerchant.phone||"—"}</dd></div>
                                            <div><dt><Clock3 size={15}/>{labels.hours}</dt><dd>{nextMerchant.openingHours||"—"}</dd></div>
                                            <div className={styles.todayMerchantFactAddress}><dt><MapPin size={15}/>{labels.address}</dt><dd>{nextMerchant.address||nextMerchant.city||"—"}</dd></div>
                                            <div><dt><CalendarDays size={15}/>{labels.submitted}</dt><dd>{shortDateTime(nextMerchant.createdAt,locale)}</dd></div>
                                        </dl>
                                    </section>
                                    <section className={styles.todayReadSummary} aria-label={labels.readSummaryTitle}>
                                        <div className={styles.todayReadSummaryHeader}>
                                            <div><strong>{labels.readSummaryTitle}</strong><small>{labels.readSummarySubtitle}</small></div>
                                            <span className={styles.todayReadSummaryTotal}><strong>{readSummaryProvided}/{readSummaryTotal}</strong><small>{labels.readSummaryProvided}</small></span>
                                        </div>
                                        <div className={styles.todayReadSummaryGrid}>
                                            {readSummaryGroups.map(group=>{
                                                const provided=group.fields.filter(value=>Boolean(value?.trim())).length;
                                                const complete=provided===group.fields.length;
                                                return <article className={styles.todayReadSummaryCard} key={group.key}>
                                                    <div className={styles.todayReadSummaryCardIcon}>{group.icon}</div>
                                                    <div className={styles.todayReadSummaryCardCopy}>
                                                        <div className={styles.todayReadSummaryCardTitle}><strong>{group.title}</strong><span className={complete?styles.todayReadSummaryComplete:styles.todayReadSummaryPartial}>{provided}/{group.fields.length}</span></div>
                                                        <small>{group.description}</small>
                                                        <span className={styles.todayReadSummaryTrack}><i style={{width:`${provided/group.fields.length*100}%`}}/></span>
                                                    </div>
                                                </article>;
                                            })}
                                        </div>
                                        <p className={styles.todayReadSummaryDisclosure}><ShieldCheck size={14} aria-hidden="true"/>{labels.readSummaryDisclosure}</p>
                                    </section></>:<>
                                        <div className={styles.todayVerifySummary}>
                                            <span className={styles.todayNextAvatar}><Store size={24}/></span>
                                            <div className={styles.todayNextTitle}>
                                                <div className={styles.todayNextReference}><span>{labels.merchant}</span><code>KLH-M-{nextMerchant.id.slice(0,4).toUpperCase()}</code></div>
                                                <h2>{nextMerchant.name}</h2>
                                                <p><span>{nextMerchant.businessType}</span><i>·</i><span>{nextMerchant.city}</span></p>
                                            </div>
                                        </div>
                                        <section className={styles.todayVerificationSection} aria-label={labels.checksTitle}>
                                            <div className={styles.todayVerificationStages} aria-label={t.application}>
                                                <div className={styles.todayStageDone}><span>✓</span><strong>{t.stageApplication}</strong></div>
                                                <div className={styles.todayStageCurrent}><span>2</span><strong>{t.stageChecks}</strong></div>
                                                <div className={styles.todayStagePending}><span>3</span><strong>{t.stageDecision}</strong></div>
                                            </div>
                                            <div className={styles.todayVerificationHeading}>
                                                <div><strong>{labels.checksTitle}</strong><small>{labels.checksHelp}</small></div>
                                                <span>{checksDone}/3 <small>{labels.checked}</small></span>
                                            </div>
                                            <div className={styles.todayVerificationProgress} aria-label={`${checksDone} ${labels.checked}`}><span style={{width:`${checksDone/3*100}%`}}/></div>
                                            <div className={styles.todayVerificationChecks}>
                                                {[
                                                    [labels.identity,labels.identityHelp],
                                                    [labels.contact,labels.contactHelp],
                                                    [labels.location,labels.locationHelp]
                                                ].map(([label,description],index)=><label key={label} className={currentTodayChecks[index]?styles.todayVerificationComplete:""}>
                                                    <input type="checkbox" checked={currentTodayChecks[index]} onChange={event=>{setTodayChecks(values=>(todayChecksMerchantId===nextMerchant.id?values:[false,false,false]).map((value,current)=>current===index?event.target.checked:value));setTodayChecksMerchantId(nextMerchant.id);}}/>
                                                    <span className={styles.todayVerificationNumber}>{currentTodayChecks[index]?<CheckCircle2 size={19}/>: `0${index+1}`}</span>
                                                    <span className={styles.todayVerificationCopy}><strong>{label}</strong><small>{description}</small></span>
                                                    <span className={styles.todayVerificationState}>{currentTodayChecks[index]?(locale==="fr"?"Vérifié":locale==="ar"?"تم التحقق":"Verified"):(locale==="fr"?"À vérifier":locale==="ar"?"بانتظار التحقق":"Pending")}</span>
                                                </label>)}
                                            </div>
                                        </section>
                                        {isTodayVerifyMode&&<div className={styles.todayVerificationDecisionArea}>
                                            {activeTodayDecisionAction&&<div className={styles.todayReasonComposer}>
                                                <div className={styles.todayReasonComposerHeader}>
                                                    <div><strong>{activeTodayDecisionAction==="approve"?labels.reasonForApprove:activeTodayDecisionAction==="request-information"?labels.reasonForRequest:labels.reasonForReject}</strong></div>
                                                    <button type="button" className={styles.todayReasonCancel} disabled={working} onClick={()=>{setTodayDecisionAction(null);setTodayDecisionMerchantId(null);setTodayReason("");}}><X size={15}/>{labels.cancelDecision}</button>
                                                </div>
                                                <textarea autoFocus rows={3} value={todayReason} onChange={event=>setTodayReason(event.target.value)} placeholder={labels.reasonPlaceholder} aria-label={activeTodayDecisionAction==="approve"?labels.reasonForApprove:activeTodayDecisionAction==="request-information"?labels.reasonForRequest:labels.reasonForReject}/>
                                            </div>}
                                            <div className={styles.todayVerificationActions} aria-label={locale==="fr"?"Décision sur la demande":locale==="ar"?"القرار بشأن الطلب":"Application decision"}>
                                                <button type="button" data-testid="today-decision-approve" className={`${styles.todayVerificationActionButton} ${styles.todayVerifyApprove} ${activeTodayDecisionAction==="approve"?styles.todayVerificationActionSelected:""}`} aria-pressed={activeTodayDecisionAction==="approve"} disabled={working||checksDone!==3} onClick={()=>handleTodayDecisionChoice("approve")}><CheckCircle2 size={18}/><span>{activeTodayDecisionAction==="approve"?labels.confirmAction:t.approve}</span></button>
                                                <button type="button" data-testid="today-decision-request-info" className={`${styles.todayVerificationActionButton} ${styles.todayVerifyInfo} ${activeTodayDecisionAction==="request-information"?styles.todayVerificationActionSelected:""}`} aria-pressed={activeTodayDecisionAction==="request-information"} disabled={working} onClick={()=>handleTodayDecisionChoice("request-information")}><FileText size={18}/><span>{activeTodayDecisionAction==="request-information"?labels.confirmAction:t.requestInfo}</span></button>
                                                <button type="button" data-testid="today-decision-reject" className={`${styles.todayVerificationActionButton} ${styles.todayVerifyReject} ${activeTodayDecisionAction==="reject"?styles.todayVerificationActionSelected:""}`} aria-pressed={activeTodayDecisionAction==="reject"} disabled={working} onClick={()=>handleTodayDecisionChoice("reject")}><X size={18}/><span>{activeTodayDecisionAction==="reject"?labels.confirmAction:t.reject}</span></button>
                                            </div>
                                        </div>}
                                    </>}
                                </div>
                            </>:nextOffer? <>
                                <div className={styles.todayNextIdentity}><span className={styles.todayNextAvatar}><Tag size={25}/></span><div className={styles.todayNextTitle}><div className={styles.todayNextReference}><span>{labels.offer}</span><code>{nextOffer.id.slice(0,8).toUpperCase()}</code></div><h2>{nextOffer.title}</h2><p>{nextOffer.shopName} · {nextOffer.city}</p></div></div>
                                <dl className={styles.todayNextFacts}><div><dt>{t.price}</dt><dd>{amount(nextOffer.priceMinor,locale)} MAD</dd></div><div><dt>{t.reports}</dt><dd>{nextOffer.reportedCount}</dd></div><div className={styles.todayFactAddress}><dt>{t.foodInfo}</dt><dd>{nextOffer.allergens||t.hiddenAllergens}</dd></div></dl>
                                <Link className={styles.todayPrimaryLink} href={`${localePath(locale,"/admin/offer-moderation")}?page=${Math.floor(Math.max(0,overview.offers.items.findIndex(item=>item.id===nextOffer.id))/OFFER_PAGE_SIZE)}&selected=${encodeURIComponent(nextOffer.id)}`}>{labels.openOffer}<ArrowUpRight size={16}/></Link>
                            </>:nextCase? <>
                                <div className={styles.todayNextIdentity}><span className={styles.todayNextAvatar}><LifeBuoy size={25}/></span><div className={styles.todayNextTitle}><div className={styles.todayNextReference}><span>{labels.support}</span><code>{nextCase.reference}</code></div><h2>{nextCase.subject}</h2><p>{nextCase.category} · {priorityLabel(nextCase.priority)}</p></div></div>
                                <dl className={styles.todayNextFacts}><div><dt>{t.record}</dt><dd>{nextCase.reference}</dd></div><div><dt>{t.customer}</dt><dd>{nextCase.customerLabel}</dd></div><div><dt>{t.shop}</dt><dd>{nextCase.merchantName||"—"}</dd></div><div><dt>{t.status}</dt><dd>{priorityLabel(nextCase.priority)}</dd></div></dl>
                                <Link className={styles.todayPrimaryLink} href={`${localePath(locale,"/admin/support-cases")}?page=${Math.floor(Math.max(0,overview.cases.items.findIndex(item=>item.reference===nextCase.reference))/CASE_PAGE_SIZE)}&selected=${encodeURIComponent(nextCase.reference)}`}>{labels.openCase}<ArrowUpRight size={16}/></Link>
                            </>:<div className={styles.todayNextEmpty}><ShieldCheck size={30}/><strong>{labels.noMerchant}</strong><span>{labels.noOffer}</span></div>}
                        </div>

                    </section>
                </div>
            </section>;
        })()}
        {page==="merchant-review"&&merchants&&<>
            <div className={styles.merchantReviewWorkspace} data-testid="merchant-review-workspace">
                <section className={styles.merchantPicker} aria-label={t.merchantTitle}>
                    <header className={styles.merchantPickerHeader}>
                        <div><span>{locale==="fr"?"ESPACE COMMERCES":locale==="ar"?"مساحة المتاجر":"MERCHANT WORKSPACE"}</span><h2>{t.merchantListTitle}</h2><p>{merchants.total.toLocaleString(locale)} {t.merchantRecords}</p></div>
                        <strong>{merchants.total.toLocaleString(locale)}</strong>
                    </header>
                    <div className={styles.list} data-testid="merchant-review-list">
                        {merchantItems.map(item=><button key={item.id} type="button" className={`${styles.merchantListItem} ${selectedMerchant?.id===item.id?styles.merchantSelected:""}`} aria-pressed={selectedMerchant?.id===item.id} onClick={()=>void loadMerchant(item.id)}>
                            <span className={styles.merchantListAvatar}><Store size={20} strokeWidth={2}/></span>
                            <span className={styles.merchantListContent}>
                                <span className={styles.merchantListTop}><strong>{item.name}</strong><em className={styles.pill+" "+merchantTone(item.status)}>{merchantLabel(item.status)}</em></span>
                                <small className={styles.merchantListBusiness}>{item.businessType} <i>·</i> {item.city}</small>
                                <span className={styles.merchantListMeta}><span><Mail size={13} aria-hidden="true"/>{item.ownerEmail}</span><span><Clock3 size={13} aria-hidden="true"/>{shortDateTime(item.createdAt,locale)}</span></span>
                            </span>
                            <ChevronRight className={styles.merchantListChevron} size={17} aria-hidden="true"/>
                        </button>)}
                    </div>
                    {!merchantItems.length&&<p className={styles.empty}>{t.empty}</p>}
                    <div className={styles.merchantPickerFooter}><AdminPagination page={merchantPage} pageCount={merchantPageCount} total={merchants.total} size={merchants.size||MERCHANT_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setMerchantPage(next);setSelectedMerchant(null);setMerchantViewMode("read");}} /></div>
                </section>
                <section className={styles.card+" "+styles.merchantDetails} data-testid="merchant-review-detail-panel">
                    {!selectedMerchant?<div className={styles.merchantSelectEmpty}><Store size={34} strokeWidth={1.7}/><strong>{merchantItems.length?t.merchantSelectEmpty:t.empty}</strong></div>:<>
                        <header className={styles.merchantDetailsHeader}>
                            <div className={styles.merchantIdentityTitle}>
                                <span className={styles.merchantIdentityIcon}><Store size={26} strokeWidth={2}/></span>
                                <div><small>{t.application} · KLH-M-{selectedMerchant.id.slice(0,4).toUpperCase()}</small><h2>{selectedMerchant.name}</h2><p>{selectedMerchant.businessType} <i>·</i> {selectedMerchant.city}</p></div>
                            </div>
                            <div className={styles.merchantDetailHeaderActions}>
                                <span className={styles.pill+" "+merchantTone(selectedMerchant.status)}>{merchantLabel(selectedMerchant.status)}</span>
                                <button type="button" className={styles.merchantModeButton} aria-pressed={merchantViewMode==="verify"} onClick={()=>setMerchantViewMode(current=>current==="read"?"verify":"read")}>
                                    {merchantViewMode==="read"?<><ShieldCheck size={17} aria-hidden="true"/>{t.merchantVerifyButton}</>:<><Eye size={17} aria-hidden="true"/>{t.merchantReadButton}</>}
                                </button>
                            </div>
                        </header>
                        <div className={styles.merchantDetailScroll}>
                            {merchantViewMode==="read"?<div className={styles.merchantReadMode} data-testid="merchant-review-read-mode">
                                <div className={styles.merchantReadModeHeading}><div><span>{locale==="fr"?"DOSSIER TRANSMIS":locale==="ar"?"الملف المقدم":"SUBMITTED PROFILE"}</span><h3>{t.businessDetails}</h3></div><small>{dateTime(selectedMerchant.createdAt,locale)}</small></div>
                                <div className={styles.merchantReadGroups}>
                                    <article className={styles.merchantReadGroup}>
                                        <header><span><Store size={19}/></span><div><strong>{t.merchantIdentityGroup}</strong><small>{locale==="fr"?"Informations principales":locale==="ar"?"المعلومات الأساسية":"Core business information"}</small></div></header>
                                        <dl><div><dt>{t.business}</dt><dd>{selectedMerchant.businessType||"—"}</dd></div><div><dt>{locale==="fr"?"Ville":locale==="ar"?"المدينة":"City"}</dt><dd>{selectedMerchant.city||"—"}</dd></div></dl>
                                    </article>
                                    <article className={styles.merchantReadGroup}>
                                        <header><span><Mail size={19}/></span><div><strong>{t.merchantContactGroup}</strong><small>{locale==="fr"?"Coordonnées du responsable":locale==="ar"?"بيانات المسؤول":"Owner contact information"}</small></div></header>
                                        <dl><div><dt>{t.owner}</dt><dd>{selectedMerchant.ownerEmail||"—"}</dd></div><div><dt>{t.phone}</dt><dd>{selectedMerchant.phone||"—"}</dd></div></dl>
                                    </article>
                                    <article className={styles.merchantReadGroup}>
                                        <header><span><MapPin size={19}/></span><div><strong>{t.merchantEstablishmentGroup}</strong><small>{locale==="fr"?"Localisation et disponibilité":locale==="ar"?"الموقع وأوقات العمل":"Location and opening times"}</small></div></header>
                                        <dl>
                                            <div><dt>{t.address}</dt><dd>{selectedMerchant.address||selectedMerchant.city||"—"}</dd></div>
                                            {selectedMerchant.district&&<div><dt>{t.merchantDistrict}</dt><dd>{selectedMerchant.district}</dd></div>}
                                            <div><dt>{t.hours}</dt><dd>{selectedMerchant.openingHours||"—"}</dd></div>
                                            {typeof selectedMerchant.latitude==="number"&&typeof selectedMerchant.longitude==="number"&&<div><dt>{t.merchantCoordinates}</dt><dd><bdi dir="ltr">{selectedMerchant.latitude.toFixed(5)}, {selectedMerchant.longitude.toFixed(5)}</bdi></dd></div>}
                                            {selectedMerchant.pickupInstructions&&<div><dt>{t.merchantPickupInstructions}</dt><dd>{selectedMerchant.pickupInstructions}</dd></div>}
                                        </dl>
                                    </article>
                                </div>
                                <div className={styles.merchantDocumentsNotice}><span><FileText size={19}/></span><div><strong>{t.noDocumentsTitle}</strong><small>{t.noDocumentsBody}</small></div></div>
                            </div>:<div className={styles.merchantVerifyMode} data-testid="merchant-review-workflow">
                                <div className={styles.merchantStepper} aria-label={t.application}>
                                    <div className={styles.stepDone}><span>✓</span><strong>{t.stageApplication}</strong></div>
                                    <div className={styles.stepCurrent}><span>2</span><strong>{t.stageChecks}</strong></div>
                                    <div className={styles.stepPending}><span>3</span><strong>{t.stageDecision}</strong></div>
                                </div>
                                <section className={styles.merchantVerificationWorkspace}>
                                    <div className={styles.merchantVerificationHeading}>
                                        <div><h3>{t.merchantVerificationTitle}</h3><p>{t.merchantVerificationLead}</p></div>
                                        <span><strong>{checks.filter(Boolean).length}/3</strong><small>{locale==="fr"?"vérifié(s) sur 3":locale==="ar"?"تم التحقق من 3":"verified of 3"}</small></span>
                                    </div>
                                    <div className={styles.merchantVerificationProgress}><span style={{width:`${checks.filter(Boolean).length/3*100}%`}}/></div>
                                    <div className={styles.merchantVerificationChecks}>
                                        {[
                                            {title:t.merchantIdentityCheck,description:t.merchantIdentityCheckHelp},
                                            {title:t.merchantContactCheck,description:t.merchantContactCheckHelp},
                                            {title:t.merchantAddressCheck,description:t.merchantAddressCheckHelp}
                                        ].map((item,index)=><label key={item.title} className={checks[index]?styles.merchantVerificationCheckDone:styles.merchantVerificationCheck}>
                                            <input type="checkbox" checked={checks[index]} onChange={event=>setChecks(current=>current.map((value,position)=>position===index?event.target.checked:value))}/>
                                            <span className={styles.merchantVerificationNumber}>{String(index+1).padStart(2,"0")}</span>
                                            <span className={styles.merchantVerificationCopy}><strong>{item.title}</strong><small>{item.description}</small></span>
                                            <span className={styles.merchantVerificationState}>{checks[index]?t.merchantCheckComplete:t.merchantCheckPending}</span>
                                        </label>)}
                                    </div>
                                    <p className={styles.merchantApprovalNote}>{t.approveUnlocks}</p>
                                </section>
                                <section className={styles.merchantDecision+" "+styles.merchantModalDecision} data-testid="merchant-review-decision">
                                    <div className={styles.sectionHeading}><h3>{t.decision}</h3><span>{locale==="fr"?"Étape 3 sur 3":locale==="ar"?"الخطوة 3 من 3":"Step 3 of 3"}</span></div>
                                    <div className={styles.segment} role="group" aria-label={t.decision}>
                                        <button type="button" aria-pressed={merchantAction==="approve"} className={styles.segApprove+" "+(merchantAction==="approve"?styles.segOn:"")} disabled={working||checks.some(value=>!value)} onClick={()=>setMerchantAction("approve")}><CheckCircle2 size={17} strokeWidth={2.1} aria-hidden="true"/>{t.approve}</button>
                                        <button type="button" aria-pressed={merchantAction==="request-information"} className={styles.segInfo+" "+(merchantAction==="request-information"?styles.segOn:"")} disabled={working} onClick={()=>setMerchantAction("request-information")}><FileText size={17} strokeWidth={2.1} aria-hidden="true"/>{t.requestInfo}</button>
                                        <button type="button" aria-pressed={merchantAction==="reject"} className={styles.segReject+" "+(merchantAction==="reject"?styles.segOn:"")} disabled={working} onClick={()=>setMerchantAction("reject")}><X size={17} strokeWidth={2.2} aria-hidden="true"/>{t.reject}</button>
                                    </div>
                                    {merchantAction&&<div className={styles.merchantDecisionFields}>
                                        <label className={styles.field}><span>{t.reason}</span><textarea rows={2} value={reason} onChange={event=>setReason(event.target.value)} maxLength={500}/></label>
                                        <label className={styles.field}><span>{t.internalNote} · {t.optional}</span><textarea rows={2} value={internalNote} onChange={event=>setInternalNote(event.target.value)} placeholder={t.optional}/></label>
                                    </div>}
                                </section>
                            </div>}
                        </div>
                        {merchantViewMode==="verify"&&<footer className={styles.merchantInlineFooter} data-testid="merchant-review-footer">
                            <p><ShieldCheck size={15} aria-hidden="true"/>{t.decisionNote}</p>
                            <button type="button" className={styles.primary} disabled={working||!merchantAction||!reason.trim()||(merchantAction==="approve"&&checks.some(value=>!value))} onClick={()=>void submitMerchant()}><ShieldCheck size={16} strokeWidth={2.1} aria-hidden="true"/>{working?t.loading:t.save}</button>
                        </footer>}
                    </>}
                </section>
            </div>
        </>}
        {page==="offer-moderation"&&offers&&<>
            <div className={styles.offerWorkspace} data-testid="offer-workspace">
                <section className={styles.offerPicker} aria-label={t.offersTitle} data-testid="offer-picker">
                    <header className={styles.offerPickerHeader}>
                        <div>
                            <span>{offerUi.queueEyebrow}</span>
                            <h2>{offerUi.queueTitle}</h2>
                            <p>{offerUi.queueHint}</p>
                        </div>
                        <strong aria-label={`${offerItems.length} ${t.all.toLocaleLowerCase(locale)}`}>{offerItems.length.toLocaleString(locale)}</strong>
                    </header>
                    <div className={styles.offerFilters} role="tablist" aria-label={t.filter}>
                        {[
                            {value:"",label:t.all,count:offers.total},
                            {value:"REPORTED",label:t.reportedFilter,count:reportedOfferCount},
                            {value:"ALLERGENS_UNKNOWN",label:t.allergensUnknown,count:unknownAllergenCount},
                            {value:"SUSPENDED",label:t.hiddenFilter,count:hiddenOfferCount}
                        ].map(tab=><button key={tab.value||"all"} type="button" role="tab" aria-selected={offerStatus===tab.value} className={offerStatus===tab.value?styles.offerFilterActive:styles.offerFilter} onClick={()=>{setOfferStatus(tab.value);setOfferPage(0);setSelectedOffer(null);setOfferViewMode("read");setReason("");}}><span>{tab.label}</span><em>{tab.count.toLocaleString(locale)}</em></button>)}
                    </div>
                    <div className={styles.offerQueue} data-testid="offer-queue">
                        {offerItems.map(item=>{const d=discount(item);return <button type="button" key={item.id} aria-pressed={selectedOffer?.id===item.id} className={selectedOffer?.id===item.id?styles.offerItemSelected:styles.offerItem} onClick={()=>{setSelectedOffer(item);setOfferViewMode("read");setReason("");setOfferAction(item.status==="SUSPENDED"?"reinstate":"suspend");}}>
                            <span className={styles.offerThumb}>{item.imageUrl?<OfferImage src={item.imageUrl} alt="" lazy/>:<ImageIcon size={25} aria-hidden="true"/>}</span>
                            <span className={styles.offerCopy}>
                                <span className={styles.offerQueueCardTopline}><strong className={styles.offerQueueCardTitle}>{item.title}</strong><em className={styles.offerQueueCardPrice}>{amount(item.priceMinor,locale)} MAD</em></span>
                                <span className={styles.offerQueueCardMerchant}><Store size={13} aria-hidden="true"/><span>{item.shopName}</span><i>·</i><span>{item.city}</span></span>
                                <span className={styles.offerTags}>
                                    {item.reportedCount>0&&<em className={styles.reportTag}><Flag size={12} aria-hidden="true"/>{item.reportedCount} {item.reportedCount===1?t.report:t.reportsN}</em>}
                                    {item.allergensStatus==="UNKNOWN"&&<em className={styles.allergenTag}><AlertTriangle size={12} aria-hidden="true"/>{t.allergensUnknown}</em>}
                                    {item.status==="SUSPENDED"?<em className={styles.hiddenTag}><EyeOff size={12} aria-hidden="true"/>{t.hiddenS}</em>:<em className={styles.offerQueueStatusTag}>{offerLabel(item.status)}</em>}
                                </span>
                                <span className={styles.offerQueueCardBottom}>
                                    <span className={styles.offerQueueCardStock}><PackageCheck size={13} aria-hidden="true"/>{item.quantityReserved.toLocaleString(locale)} / {item.quantityTotal.toLocaleString(locale)} {t.reserved}</span>
                                    {d!==null&&<span className={styles.offerQueueCardDiscount}>−{d}%</span>}
                                </span>
                            </span>
                            <ChevronRight className={styles.offerItemChevron} size={18} aria-hidden="true"/>
                        </button>;})}
                    </div>
                    {!offerItems.length&&<p className={styles.empty}>{t.empty}</p>}
                    <div className={styles.offerPagination} data-testid="offer-pagination"><AdminPagination page={offerPage} pageCount={offerPageCount} total={offers.total} size={offers.size||OFFER_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setOfferPage(next);setSelectedOffer(null);setOfferViewMode("read");setReason("");}} /></div>
                </section>
                <section className={styles.offerPreviewCard} aria-label={t.selectedOffer} data-testid="offer-detail-panel">
                    {!selectedOffer?<div className={styles.offerEmpty}><Tag size={32} aria-hidden="true"/><strong>{t.selectedOffer}</strong><span>{t.empty}</span></div>:<>
                        <header className={styles.offerPreviewHeading}>
                            <div className={styles.offerPreviewTitle}>
                                <small>{t.selectedOffer} · #{selectedOffer.id.slice(0,8).toUpperCase()}</small>
                                <h2>{selectedOffer.title}</h2>
                                <p><Store size={15} aria-hidden="true"/>{selectedOffer.shopName}<i>·</i>{selectedOffer.city}</p>
                            </div>
                            <div className={styles.offerPreviewHeaderActions}>
                                <span className={styles.pill+" "+offerTone(selectedOffer.status)}>{offerLabel(selectedOffer.status)}</span>
                                <button type="button" className={styles.offerModeToggle} onClick={()=>setOfferViewMode(mode=>mode==="read"?"write":"read")}>
                                    {offerViewMode==="read"?<><ShieldCheck size={16} aria-hidden="true"/>{t.openOfferReview}</>:<><Eye size={16} aria-hidden="true"/>{t.merchantReadButton}</>}
                                </button>
                            </div>
                        </header>

                        {offerViewMode==="read"?<>
                                                    <div className={styles.offerPreviewScroll} data-testid="offer-preview-scroll">
                            <section className={styles.offerReviewHero} aria-label={offerUi.factsTitle}>
                                <div className={styles.offerPreviewImage} data-testid="offer-preview-image">
                                    {selectedOffer.imageUrl?<OfferImage src={selectedOffer.imageUrl} alt={selectedOffer.title}/>:<div className={styles.offerImageFallback}><ImageIcon size={30} aria-hidden="true"/><span>{offerUi.imageMissing}</span></div>}
                                </div>
                                <div className={styles.offerReviewFactsPanel}>
                                    <div className={styles.offerReviewFactsHeading}><span>{offerUi.factsTitle}</span>{discount(selectedOffer)!==null&&<em>−{discount(selectedOffer)}%</em>}</div>
                                    <dl className={styles.offerPreviewFacts}>
                                        <div><dt>{t.price}</dt><dd>{amount(selectedOffer.priceMinor,locale)} MAD</dd></div>
                                        <div><dt>{t.originalPrice}</dt><dd>{selectedOffer.originalPriceMinor?amount(selectedOffer.originalPriceMinor,locale)+" MAD":"—"}</dd></div>
                                        <div><dt>{t.stock}</dt><dd>{selectedOffer.quantityTotal.toLocaleString(locale)}</dd></div>
                                        <div><dt>{t.reserved}</dt><dd>{selectedOffer.quantityReserved.toLocaleString(locale)} / {selectedOffer.quantityTotal.toLocaleString(locale)}</dd></div>
                                        <div><dt>{t.reportsTitle}</dt><dd>{selectedOffer.reportedCount.toLocaleString(locale)}</dd></div>
                                        <div><dt>{t.pickup}</dt><dd>{selectedOffer.pickupStart&&selectedOffer.pickupEnd?shortDateTime(selectedOffer.pickupStart,locale)+" – "+shortDateTime(selectedOffer.pickupEnd,locale):t.pickupUnavailable}</dd></div>
                                    </dl>
                                </div>
                            </section>
                            <section className={styles.offerFoodGrid} aria-label={offerUi.foodTitle}>
                                <article className={selectedOffer.allergensStatus==="UNKNOWN"?styles.offerFoodCardWarning:styles.offerFoodCard}>
                                    <header><span><AlertTriangle size={17} aria-hidden="true"/></span><div><small>{offerUi.allergensLabel}</small><strong>{selectedOffer.allergensStatus==="UNKNOWN"?t.hiddenAllergens:(selectedOffer.allergens||t.hiddenAllergens)}</strong></div></header>
                                    <em>{selectedOffer.allergensStatus==="UNKNOWN"?offerUi.checkAllergens:t.notVerified}</em>
                                </article>
                                <article className={styles.offerFoodCard}>
                                    <header><span><FileText size={17} aria-hidden="true"/></span><div><small>{offerUi.notesLabel}</small><strong>{selectedOffer.foodNotes||"—"}</strong></div></header>
                                </article>
                            </section>
                            {selectedOffer.allergensStatus==="UNKNOWN"&&<div className={styles.offerPreviewAlert} data-testid="offer-food-safety-alert"><AlertTriangle size={18} aria-hidden="true"/><span><strong>{t.foodSafetyTitle}</strong><small>{t.foodSafetyBody}</small></span></div>}
                            <section className={styles.offerEvidence} data-testid="offer-evidence">
                                <header><div><span><Flag size={17} aria-hidden="true"/></span><h3>{t.reportsTitle}</h3></div><strong>{selectedOffer.reportedCount.toLocaleString(locale)}</strong></header>
                                {selectedOffer.reportedCount>0?<div className={styles.offerModalReport}><strong>{selectedOffer.reportedCount} {t.reportReceived}</strong><span>{t.status}: {offerLabel(selectedOffer.status)}</span></div>:<p className={styles.offerModalNoReports}>{t.noReports}</p>}
                            </section>
                        </div>
                        </>:<div className={styles.offerWritePane} data-testid="offer-write-pane">
                            <div className={styles.offerWriteIntro}>
                                <span className={styles.offerWriteIntroIcon}><ShieldCheck size={20} aria-hidden="true"/></span>
                                <div><h3>{offerUi.decisionTitle}</h3><p>{offerUi.decisionLead}</p></div>
                                <span className={styles.offerWriteReference}>#{selectedOffer.id.slice(0,8).toUpperCase()}</span>
                            </div>
                            <section className={styles.offerWriteActions} aria-label={t.decision}>
                                <div className={styles.offerDecisionSectionHeading}>
                                    <div><h3>{t.decision}</h3><p>{t.reinstateOnlyHidden}</p></div>
                                </div>
                                <div className={styles.offerActionRow}>
                                    <button type="button" data-action="reinstate" aria-pressed={offerAction==="reinstate"} className={offerAction==="reinstate"?styles.offerActionActive:styles.offerAction} disabled={selectedOffer.status!=="SUSPENDED"} onClick={()=>setOfferAction("reinstate")}><CheckCircle2 size={18} strokeWidth={2.1} aria-hidden="true"/>{t.putLive}</button>
                                    <button type="button" data-action="request-edit" aria-pressed={offerAction==="request-edit"} className={offerAction==="request-edit"?styles.offerActionActive:styles.offerAction} onClick={()=>setOfferAction("request-edit")}><FileText size={18} strokeWidth={2.1} aria-hidden="true"/>{t.askEdit}</button>
                                    <button type="button" data-action="suspend" aria-pressed={offerAction==="suspend"} className={offerAction==="suspend"?styles.offerActionActive:styles.offerAction} onClick={()=>setOfferAction("suspend")}><EyeOff size={18} strokeWidth={2.1} aria-hidden="true"/>{selectedOffer.status==="SUSPENDED"?t.keepHidden:t.hide}</button>
                                </div>
                            </section>
                            <section className={styles.offerWriteReason} data-testid="offer-decision-reason">
                                <div className={styles.offerDecisionSectionHeading}><div><h3>{t.reason}</h3><p>{offerUi.decisionLead}</p></div><span>{locale==="fr"?"OBLIGATOIRE":locale==="ar"?"مطلوب":"REQUIRED"}</span></div>
                                <div className={styles.reasonChips}>
                                    {[t.reasonMisleading,t.reasonAllergens,t.reasonPhoto,t.reasonOther].map(label=><button key={label} type="button" className={reason.startsWith(label)?styles.reasonChipActive:styles.reasonChip} onClick={()=>setReason(label+": ")}>{label}</button>)}
                                </div>
                                <label className={`${styles.field} ${styles.offerReasonField}`}><span>{t.reason}</span><textarea rows={3} value={reason} onChange={e=>setReason(e.target.value)} placeholder={offerUi.reasonPlaceholder} maxLength={500}/></label>
                            </section>
                            <footer className={styles.offerWriteFooter} data-testid="offer-moderation-footer">
                                <p><ShieldCheck size={16} aria-hidden="true"/>{t.auditRecorded}</p>
                                <button className={styles.primary} disabled={working||!reason.trim()||(offerAction==="reinstate"&&selectedOffer.status!=="SUSPENDED")} onClick={()=>void submitOffer()}><ShieldCheck size={16} strokeWidth={2.1} aria-hidden="true"/>{working?t.loading:offerUi.recordDecision}</button>
                            </footer>
                        </div>}

                    </>}
                </section>
            </div>
        </>}

        {page==="support-cases"&&cases&&<>
            <div className={styles.supportStatusBar} role="tablist" aria-label={t.casesTitle}>
                {([ ["OPEN",t.open,caseCounts.open,<Inbox key="case-status-open-icon" size={16}/>], ["ESCALATED",t.escalated,caseCounts.escalated,<ShieldAlert key="case-status-escalated-icon" size={16}/>], ["WAITING_REPLY",t.waiting,caseCounts.waiting,<MessageSquare key="case-status-waiting-icon" size={16}/>], ["RESOLVED",t.resolved,caseCounts.resolved,<CheckCircle2 key="case-status-resolved-icon" size={16}/>] ] as const).map(([value,label,count,icon])=><button key={value} type="button" role="tab" aria-selected={caseStatus===value} className={caseStatus===value?styles.supportStatusActive:styles.supportStatusTab} onClick={()=>switchTab(()=>{setCaseStatus(value);setCasePage(0);setSelectedCase(null);setReason("");setDraftMessage("");})}><span className={styles.supportStatusIcon}>{icon}</span><span>{label}</span><strong>{typeof count==="number"?count:"—"}</strong></button>)}
            </div>
            <div className={styles.supportWorkspace} data-testid="support-workspace">
                <section className={styles.casePicker} aria-label={t.casesTitle} data-testid="support-case-queue">
                    <header className={styles.caseQueueHeader}>
                        <div><span className={styles.caseQueueEyebrow}>{supportText.inbox}</span><h2>{supportText.queue}</h2><p>{supportText.queueHint}</p></div>
                        <span className={styles.caseQueueCount}>{cases.total.toLocaleString(locale)} <small>{supportText.caseCount}</small></span>
                    </header>
                    <div className={styles.caseList} data-testid="support-case-list">
                        {caseItems.map(item=>{
                            const isFood=isFoodSafetyCase(item.category,item.subject,item.description);
                            const selected=selectedCase?.summary.reference===item.reference;
                            return <button key={item.reference} type="button" data-testid="support-case-row" className={`${styles.caseItemV20} ${selected?styles.caseSelectedV20:""} ${isFood?styles.caseFoodSafetyV20:""}`} aria-pressed={selected} onClick={()=>void loadCase(item.reference)}>
                                <span className={styles.caseItemMeta}><span>{item.reference} · {item.category}</span><em className={styles.pill+" "+priorityTone(item.priority)}>{priorityLabel(item.priority)}</em></span>
                                <strong className={styles.caseItemSubject}>{item.subject}</strong>
                                <span className={styles.caseItemContext}><Building2 size={14}/>{item.merchantName||t.shop}<span>·</span>{item.reservationReference||item.offerTitle||supportText.noReservation}</span>
                                <span className={styles.caseItemFoot}>{isFood?<span className={styles.caseFoodFlag}><AlertTriangle size={13}/>{supportText.foodSafetyFlag}</span>:<span>{item.reference}</span>}<time dateTime={item.updatedAt}>{shortDateTime(item.updatedAt,locale)}</time></span>
                            </button>;
                        })}
                        {!caseItems.length&&<div className={styles.caseQueueEmpty}><Inbox size={28}/><strong>{supportText.emptyQueue}</strong><span>{supportText.emptyQueueHint}</span></div>}
                    </div>
                    <AdminPagination page={casePage} pageCount={casePageCount} total={cases.total} size={cases.size||CASE_PAGE_SIZE} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setCasePage(next);setSelectedCase(null);}} />
                </section>
                <section className={styles.caseDetailV20} data-testid="support-case-detail">
                    {!selectedCase?<div className={styles.caseEmptyState}><span><LifeBuoy size={30}/></span><h2>{supportText.selectTitle}</h2><p>{supportText.selectHint}</p></div>:<>
                        <header className={styles.caseDetailHeaderV20}>
                            <div className={styles.caseDetailTitleBlock}>
                                <div className={styles.caseDetailEyebrow}><span>{supportText.reference} {selectedCase.summary.reference}</span><span>·</span><span>{selectedCase.summary.category}</span><span>·</span><span>{supportText.updated} {shortDateTime(selectedCase.summary.updatedAt,locale)}</span></div>
                                <h2>{selectedCase.summary.subject}</h2>
                                <div className={styles.caseDetailBadges}>
                                    <span className={styles.pill+" "+caseStatusTone(selectedCase.summary.status)}>{caseStatusLabel(selectedCase.summary.status)}</span>
                                    <span className={styles.pill+" "+priorityTone(selectedCase.summary.priority)}>{priorityLabel(selectedCase.summary.priority)}</span>
                                    {isFoodSafetyCase(selectedCase.summary.category,selectedCase.summary.subject,selectedCase.summary.description)&&<span className={styles.caseFoodFlag}><AlertTriangle size={13}/>{supportText.foodSafetyFlag}</span>}
                                </div>
                            </div>
                            <div className={styles.caseHeaderReference}><small>{supportText.created}</small><strong>{shortDateTime(selectedCase.summary.createdAt,locale)}</strong></div>
                        </header>
                        <div className={styles.caseDetailGridV20}>
                            <section className={styles.caseConversationV20} aria-label={supportText.conversation}>
                                <div className={styles.caseSectionHeader}><div><span className={styles.caseSectionIcon}><MessageSquare size={17}/></span><div><h3>{supportText.conversation}</h3><p>{selectedCase.timeline.length.toLocaleString(locale)} {supportText.messages}</p></div></div><span className={styles.caseSectionReference}>{selectedCase.summary.reference}</span></div>
                                <div className={styles.caseHistoryV20} data-testid="support-case-history">
                                    {selectedCase.summary.description?.trim()&&<article className={styles.caseInitialMessage}>
                                        <div className={styles.caseMessageMeta}><strong>{supportText.initialMessage}</strong><time dateTime={selectedCase.summary.createdAt}>{dateTime(selectedCase.summary.createdAt,locale)}</time></div>
                                        <p>{selectedCase.summary.description}</p>
                                    </article>}
                                    <div className={styles.caseTimelineV20} data-testid="support-case-timeline">
                                        {selectedCase.timeline.filter(item=>!selectedCase.summary.description?.trim()||item.message.trim()!==selectedCase.summary.description.trim()).map(item=><article key={item.id} className={`${styles.caseMessageV20} ${item.visibility==="INTERNAL"?styles.caseMessageInternalV20:item.authorType==="CUSTOMER"?styles.caseMessageCustomerV20:styles.caseMessageAgentV20}`}>
                                            <div className={styles.caseMessageMeta}><strong>{item.visibility==="INTERNAL"?supportText.internalNote:item.authorType==="CUSTOMER"?supportText.customerMessage:item.authorLabel||supportText.teamMessage}</strong><time dateTime={item.createdAt}>{dateTime(item.createdAt,locale)}</time></div>
                                            <p>{item.message}</p>
                                        </article>)}
                                        {!selectedCase.timeline.length&&!selectedCase.summary.description?.trim()&&<p className={styles.caseNoMessages}>{supportText.noMessages}</p>}
                                    </div>
                                </div>
                                <section className={styles.messageComposerV20} data-testid="support-message-composer">
                                    <div className={styles.messageComposerHeader}><div><span className={styles.caseSectionIcon}><Send size={16}/></span><div><h3>{supportText.replyComposer}</h3><p>{sendToCustomer?supportText.replyHint:supportText.noteHint}</p></div></div>
                                        <div className={styles.messageModesV20} role="group" aria-label={t.replyNote}>
                                            <button type="button" aria-pressed={sendToCustomer} className={sendToCustomer?styles.messageModeActiveV20:styles.messageModeV20} onClick={()=>setSendToCustomer(true)}><MessageSquare size={14}/>{supportText.replyMode}</button>
                                            <button type="button" aria-pressed={!sendToCustomer} className={!sendToCustomer?styles.messageModeInternalV20:styles.messageModeV20} onClick={()=>setSendToCustomer(false)}><StickyNote size={14}/>{supportText.noteMode}</button>
                                        </div>
                                    </div>
                                    <form onSubmit={sendMessage} className={styles.messageFormV20}>
                                        <label className={styles.caseComposerField}><span className="sr-only">{supportText.replyComposer}</span><textarea rows={3} value={draftMessage} onChange={e=>setDraftMessage(e.target.value)} placeholder={sendToCustomer?supportText.replyPlaceholder:supportText.notePlaceholder} required/></label>
                                        <div className={styles.composerFootV20}><p className={sendToCustomer?styles.replyVisibility:styles.internalVisibility}>{sendToCustomer?<><Eye size={14}/>{supportText.replyHint}</>:<><Lock size={14}/>{supportText.noteHint}</>}</p><button type="submit" className={styles.primary} disabled={working||!draftMessage.trim()}>{sendToCustomer?<><Send size={15}/>{supportText.sendReply}</>:<><StickyNote size={15}/>{supportText.saveInternal}</>}</button></div>
                                    </form>
                                </section>
                            </section>
                            <aside className={styles.caseContextPanelV20} aria-label={supportText.context}>
                                <section className={styles.caseContextSection}>
                                    <div className={styles.caseContextHeading}><span><ClipboardList size={16}/></span><h3>{supportText.linkedRecords}</h3></div>
                                    <div className={styles.caseLinkedListV20}>
                                        <article><span><CalendarDays size={15}/>{t.caseReservation}</span><strong>{selectedCase.summary.reservationReference||supportText.noReservation}</strong></article>
                                        <article><span><Tag size={15}/>{t.caseOffer}</span><strong>{selectedCase.summary.offerTitle||supportText.noOffer}</strong></article>
                                        <article><span><Store size={15}/>{t.caseShop}</span><strong>{selectedCase.summary.merchantName||supportText.noShop}</strong></article>
                                    </div>
                                </section>
                                <section className={styles.caseContextSection}>
                                    <div className={styles.caseContextHeading}><span><UserCheck size={16}/></span><h3>{supportText.management}</h3></div>
                                    <div className={styles.caseAssigneeV20}><div><small>{supportText.assignee}</small><strong>{selectedCase.summary.assigneeName||supportText.unassigned}</strong></div><button type="button" className={styles.caseAssignButtonV20} disabled={working||!actorId||selectedCase.summary.assignedTo===actorId||isSupportOnly&&!!selectedCase.summary.assignedTo&&selectedCase.summary.assignedTo!==actorId} onClick={()=>void assignToMe()}><UserCheck size={14}/>{t.assign}</button></div>
                                </section>
                                <section className={styles.caseContextSection}>
                                    <div className={styles.caseContextHeading}><span><Lock size={16}/></span><h3>{supportText.customerDetails}</h3></div>
                                    <div className={styles.caseCustomerCardV20}><strong>{revealed?revealed.fullName:selectedCase.summary.customerLabel}</strong>{revealed?<span>{revealed.email} · {revealed.phone||"—"}</span>:<span>{supportText.customerMaskedBody}</span>}</div>
                                    {!revealed&&canRevealSupportCustomerDetails(roles,actorId,selectedCase.summary.assignedTo)&&<div className={styles.caseRevealFormV20}>
                                        <label className={styles.caseReasonFieldV20}><span>{t.disclosureReason}</span><input value={disclosureReason} maxLength={SUPPORT_DISCLOSURE_REASON_MAX_LENGTH} onChange={event=>setDisclosureReason(event.target.value)} placeholder={supportText.reasonPlaceholder} required/></label>
                                        <button type="button" className={styles.caseRevealButtonV20} disabled={working||!disclosureReason.trim()} onClick={()=>void revealCustomer()}><Eye size={14}/>{t.reveal}</button>
                                        <small><ShieldCheck size={13}/>{supportText.privacyAudit}</small>
                                    </div>}
                                </section>
                                <section className={styles.caseContextSection+" "+styles.caseManagementV20}>
                                    <div className={styles.caseContextHeading}><span><ShieldCheck size={16}/></span><h3>{supportText.management}</h3></div>
                                    <label className={styles.caseReasonFieldV20}><span>{t.actionReason}</span><input value={reason} onChange={e=>setReason(e.target.value)} placeholder={supportText.reasonPlaceholder} /></label>
                                    <div className={styles.caseManagementActionsV20}>
                                        <button type="button" className={styles.caseContactButtonV20} disabled={working||!reason.trim()} onClick={()=>void caseAction("CONTACT_SHOP")}><PhoneCall size={15}/>{t.contactShop}</button>
                                        <button type="button" className={styles.caseEscalateButtonV20} disabled={working||!reason.trim()} onClick={()=>void caseAction("ESCALATE")}><AlertTriangle size={15}/>{t.escalate}</button>
                                        <button type="button" className={styles.caseResolveButtonV20} disabled={working||!reason.trim()||selectedCase.summary.status==="RESOLVED"} onClick={()=>void caseAction("RESOLVE")}><CheckCircle2 size={15}/>{t.resolve}</button>
                                        {!isSupportOnly&&selectedCase.summary.offerId&&<button type="button" className={styles.caseHideOfferButtonV20} disabled={working||!reason.trim()||selectedCase.summary.hiddenOffer} onClick={()=>void caseAction("KEEP_OFFER_HIDDEN")}><EyeOff size={15}/>{t.keepOffer}</button>}
                                    </div>
                                    <p className={styles.caseAuditHintV20}><ShieldCheck size={13}/>{supportText.caseReasonHint}</p>
                                </section>
                            </aside>
                        </div>
                    </>}
                </section>
            </div>
        </>}
        {page==="audit-log"&&audit&&<>
            <section className={styles.auditFilters} aria-label={t.filter}>
                <div className={styles.auditFilterTopRow}>
                    <div className={styles.auditQuickRanges} role="group" aria-label={locale==="fr"?"Période rapide":locale==="ar"?"الفترة السريعة":"Quick date range"}>
                        <button type="button" aria-pressed={auditQuickRange==="today"} className={auditQuickRange==="today"?styles.auditRangeActive:styles.auditRangeButton} onClick={()=>applyAuditRange("today")}>{locale==="fr"?"Aujourd’hui":locale==="ar"?"اليوم":"Today"}</button>
                        <button type="button" aria-pressed={auditQuickRange==="7"} className={auditQuickRange==="7"?styles.auditRangeActive:styles.auditRangeButton} onClick={()=>applyAuditRange("7")}>{locale==="fr"?"7 jours":locale==="ar"?"7 أيام":"7 days"}</button>
                        <button type="button" aria-pressed={auditQuickRange==="30"} className={auditQuickRange==="30"?styles.auditRangeActive:styles.auditRangeButton} onClick={()=>applyAuditRange("30")}>{locale==="fr"?"30 jours":locale==="ar"?"30 يوماً":"30 days"}</button>
                    </div>
                    <button type="button" className={`${styles.auditAdvancedToggle} ${auditFiltersExpanded?styles.auditAdvancedToggleActive:""}`} aria-expanded={auditFiltersExpanded} aria-controls="audit-advanced-filters" onClick={()=>setAuditFiltersExpanded(value=>!value)}>
                        <SlidersHorizontal size={16} aria-hidden="true"/>
                        <span>{locale==="fr"?"Filtres avancés":locale==="ar"?"عوامل تصفية متقدمة":"Advanced filters"}</span>
                        {activeAuditAdvancedCount>0&&<em>{activeAuditAdvancedCount}</em>}
                        <ChevronDown size={15} className={styles.auditAdvancedChevron} aria-hidden="true"/>
                    </button>
                    {hasAuditFilters&&<button type="button" className={styles.auditClearFilters} onClick={()=>{setQuery("");setAuditSearch("");setAuditFrom("");setAuditTo("");setAuditAction("");setAuditResult("");setAuditQuickRange(null);setAuditPage(0);setAuditFiltersExpanded(false);}}><X size={15} aria-hidden="true"/>{locale==="fr"?"Effacer":locale==="ar"?"مسح":"Clear"}</button>}
                </div>
                {auditFiltersExpanded&&<div className={styles.auditFilterBottomRow} id="audit-advanced-filters">
                    <div className={styles.auditDateRange} role="group" aria-label={locale==="fr"?"Période personnalisée":locale==="ar"?"فترة مخصصة":"Custom date range"}>
                        <AuditDatePicker label={t.from} value={auditFrom} onChange={value=>{setAuditFrom(value);setAuditQuickRange(null);setAuditPage(0);}} locale={locale} max={auditTo||undefined} placeholder={locale==="fr"?"Choisir":locale==="ar"?"اختر":"Choose"}/>
                        <AuditDatePicker label={t.to} value={auditTo} onChange={value=>{setAuditTo(value);setAuditQuickRange(null);setAuditPage(0);}} locale={locale} min={auditFrom||undefined} placeholder={locale==="fr"?"Choisir":locale==="ar"?"اختر":"Choose"}/>
                    </div>
                    <AuditSelect label={t.action} value={auditAction} icon={<Filter size={17}/>} options={[
                        {value:"",label:locale==="fr"?"Toutes les actions":locale==="ar"?"كل الإجراءات":"All actions"},
                        ...Object.keys(auditActionNames[locale]).map(action=>({value:action,label:auditActionLabel(action,locale),description:action}))
                    ]} onChange={value=>{setAuditAction(value);setAuditPage(0);}}/>
                    <AuditSelect label={t.result} value={auditResult} icon={<ShieldCheck size={17}/>} options={[
                        {value:"",label:t.allResults},
                        {value:"SUCCESS",label:t.success},
                        {value:"DENIED",label:t.denied},
                        {value:"FAILED",label:auditUi.failed}
                    ]} onChange={value=>{setAuditResult(value);setAuditPage(0);}}/>
                </div>}
            </section>
            <section className={styles.auditExplorer} aria-label={auditUi.history} data-testid="audit-explorer">
                <section className={styles.auditTableCard} data-testid="audit-table-card">
                    <div className={styles.auditExplorerHeading}>
                        <div><h2>{auditUi.history}</h2><p>{auditUi.latest}</p></div>
                        <span>{audit.total.toLocaleString(loc(locale))} · {t.audit}</span>
                    </div>
                    <div className={styles.auditEventList} role="list" aria-label={auditUi.history}>
                        {auditItems.map((item,index)=>{
                            const day=auditDateGroup(item.createdAt);const previous=index>0?auditDateGroup(auditItems[index-1].createdAt):null;
                            const ActionIcon=item.action.startsWith("merchant")?Store:item.action.startsWith("offer")?Tag:item.action.startsWith("support")?LifeBuoy:ShieldCheck;
                            const eventTone=item.action.startsWith("merchant")?styles.auditEventIconMerchant:item.action.startsWith("offer")?styles.auditEventIconOffer:item.action.startsWith("support")?styles.auditEventIconSupport:styles.auditEventIconSecurity;
                            return <div key={item.id} role="listitem" className={styles.auditEventGroup}>
                                {day.key!==previous?.key&&<div className={styles.auditDayDivider}><span>{day.label}</span><i/></div>}
                                <button type="button" data-testid="audit-record-row" aria-label={`${auditActionLabel(item.action,locale)} · ${item.actorName}`} aria-pressed={selectedAuditId===item.id} className={selectedAuditId===item.id?styles.auditEventSelected:styles.auditEvent} onClick={()=>{setSelectedAuditId(item.id);}}>
                                    <span className={`${styles.auditEventAvatar} ${eventTone}`} aria-hidden="true"><ActionIcon size={17} strokeWidth={2}/></span>
                                    <span className={styles.auditEventCopy}>
                                        <strong>{auditActionLabel(item.action,locale)}</strong>
                                        <span>{item.actorName} · {auditCategoryLabel(item.action,locale)}</span>
                                        <small>{item.targetType} · {item.targetId}{item.reason?" · "+item.reason:""}</small>
                                    </span>
                                    <span className={styles.auditEventMeta}>
                                        <time dateTime={item.createdAt}>{shortDateTime(item.createdAt,locale)}</time>
                                        {resultPill(item.result)}
                                    </span>
                                </button>
                            </div>;
                        })}
                    </div>
                    {!auditItems.length&&<p className={styles.empty}>{auditSearch?auditUi.noMatches:t.empty}</p>}
                    <div className={styles.auditPaginationBar}>
                        <AuditSelect label={auditUi.pageSize} value={String(auditPageSize)} className={styles.auditPageSizeCustom} menuPlacement="top" options={[{value:"10",label:"10"},{value:"20",label:"20"},{value:"50",label:"50"}]} onChange={value=>{setAuditPageSize(Number(value));setAuditPage(0);}}/>
                        <AdminPagination page={auditPage} pageCount={auditPageCount} total={audit.total} size={audit.size||auditPageSize} labels={pagerLabels} loading={loading} onChange={next=>{setLoading(true);setAuditPage(next);setSelectedAuditId(null);}} />
                    </div>
                </section>
                {audit&&<section className={styles.auditRecordCard} aria-label={auditUi.eventDetails} data-testid="audit-record-detail">
                    {!selectedAudit?<div className={styles.auditRecordEmpty}><ShieldCheck size={22} aria-hidden="true"/><strong>{auditUi.eventDetails}</strong><p>{locale==="fr"?"Sélectionnez un événement pour consulter ses détails.":locale==="ar"?"اختر حدثاً لعرض تفاصيله.":"Select an event to inspect its details."}</p></div>:<>
                        <header className={styles.auditRecordHeader} data-testid="audit-record-header">
                            <div className={styles.auditRecordTitleGroup}>
                                <span className={styles.auditRecordHeroIcon}>{selectedAudit.action.startsWith("merchant")?<Store size={21} aria-hidden="true"/>:selectedAudit.action.startsWith("offer")?<Tag size={21} aria-hidden="true"/>:selectedAudit.action.startsWith("support")?<LifeBuoy size={21} aria-hidden="true"/>:<ShieldCheck size={21} aria-hidden="true"/>}</span>
                                <div><small>{auditUi.eventDetails}</small><h2>{auditActionLabel(selectedAudit.action,locale)}</h2><code>{selectedAudit.action}</code></div>
                            </div>
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
