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

export function OfferLoadingState({ locale }: { locale: SiteLocale }) {
  const t = publicOfferCopy(locale);
  return (
    <div className="kulha-offers-page kulha-offers-loading-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} aria-busy="true" aria-label={t.loading}>
      <span className="sr-only">{t.loading}</span>
      <section className="kulha-offers-hero kulha-offers-hero-compact" aria-hidden="true">
        <div className="kulha-offers-hero-inner">
          <div className="kulha-offers-intro">
            <span className="kulha-loading-block kulha-loading-kicker" />
            <span className="kulha-loading-block kulha-loading-hero-title" />
          </div>
        </div>
      </section>

      <main className="kulha-offers-content" aria-hidden="true">
        <div className="kulha-marketplace-layout">
          <aside className="kulha-marketplace-sidebar">
            <div className="kulha-sidebar-panel kulha-loading-sidebar">
              <div className="kulha-sidebar-categories">
                <span className="kulha-loading-block kulha-loading-sidebar-title" />
                <div className="kulha-loading-category-list">
                  {Array.from({ length: 8 }, (_, index) => (
                    <div className="kulha-loading-category" key={index}>
                      <span className="kulha-loading-block kulha-loading-category-icon" />
                      <span className={`kulha-loading-block kulha-loading-category-label is-${index % 3}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="kulha-marketplace-main">
            <div className="kulha-offers-toolbar">
              <div className="kulha-loading-search">
                <span className="kulha-loading-block kulha-loading-search-icon" />
                <span className="kulha-loading-block kulha-loading-search-input" />
                <span className="kulha-loading-block kulha-loading-search-action" />
              </div>
              <div className="kulha-filter-shell kulha-inline-filter-bar kulha-loading-filters">
                <span className="kulha-loading-block kulha-loading-filter-toggle" />
              </div>
            </div>

            <section className="kulha-offers-results">
              <div className="kulha-results-heading">
                <div className="kulha-loading-results-title-group">
                  <span className="kulha-loading-block kulha-loading-results-eyebrow" />
                  <span className="kulha-loading-block kulha-loading-results-title" />
                </div>
                <span className="kulha-loading-block kulha-loading-results-count" />
              </div>
              <div className="kulha-offer-grid kulha-offer-grid-skeleton">
                {Array.from({ length: 6 }, (_, index) => (
                  <article className="kulha-offer-skeleton" key={index}>
                    <div className="kulha-skeleton-art"><span className="kulha-loading-block kulha-skeleton-art-shape" /></div>
                    <div className="kulha-skeleton-body">
                      <span className="kulha-loading-block kulha-skeleton-line is-merchant" />
                      <span className="kulha-loading-block kulha-skeleton-line is-title" />
                      <span className="kulha-loading-block kulha-skeleton-line is-title-short" />
                      <div className="kulha-skeleton-card-meta">
                        <span className="kulha-loading-block kulha-skeleton-pickup" />
                        <span className="kulha-loading-block kulha-skeleton-availability" />
                      </div>
                      <div className="kulha-skeleton-card-bottom">
                        <span className="kulha-loading-block kulha-skeleton-line is-location" />
                        <span className="kulha-loading-block kulha-skeleton-price" />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
