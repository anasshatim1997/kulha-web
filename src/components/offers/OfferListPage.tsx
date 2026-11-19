import Link from "next/link";
import { Suspense } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { listPublicOffers, type OfferSearch, type PublicOfferPage } from "@/lib/offers/public-api";
import { publicOfferCopy } from "@/lib/offers/public-copy";
import { OfferProgressiveGrid } from "@/components/offers/OfferProgressiveGrid";
import { OfferSearchDisclosure } from "@/components/offers/OfferSearchDisclosure";
import { OfferFilterBar, OfferActiveFilters } from "@/components/offers/OfferFilterBar";
import { OfferEmptyState, OfferErrorState } from "@/components/offers/OfferListStates";
import { OfferCategoryNav } from "@/components/offers/OfferCategoryNav";
import { OfferLocationControl } from "@/components/offers/OfferLocationControl";
import { OfferSortSelect } from "@/components/offers/OfferSortSelect";
import { OfferNearbyProvider } from "@/components/offers/OfferNearbyContext";
import { OfferNearbyResults } from "@/components/offers/OfferNearbyResults";
import { searchFromParams } from "@/lib/offers/search-params";
import { getCasablancaQuickPickupRanges } from "@/lib/time/casablanca";
import { OfferResultsProgress } from "@/components/offers/OfferResultsProgress";
import { OfferMapButton } from "@/components/offers/OfferMapButton";
import { offerDesignCopy, offerAreaLabel } from "@/lib/offers/design-copy";
import { offerDistricts } from "@/lib/offers/location-options";

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

function pickupHref(locale: SiteLocale, search: OfferSearch, range: { from: string; to: string }): string {
  const query = new URLSearchParams();
  for (const key of ["q", "category", "maxPriceMinor", "city", "district", "sort", "size"] as const) {
    const value = search[key];
    if (value) query.set(key, value);
  }
  query.set("pickupFrom", range.from);
  query.set("pickupTo", range.to);
  if (search.availableOnly === "false") query.set("availableOnly", "false");
  query.set("page", "0");
  return `${offersPath(locale)}?${query.toString()}#kulha-offers-results`;
}

function selectedPickup(search: OfferSearch, ranges: ReturnType<typeof getCasablancaQuickPickupRanges>) {
  return (Object.keys(ranges) as (keyof typeof ranges)[]).find((key) => {
    if (!search.pickupFrom || !search.pickupTo) return false;
    const fromDelta = Math.abs(Date.parse(search.pickupFrom) - Date.parse(ranges[key].from));
    const toDelta = Math.abs(Date.parse(search.pickupTo) - Date.parse(ranges[key].to));
    return Number.isFinite(fromDelta) && Number.isFinite(toDelta) && fromDelta <= 120_000 && toDelta <= 120_000;
  });
}

export async function OfferListPage({ locale, params }: { locale: SiteLocale; params: Record<string, string | string[] | undefined> }) {
  const t = publicOfferCopy(locale);
  const search = searchFromParams(params);
  // This feed is progressively appended; legacy numbered-page URLs now start from page one.
  search.page = "0";
  const pickupRanges = getCasablancaQuickPickupRanges();
  const activePickup = selectedPickup(search, pickupRanges);
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
  const d = offerDesignCopy(locale);
  const districtLabel = offerDistricts(search.city).find((district) => district.value === search.district)?.labels[locale];
  const bannerArea = districtLabel ?? offerAreaLabel(locale, search) ?? d.yourArea;

  return (
    <div className="kulha-offers-page kulha-offers-redesign" lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <OfferNearbyProvider>
      <section className="kulha-offers-hero kulha-offers-hero-compact" aria-labelledby="kulha-offers-title">
        <div className="kulha-offers-hero-inner">
          <div className="kulha-offers-intro">
            <h1 id="kulha-offers-title">{d.title}</h1>
            <p className="kulha-offers-intro-copy">{d.tagline}</p>
          </div>
          <OfferLocationControl locale={locale} values={search} />
        </div>
      </section>

      <main className="kulha-offers-content" id="available-baskets">
          <div className="kulha-marketplace-layout">
            <div className="kulha-marketplace-main">
              <div className="kulha-offers-toolbar" aria-label={t.searchLabel}>
                <OfferSearchDisclosure key={search.q ?? ""} locale={locale} values={search} />
                <div className="kulha-offers-view-switch" aria-label={locale === "fr" ? "Mode d’affichage" : locale === "ar" ? "طريقة العرض" : "View mode"}>
                  <span className="is-active" aria-current="page">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {d.list}
                  </span>
                  <OfferMapButton locale={locale} mode="nearby" values={search} label={d.map} />
                </div>
              </div>

              <aside className="kulha-marketplace-sidebar" aria-label={t.categoriesTitle}>
                <div className="kulha-sidebar-panel is-open" id="kulha-offers-sidebar-panel">
                  <section className="kulha-sidebar-categories" aria-labelledby="kulha-sidebar-categories-title">
                    <h2 id="kulha-sidebar-categories-title" className="sr-only">{t.categoriesTitle}</h2>
                    <OfferCategoryNav locale={locale} search={search} />
                  </section>
                </div>
              </aside>

              <div className="kulha-offers-refine-row">
                <div className="kulha-offers-pickup-quick" aria-label={t.pickupQuickLabel}>
                  <span className="kulha-offers-pickup-label">{d.pickup}</span>
                  <Link href={pickupHref(locale, search, pickupRanges.now)} scroll={false} className={`kulha-offers-pickup-chip${activePickup === "now" ? " is-active" : ""}`}>{t.pickupNow}</Link>
                  <Link href={pickupHref(locale, search, pickupRanges.tonight)} scroll={false} className={`kulha-offers-pickup-chip${activePickup === "tonight" ? " is-active" : ""}`}>{t.pickupTonight}</Link>
                  <Link href={pickupHref(locale, search, pickupRanges.tomorrow)} scroll={false} className={`kulha-offers-pickup-chip${activePickup === "tomorrow" ? " is-active" : ""}`}>{t.pickupTomorrow}</Link>
                </div>
                <div className="kulha-offers-sort-filter">
                  <OfferSortSelect locale={locale} values={search} />
                  <OfferFilterBar key={`${JSON.stringify(search)}:${openFiltersFromMap}`} locale={locale} values={search} pickupRanges={pickupRanges} total={error ? undefined : total} initialOpen={openFiltersFromMap} />
                </div>
              </div>

              <OfferNearbyResults locale={locale}>
                <OfferActiveFilters locale={locale} values={search} pickupRanges={pickupRanges} total={error ? undefined : total}>
                  <Suspense fallback={null}>
                    <OfferResultsProgress label={t.loading} />
                  </Suspense>
                </OfferActiveFilters>
                <section className="kulha-offers-results" id="kulha-offers-results" aria-labelledby="kulha-results-title">
                  {!error && result && (
                    <p className="sr-only" role="status" aria-live="polite"><bdi dir="auto">{total}</bdi> {total === 1 ? t.resultCountOne : t.resultCount}</p>
                  )}

                  {error ? (
                    <OfferErrorState locale={locale} href={retryHref} />
                  ) : result?.items.length ? (
                    <>
                      <OfferProgressiveGrid key={JSON.stringify(search)} locale={locale} initialPage={result} search={search} />
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
              </OfferNearbyResults>

              <section className="kulha-offers-notify-banner">
                <div className="kulha-offers-notify-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9ZM10 21h4" /></svg>
                </div>
                <div>
                  <h2>{d.missTitle}</h2>
                  <p>{d.missBody.replace("{area}", bannerArea)}</p>
                </div>
                <Link href="/register">{d.missCta}</Link>
              </section>
            </div>
          </div>
      </main>
      </OfferNearbyProvider>
    </div>
  );
}
