import Link from "next/link";
import { Suspense } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { listPublicOffers, type OfferSearch, type PublicOfferPage } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { OfferCard } from "@/components/offers/OfferCard";
import { OfferSearchDisclosure } from "@/components/offers/OfferSearchDisclosure";
import { OfferSidebar } from "@/components/offers/OfferSidebar";
import { OfferFilterBar } from "@/components/offers/OfferFilterBar";
import { OfferEmptyState, OfferErrorState } from "@/components/offers/OfferListStates";
import { searchFromParams } from "@/lib/offers/search-params";
import { offerPageHref } from "@/lib/offers/pagination";
import { getCasablancaQuickPickupRanges } from "@/lib/time/casablanca";
import { OfferResultsProgress } from "@/components/offers/OfferResultsProgress";
import { OfferMapButton } from "@/components/offers/OfferMapButton";

function offersPath(locale: SiteLocale): string {
  return locale === "fr" ? "/offers" : `/${locale}/offers`;
}

function filterRecoveryHref(locale: SiteLocale, search: OfferSearch, omit?: keyof OfferSearch): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort"] as const) {
    const value = search[key];
    if (key !== omit && value) query.set(key, value);
  }
  if (search.availableOnly === "false" && omit !== "availableOnly") query.set("availableOnly", "false");
  query.set("page", "0");
  query.set("size", search.size || "20");
  return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

export async function OfferListPage({ locale, params }: { locale: SiteLocale; params: Record<string, string | string[] | undefined> }) {
  const t = publicOfferCopy(locale);
  const search = searchFromParams(params);
  const pickupRanges = getCasablancaQuickPickupRanges();
  const openFiltersFromMap = params.filters === "open" || (Array.isArray(params.filters) && params.filters[0] === "open");
  const retryQuery = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value !== undefined && value !== "") retryQuery.set(key, value);
  }
  const retryHref = retryQuery.size ? `${offersPath(locale)}?${retryQuery.toString()}` : offersPath(locale);
  const loaded = await Promise.resolve()
    .then(() => listPublicOffers(search))
    .then(
      (page) => ({ page, error: false as const }),
      () => ({ page: undefined, error: true as const }),
    );
  const result: PublicOfferPage | undefined = loaded.page;
  const error = loaded.error;
  const total = result?.total ?? 0;
  const explicitCity = Array.isArray(params.city) ? params.city[0] : params.city;
  const isFiltered = Boolean(
    search.q || search.category || search.maxPriceMinor || explicitCity || search.district ||
    search.pickupFrom || search.pickupTo || search.availableOnly === "false" ||
    (search.sort && search.sort !== "pickup_end"),
  );
  const recoveryKeys = ["q", "category", "maxPriceMinor", "pickupFrom", "pickupTo", "city", "district", "sort", "availableOnly"] as const;
  const lastActiveKey = [...recoveryKeys].reverse().find((key) => key === "availableOnly"
    ? search.availableOnly === "false"
    : Boolean(search[key] && (key !== "sort" || search.sort !== "pickup_end")));
  const removeLastFilterHref = lastActiveKey ? filterRecoveryHref(locale, search, lastActiveKey) : undefined;
  const includeSoldOutHref = filterRecoveryHref(locale, { ...search, availableOnly: "false" });

  return (
    <div className="kulha-offers-page" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <section className="kulha-offers-hero kulha-offers-hero-compact" aria-labelledby="kulha-offers-title">
        <div className="kulha-offers-hero-inner">
          <div className="kulha-offers-intro">
            <p className="kulha-offers-kicker">{t.kicker}</p>
            <h1 id="kulha-offers-title">{t.heroTitleStart} <em>{t.heroTitleAccent}</em></h1>
          </div>
        </div>
      </section>

      <main className="kulha-offers-content" id="available-baskets">
        <div className="kulha-marketplace-layout">
          <OfferSidebar locale={locale} search={search} />

          <div className="kulha-marketplace-main">
            <div className="kulha-offers-toolbar" aria-label={t.searchLabel}>
              <OfferSearchDisclosure key={search.q ?? ""} locale={locale} values={search} />
              <OfferFilterBar key={`${JSON.stringify(search)}:${openFiltersFromMap}`} locale={locale} values={search} pickupRanges={pickupRanges} initialOpen={openFiltersFromMap} />
            </div>

            <section className="kulha-offers-results" id="kulha-offers-results" aria-labelledby="kulha-results-title">
              <div className="kulha-results-heading">
                <div>
                  <p className="kulha-results-eyebrow">{t.resultsEyebrow}</p>
                  <h2 id="kulha-results-title">{t.availableTitle}</h2>
                </div>
                <div className="kulha-results-heading-meta">
                  <OfferMapButton locale={locale} mode="nearby" values={search} />
                  <Suspense fallback={null}>
                    <OfferResultsProgress label={t.loading} />
                  </Suspense>
                  {!error && result && (
                    <p className="kulha-results-count" role="status" aria-live="polite"><strong><bdi dir="auto">{total}</bdi></strong> {total === 1 ? t.resultCountOne : t.resultCount}</p>
                  )}
                </div>
              </div>

              {error ? (
                <OfferErrorState locale={locale} href={retryHref} />
              ) : result?.items.length ? (
                <>
                  <div className="kulha-offer-grid">
                    {result.items.map((offer, index) => <OfferCard key={offer.id} offer={offer} locale={locale} priority={index === 0} />)}
                  </div>
                  {result.total > result.size && (
                    <nav aria-label={t.availableTitle} className="kulha-pagination">
                      <span>{t.pageLabel} {result.page + 1} / {Math.ceil(result.total / result.size)}</span>
                      <div>
                        {result.page > 0 && <Link rel="prev" href={`${offerPageHref(locale, search, result.page - 1)}#kulha-offers-results`}>{t.previous}</Link>}
                        {(result.page + 1) * result.size < result.total && <Link rel="next" href={`${offerPageHref(locale, search, result.page + 1)}#kulha-offers-results`}>{t.next}</Link>}
                      </div>
                    </nav>
                  )}
                </>
              ) : (
                <OfferEmptyState
                  locale={locale}
                  href={isFiltered ? offersPath(locale) : undefined}
                  filtered={isFiltered}
                  removeLastFilterHref={removeLastFilterHref}
                  includeSoldOutHref={search.availableOnly === "false" ? undefined : includeSoldOutHref}
                />
              )}
            </section>
          </div>
        </div>

      </main>
    </div>
  );
}
