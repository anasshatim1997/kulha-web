"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Flag,
  RefreshCw,
  ShieldCheck,
  Store,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api/client";
import { localePath } from "@/lib/navigation";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import styles from "./AdminOverview.module.css";

type Page<T> = { items: T[]; page: number; size: number; total: number };
type Merchant = {
  id: string;
  name: string;
  businessType: string;
  city: string;
  ownerEmail: string;
  status: string;
  createdAt: string;
};
type Offer = {
  id: string;
  title: string;
  shopName: string;
  city: string;
  status: string;
  reportedCount: number;
  allergensStatus: string;
  priceMinor: number;
};
type SupportCase = {
  id: string;
  reference: string;
  subject: string;
  priority: string;
  status: string;
  merchantName: string | null;
  updatedAt: string;
};
type AuditEntry = {
  id: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  result: string;
  createdAt: string;
};

type Snapshot = {
  merchants: Page<Merchant> | null;
  offers: Page<Offer> | null;
  cases: Page<SupportCase> | null;
  audit: Page<AuditEntry> | null;
};

const emptySnapshot: Snapshot = {
  merchants: null,
  offers: null,
  cases: null,
  audit: null,
};

const copy = {
  fr: {
    eyebrow: "ESPACE D’ADMINISTRATION",
    title: "Pilotez KULHA! depuis un seul endroit.",
    lead: "Les files de travail prioritaires, les décisions récentes et l’état opérationnel de la plateforme.",
    live: "Données en direct",
    refresh: "Actualiser",
    syncing: "Synchronisation…",
    updated: "Dernière actualisation",
    pendingShops: "Commerces à examiner",
    openCases: "Dossiers ouverts",
    offersCatalog: "Offres enregistrées",
    auditEvents: "Événements d’audit",
    queueTitle: "File de validation des commerces",
    queueLead: "Demandes en attente de décision",
    viewAll: "Voir la file",
    offerTitle: "Signalements sur les offres",
    offerLead: "Offres signalées ou avec allergènes non renseignés dans l’échantillon chargé",
    supportTitle: "Support à traiter",
    supportLead: "Dossiers ouverts les plus récemment mis à jour",
    activityTitle: "Journal récent",
    activityLead: "Les dernières actions enregistrées par l’équipe",
    noShops: "Aucune demande en attente dans cette file.",
    noOffers: "Aucun signalement dans les offres chargées.",
    noCases: "Aucun dossier ouvert à afficher.",
    noActivity: "Aucune activité récente à afficher.",
    shop: "Commerce",
    city: "Ville",
    submitted: "Demande reçue",
    offer: "Offre",
    issue: "Point à vérifier",
    reports: "signalement(s)",
    unknownAllergens: "Allergènes inconnus",
    case: "Dossier",
    priority: "Priorité",
    action: "Action",
    actor: "Par",
    record: "Enregistrement",
    documentsTitle: "Dossier documentaire non connecté",
    documentsLead: "Le backend actuel ne fournit pas encore de dépôt, de liste ou de prévisualisation sécurisée des justificatifs. Ne marquez pas un document comme vérifié sur la base d’une case à cocher.",
    documentsStatus: "Intégration requise",
    documentsAction: "Ouvrir la validation des commerces",
    quickTitle: "Accès direct",
    quickLead: "Aller directement à une file de travail.",
    merchants: "Commerces",
    offers: "Modération des offres",
    support: "Support",
    audit: "Journal d’audit",
    partial: "Certaines sources n’ont pas répondu. Les sections disponibles restent consultables.",
    error: "Les services d’administration sont momentanément indisponibles.",
    retry: "Réessayer",
    priorityHigh: "Haute",
    priorityMedium: "Moyenne",
    priorityLow: "Faible",
    statusPending: "En attente",
    statusInfo: "Informations requises",
    statusFlagged: "À vérifier",
    statusReported: "Signalée",
    statusUnknown: "Allergènes inconnus",
    resultDenied: "Refusée",
    resultFailed: "Échec",
    resultSuccess: "Réussie",
    emptyValue: "—",
  },
  en: {
    eyebrow: "ADMINISTRATION",
    title: "Run KULHA! from one clear workspace.",
    lead: "Priority work queues, recent decisions, and a live operational view of the platform.",
    live: "Live data",
    refresh: "Refresh",
    syncing: "Syncing…",
    updated: "Last refreshed",
    pendingShops: "Shops awaiting review",
    openCases: "Open support cases",
    offersCatalog: "Offers in catalogue",
    auditEvents: "Audit events",
    queueTitle: "Shop verification queue",
    queueLead: "Applications waiting for a decision",
    viewAll: "Open queue",
    offerTitle: "Offer signals",
    offerLead: "Reported offers or unknown allergens in the loaded sample",
    supportTitle: "Support to handle",
    supportLead: "Recently updated open cases",
    activityTitle: "Recent activity",
    activityLead: "Latest actions recorded by the team",
    noShops: "There are no pending applications in this queue.",
    noOffers: "No signals found in the loaded offers.",
    noCases: "There are no open cases to show.",
    noActivity: "There is no recent activity to show.",
    shop: "Shop",
    city: "City",
    submitted: "Application received",
    offer: "Offer",
    issue: "Review signal",
    reports: "report(s)",
    unknownAllergens: "Unknown allergens",
    case: "Case",
    priority: "Priority",
    action: "Action",
    actor: "By",
    record: "Record",
    documentsTitle: "Document review is not connected",
    documentsLead: "The current backend does not expose secure document upload, listing, or preview endpoints yet. Do not mark a document as verified using a checkbox.",
    documentsStatus: "Integration required",
    documentsAction: "Open shop verification",
    quickTitle: "Jump to work",
    quickLead: "Go straight to an operational queue.",
    merchants: "Shops",
    offers: "Offer moderation",
    support: "Support",
    audit: "Audit log",
    partial: "Some data sources did not respond. Available sections are still shown.",
    error: "Admin services are temporarily unavailable.",
    retry: "Try again",
    priorityHigh: "High",
    priorityMedium: "Medium",
    priorityLow: "Low",
    statusPending: "Pending",
    statusInfo: "Information required",
    statusFlagged: "Needs review",
    statusReported: "Reported",
    statusUnknown: "Unknown allergens",
    resultDenied: "Denied",
    resultFailed: "Failed",
    resultSuccess: "Succeeded",
    emptyValue: "—",
  },
  ar: {
    eyebrow: "مساحة الإدارة",
    title: "أدر KULHA! من مساحة عمل واحدة.",
    lead: "قوائم العمل ذات الأولوية، والقرارات الأخيرة، ومؤشرات تشغيل المنصة.",
    live: "بيانات مباشرة",
    refresh: "تحديث",
    syncing: "جارٍ التحديث…",
    updated: "آخر تحديث",
    pendingShops: "متاجر بانتظار المراجعة",
    openCases: "طلبات دعم مفتوحة",
    offersCatalog: "العروض المسجلة",
    auditEvents: "أحداث التدقيق",
    queueTitle: "قائمة التحقق من المتاجر",
    queueLead: "طلبات بانتظار القرار",
    viewAll: "عرض القائمة",
    offerTitle: "تنبيهات العروض",
    offerLead: "العروض المبلغ عنها أو التي لا تتوفر لها معلومات مسببات الحساسية في العينة المحملة",
    supportTitle: "طلبات الدعم المطلوب معالجتها",
    supportLead: "أحدث الحالات المفتوحة تحديثاً",
    activityTitle: "النشاط الأخير",
    activityLead: "آخر الإجراءات المسجلة من الفريق",
    noShops: "لا توجد طلبات معلقة في هذه القائمة.",
    noOffers: "لا توجد تنبيهات في العروض المحملة.",
    noCases: "لا توجد حالات دعم مفتوحة للعرض.",
    noActivity: "لا يوجد نشاط حديث للعرض.",
    shop: "المتجر",
    city: "المدينة",
    submitted: "تاريخ الطلب",
    offer: "العرض",
    issue: "نقطة للمراجعة",
    reports: "بلاغات",
    unknownAllergens: "مسببات حساسية غير معروفة",
    case: "الحالة",
    priority: "الأولوية",
    action: "الإجراء",
    actor: "بواسطة",
    record: "السجل",
    documentsTitle: "مراجعة الوثائق غير متصلة",
    documentsLead: "لا توفر الواجهة الخلفية حالياً رفع الوثائق أو عرضها أو معاينتها بشكل آمن. لا تؤكد صلاحية وثيقة باستخدام خانة اختيار.",
    documentsStatus: "التكامل مطلوب",
    documentsAction: "فتح مراجعة المتاجر",
    quickTitle: "وصول سريع",
    quickLead: "انتقل مباشرة إلى إحدى قوائم العمل.",
    merchants: "المتاجر",
    offers: "مراجعة العروض",
    support: "الدعم",
    audit: "سجل التدقيق",
    partial: "لم تستجب بعض مصادر البيانات. ما توفر منها لا يزال معروضاً.",
    error: "خدمات الإدارة غير متاحة مؤقتاً.",
    retry: "إعادة المحاولة",
    priorityHigh: "مرتفعة",
    priorityMedium: "متوسطة",
    priorityLow: "منخفضة",
    statusPending: "قيد الانتظار",
    statusInfo: "معلومات مطلوبة",
    statusFlagged: "تحتاج مراجعة",
    statusReported: "مبلغ عنها",
    statusUnknown: "مسببات حساسية غير معروفة",
    resultDenied: "مرفوض",
    resultFailed: "فشل",
    resultSuccess: "ناجح",
    emptyValue: "—",
  },
} as const;

function formatNumber(value: number, locale: SiteLocale) {
  const tag = locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA";
  return new Intl.NumberFormat(tag, { maximumFractionDigits: 0 }).format(value);
}

function formatDate(value: string | null | undefined, locale: SiteLocale) {
  if (!value) return "";
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "";
  const tag = locale === "ar" ? "ar-MA" : locale === "en" ? "en-MA" : "fr-MA";
  return new Intl.DateTimeFormat(tag, {
    timeZone: "Africa/Casablanca",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function humanize(value: string, locale: SiteLocale) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase(locale) + part.slice(1).toLocaleLowerCase(locale))
    .join(" ");
}

export function AdminOverview({ locale }: { locale: SiteLocale }) {
  const t = copy[locale];
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadState, setLoadState] = useState<"initial" | "ready" | "partial" | "error">("initial");
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const settled = await Promise.allSettled([
      api.get<Page<Merchant>>("/admin/merchants?status=PENDING&page=0&size=6"),
      api.get<Page<Offer>>("/admin/offers?page=0&size=8"),
      api.get<Page<SupportCase>>("/admin/support-cases?status=OPEN&page=0&size=5"),
      api.get<Page<AuditEntry>>("/admin/audit-log?page=0&size=6"),
    ]);

    if (!mounted.current) return;

    const next: Snapshot = {
      merchants: settled[0].status === "fulfilled" ? settled[0].value : null,
      offers: settled[1].status === "fulfilled" ? settled[1].value : null,
      cases: settled[2].status === "fulfilled" ? settled[2].value : null,
      audit: settled[3].status === "fulfilled" ? settled[3].value : null,
    };
    const available = settled.filter((entry) => entry.status === "fulfilled").length;
    setSnapshot(next);
    setLoadState(available === 0 ? "error" : available === 4 ? "ready" : "partial");
    setLastUpdated(new Date());
    setRefreshing(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialLoad = window.setTimeout(() => void refresh(), 0);

    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (!document.hidden) void refresh();
    };
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted.current = false;
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);

  const lastUpdatedLabel = lastUpdated
    ? formatDate(lastUpdated.toISOString(), locale)
    : t.syncing;

  const flaggedOffers = (snapshot.offers?.items ?? []).filter(
    (offer) => offer.reportedCount > 0 || offer.allergensStatus === "UNKNOWN",
  );
  const visibleOffers = flaggedOffers.slice(0, 4);

  const showError = loadState === "error";
  const showPartial = loadState === "partial";

  return (
    <div className={styles.overview} data-testid="admin-overview" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className={styles.hero} aria-labelledby="admin-overview-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.eyebrow}><span className={styles.liveDot} />{t.eyebrow}</div>
          <h1 id="admin-overview-title">{t.title}</h1>
          <p>{t.lead}</p>
          <div className={styles.heroMeta}>
            <span className={styles.livePill}><span />{t.live}</span>
            <span className={styles.updatedAt}><Clock3 size={14} aria-hidden="true" />{t.updated}: {lastUpdatedLabel}</span>
          </div>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : ""} aria-hidden="true" />
          {refreshing ? t.syncing : t.refresh}
        </button>
        <div className={styles.heroMark} aria-hidden="true">K!</div>
      </section>

      {showError && (
        <div className={styles.errorNotice} role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{t.error}</span>
          <button type="button" onClick={() => void refresh()}>{t.retry}</button>
        </div>
      )}
      {showPartial && (
        <div className={styles.partialNotice} role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{t.partial}</span>
        </div>
      )}

      <section className={styles.metrics} data-testid="admin-overview-metrics" aria-label={t.eyebrow}>
        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricIcon + " " + styles.metricGold}><Store size={18} /></span>
            <span className={styles.metricContext}>{t.pendingShops}</span>
          </div>
          <strong>{snapshot.merchants ? formatNumber(snapshot.merchants.total, locale) : t.emptyValue}</strong>
          <span className={styles.metricFoot}>{t.queueLead}</span>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricIcon + " " + styles.metricBlue}><Flag size={18} /></span>
            <span className={styles.metricContext}>{t.openCases}</span>
          </div>
          <strong>{snapshot.cases ? formatNumber(snapshot.cases.total, locale) : t.emptyValue}</strong>
          <span className={styles.metricFoot}>{t.supportLead}</span>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricIcon + " " + styles.metricGreen}><Tag size={18} /></span>
            <span className={styles.metricContext}>{t.offersCatalog}</span>
          </div>
          <strong>{snapshot.offers ? formatNumber(snapshot.offers.total, locale) : t.emptyValue}</strong>
          <span className={styles.metricFoot}>{t.offerLead}</span>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricTop}>
            <span className={styles.metricIcon + " " + styles.metricInk}><FileText size={18} /></span>
            <span className={styles.metricContext}>{t.auditEvents}</span>
          </div>
          <strong>{snapshot.audit ? formatNumber(snapshot.audit.total, locale) : t.emptyValue}</strong>
          <span className={styles.metricFoot}>{t.activityLead}</span>
        </article>
      </section>

      <section className={styles.workGrid}>
        <div className={styles.primaryColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionKicker}>01 / {t.merchants}</span>
                <h2>{t.queueTitle}</h2>
                <p>{t.queueLead}</p>
              </div>
              <Link href={localePath(locale, "/admin/merchant-review")} className={styles.textLink}>
                {t.viewAll}<ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.queueTable}>
                <thead>
                  <tr><th>{t.shop}</th><th>{t.city}</th><th>{t.submitted}</th><th aria-label={t.statusPending} /></tr>
                </thead>
                <tbody>
                  {snapshot.merchants?.items.slice(0, 5).map((merchant) => (
                    <tr key={merchant.id}>
                      <td>
                        <strong>{merchant.name}</strong>
                        <small>{merchant.businessType || merchant.ownerEmail}</small>
                      </td>
                      <td>{merchant.city || t.emptyValue}</td>
                      <td>{formatDate(merchant.createdAt, locale) || t.emptyValue}</td>
                      <td><span className={styles.statusPending}>{merchant.status === "INFO_REQUIRED" ? t.statusInfo : t.statusPending}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {snapshot.merchants && snapshot.merchants.items.length === 0 && <p className={styles.emptyState}>{t.noShops}</p>}
              {!snapshot.merchants && loadState !== "initial" && <p className={styles.emptyState}>{t.emptyValue}</p>}
              {loadState === "initial" && <div className={styles.tableSkeleton}><span /><span /><span /></div>}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionKicker}>02 / {t.offers}</span>
                <h2>{t.offerTitle}</h2>
                <p>{t.offerLead}</p>
              </div>
              <Link href={localePath(locale, "/admin/offer-moderation")} className={styles.textLink}>
                {t.viewAll}<ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.signalList}>
              {visibleOffers.map((offer) => {
                const reported = offer.reportedCount > 0;
                return (
                  <div className={styles.signalRow} key={offer.id}>
                    <span className={styles.signalIcon}><Tag size={17} aria-hidden="true" /></span>
                    <div className={styles.signalContent}>
                      <strong>{offer.title}</strong>
                      <small>{offer.shopName} · {offer.city}</small>
                    </div>
                    <span className={reported ? styles.signalReported : styles.signalUnknown}>
                      {reported ? offer.reportedCount + " " + t.reports : t.unknownAllergens}
                    </span>
                  </div>
                );
              })}
              {snapshot.offers && visibleOffers.length === 0 && <p className={styles.emptyState}>{t.noOffers}</p>}
              {!snapshot.offers && loadState !== "initial" && <p className={styles.emptyState}>{t.emptyValue}</p>}
              {loadState === "initial" && <div className={styles.tableSkeleton}><span /><span /></div>}
            </div>
          </article>
        </div>

        <aside className={styles.secondaryColumn}>
          <article className={styles.panel + " " + styles.supportPanel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionKicker}>03 / {t.support}</span>
                <h2>{t.supportTitle}</h2>
                <p>{t.supportLead}</p>
              </div>
              <Link href={localePath(locale, "/admin/support-cases")} className={styles.iconLink} aria-label={t.viewAll}>
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.caseList}>
              {snapshot.cases?.items.slice(0, 4).map((item) => (
                <div className={styles.caseRow} key={item.id}>
                  <span className={item.priority === "HIGH" ? styles.priorityHigh : item.priority === "MEDIUM" ? styles.priorityMedium : styles.priorityLow} />
                  <div>
                    <strong>{item.subject}</strong>
                    <small>{item.reference} · {item.merchantName || t.case}</small>
                  </div>
                  <time>{formatDate(item.updatedAt, locale)}</time>
                </div>
              ))}
              {snapshot.cases && snapshot.cases.items.length === 0 && <p className={styles.emptyState}>{t.noCases}</p>}
              {!snapshot.cases && loadState !== "initial" && <p className={styles.emptyState}>{t.emptyValue}</p>}
              {loadState === "initial" && <div className={styles.tableSkeleton}><span /><span /></div>}
            </div>
          </article>

          <article className={styles.documentCard} data-testid="admin-overview-document-warning">
            <div className={styles.documentTop}>
              <span className={styles.documentIcon}><ShieldCheck size={19} aria-hidden="true" /></span>
              <span className={styles.documentStatus}>{t.documentsStatus}</span>
            </div>
            <h2>{t.documentsTitle}</h2>
            <p>{t.documentsLead}</p>
            <Link href={localePath(locale, "/admin/merchant-review")} className={styles.documentLink}>
              {t.documentsAction}<ChevronRight size={16} aria-hidden="true" />
            </Link>
          </article>

          <article className={styles.quickPanel}>
            <div className={styles.panelHeader}>
              <div><h2>{t.quickTitle}</h2><p>{t.quickLead}</p></div>
              <Activity size={18} aria-hidden="true" />
            </div>
            <div className={styles.quickLinks}>
              <Link href={localePath(locale, "/admin/merchant-review")}><Store size={16} />{t.merchants}<ArrowUpRight size={14} /></Link>
              <Link href={localePath(locale, "/admin/offer-moderation")}><Tag size={16} />{t.offers}<ArrowUpRight size={14} /></Link>
              <Link href={localePath(locale, "/admin/support-cases")}><Flag size={16} />{t.support}<ArrowUpRight size={14} /></Link>
              <Link href={localePath(locale, "/admin/audit-log")}><FileText size={16} />{t.audit}<ArrowUpRight size={14} /></Link>
            </div>
          </article>
        </aside>
      </section>

      <article className={styles.panel + " " + styles.activityPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.sectionKicker}>04 / {t.audit}</span>
            <h2>{t.activityTitle}</h2>
            <p>{t.activityLead}</p>
          </div>
          <Link href={localePath(locale, "/admin/audit-log")} className={styles.textLink}>
            {t.viewAll}<ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.activityList}>
          {snapshot.audit?.items.slice(0, 5).map((entry) => (
            <div className={styles.activityRow} key={entry.id}>
              <span className={entry.result === "SUCCESS" ? styles.activitySuccess : styles.activityIssue}>
                {entry.result === "SUCCESS" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              </span>
              <div className={styles.activityCopy}>
                <strong>{humanize(entry.action, locale)}</strong>
                <small>{entry.actorName || t.emptyValue} · {entry.targetType} {entry.targetId}</small>
                {entry.reason && <small className={styles.activityReason}>{entry.reason}</small>}
              </div>
              <time>{formatDate(entry.createdAt, locale)}</time>
            </div>
          ))}
          {snapshot.audit && snapshot.audit.items.length === 0 && <p className={styles.emptyState}>{t.noActivity}</p>}
          {!snapshot.audit && loadState !== "initial" && <p className={styles.emptyState}>{t.emptyValue}</p>}
          {loadState === "initial" && <div className={styles.tableSkeleton}><span /><span /><span /></div>}
        </div>
      </article>
    </div>
  );
}
