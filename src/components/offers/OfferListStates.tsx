import type { SiteLocale } from "@/lib/i18n/site-copy";
import { publicOfferCopy } from "@/lib/offers/public-copy";

export function OfferEmptyState({ locale, href, filtered = false, removeLastFilterHref, includeSoldOutHref }: {
  locale: SiteLocale;
  href?: string;
  filtered?: boolean;
  removeLastFilterHref?: string;
  includeSoldOutHref?: string;
}) {
  const t = publicOfferCopy(locale);
  const resetHref = href ?? (locale === "fr" ? "/offers" : `/${locale}/offers`);
  return (
    <section className={`kulha-offers-empty is-compact${filtered ? " is-filtered" : ""}`} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="kulha-empty-art" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M15 20v-5a9 9 0 0 1 18 0v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 20h32l-3.3 20H11.3L8 20Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="m16 23 3 14M24 22v15m8-14-3 14M10 27h28M11 33h26" stroke="currentColor" strokeOpacity=".65" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="kulha-empty-copy">
        <p className="kulha-state-eyebrow">{t.kicker}</p>
        <h3>{filtered ? t.noFilterResultsTitle : t.emptyTitle}</h3>
        <p>{filtered ? t.noFilterResultsLead : t.emptyLead}</p>
        {!filtered && <p className="kulha-empty-hint">{t.emptyHint}</p>}
        {filtered && (
          <div className="kulha-empty-actions">
            <div className="kulha-empty-recovery">
              {removeLastFilterHref && <a href={removeLastFilterHref}>{t.removeLastFilter}</a>}
              {includeSoldOutHref && <a href={includeSoldOutHref}>{t.includeSoldOutRecovery}</a>}
            </div>
            {href && <a className="kulha-empty-primary" href={resetHref}>{t.clearFilters}<span aria-hidden="true"> ↗</span></a>}
          </div>
        )}
        {!filtered && href && <a className="kulha-empty-primary" href={resetHref}>{t.clearFilters}<span aria-hidden="true"> ↗</span></a>}
      </div>
    </section>
  );
}

export function OfferErrorState({ locale, href }: { locale: SiteLocale; href: string }) {
  const t = publicOfferCopy(locale);
  const [action, queryString = ""] = href.split("?", 2);
  const retryParams = new URLSearchParams(queryString.split("#", 1)[0] ?? "");
  return (
    <section className="kulha-offers-error" role="alert" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <span className="kulha-error-mark" aria-hidden="true">!</span>
      <div><h3>{t.errorTitle}</h3><p>{t.error}</p></div>
      <form action={action} method="get">
        {Array.from(retryParams.entries()).map(([key, value], index) => <input key={`${key}-${index}`} type="hidden" name={key} value={value} />)}
        <button type="submit">{t.retry}</button>
      </form>
    </section>
  );
}

/**
 * Loading skeleton. Every block sits where the real page puts the same thing (headline + location,
 * search + List/Map, category chips, pickup + sort/filters, result row, basket cards, notify banner),
 * so nothing jumps when the real content streams in.
 */
export function OfferLoadingState({ locale }: { locale: SiteLocale }) {
  const t = publicOfferCopy(locale);
  const block = (className: string, key?: number) => <span className={`kulha-loading-block ${className}`} key={key} />;
  return (
    <div className="kulha-offers-page kulha-offers-redesign kulha-offers-loading-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} aria-busy="true" aria-label={t.loading}>
      <span className="sr-only" role="status">{t.loading}</span>
      <section className="kulha-offers-hero kulha-offers-hero-compact" aria-hidden="true">
        <div className="kulha-offers-hero-inner">
          <div className="kulha-offers-intro">
            {block("kulha-loading-hero-title")}
            {block("kulha-loading-hero-subtitle")}
          </div>
          {block("kulha-loading-location")}
        </div>
      </section>

      <main className="kulha-offers-content" aria-hidden="true">
        <div className="kulha-marketplace-layout">
          <div className="kulha-marketplace-main">
            <div className="kulha-offers-toolbar kulha-loading-toolbar">
              <div className="kulha-loading-search">
                {block("kulha-loading-search-icon")}
                {block("kulha-loading-search-input")}
              </div>
              <div className="kulha-loading-view-switch">
                {block("kulha-loading-view-button is-active")}
                {block("kulha-loading-view-button")}
              </div>
            </div>

            <div className="kulha-loading-categories">
              {[56, 92, 86, 78, 100, 112, 84, 78].map((width, index) => (
                <span className="kulha-loading-block kulha-loading-category-pill" style={{ width }} key={index} />
              ))}
            </div>

            <div className="kulha-loading-refine-row">
              <div className="kulha-loading-pickup">
                {block("kulha-loading-pickup-label")}
                {[64, 88, 96].map((width, index) => <span className="kulha-loading-block kulha-loading-pickup-chip" style={{ width }} key={index} />)}
              </div>
              <div className="kulha-loading-sort-filter">
                {block("kulha-loading-sort")}
                {block("kulha-loading-filter-button")}
              </div>
            </div>

            <div className="kulha-loading-results-bar">
              {block("kulha-loading-results-title")}
              {block("kulha-loading-results-chip")}
              {block("kulha-loading-results-chip is-short")}
            </div>

            <div className="kulha-offer-grid kulha-offer-grid-skeleton">
              {Array.from({ length: 4 }, (_, index) => (
                <article className="kulha-offer-skeleton" key={index}>
                  <div className="kulha-skeleton-art">
                    {block("kulha-skeleton-countdown")}
                    {block("kulha-skeleton-art-shape")}
                    {block("kulha-skeleton-price")}
                  </div>
                  <div className="kulha-skeleton-body">
                    {block("kulha-skeleton-line is-merchant")}
                    {block("kulha-skeleton-line is-title")}
                    <div className="kulha-skeleton-card-meta">
                      {block("kulha-skeleton-pickup")}
                      {block("kulha-skeleton-availability")}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="kulha-loading-banner" />
          </div>
        </div>
      </main>
    </div>
  );
}
